// Merges data/g*.json into data/inventions.js and data/credits.json into data/credits.js, checking everything.
// Usage: node build-data.js <site-folder>
const fs = require('fs'), path = require('path');
const SITE = process.argv[2], D = path.join(SITE, 'data');
const master = fs.readFileSync(path.join(D, 'MASTER.md'), 'utf8');
const ids = [...master.matchAll(/^## (g\d) .*\n(.+)$/gm)].flatMap((m) => m[2].split(',').map((s) => s.trim()));
const groups = fs.readdirSync(D).filter((f) => /^g\d+\.json$/.test(f)).sort();
const all = [], problems = [];
const FIELDS = ['id', 'name', 'emoji', 'year', 'when', 'where', 'who', 'category', 'kid', 'explorer', 'expert', 'how', 'before', 'impact', 'facts', 'ledTo', 'quiz', 'wiki'];
for (const g of groups) {
  let arr;
  try { arr = JSON.parse(fs.readFileSync(path.join(D, g), 'utf8')); } catch (e) { problems.push(`${g}: invalid JSON ${e.message}`); continue; }
  for (const x of arr) {
    for (const f of FIELDS) if (x[f] === undefined || x[f] === '') problems.push(`${g} ${x.id}: missing ${f}`);
    if (!ids.includes(x.id)) problems.push(`${g}: unknown id ${x.id}`);
    if (typeof x.year !== 'number') problems.push(`${x.id}: year not a number`);
    if (!Array.isArray(x.facts) || x.facts.length < 3) problems.push(`${x.id}: needs 3+ facts`);
    if (!Array.isArray(x.quiz) || x.quiz.length < 2) problems.push(`${x.id}: needs 2 quiz questions`);
    for (const q of x.quiz || []) {
      if (!q.q || !q.a || !Array.isArray(q.wrong) || q.wrong.length !== 3) problems.push(`${x.id}: bad quiz item`);
      else if (q.wrong.includes(q.a) || new Set(q.wrong).size !== 3) problems.push(`${x.id}: duplicate quiz option "${q.q}"`);
    }
    x.ledTo = (x.ledTo || []).filter((id) => { const ok = ids.includes(id) && id !== x.id; if (!ok) problems.push(`${x.id}: ledTo bad id ${id} (dropped)`); return ok; });
    all.push(x);
  }
}
const seen = new Set();
for (const x of all) { if (seen.has(x.id)) problems.push(`duplicate ${x.id}`); seen.add(x.id); }
const missing = ids.filter((id) => !seen.has(id));
if (missing.length) problems.push(`not written yet: ${missing.join(', ')}`);
fs.writeFileSync(path.join(D, 'inventions.js'), '/* Invention Lab data: ' + all.length + ' inventions. Generated from data/g*.json — edit those, then rebuild. */\nwindow.INVENTIONS = ' + JSON.stringify(all, null, 1) + ';\n');

// photo credits + image sizes
function jpegSize(file) {
  const b = fs.readFileSync(file);
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xc3) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}
const credits = fs.existsSync(path.join(D, 'credits.json')) ? JSON.parse(fs.readFileSync(path.join(D, 'credits.json'), 'utf8')) : {};
const out = {};
for (const x of all) {
  const c = credits[x.id], img = path.join(SITE, 'img', x.id + '.jpg');
  if (c && fs.existsSync(img)) { const s = jpegSize(img); out[x.id] = Object.assign({}, c, s || {}); }
}
fs.writeFileSync(path.join(D, 'credits.js'), '/* Photo credits (Wikimedia Commons). Generated — do not edit by hand. */\nwindow.PHOTO_CREDITS = ' + JSON.stringify(out, null, 1) + ';\n');
console.log(`inventions: ${all.length}/${ids.length}, photos: ${Object.keys(out).length}`);
console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'no problems');
