// Downloads a freely licensed photo for every invention (from its Wikipedia article's lead image on
// Wikimedia Commons), saves it as img/<id>.jpg (max 900 px wide), and writes data/credits.js.
// Usage: node fetch-images.js <site-folder> [--only id,id] [--override id=File:Name.jpg,...]
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const SITE = process.argv[2];
const args = process.argv.slice(3);
const only = (args.includes('--only') ? args[args.indexOf('--only') + 1] : '').split(',').filter(Boolean);
const overrides = Object.fromEntries((args.includes('--override') ? args[args.indexOf('--override') + 1] : '').split(',').filter(Boolean).map((s) => s.split('=')));
const FFMPEG = path.join(process.env.LOCALAPPDATA, 'Microsoft/WinGet/Links/ffmpeg.exe');
const UA = { 'User-Agent': 'InventionLab/1.0 (educational kids site; contact via github.com/alanzwwang)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (h) => String(h || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const FREE = /^(public domain|pd|cc0|cc[ -]by|cc[ -]by-sa|cc-by|cc-by-sa|attribution|gfdl|fal)/i;

async function json(url) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: UA });
    if (r.ok) return r.json();
    await sleep(1500 * (i + 1));
  }
  throw new Error('HTTP failed ' + url);
}

async function leadFile(title) {
  const u = 'https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=pageimages&piprop=name&titles=' + encodeURIComponent(title);
  const d = await json(u);
  const p = Object.values(d.query.pages)[0];
  return p && p.pageimage ? 'File:' + p.pageimage : null;
}

async function commonsInfo(file) {
  const u = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=900&titles=' + encodeURIComponent(file);
  const d = await json(u);
  const p = Object.values(d.query.pages)[0];
  if (!p || p.missing !== undefined || !p.imageinfo) return null;   // not on Commons (e.g. non-free, en-only)
  const ii = p.imageinfo[0], m = ii.extmetadata || {};
  return {
    thumb: ii.thumburl || ii.url, page: ii.descriptionurl, w: ii.width, h: ii.height,
    license: strip(m.LicenseShortName && m.LicenseShortName.value),
    author: strip((m.Artist && m.Artist.value) || (m.Credit && m.Credit.value)).slice(0, 120),
  };
}

(async () => {
  const groups = fs.readdirSync(path.join(SITE, 'data')).filter((f) => /^g\d+\.json$/.test(f)).sort();
  const items = groups.flatMap((g) => JSON.parse(fs.readFileSync(path.join(SITE, 'data', g), 'utf8')));
  const credFile = path.join(SITE, 'data', 'credits.json');
  const credits = fs.existsSync(credFile) ? JSON.parse(fs.readFileSync(credFile, 'utf8')) : {};
  fs.mkdirSync(path.join(SITE, 'img'), { recursive: true });
  const report = [];
  for (const inv of items) {
    if (only.length && !only.includes(inv.id)) continue;
    if (!only.length && credits[inv.id] && fs.existsSync(path.join(SITE, 'img', inv.id + '.jpg'))) continue;
    try {
      const file = overrides[inv.id] || await leadFile(inv.wiki);
      if (!file) { report.push(`NOIMG  ${inv.id} (no lead image for "${inv.wiki}")`); continue; }
      const info = await commonsInfo(file);
      if (!info) { report.push(`NONFREE ${inv.id} ${file} (not on Commons)`); delete credits[inv.id]; continue; }
      if (!FREE.test(info.license)) { report.push(`LICENSE ${inv.id} ${file} "${info.license}"`); delete credits[inv.id]; continue; }
      const r = await fetch(info.thumb, { headers: UA });
      if (!r.ok) { report.push(`DLFAIL ${inv.id} ${r.status}`); continue; }
      const tmp = path.join(SITE, 'img', inv.id + '.src');
      fs.writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
      const out = path.join(SITE, 'img', inv.id + '.jpg');
      // flatten any transparency onto white, cap the width at 900 px, good JPEG quality
      execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', tmp, '-filter_complex',
        "color=white[c];[c][0]scale2ref[c][i];[c][i]overlay=shortest=1,scale='min(900,iw)':-2,format=yuvj420p", '-frames:v', '1', '-q:v', '3', out]);
      fs.unlinkSync(tmp);
      credits[inv.id] = { file: file.replace(/^File:/, ''), url: info.page, author: info.author, license: info.license };
      report.push(`OK     ${inv.id} ${file} [${info.license}]`);
      await sleep(1500);
    } catch (e) {
      report.push(`ERROR  ${inv.id} ${e.message}`);
    }
  }
  fs.writeFileSync(credFile, JSON.stringify(credits, null, 1));
  console.log(report.join('\n'));
})();
