// Wikimedia Commons helper for the Invention Lab picture finders.
//
//   node commons.js search "<keywords>" [count]      -> list free-licensed image candidates
//   node commons.js info "File:Name.jpg"               -> license / author / size for one file
//   node commons.js get "File:Name.jpg" <out.jpg>      -> download (max 1000 px wide) as JPEG, print credit JSON
//   node commons.js sheet <folder-of-jpgs> <out.jpg>   -> contact sheet of every .jpg in a folder (to eyeball)
//
// Only files whose license is Public Domain / CC0 / CC BY / CC BY-SA (any version) / GFDL are accepted.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const FFMPEG = path.join(process.env.LOCALAPPDATA, 'Microsoft/WinGet/Links/ffmpeg.exe');
const UA = { 'User-Agent': 'InventionLab/1.0 (educational kids site; github.com/alanzwwang)' };
const API = 'https://commons.wikimedia.org/w/api.php?format=json&';
const strip = (h) => String(h || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const FREE = /(public domain|^pd|cc0|cc[ -]?by|attribution|gfdl|no restrictions)/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let i = 0; i < 9; i++) {
    try { const r = await fetch(url, { headers: UA }); if (r.ok) return r; if (r.status === 404) return r; } catch (e) { }
    await sleep(Math.min(30000, 2000 * 2 ** i) + Math.random() * 2000); // back off: Commons rate-limits busy clients
  }
  throw new Error('request failed: ' + url);
}
function meta(ii) {
  const m = ii.extmetadata || {};
  return {
    license: strip(m.LicenseShortName && m.LicenseShortName.value),
    author: strip((m.Artist && m.Artist.value) || (m.Credit && m.Credit.value)).slice(0, 140),
    desc: strip(m.ImageDescription && m.ImageDescription.value).slice(0, 220),
    w: ii.width, h: ii.height, page: ii.descriptionurl, thumb: ii.thumburl || ii.url, mime: ii.mime,
  };
}

let [cmd, a, b] = process.argv.slice(2);
// "img/..." output paths always mean the site's img folder, whatever folder the command is run from
if (cmd === 'get' && b && !path.isAbsolute(b)) b = path.join(__dirname, '..', 'inventions', b.replace(/^inventions[\\/]/, ''));
(async () => {
  if (cmd === 'search') {
    const n = +(b || 12);
    const url = API + 'action=query&generator=search&gsrnamespace=6&gsrlimit=' + Math.min(50, n * 3) +
      '&gsrsearch=' + encodeURIComponent(a + ' filetype:bitmap') + '&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=960';
    const d = await (await get(url)).json();
    const pages = Object.values((d.query && d.query.pages) || {}).sort((x, y) => x.index - y.index);
    let shown = 0;
    for (const p of pages) {
      if (!p.imageinfo) continue;
      const m = meta(p.imageinfo[0]);
      if (!FREE.test(m.license) || m.w < 400) continue;
      console.log(`${p.title}\n   ${m.w}x${m.h} · ${m.license} · ${m.author.slice(0, 60)}\n   ${m.desc.slice(0, 160)}`);
      if (++shown >= n) break;
    }
    if (!shown) console.log('(no free-licensed results — try other keywords)');
  } else if (cmd === 'info') {
    const d = await (await get(API + 'action=query&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=960&titles=' + encodeURIComponent(a))).json();
    const p = Object.values(d.query.pages)[0];
    if (!p.imageinfo) return console.log('NOT FOUND on Commons');
    console.log(JSON.stringify(Object.assign({ file: a.replace(/^File:/, ''), free: FREE.test(meta(p.imageinfo[0]).license) }, meta(p.imageinfo[0])), null, 1));
  } else if (cmd === 'get') {
    const d = await (await get(API + 'action=query&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=960&titles=' + encodeURIComponent(a))).json();
    const p = Object.values(d.query.pages)[0];
    if (!p.imageinfo) { console.log('ERROR not found on Commons'); process.exit(1); }
    const m = meta(p.imageinfo[0]);
    if (!FREE.test(m.license)) { console.log('ERROR not a free license: ' + m.license); process.exit(1); }
    // Originals of small files get rate-limited (429), and only standard thumbnail widths exist (500, 960, …),
    // so for files 960 px wide or less, use the 500 px thumbnail when the file is bigger than that.
    let src = m.thumb;
    if (m.w <= 960 && m.w > 500) {
      const d5 = await (await get(API + 'action=query&prop=imageinfo&iiprop=url&iiurlwidth=500&titles=' + encodeURIComponent(a))).json();
      src = Object.values(d5.query.pages)[0].imageinfo[0].thumburl || src;
    }
    const r = await get(src);
    if (!r.ok) { console.log('ERROR download failed (HTTP ' + r.status + ')'); process.exit(1); }
    fs.mkdirSync(path.dirname(b), { recursive: true });
    const tmp = b + '.src';
    fs.writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', tmp, '-filter_complex',
      "color=white[c];[c][0]scale2ref[c][i];[c][i]overlay=shortest=1,scale='min(1000,iw)':-2,format=yuvj420p", '-frames:v', '1', '-q:v', '3', b]);
    fs.unlinkSync(tmp);
    console.log(JSON.stringify({ file: a.replace(/^File:/, ''), url: m.page, author: m.author, license: m.license }));
  } else if (cmd === 'sheet') {
    const files = fs.readdirSync(a).filter((f) => f.endsWith('.jpg')).sort();
    const list = path.join(a, '_sheet.txt');
    fs.writeFileSync(list, files.map((f) => `file '${path.join(a, f).replace(/\\/g, '/')}'`).join('\n'));
    const cols = 6, rows = Math.ceil(files.length / cols);
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-vf',
      `scale=260:195:force_original_aspect_ratio=decrease,pad=260:195:(ow-iw)/2:(oh-ih)/2:color=gray,drawtext=text='%{n}':x=4:y=4:fontsize=18:fontcolor=yellow:box=1:boxcolor=black,tile=${cols}x${rows}`,
      '-frames:v', '1', b]);
    fs.unlinkSync(list);
    console.log('sheet written; tiles in this order (0-based):\n' + files.map((f, i) => i + ' ' + f).join('\n'));
  } else {
    console.log('usage: search | info | get | sheet');
  }
})().catch((e) => { console.log('ERROR ' + e.message); process.exit(1); });
