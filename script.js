/* ============================================================
   INVENTION LAB — all the interactive parts
   1. Saved progress (notebook, streaks, badges)
   2. Drifting sparks background
   3. Reading levels (Kid / Explorer / Expert)
   4. Invention cards + spotlight + pop-up
   5. "Did you know?" facts
   6. The Great Timeline
   7. Games: Which Came First?, Time Machine, Inventor Quiz, Invention Chain
   8. Inventor's Notebook + badges
   9. Deep Dive Library shelf (links to deep.html)
   ============================================================ */

const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ALL = (window.INVENTIONS || []).slice().sort((a, b) => a.year - b.year);
const BY_ID = Object.fromEntries(ALL.map((x) => [x.id, x]));
const CREDITS = window.PHOTO_CREDITS || {};
const $ = (s) => document.querySelector(s);

const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const yearText = (y) => (y < 0 ? Math.abs(y).toLocaleString() + " BCE" : String(y));

// what each invention came from (the reverse of "led to")
const CAME_FROM = {};
for (const inv of ALL) for (const id of inv.ledTo || []) if (BY_ID[id]) (CAME_FROM[id] = CAME_FROM[id] || []).push(inv.id);

/* ---------- 1. SAVED PROGRESS ----------
   Kept in this browser only. Everything still works if storage is blocked. */
const KEY = "inventionLab.v1";
const state = Object.assign(
  { seen: [], levelsRead: [], visits: 0, lastDay: "", streak: 0, level: "explorer", recent: [],
    firstBest: 0, quizBest: 0, sortPerfect: 0, chainWins: 0, badges: [] },
  (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })()
);
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked: fine */ } }

(function countVisit() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.lastDay !== today) {
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    state.streak = state.lastDay === yesterday ? state.streak + 1 : 1;
    state.lastDay = today;
  }
  state.visits += 1;
  save();
})();

function markSeen(id) {
  const fresh = !state.seen.includes(id);
  if (fresh) state.seen.push(id);
  if (!state.levelsRead.includes(state.level)) state.levelsRead.push(state.level);
  save();
  if (fresh) { refreshStats(); refreshNotebook(); markTimelineSeen(id); }
  checkBadges();
  return fresh;
}

/* ---------- 2. DRIFTING SPARKS ---------- */
(function sparks() {
  const canvas = $("#sparks");
  const ctx = canvas.getContext("2d");
  let dots = [];
  function resize() {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    const n = Math.round((innerWidth * innerHeight) / 26000);
    dots = Array.from({ length: n }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: (Math.random() * 1.6 + 0.6) * devicePixelRatio,
      vy: -(Math.random() * 0.25 + 0.08) * devicePixelRatio,
      vx: (Math.random() - 0.5) * 0.12 * devicePixelRatio,
      c: Math.random() < 0.7 ? "255,184,77" : "95,212,255",
      p: Math.random() * Math.PI * 2,
    }));
  }
  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const d of dots) {
      if (!calm) { d.y += d.vy; d.x += d.vx; if (d.y < -10) { d.y = canvas.height + 10; d.x = Math.random() * canvas.width; } }
      const a = calm ? 0.5 : 0.25 + 0.45 * Math.abs(Math.sin(d.p + t * 0.0012));
      ctx.fillStyle = `rgba(${d.c},${a})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
    }
    if (!calm) requestAnimationFrame(draw);
  }
  addEventListener("resize", () => { resize(); if (calm) draw(0); });
  resize();
  requestAnimationFrame(draw);
})();

/* ---------- 3. READING LEVELS ---------- */
const LEVEL_FACTS = { kid: 2, explorer: 3, expert: 4 };
function setLevel(level) {
  state.level = level; save();
  document.querySelectorAll(".lv").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.level === level)));
  if (spotId) renderSpot(spotId, false);
  if ($("#modal").open && modalId) renderInto($("#modalCard"), BY_ID[modalId], false);
  if (!state.levelsRead.includes(level)) { state.levelsRead.push(level); save(); checkBadges(); }
}
document.querySelectorAll(".lv").forEach((b) => b.addEventListener("click", () => setLevel(b.dataset.level)));

/* ---------- 4. INVENTION CARDS ---------- */
function photoHtml(inv) {
  const c = CREDITS[inv.id];
  if (!c) return `<figure><span class="emoji-art" aria-hidden="true">${inv.emoji}</span></figure>`;
  return `<figure><img src="img/${inv.id}.jpg" alt="${esc(inv.name)}" loading="lazy" width="${c.w || 800}" height="${c.h || 600}" /></figure>
    <figcaption>Photo: ${esc(c.author || "Wikimedia Commons")} · ${esc(c.license || "")}</figcaption>`;
}
function chipLinks(ids, label) {
  const ok = (ids || []).filter((id) => BY_ID[id]);
  if (!ok.length) return "";
  return `<div class="led"><b>${label}</b><div class="chips">${ok
    .map((id) => `<button class="chip small" data-open="${id}">${BY_ID[id].emoji} ${esc(BY_ID[id].name)}</button>`)
    .join("")}</div></div>`;
}
function cardHtml(inv) {
  const lv = state.level;
  const facts = inv.facts.slice(0, LEVEL_FACTS[lv]);
  return `
    <div class="spot-photo">${photoHtml(inv)}</div>
    <div class="spot-body">
      <div class="discover" data-discover></div>
      <h3>${inv.emoji} ${esc(inv.name)}</h3>
      <p class="who">${esc(inv.who)}</p>
      <div class="spot-meta">
        <span class="tag year">📅 ${esc(inv.when)}</span>
        <span class="tag">📍 ${esc(inv.where)}</span>
        <span class="tag">${esc(inv.category)}</span>
      </div>
      <p class="story">${esc(inv[lv])}</p>
      <div class="boxes">
        <div class="box"><b>⚙️ How it works</b><p>${esc(inv.how)}</p></div>
        <div class="box"><b>⏮️ Before it</b><p>${esc(inv.before)}</p></div>
        <div class="box"><b>🌍 Why it mattered</b><p>${esc(inv.impact)}</p></div>
      </div>
      <ul class="facts">${facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      ${chipLinks(CAME_FROM[inv.id], "⬅️ Came from")}
      ${chipLinks(inv.ledTo, "➡️ Led to")}
    </div>`;
}
/* Discovering an invention takes 5 minutes on that one invention (no more spamming "Another one"!).
   Time only counts while the page is visible; switching to a different invention starts over. */
const DISCOVER_MS = 5 * 60 * 1000;
let disc = { id: null, el: null, ms: 0, last: 0, timer: 0 };
function discoverBar(el, id) {
  const box = el.querySelector("[data-discover]");
  if (!box) return;
  if (state.seen.includes(id)) { box.className = "discover done"; box.innerHTML = "✅ In your notebook"; return; }
  if (disc.id !== id) { box.className = "discover"; box.innerHTML = "🔍 Stay on this invention for 5 minutes to discover it"; return; }
  const left = Math.max(0, Math.ceil((DISCOVER_MS - disc.ms) / 1000));
  box.className = "discover";
  box.innerHTML = `🔍 Discovering… stay for <b>${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}</b> more
    <span class="disc-bar"><i style="width:${Math.min(100, (disc.ms / DISCOVER_MS) * 100).toFixed(1)}%"></i></span>`;
}
function startDiscover(el, id) {
  clearInterval(disc.timer);
  disc = { id, el, ms: 0, last: Date.now(), timer: 0 };
  if (!state.seen.includes(id)) disc.timer = setInterval(tickDiscover, 1000);
  discoverBar(el, id);
}
function tickDiscover() {
  const now = Date.now();
  if (!document.hidden) disc.ms += Math.min(now - disc.last, 2000); // a sleeping/hidden tab doesn't count
  disc.last = now;
  if (!disc.el || !disc.el.isConnected) return;
  if (disc.ms >= DISCOVER_MS) {
    clearInterval(disc.timer);
    if (markSeen(disc.id)) {
      const photo = disc.el.querySelector(".spot-photo");
      if (photo) photo.insertAdjacentHTML("beforeend", '<span class="new-stamp">NEW IN YOUR NOTEBOOK!</span>');
      toast(`📓 Discovered: ${BY_ID[disc.id].emoji} ${BY_ID[disc.id].name}!`);
    }
  }
  discoverBar(disc.el, disc.id);
}
// track = false means "just redraw" (e.g. reading level changed): the timer keeps going
function renderInto(el, inv, track = true) {
  el.innerHTML = cardHtml(inv);
  if (track) startDiscover(el, inv.id);
  else discoverBar(el, inv.id);
}

let spotId = null;
function renderSpot(id, track = true) {
  spotId = id;
  renderInto($("#spotCard"), BY_ID[id], track);
  if (track) {
    state.recent = [id].concat(state.recent.filter((x) => x !== id)).slice(0, 30);
    save();
  }
}
// a new invention every visit: prefer ones you haven't opened yet, and never the last few
function freshPick() {
  const unseen = ALL.filter((x) => !state.seen.includes(x.id));
  const pool = (unseen.length ? unseen : ALL).filter((x) => !state.recent.slice(0, 8).includes(x.id));
  return pick(pool.length ? pool : ALL).id;
}
$("#spotRandom").addEventListener("click", () => renderSpot(freshPick()));
$("#spotPrev").addEventListener("click", () => { const i = ALL.findIndex((x) => x.id === spotId); renderSpot(ALL[(i - 1 + ALL.length) % ALL.length].id); });
$("#spotNext").addEventListener("click", () => { const i = ALL.findIndex((x) => x.id === spotId); renderSpot(ALL[(i + 1) % ALL.length].id); });

// pop-up for anything clicked elsewhere
let modalId = null;
function openModal(id) {
  if (!BY_ID[id]) return;
  modalId = id;
  renderInto($("#modalCard"), BY_ID[id]);
  const m = $("#modal");
  if (!m.open) m.showModal();
  m.scrollTop = 0;
}
$("#modalX").addEventListener("click", () => $("#modal").close());
// closing the pop-up goes back to the spotlight invention, which starts its own 5 minutes
$("#modal").addEventListener("close", () => { modalId = null; if (spotId) startDiscover($("#spotCard"), spotId); });
document.querySelectorAll("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));
document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-open]");
  if (!t) return;
  // inside the spotlight, links swap the spotlight; anywhere else they open the pop-up
  if (t.closest("#spotCard")) renderSpot(t.dataset.open);
  else openModal(t.dataset.open);
});

/* ---------- 5. DID YOU KNOW? ---------- */
const FACTS = ALL.flatMap((inv) => inv.facts.map((f) => ({ f, inv })));
let factDeck = [];
function nextFact() {
  if (!factDeck.length) factDeck = shuffle(FACTS);
  const { f, inv } = factDeck.pop();
  $("#dykText").innerHTML = `${esc(f)} <button class="linkish" data-open="${inv.id}">(${inv.emoji} ${esc(inv.name)})</button>`;
}
$("#dykNext").addEventListener("click", nextFact);

/* ---------- 6. THE GREAT TIMELINE ---------- */
const ERAS = [
  { name: "🏺 Ancient World", from: -Infinity, to: 499, note: "before 500 CE" },
  { name: "🏰 Middle Ages", from: 500, to: 1449, note: "500 – 1449" },
  { name: "🧭 Age of Exploration", from: 1450, to: 1759, note: "1450 – 1759" },
  { name: "🏭 Industrial Revolution", from: 1760, to: 1899, note: "1760 – 1899" },
  { name: "✈️ Modern Age", from: 1900, to: 1969, note: "1900 – 1969" },
  { name: "💻 Digital Age", from: 1970, to: Infinity, note: "1970 – today" },
];
const eraOf = (y) => ERAS.find((e) => y >= e.from && y <= e.to);
const CATS = [...new Set(ALL.map((x) => x.category))];
let tlCat = "All";
function buildTimeline() {
  $("#tlCats").innerHTML = ["All", ...CATS]
    .map((c) => `<button class="chip small${c === tlCat ? " on" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
  const q = $("#tlSearch").value.trim().toLowerCase();
  const list = ALL.filter((x) => (tlCat === "All" || x.category === tlCat) &&
    (!q || [x.name, x.who, x.where, x.category, x.when].join(" ").toLowerCase().includes(q)));
  $("#tlEmpty").classList.toggle("hidden", list.length > 0);
  $("#tlEras").innerHTML = ERAS.map((era) => {
    const items = list.filter((x) => eraOf(x.year) === era);
    if (!items.length) return "";
    return `<div class="era"><div class="era-head"><h3>${era.name}</h3><small>${era.note} · ${items.length} inventions</small></div>
      <div class="tl-row">${items.map((x) => `<button class="tl-item${state.seen.includes(x.id) ? " seen" : ""}" data-open="${x.id}" data-id="${x.id}">
        <span class="e">${x.emoji}</span><span><b>${esc(x.name)}</b><small>${esc(x.when)}</small></span></button>`).join("")}</div></div>`;
  }).join("");
}
function markTimelineSeen(id) { const el = document.querySelector(`.tl-item[data-id="${id}"]`); if (el) el.classList.add("seen"); }
$("#tlCats").addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (b) { tlCat = b.dataset.cat; buildTimeline(); } });
let searchT = 0;
$("#tlSearch").addEventListener("input", () => { clearTimeout(searchT); searchT = setTimeout(buildTimeline, 120); });

/* ---------- 7. GAMES ---------- */
const box = $("#gameBox");
let game = "first";
document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === t));
  game = t.dataset.game; startGame();
}));
function startGame() { ({ first: firstGame, sort: sortGame, quiz: quizGame, chain: chainGame })[game](); }
const thumb = (inv) => CREDITS[inv.id] ? `<span class="thumb"><img src="img/${inv.id}.jpg" alt="" loading="lazy" /></span>` : `<span class="thumb">${inv.emoji}</span>`;

// 7a. WHICH CAME FIRST? — pairs get closer in time as your streak grows
let firstStreak = 0;
function firstGame() {
  const gap = firstStreak < 3 ? 400 : firstStreak < 6 ? 120 : firstStreak < 10 ? 40 : 1;
  let a, b, tries = 0;
  do { a = pick(ALL); b = pick(ALL); tries++; }
  while ((a === b || a.year === b.year || Math.abs(a.year - b.year) < gap) && tries < 500);
  box.innerHTML = `<div class="g-head"><p>Which was invented <b>first</b>?</p><span class="score">Streak ${firstStreak} · Best ${state.firstBest}</span></div>
    <div class="vs">
      <button class="pick" data-id="${a.id}">${thumb(a)}<b>${a.emoji} ${esc(a.name)}</b><small class="yr">?</small></button>
      <span class="or">or</span>
      <button class="pick" data-id="${b.id}">${thumb(b)}<b>${b.emoji} ${esc(b.name)}</b><small class="yr">?</small></button>
    </div>
    <p class="verdict" id="verdict"></p>`;
  const older = a.year < b.year ? a : b;
  box.querySelectorAll(".pick").forEach((btn) => btn.addEventListener("click", () => {
    box.querySelectorAll(".pick").forEach((p) => {
      p.disabled = true;
      const inv = BY_ID[p.dataset.id];
      p.querySelector(".yr").textContent = inv.when;
      p.classList.add(inv === older ? "right" : "wrong");
    });
    const v = $("#verdict");
    if (btn.dataset.id === older.id) {
      firstStreak++; state.firstBest = Math.max(state.firstBest, firstStreak); save(); checkBadges();
      v.className = "verdict good"; v.textContent = `✅ Right! ${older.name} came first.`;
    } else {
      v.className = "verdict bad"; v.textContent = `❌ Not quite — ${older.name} is older. Streak reset.`;
      firstStreak = 0;
    }
    v.insertAdjacentHTML("beforeend", ` <button class="chip small" id="firstNext">Next pair →</button> <button class="chip small" data-open="${older.id}">Read about it</button>`);
    $("#firstNext").addEventListener("click", firstGame);
  }));
}

// 7b. TIME MACHINE — put 5 inventions in order, oldest first
function sortGame() {
  let picks;
  do { picks = shuffle(ALL).slice(0, 5); } while (new Set(picks.map((x) => x.year)).size < 5);
  let order = picks.map((x) => x.id);
  const draw = (checked) => {
    const correct = order.slice().sort((a, b) => BY_ID[a].year - BY_ID[b].year);
    box.innerHTML = `<div class="g-head"><p>⏳ Put these in order — <b>oldest at the top</b>. Use ▲ ▼ to move them.</p><span class="score">Perfect rounds ${state.sortPerfect}</span></div>
      <ol class="sort-list">${order.map((id, i) => {
        const x = BY_ID[id], cls = checked ? (correct[i] === id ? "ok" : "no") : "";
        return `<li class="${cls}"><span class="e">${x.emoji}</span><span class="nm">${esc(x.name)}</span>
          ${checked ? `<span class="yr">${esc(x.when)}</span>` : `<button class="mv" data-i="${i}" data-d="-1" ${i === 0 ? "disabled" : ""} aria-label="Move up">▲</button><button class="mv" data-i="${i}" data-d="1" ${i === order.length - 1 ? "disabled" : ""} aria-label="Move down">▼</button>`}</li>`;
      }).join("")}</ol>
      ${checked ? "" : '<button class="chip accent" id="sortCheck">Lock in my order 🔒</button>'}
      <p class="verdict" id="verdict"></p>`;
    box.querySelectorAll(".mv").forEach((b) => b.addEventListener("click", () => {
      const i = +b.dataset.i, j = i + +b.dataset.d;
      [order[i], order[j]] = [order[j], order[i]]; draw(false);
    }));
    if (!checked) $("#sortCheck").addEventListener("click", () => draw(true));
    else {
      const right = order.filter((id, i) => correct[i] === id).length;
      const v = $("#verdict");
      if (right === 5) { state.sortPerfect++; save(); checkBadges(); v.className = "verdict good"; v.textContent = "🏆 Perfect! You're a time traveler."; }
      else { v.className = "verdict bad"; v.textContent = `${right} of 5 in the right spot. Real order: ${correct.map((id) => BY_ID[id].name).join(" → ")}`; }
      v.insertAdjacentHTML("beforeend", ' <button class="chip small" id="sortAgain">New round →</button>');
      $("#sortAgain").addEventListener("click", sortGame);
    }
  };
  draw(false);
}

// 7c. INVENTOR QUIZ — 10 questions drawn from 280 hand-written ones plus generated ones
function makeQuestions() {
  const qs = [];
  const written = shuffle(ALL.flatMap((inv) => (inv.quiz || []).map((q) => ({ ...q, about: inv.id }))));
  qs.push(...written.slice(0, 7));
  // generated: which of four came first
  let four; do { four = shuffle(ALL).slice(0, 4); } while (new Set(four.map((x) => x.year)).size < 4);
  const oldest = four.reduce((m, x) => (x.year < m.year ? x : m));
  qs.push({ q: "Which of these was invented first?", a: oldest.name, wrong: four.filter((x) => x !== oldest).map((x) => x.name), about: oldest.id });
  // generated: which era
  const e = pick(ALL), era = eraOf(e.year);
  qs.push({ q: `${e.emoji} In which era was the ${e.name.toLowerCase()} invented?`, a: era.name, wrong: shuffle(ERAS.filter((x) => x !== era)).slice(0, 3).map((x) => x.name), about: e.id });
  // generated: what did it lead to
  const withLinks = ALL.filter((x) => (x.ledTo || []).length);
  const l = pick(withLinks), led = BY_ID[pick(l.ledTo)];
  if (led) {
    const not = shuffle(ALL.filter((x) => x !== l && !(l.ledTo || []).includes(x.id))).slice(0, 3);
    qs.push({ q: `${l.emoji} The ${l.name.toLowerCase()} helped make which of these possible?`, a: led.name, wrong: not.map((x) => x.name), about: l.id });
  }
  return shuffle(qs).slice(0, 10);
}
function quizGame() {
  const qs = makeQuestions();
  let i = 0, score = 0;
  const ask = () => {
    if (i >= qs.length) {
      state.quizBest = Math.max(state.quizBest, score); save(); checkBadges();
      const msg = score === 10 ? "🏆 PERFECT! Master Inventor!" : score >= 7 ? "🌟 Great job, inventor!" : score >= 4 ? "👍 Nice work — keep exploring!" : "💡 Every inventor starts somewhere. Try again!";
      box.innerHTML = `<div class="end-screen"><p class="big">${score}/10</p><p>${msg}</p><p class="note">Best score: ${state.quizBest}/10 · Questions change every time!</p><button class="chip accent" id="quizAgain">New quiz →</button></div>`;
      $("#quizAgain").addEventListener("click", quizGame);
      return;
    }
    const q = qs[i];
    const opts = shuffle([q.a, ...q.wrong]);
    box.innerHTML = `<p class="q-progress">Question ${i + 1} of ${qs.length} · Score ${score}</p>
      <div class="q-bar"><i style="width:${(i / qs.length) * 100}%"></i></div>
      <p class="q-text">${esc(q.q)}</p>
      <div class="answers">${opts.map((o) => `<button class="ans">${esc(o)}</button>`).join("")}</div>
      <p class="verdict" id="verdict"></p>`;
    box.querySelectorAll(".ans").forEach((b) => b.addEventListener("click", () => {
      const ok = b.textContent === q.a;
      if (ok) score++;
      box.querySelectorAll(".ans").forEach((x) => { x.disabled = true; if (x.textContent === q.a) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      const v = $("#verdict");
      v.className = "verdict " + (ok ? "good" : "bad");
      v.innerHTML = (ok ? "✅ Correct!" : `❌ The answer is: ${esc(q.a)}`) +
        ` <button class="chip small" data-open="${q.about}">Learn more</button> <button class="chip small accent" id="qNext">${i + 1 < qs.length ? "Next →" : "See score"}</button>`;
      $("#qNext").addEventListener("click", () => { i++; ask(); });
    }));
  };
  ask();
}

// 7d. INVENTION CHAIN — follow the "led to" links from one invention to another
function shortestPath(from, to) {
  const prev = { [from]: null }, queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === to) break;
    for (const n of (BY_ID[cur].ledTo || []).filter((id) => BY_ID[id])) if (!(n in prev)) { prev[n] = cur; queue.push(n); }
  }
  if (!(to in prev)) return null;
  const path = []; for (let c = to; c; c = prev[c]) path.unshift(c);
  return path;
}
function chainGame() {
  let start, goal, best, tries = 0;
  do {
    start = pick(ALL.filter((x) => (x.ledTo || []).length)).id;
    goal = pick(ALL).id;
    best = shortestPath(start, goal);
    tries++;
  } while ((!best || best.length < 3 || best.length > 5) && tries < 3000);
  if (!best) { box.innerHTML = "<p>Chains are still being built — try another game!</p>"; return; }
  const path = [start];
  const draw = () => {
    const cur = path[path.length - 1];
    const won = cur === goal;
    const next = (BY_ID[cur].ledTo || []).filter((id) => BY_ID[id]);
    box.innerHTML = `<div class="g-head"><p>🔗 Get from <b>${BY_ID[start].emoji} ${esc(BY_ID[start].name)}</b> to <b>${BY_ID[goal].emoji} ${esc(BY_ID[goal].name)}</b> by following what each invention <b>led to</b>.</p>
      <span class="score">Chains won ${state.chainWins}</span></div>
      <div class="chain-path">${path.map((id) => `<span class="node">${BY_ID[id].emoji} ${esc(BY_ID[id].name)}</span>`).join('<span class="arrow">→</span>')}
        ${won ? "" : `<span class="arrow">→ … →</span><span class="node goal">${BY_ID[goal].emoji} ${esc(BY_ID[goal].name)}</span>`}</div>
      ${won ? `<p class="verdict good">🎉 You made it in ${path.length - 1} steps! (Shortest possible: ${best.length - 1})</p>
          <button class="chip accent" id="chainAgain">New chain →</button>`
        : `<p>${BY_ID[cur].emoji} <b>${esc(BY_ID[cur].name)}</b> led to…</p>
          <div class="answers">${next.length ? next.map((id) => `<button class="ans" data-step="${id}">${BY_ID[id].emoji} ${esc(BY_ID[id].name)}</button>`).join("") : "<p class='note'>Dead end! Nothing on our list came from this one.</p>"}</div>
          <p>${path.length > 1 ? '<button class="chip small" id="chainBack">⏪ Step back</button>' : ""} <button class="chip small" id="chainHint">💡 Hint</button> <button class="chip small" id="chainSkip">New chain</button></p>
          <p class="verdict" id="verdict"></p>`}`;
    if (won) { $("#chainAgain").addEventListener("click", chainGame); return; }
    box.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => {
      path.push(b.dataset.step);
      if (b.dataset.step === goal) { state.chainWins++; save(); checkBadges(); }
      draw();
    }));
    if (path.length > 1) $("#chainBack").addEventListener("click", () => { path.pop(); draw(); });
    $("#chainSkip").addEventListener("click", chainGame);
    $("#chainHint").addEventListener("click", () => {
      const rest = shortestPath(cur, goal);
      const v = $("#verdict");
      v.className = "verdict";
      v.textContent = rest ? `💡 Try ${BY_ID[rest[1]].emoji} ${BY_ID[rest[1]].name} next.` : "💡 You can't reach the goal from here — step back!";
    });
  };
  draw();
}

/* ---------- 8. NOTEBOOK + BADGES ---------- */
const BADGES = [
  { id: "spark", ic: "✨", name: "First Spark", desc: "Discover your first invention", test: () => state.seen.length >= 1 },
  { id: "c10", ic: "📓", name: "Collector", desc: "Discover 10 inventions", test: () => state.seen.length >= 10 },
  { id: "c25", ic: "🔧", name: "Tinkerer", desc: "Discover 25 inventions", test: () => state.seen.length >= 25 },
  { id: "c50", ic: "⚙️", name: "Engineer", desc: "Discover 50 inventions", test: () => state.seen.length >= 50 },
  { id: "c100", ic: "🏛️", name: "Historian", desc: "Discover 100 inventions", test: () => state.seen.length >= 100 },
  { id: "call", ic: "👑", name: "Grand Inventor", desc: "Discover every invention", test: () => ALL.length && state.seen.length >= ALL.length },
  { id: "cats", ic: "🧩", name: "All-Rounder", desc: "Discover one from every category", test: () => CATS.every((c) => state.seen.some((id) => BY_ID[id] && BY_ID[id].category === c)) },
  { id: "levels", ic: "🎓", name: "Deep Diver", desc: "Read at all 3 levels", test: () => ["kid", "explorer", "expert"].every((l) => state.levelsRead.includes(l)) },
  { id: "first10", ic: "⚔️", name: "Time Judge", desc: "Get a 10 streak in Which Came First?", test: () => state.firstBest >= 10 },
  { id: "sort", ic: "⏳", name: "Time Traveler", desc: "A perfect Time Machine round", test: () => state.sortPerfect >= 1 },
  { id: "quiz", ic: "🧠", name: "Master Inventor", desc: "Score 10/10 on the quiz", test: () => state.quizBest >= 10 },
  { id: "chain", ic: "🔗", name: "Chain Builder", desc: "Win 3 invention chains", test: () => state.chainWins >= 3 },
  { id: "streak", ic: "🔥", name: "On Fire", desc: "Visit 7 days in a row", test: () => state.streak >= 7 },
  { id: "regular", ic: "🏠", name: "Lab Regular", desc: "Visit the lab 20 times", test: () => state.visits >= 20 },
];
let badgesReady = false;
function checkBadges() {
  for (const b of BADGES) {
    if (!state.badges.includes(b.id) && b.test()) {
      state.badges.push(b.id); save();
      if (badgesReady) toast(`${b.ic} Badge earned: ${b.name}!`);
    }
  }
  refreshBadges(); refreshStats();
}
function refreshBadges() {
  $("#badges").innerHTML = BADGES.map((b) => `<div class="badge${state.badges.includes(b.id) ? " got" : ""}"><div class="ic">${b.ic}</div><b>${b.name}</b><small>${b.desc}</small></div>`).join("");
}
function refreshNotebook() {
  const n = state.seen.filter((id) => BY_ID[id]).length;
  $("#nbBar").style.width = (ALL.length ? (n / ALL.length) * 100 : 0) + "%";
  $("#nbText").textContent = `${n} / ${ALL.length}`;
  $("#nbGrid").innerHTML = ALL.map((x) => {
    const seen = state.seen.includes(x.id);
    return `<button class="nb-cell${seen ? " seen" : ""}" data-open="${x.id}" title="${seen ? esc(x.name) : "Not discovered yet — tap it, then stay 5 minutes to discover it!"}"><span>${x.emoji}</span></button>`;
  }).join("");
}
function refreshStats() {
  $("#statFound").textContent = state.seen.filter((id) => BY_ID[id]).length;
  $("#statStreak").textContent = state.streak;
  $("#statBadges").textContent = state.badges.length;
}
let toastT = 0;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 3200);
}
$("#resetBtn").addEventListener("click", () => {
  if (!confirm("Erase your notebook, badges and scores?")) return;
  Object.assign(state, { seen: [], levelsRead: [], badges: [], firstBest: 0, quizBest: 0, sortPerfect: 0, chainWins: 0, recent: [] });
  save(); refreshNotebook(); refreshBadges(); refreshStats(); buildTimeline();
});

// photo credits
$("#creditsBtn").addEventListener("click", () => {
  $("#creditList").innerHTML = ALL.filter((x) => CREDITS[x.id]).map((x) => {
    const c = CREDITS[x.id];
    return `<li><b>${esc(x.name)}</b>: <a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.file)}</a> by ${esc(c.author || "unknown")} · ${esc(c.license || "")}</li>`;
  }).join("");
  $("#credits").showModal();
});

/* ---------- 9. DEEP DIVE LIBRARY SHELF ---------- */
function buildShelf() {
  const lib = window.DEEP_LIBRARY || [];
  if (!lib.length) { $("#library").classList.add("hidden"); return; }
  const words = lib.reduce((t, s) => t + s.words, 0);
  $("#libSub").textContent = `${lib.length} giant stories, 20 chapters each, about ${Math.round(words / 1000)},000 words so far, with the sources we used. Pick a book and dive in.`;
  $("#libShelf").innerHTML = lib.map((s) => s.parts
    ? `<a class="tl-item" href="deep.html#/${esc(s.slug)}"><span class="e">${esc(s.emoji)}</span><span><b>${esc(s.title)}</b><small>${s.parts} chapters</small></span></a>`
    : `<span class="tl-item off"><span class="e">${esc(s.emoji)}</span><span><b>${esc(s.title)}</b><small>being written…</small></span></span>`).join("");
}

/* ---------- START ---------- */
$("#count").textContent = ALL.length;
$("#visitNo").textContent = state.visits;
document.querySelectorAll(".lv").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.level === state.level)));
nextFact();
buildTimeline();
refreshNotebook();
buildShelf();
checkBadges();
badgesReady = true;
if (ALL.length) renderSpot(freshPick());
startGame();
