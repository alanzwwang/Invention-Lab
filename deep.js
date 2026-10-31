/* ============================================================
   DEEP DIVE LIBRARY
   Routes (in the address bar after #):
     #/                 the library shelf
     #/<story>          a story's chapter list
     #/<story>/<n>      chapter n of a story
   Story text is in deep/data/<story>.js (made by build-deep.js) and is only loaded when needed.
   ============================================================ */

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const LIB = window.DEEP_LIBRARY || [];
const WPM = 200; // reading speed used for "minutes" estimates

/* ---------- saved progress (this browser only) ---------- */
const KEY = "inventionLab.deep.v1", LAB_KEY = "inventionLab.v1";
const load = (k) => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } };
const state = Object.assign({ read: {}, quiz: {}, last: null, size: 0 }, load(KEY));
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked: fine */ } }
const readList = (slug) => state.read[slug] || (state.read[slug] = []);
const isRead = (slug, n) => (state.read[slug] || []).includes(n);

/* reading level is shared with the main Lab page */
const lab = load(LAB_KEY);
let level = lab.level || "explorer";
function setLevel(lv) {
  level = lv;
  const l = load(LAB_KEY); l.level = lv;
  l.levelsRead = Array.from(new Set([...(l.levelsRead || []), lv]));
  try { localStorage.setItem(LAB_KEY, JSON.stringify(l)); } catch (e) { /* fine */ }
  document.querySelectorAll(".lv").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.level === lv)));
  route();
}
document.querySelectorAll(".lv").forEach((b) => b.addEventListener("click", () => setLevel(b.dataset.level)));
document.querySelectorAll(".lv").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.level === level)));

/* text size */
function applySize() { document.documentElement.style.setProperty("--read-size", (1.12 + state.size * 0.1).toFixed(2) + "rem"); }
document.querySelectorAll(".ts").forEach((b) => b.addEventListener("click", () => {
  state.size = Math.max(-2, Math.min(4, state.size + Number(b.dataset.step))); save(); applySize();
}));
applySize();

/* ---------- load a story's data file on demand ---------- */
const loading = {};
function getStory(slug) {
  window.DEEP_STORIES = window.DEEP_STORIES || {};
  if (window.DEEP_STORIES[slug]) return Promise.resolve(window.DEEP_STORIES[slug]);
  if (!LIB.some((s) => s.slug === slug)) return Promise.resolve(null);
  return loading[slug] || (loading[slug] = new Promise((res) => {
    const sc = document.createElement("script");
    sc.src = `deep/data/${slug}.js`;
    sc.onload = () => res(window.DEEP_STORIES[slug] || null);
    sc.onerror = () => res(null);
    document.head.appendChild(sc);
  }));
}

/* ---------- helpers ---------- */
const mins = (w) => Math.max(1, Math.round(w / WPM));
function timeText(m) { return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
let toastT = 0;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 3200);
}
function setTitle(t) { document.title = t ? `${t} · Deep Dive Library` : "Deep Dive Library · Invention Lab"; }

/* ---------- views ---------- */
const view = $("#view");

function renderLibrary() {
  setTitle("");
  const totalWords = LIB.reduce((t, s) => t + s.words, 0);
  const totalParts = LIB.reduce((t, s) => t + s.parts, 0);
  const readParts = Object.values(state.read).reduce((t, a) => t + a.length, 0);
  const cont = state.last && LIB.find((s) => s.slug === state.last.slug);
  view.innerHTML = `
    <section class="lib-hero">
      <p class="kicker">Invention Lab · Library</p>
      <h1>The <span class="shine">Deep Dive</span> Library</h1>
      <p class="lead">${LIB.length} giant stories of inventions that changed the world, each told in 20 chapters with real people,
        real places and the sources we used. Altogether that's about ${timeText(mins(totalWords))} of reading.</p>
      <div class="hero-stats">
        <div class="stat"><b>${readParts}</b><small>chapters read</small></div>
        <div class="stat"><b>${totalParts}</b><small>chapters so far</small></div>
        <div class="stat"><b>${Math.round(totalWords / 1000)}k</b><small>words</small></div>
      </div>
      ${cont ? `<a class="btn" href="#/${cont.slug}/${state.last.n}">Continue: ${esc(cont.emoji)} ${esc(cont.title)}, chapter ${state.last.n} →</a>` : ""}
    </section>
    <div class="lib-grid">
      ${LIB.map((s) => {
        const r = (state.read[s.slug] || []).length, soon = s.parts === 0;
        const done = s.parts > 0 && r >= s.planned;
        return `<a class="book${soon ? " soon" : ""}${done ? " done" : ""}" href="${soon ? "#/" : "#/" + s.slug}">
          <span class="e">${esc(s.emoji)}</span>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.tagline)}</p>
          <span class="meta">${soon ? "✍️ being written…" : `${s.parts}${s.parts < s.planned ? " of " + s.planned : ""} chapters · ${timeText(mins(s.words))}`}${r ? ` · ${r} read` : ""}</span>
          <span class="bar"><i style="width:${s.planned ? Math.round((100 * r) / s.planned) : 0}%"></i></span>
        </a>`;
      }).join("")}
    </div>`;
}

function renderStory(st) {
  setTitle(st.title);
  const have = new Map(st.parts.map((p) => [p.n, p]));
  const firstUnread = st.parts.find((p) => !isRead(st.slug, p.n)) || st.parts[0];
  const r = (state.read[st.slug] || []).length;
  view.innerHTML = `
    <p class="crumbs"><a href="#/">📚 Library</a> › <span>${esc(st.title)}</span></p>
    <section class="story-head">
      <span class="e">${esc(st.emoji)}</span>
      <h1>${esc(st.title)}</h1>
      <p class="lead">${esc(st.tagline)}</p>
    </section>
    <p class="story-intro">${esc(st.intro)}</p>
    <div class="story-actions">
      ${firstUnread ? `<a class="btn" href="#/${st.slug}/${firstUnread.n}">${r ? "Continue" : "Start reading"}: chapter ${firstUnread.n} →</a>` : ""}
      <span class="note">${r} of ${st.outline.length} chapters read · about ${timeText(mins(st.words))} in total</span>
    </div>
    <ol class="toc">
      ${st.outline.map((o) => {
        const p = have.get(o.n), rd = isRead(st.slug, o.n);
        const inner = `<span class="num">${o.n}</span><span><b>${esc(o.title)}</b><small>${esc(o.when)}${p ? ` · ${mins(p.words)} min` : " · coming soon"}</small></span><span class="st">${rd ? "✅" : state.quiz[st.slug + "/" + o.n] ? "⭐" : ""}</span>`;
        return `<li>${p ? `<a class="${rd ? "read" : ""}" href="#/${st.slug}/${o.n}">${inner}</a>` : `<span class="off">${inner}</span>`}</li>`;
      }).join("")}
    </ol>
    <div class="extras">
      ${st.people.length ? `<details><summary>👥 People in this story (${st.people.length})</summary><dl>${st.people.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl></details>` : ""}
      ${st.glossary.length ? `<details><summary>📖 Word list (${st.glossary.length})</summary><dl>${st.glossary.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl></details>` : ""}
    </div>`;
}

function figure(ph) {
  return `<figure class="pic"><img src="${esc(ph.src)}" alt="${esc(ph.alt)}" loading="lazy" />
    <figcaption>${esc(ph.alt)} · <a href="${esc(ph.url)}" target="_blank" rel="noopener">${esc(ph.author || "Wikimedia Commons")}</a>, ${esc(ph.license)}</figcaption></figure>`;
}

let endObserver = null;
function renderChapter(st, n) {
  const i = st.parts.findIndex((p) => p.n === n);
  if (i < 0) { location.hash = `#/${st.slug}`; return; }
  const p = st.parts[i], prev = st.parts[i - 1], next = st.parts[i + 1];
  setTitle(`${st.title}, chapter ${n}: ${p.title}`);
  state.last = { slug: st.slug, n }; save();

  // pictures go at the top, after the 2nd section and after the 4th section
  const photos = p.photos.slice();
  const slots = { 0: photos.shift(), 2: photos.shift(), 4: photos.shift() };
  const body = p.sections.map((s, k) => `${k === 0 && slots[0] ? figure(slots[0]) : ""}
      <h2>${esc(s.heading)}</h2>${(s.paragraphs || []).map((x) => `<p>${esc(x)}</p>`).join("")}
      ${slots[k + 1] && k > 0 ? figure(slots[k + 1]) : ""}`).join("");

  const ddOpen = level === "expert";
  const ddLabel = level === "kid" ? "🎓 Deep Dive (for older readers)" : "🔬 Deep Dive: the science and the debates";
  view.innerHTML = `
    <article class="chapter">
      <p class="crumbs"><a href="#/">📚 Library</a> › <a href="#/${st.slug}">${esc(st.emoji)} ${esc(st.title)}</a> › <span>Chapter ${n}</span></p>
      <header class="ch-head">
        <p class="kicker">Chapter ${n} of ${st.outline.length}</p>
        <h1>${esc(p.title)}</h1>
        <div class="meta"><span class="tag year">${esc(p.when)}</span><span class="tag">⏱ ${mins(p.words)} min read</span>${isRead(st.slug, n) ? '<span class="tag">✅ read</span>' : ""}</div>
      </header>
      ${p.summary ? `<div class="nutshell"><b>In a nutshell</b><p>${esc(p.summary)}</p></div>` : ""}
      <div class="prose">${body}</div>
      ${p.deepDive ? `<details class="dd"${ddOpen ? " open" : ""}><summary>${ddLabel}</summary><p>${esc(p.deepDive).replace(/\n+/g, "</p><p>")}</p></details>` : ""}
      ${p.funFact ? `<div class="fun"><b>⚡ Fun fact:</b> ${esc(p.funFact)}</div>` : ""}
      ${p.check ? `<section class="check card"><p class="kicker">Quick check</p><p class="q-text">${esc(p.check.q)}</p><div class="answers" id="checkAns"></div><p class="verdict" id="checkVerdict"></p></section>` : ""}
      ${p.sources.length ? `<section class="sources"><h3>📎 Sources and further reading</h3><ol>${p.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>${s.publisher ? ` (${esc(s.publisher)})` : ""}</li>`).join("")}</ol>
        <p class="note">We read these to check our facts, then wrote this chapter in our own words.</p></section>` : ""}
      <div class="end-mark" id="endMark"></div>
      <nav class="ch-nav">
        ${prev ? `<a href="#/${st.slug}/${prev.n}"><small>← Chapter ${prev.n}</small>${esc(prev.title)}</a>` : `<a href="#/${st.slug}"><small>←</small>All chapters</a>`}
        ${next ? `<a class="next" href="#/${st.slug}/${next.n}"><small>Chapter ${next.n} →</small>${esc(next.title)}</a>` : `<a class="next" href="#/${st.slug}"><small>→</small>Back to the chapter list</a>`}
      </nav>
    </article>`;

  if (p.check) {
    const box = $("#checkAns"), verdict = $("#checkVerdict");
    shuffle([p.check.a, ...p.check.wrong]).forEach((opt) => {
      const b = document.createElement("button");
      b.className = "ans"; b.textContent = opt;
      b.addEventListener("click", () => {
        box.querySelectorAll(".ans").forEach((x) => { x.disabled = true; if (x.textContent === p.check.a) x.classList.add("right"); });
        if (opt === p.check.a) {
          verdict.textContent = "✅ Correct! Nice reading."; verdict.className = "verdict good";
          state.quiz[st.slug + "/" + n] = 1; save();
        } else {
          b.classList.add("wrong"); verdict.textContent = `Not quite. The answer is: ${p.check.a}`; verdict.className = "verdict bad";
        }
      });
      box.appendChild(b);
    });
  }

  // reaching the end of the chapter marks it as read
  if (endObserver) endObserver.disconnect();
  endObserver = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { markRead(st, n); endObserver.disconnect(); }
  });
  endObserver.observe($("#endMark"));
}

function markRead(st, n) {
  const list = readList(st.slug);
  if (list.includes(n)) return;
  list.push(n); save();
  if (list.length === st.outline.length) toast(`🏆 You finished the whole ${st.title} story!`);
  else toast(`📖 Chapter ${n} read · ${list.length} of ${st.outline.length}`);
}

/* ---------- router ---------- */
const toTop = () => window.scrollTo({ top: 0, behavior: "instant" });
async function route() {
  const [slug, n] = location.hash.replace(/^#\/?/, "").split("/");
  if (!slug) { renderLibrary(); toTop(); return; }
  view.innerHTML = '<p class="note">Loading…</p>';
  const st = await getStory(slug);
  if (!st) { location.hash = "#/"; return; }
  if (n) renderChapter(st, Number(n)); else renderStory(st);
  toTop();
}
window.addEventListener("hashchange", route);

/* reading progress bar */
window.addEventListener("scroll", () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  $("#readBar i").style.width = (h > 0 ? Math.min(100, (100 * scrollY) / h) : 0) + "%";
}, { passive: true });

route();
