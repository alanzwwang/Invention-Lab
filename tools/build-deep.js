// Builds the Deep Dive library: deep/src/<slug>/{story.json,part-NN.json,pics.json} -> deep/data/<slug>.js + deep/data/library.js
// Pictures live in img/deep/<slug>/NN-K.jpg (K = 1..3) with credits in deep/src/<slug>/pics*.json { "NN-K": {file,url,author,license,caption} }.
// Usage: node build-deep.js <site-folder>
const fs = require('fs'), path = require('path');
const SITE = process.argv[2], SRC = path.join(SITE, 'deep', 'src'), OUT = path.join(SITE, 'deep', 'data');
const ORDER = ['printing-press', 'telescope', 'steam-engine', 'railways', 'electricity', 'telephone', 'photography',
  'automobile', 'airplane', 'rockets', 'vaccines', 'computer', 'internet', 'smartphone'];
fs.mkdirSync(OUT, { recursive: true });
const problems = [], library = [];
const words = (s) => String(s || '').split(/\s+/).filter(Boolean).length;
const pad = (n) => String(n).padStart(2, '0');
// Commons author fields can be messy: "Unknown authorUnknown author", "NSSDC, NASA[1]"
function cleanAuthor(s) {
  if (/wellcome/i.test(s) && /https?:|\.org|\.ac\.uk/i.test(s)) return 'Wellcome Collection';
  s = String(s || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/<[^>]*@[^>]*>/g, '').replace(/PGP:\s*\w+/g, '').replace(/\[\d+\]/g, '').replace(/https?:\/\/\S+/g, '').replace(/^Uploaded by\s+(\S+).*$/i, '$1').replace(/\s+/g, ' ').trim();
  if (s.length > 80) s = s.slice(0, 77).replace(/\s+\S*$/, '') + '…';
  const half = s.length / 2;
  if (s.length % 2 === 0 && s.slice(0, half) === s.slice(half)) s = s.slice(0, half);
  return /^unknown( author)?$/i.test(s) || /^(file url|catalog record)/i.test(s) || !s ? 'Unknown author' : s;
}
const splitPair =(s) => { const i = s.indexOf(' — '); return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 3)]; };

for (const slug of ORDER) {
  const dir = path.join(SRC, slug);
  if (!fs.existsSync(path.join(dir, 'story.json'))) { problems.push(`${slug}: no story.json`); continue; }
  const story = JSON.parse(fs.readFileSync(path.join(dir, 'story.json'), 'utf8'));
  const pics = {};
  for (const f of fs.readdirSync(dir).filter((f) => /^pics.*\.json$/.test(f))) {
    try { Object.assign(pics, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))); } catch (e) { problems.push(`${slug}/${f}: invalid JSON`); }
  }
  const parts = [], usedFiles = new Set(); // finders worked in separate ranges, so the same Commons file can repeat
  for (const o of story.outline) {
    const f = path.join(dir, `part-${pad(o.n)}.json`);
    if (!fs.existsSync(f)) continue;
    let p;
    try { p = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { problems.push(`${slug} part ${o.n}: invalid JSON`); continue; }
    if (!Array.isArray(p.sections) || !p.sections.length) { problems.push(`${slug} part ${o.n}: no sections`); continue; }
    const w = p.sections.reduce((t, s) => t + (s.paragraphs || []).reduce((a, x) => a + words(x), 0), 0) + words(p.deepDive);
    const photos = (p.pics || []).map((pic, i) => {
      const key = `${pad(o.n)}-${i + 1}`, c = pics[key];
      if (c && usedFiles.has(c.file)) { problems.push(`${slug} ${key}: repeats ${c.file} (dropped)`); return null; }
      if (c) usedFiles.add(c.file);
      return c && fs.existsSync(path.join(SITE, 'img', 'deep', slug, key + '.jpg'))
        ? { src: `img/deep/${slug}/${key}.jpg`, alt: c.caption || pic.want, file: c.file, url: c.url, author: cleanAuthor(c.author), license: c.license } : null;
    }).filter(Boolean);
    if (p.check && (!p.check.a || !Array.isArray(p.check.wrong))) problems.push(`${slug} part ${o.n}: bad check question`);
    parts.push({
      n: o.n, title: p.title || o.title, when: p.when || o.when, summary: p.summary, sections: p.sections,
      deepDive: p.deepDive, funFact: p.funFact, check: p.check, sources: (p.sources || []).filter((s) => /^https?:\/\//.test(s.url || '')),
      photos, words: w,
    });
  }
  const total = parts.reduce((t, p) => t + p.words, 0);
  const data = {
    slug, title: story.title, emoji: story.emoji, tagline: story.tagline, intro: story.intro,
    outline: story.outline.map((o) => ({ n: o.n, title: o.title, when: o.when })),
    people: (story.people || []).map(splitPair), glossary: (story.glossary || []).map(splitPair), parts, words: total,
  };
  fs.writeFileSync(path.join(OUT, slug + '.js'),
    `/* Deep Dive "${story.title}" — generated from deep/src/${slug}. Edit those files, then rebuild. */\n` +
    `window.DEEP_STORIES = window.DEEP_STORIES || {};\nwindow.DEEP_STORIES[${JSON.stringify(slug)}] = ${JSON.stringify(data)};\n`);
  library.push({
    slug, title: story.title, emoji: story.emoji, tagline: story.tagline, parts: parts.length, planned: story.outline.length,
    words: total, cover: (parts.find((p) => p.photos.length) || { photos: [] }).photos[0]?.src || null,
  });
  if (parts.length < story.outline.length) problems.push(`${slug}: ${parts.length}/${story.outline.length} parts written`);
}
fs.writeFileSync(path.join(OUT, 'library.js'),
  '/* Deep Dive library index. Generated by build-deep.js — do not edit by hand. */\nwindow.DEEP_LIBRARY = ' + JSON.stringify(library, null, 1) + ';\n');
const tw = library.reduce((t, s) => t + s.words, 0), tp = library.reduce((t, s) => t + s.parts, 0);
console.log(`stories: ${library.length}, parts: ${tp}, words: ${tw.toLocaleString('en-US')}`);
console.log(problems.length ? 'NOTES:\n' + problems.join('\n') : 'no problems');
