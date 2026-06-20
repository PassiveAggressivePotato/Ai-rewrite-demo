/* =============================================================================
 * app.js — router + rendering + interactions. Vanilla ES modules, no build.
 *
 * Routes (hash):
 *   #/                -> landing / browse + search
 *   #/item/<slug>     -> detail page
 *
 * Reads branding/config from config.js, data from data.js, and uses the pure
 * engine in normalize.js for every score on screen.
 * ========================================================================== */

import { BRAND, CATEGORIES, DEFAULT_COUNTRY } from "./config.js";
import { CATALOG, COUNTRIES, getItem, itemsByCategory } from "./data.js";
import { scoreItem, formatReviews } from "./normalize.js";
import { SOURCE_BADGES } from "./sources.js";

/* ---- App state ------------------------------------------------------------ */
const state = {
  category: null,          // null until the user picks a tab for the first time
  searchOpen: false,       // landing search bar visible?
  query: "",
  country: DEFAULT_COUNTRY,
  debugTap: localStorage.getItem("debug.tap") === "1", // temporary tap-highlight debug
  pickMode: false,         // Studio "pick a component to edit" mode
};
let pendingSearch = false; // set when a header search submit should survive the home reset

const app = document.getElementById("app");

/* ---- Inline icons --------------------------------------------------------- */
const ICON = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  debug: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/><path d="M12 1.5v3.5M12 19v3.5M1.5 12h3.5M19 12h3.5" stroke-linecap="round"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5.5 19 12 7 18.5z"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>`,
  studio: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6.5L5.5 18a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.5V3"/><path d="M8 14h8"/></svg>`,
  hand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11"/><path d="M14 11V6a1.5 1.5 0 0 1 3 0v7.5c0 3.6-2.3 6.5-6 6.5s-5-2.4-5.6-4.2L5 13.6a1.4 1.4 0 0 1 2.3-1.6L8.5 13"/></svg>`,
};

/* CRITIKL wordmark, drawn from the supplied logo path (recoloured to gold). */
const LOGO_PATH = "M55 0 H164 L215 57 V142 H135 V83 H83 V313 H135 V254 H215 V339 L161 396 H55 L0 339 V57 Z M244 0 H401 L458 58 V157 L424 196 L458 238 V396 H378 V240 H324 V396 H244 Z M324 83 H379 V157 H324 Z M486 0 H568 V396 H486 Z M587 0 H806 V82 H735 V396 H657 V82 H587 Z M827 0 H907 V396 H827 Z M930 0 H1010 V158 L1069 0 H1144 L1075 190 L1144 396 H1072 L1010 237 V396 H930 Z M1168 0 H1248 V313 H1333 V396 H1168 Z";
function logo(cls = "") {
  return `<span class="wordmark home-link ${cls}" data-home role="button" aria-label="${BRAND.name} — home">
    <svg class="logo" viewBox="0 0 1333 396" role="img" aria-label="${BRAND.name}">
      <path fill="url(#logo-gold)" fill-rule="evenodd" d="${LOGO_PATH}"/>
    </svg></span>`;
}

/* Flat gradient category icons (replace the emoji). Gradients live in index.html. */
const ICON_SVG = {
  movie: `<rect x="3" y="8.4" width="18" height="12.6" rx="2.2" fill="url(#gi-movie)"/><path d="M3.4 6.1 L20.2 3.4 L20.8 6.8 L4 9.5 Z" fill="url(#gi-movie)"/><path d="M7.5 5.2 L6.1 8.6 M11.4 4.6 L10 8 M15.3 4 L13.9 7.4" stroke="#160f04" stroke-width="1.1" stroke-linecap="round"/>`,
  tv: `<rect x="3" y="7.2" width="18" height="11.8" rx="2.4" fill="url(#gi-tv)"/><path d="M8.4 3.8 L12 7 L15.6 3.8" fill="none" stroke="url(#gi-tv)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><rect x="7.5" y="20" width="9" height="1.8" rx="0.9" fill="url(#gi-tv)"/>`,
  game: `<rect x="2.5" y="8.4" width="19" height="9.4" rx="4.7" fill="url(#gi-game)"/><path d="M7 11.1 V14.1 M5.5 12.6 H8.5" stroke="#0d0916" stroke-width="1.5" stroke-linecap="round"/><circle cx="15.8" cy="11.9" r="1.15" fill="#0d0916"/><circle cx="17.7" cy="13.7" r="1.15" fill="#0d0916"/>`,
  book: `<rect x="3.6" y="4.6" width="14" height="3.9" rx="1" fill="url(#gi-book)" transform="rotate(-5 10.6 6.5)"/><rect x="5.4" y="9.4" width="14" height="3.9" rx="1" fill="url(#gi-book)" transform="rotate(4 12.4 11.3)"/><rect x="4" y="14.2" width="15" height="4.1" rx="1" fill="url(#gi-book)"/>`,
};
function catIconSvg(id) {
  return `<svg class="cat-ic" viewBox="0 0 24 24" aria-hidden="true">${ICON_SVG[id] || ""}</svg>`;
}

/* ---- Small helpers -------------------------------------------------------- */
const gradient = (item) => `linear-gradient(160deg, ${item.colors[0]}, ${item.colors[1]})`;
const posterBg = (item) => item.poster ? `url('${item.poster}') center/cover, ${gradient(item)}` : gradient(item);
const backdropArt = (item) => item.backdrop || item.poster || "";
const backdropBg = (item) => { const a = backdropArt(item); return a ? `url('${a}') center/cover` : gradient(item); };
const catIcon = (item) => (CATEGORIES.find((x) => x.id === item.category) || {}).icon || "";
const escapeAttr = (s) => String(s).replace(/"/g, "&quot;");
const cat = () => CATEGORIES.find((c) => c.id === state.category) || {};

function posterBox(item, cls = "thumb") {
  const c = CATEGORIES.find((x) => x.id === item.category);
  const bg = item.poster ? `url('${item.poster}') center/cover, ${gradient(item)}` : gradient(item);
  return `<div class="${cls}" style="background:${bg}">${item.poster ? "" : (c?.icon || "")}</div>`;
}

function nativeText(row) {
  if (row.recommendation) return `${row.raw}%`;
  if (row.scale === "0–10") return `${row.raw}/10`;
  if (row.scale === "0–5") return `${row.raw}/5`;
  return `${row.raw}`;
}

function dial(value, kind, size) {
  if (value == null) return `<div class="dial ${size} ${kind}"><span class="na">—</span></div>`;
  return `<div class="dial ${size} ${kind}" data-val="${value}" style="--val:0"><span class="num">${value}</span></div>`;
}
function animateDials(root) {
  requestAnimationFrame(() => {
    root.querySelectorAll(".dial[data-val]").forEach((d) =>
      d.style.setProperty("--val", d.getAttribute("data-val")));
  });
}

/* =====================================================================
 * ARTWORK (best-effort, keyless): fetch real posters in the browser via the
 * iTunes Search API (JSONP, no key, CORS-safe). Falls back silently to the
 * gradient when offline / blocked / unmatched. Games aren't covered by iTunes.
 * ===================================================================== */
const artCache = {}; // item.id -> url | null (null = looked up, no match)
function loadArtwork(item, cb) {
  if (item.category === "game") return;            // not in the iTunes catalog
  if (item.id in artCache) { if (artCache[item.id]) cb(artCache[item.id]); return; }
  const entity = item.category === "tv" ? "tvSeason" : item.category === "book" ? "ebook" : "movie";
  const cbName = "itart_" + Math.random().toString(36).slice(2);
  const s = document.createElement("script");
  const done = (url) => { artCache[item.id] = url || null; delete window[cbName]; s.remove(); if (url) cb(url); };
  window[cbName] = (data) => {
    const r = data && data.results && data.results[0];
    let url = r && (r.artworkUrl100 || r.artworkUrl60);
    if (url) url = url.replace(/\/\d+x\d+bb\.(jpg|png)/, "/600x600bb.$1");
    done(url);
  };
  s.onerror = () => done(null);
  s.src = `https://itunes.apple.com/search?term=${encodeURIComponent(item.title)}&entity=${entity}&limit=1&callback=${cbName}`;
  document.body.appendChild(s);
}
// Fill any rendered poster surfaces for items under `root` with real artwork.
function applyArtwork(root) {
  root.querySelectorAll("[data-slug]").forEach((el) => {
    const item = getItem(el.dataset.slug);
    const surface = el.querySelector(".poster-card") || el;
    if (item && surface && !item.poster) loadArtwork(item, (url) => { surface.style.backgroundImage = `url('${url}'), ${gradient(item)}`; surface.classList.add("has-art"); });
  });
}

/* =====================================================================
 * SHARED HEADER: wordmark (home link) + slide-out search; floating controls
 * ===================================================================== */
// Floating control stack: a TEMPORARY tap-highlight debug toggle (to be removed later).
function fabStack() {
  return `<div class="fab-stack">
    <button class="debug-toggle ${state.debugTap ? "on" : ""}" title="Tap-highlight (debug)" aria-label="Toggle tap highlight">${ICON.debug}</button>
  </div>`;
}
// Bottom-left floating controls: pick-mode (finger) + Studio entry.
function leftFabs() {
  return `<div class="fab-left-stack">
    <button class="fab-left pick-toggle ${state.pickMode ? "on" : ""}" data-pick title="Pick a component to edit" aria-label="Pick a component to edit">${ICON.hand}</button>
    <a class="fab-left" href="#/studio" title="Open Studio" aria-label="Open Studio">${ICON.studio}</a>
  </div>`;
}
function togglePick() {
  state.pickMode = !state.pickMode;
  document.documentElement.classList.toggle("pick-mode", state.pickMode);
  document.querySelectorAll(".pick-toggle").forEach((b) => b.classList.toggle("on", state.pickMode));
}

function applyDebug() {
  document.documentElement.classList.toggle("tap-debug", state.debugTap);
}
function toggleDebug() {
  state.debugTap = !state.debugTap;
  localStorage.setItem("debug.tap", state.debugTap ? "1" : "0");
  applyDebug();
  document.querySelectorAll(".debug-toggle").forEach((b) => b.classList.toggle("on", state.debugTap));
}
function headSearch() {
  return `
    <div class="head-search">
      <input class="head-search-input" type="search" autocomplete="off" placeholder="Search everything…" />
      <button class="head-search-btn" aria-label="Search">${ICON.search}</button>
      <div class="head-search-dropdown hidden"></div>
    </div>`;
}

function searchAll(q) {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  return CATALOG.filter((it) =>
    it.title.toLowerCase().includes(t) || it.genres.join(" ").toLowerCase().includes(t));
}

/* Dropdown = a solid panel with a sectioned category switcher (icons) on top
 * and the matching results below. The active category section is filled and
 * grows; the others recede. */
function renderHeadDropdown(dd, q) {
  if (!q.trim()) { dd.classList.add("hidden"); dd.innerHTML = ""; return; }

  const all = searchAll(q);
  const byCat = {};
  CATEGORIES.forEach((c) => (byCat[c.id] = []));
  all.forEach((it) => byCat[it.category]?.push(it));

  let active = dd.dataset.cat;
  if (!active || !byCat[active]?.length) {
    active = (CATEGORIES.find((c) => byCat[c.id].length) || CATEGORIES[0]).id;
  }
  dd.dataset.cat = active;

  const tabs = CATEGORIES.map((c) => `
    <button class="hsd-tab ${c.id === active ? "active" : ""} ${byCat[c.id].length ? "" : "empty"}"
      data-hcat="${c.id}" title="${c.plural}">${catIconSvg(c.id)}</button>`).join("");

  const list = byCat[active] || [];
  const listHtml = list.length
    ? list.slice(0, 6).map((it) => {
        const s = scoreItem(it);
        return `<button class="hs-item" data-slug="${it.slug}">
          ${posterBox(it, "thumb sm")}
          <span class="hs-meta"><span class="hs-name">${it.title}</span><span class="hs-cat">${it.year}</span></span>
          <span class="hs-score">${s.synth ?? "—"}</span>
        </button>`;
      }).join("")
    : `<div class="hs-empty">No matches here</div>`;

  dd.innerHTML = `<div class="hsd-tabs">${tabs}</div><div class="hsd-list">${listHtml}</div>`;
  dd.classList.remove("hidden");
  dd.querySelectorAll("[data-hcat]").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      dd.dataset.cat = b.dataset.hcat;
      renderHeadDropdown(dd, q);
    }));
  dd.querySelectorAll("[data-slug]").forEach((b) =>
    b.addEventListener("click", () => { location.hash = `#/item/${b.dataset.slug}`; }));
}

/* Submit a header search → go to the landing and show the results there.
 * This is the one case that survives the otherwise-full reset on home returns. */
function goHomeWithQuery(q) {
  const matches = searchAll(q);
  state.query = q;
  state.searchOpen = true;
  if (matches.length) state.category = matches[0].category;
  else if (state.category === null) state.category = CATEGORIES[0].id;
  if ((location.hash || "#/") === "#/" || location.hash === "") renderLanding();
  else { pendingSearch = true; location.hash = "#/"; }
}

/* Logo / home navigation = a complete reset of the landing state. */
function goHome() {
  state.category = null;
  state.searchOpen = false;
  state.query = "";
  if ((location.hash || "#/") !== "#/" && location.hash !== "") location.hash = "#/";
  else renderLanding();
}

let _docClick = null;
function wireHeadSearch(root) {
  const wrap = root.querySelector(".head-search");
  if (!wrap) return;
  const input = wrap.querySelector(".head-search-input");
  const btn = wrap.querySelector(".head-search-btn");
  const dd = wrap.querySelector(".head-search-dropdown");
  const open = () => { wrap.classList.add("open"); setTimeout(() => input.focus(), 20); };
  const close = () => { wrap.classList.remove("open"); dd.classList.add("hidden"); };

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!wrap.classList.contains("open")) open();
    else if (input.value.trim()) goHomeWithQuery(input.value);
    else close();
  });
  input.addEventListener("input", () => renderHeadDropdown(dd, input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input.value.trim()) goHomeWithQuery(input.value);
    else if (e.key === "Escape") close();
  });
  // One document-level outside-click handler at a time.
  if (_docClick) document.removeEventListener("click", _docClick);
  _docClick = (e) => { if (!wrap.contains(e.target)) close(); };
  document.addEventListener("click", _docClick);
}

function wireHeader(root) {
  root.querySelector(".debug-toggle")?.addEventListener("click", toggleDebug);
  root.querySelectorAll("[data-home]").forEach((el) =>
    el.addEventListener("click", goHome));
  root.querySelectorAll("[data-back]").forEach((el) =>
    el.addEventListener("click", () => { if (history.length > 1) history.back(); else location.hash = "#/"; }));
  root.querySelectorAll("[data-pick]").forEach((el) => el.addEventListener("click", togglePick));
  wireHeadSearch(root);
}

/* =====================================================================
 * LANDING
 * ===================================================================== */
function rankBy(items, key) {
  return [...items].map((it) => ({ it, s: scoreItem(it) }))
    .sort((a, b) => (b.s[key] ?? 0) - (a.s[key] ?? 0)).slice(0, 5);
}
function rankThisMonth(items) {
  return [...items].map((it) => ({ it, s: scoreItem(it) }))
    .sort((a, b) => (b.it.year - a.it.year) || ((b.s.synth ?? 0) - (a.s.synth ?? 0))).slice(0, 5);
}
function rankTrending(items) {
  // Trending titles first, then fill with the next-best so the list reaches 5.
  const scored = items.map((it) => ({ it, s: scoreItem(it) }));
  const tr = scored.filter((x) => x.it.trending).sort((a, b) => (b.s.synth ?? 0) - (a.s.synth ?? 0));
  const rest = scored.filter((x) => !x.it.trending).sort((a, b) => (b.s.synth ?? 0) - (a.s.synth ?? 0));
  return [...tr, ...rest].slice(0, 5);
}

function listColumn(title, rows, featured = false) {
  const items = rows.length
    ? rows.map(({ it, s }) => `
      <button class="list-item" data-slug="${it.slug}">
        <div class="poster-card" style="background:${posterBg(it)}">
          ${it.poster ? "" : catIcon(it)}
          <span class="score-badge"><span class="sb-num">${s.synth ?? "—"}</span><span class="sb-lab"><span>Critikl</span><span>Score</span></span></span>
        </div>
        <div class="li-text">
          <span class="li-title">${it.title}</span>
          <span class="li-year">${it.year}</span>
        </div>
      </button>`).join("")
    : `<div class="empty">—</div>`;
  const seeAll = rows.length
    ? `<button class="see-all" data-seeall aria-label="See all"><span class="sa-ic">${ICON.back}</span><span class="sa-t">See<br>all</span></button>`
    : "";
  return `<div class="list-col">${title ? `<h3>${title}</h3>` : ""}<div class="col-items">${items}${seeAll}</div></div>`;
}

const listsClass = () => "lists cards layout-horizontal";

function renderResultsArea() {
  const area = document.getElementById("results-area");
  if (!area) return;
  const q = state.query.trim().toLowerCase();

  // Before any category is chosen: a cross-category sampler.
  if (state.category === null) {
    area.innerHTML = `
      <div class="section-title">Popular Right Now</div>
      <div class="${listsClass()}">
        ${listColumn("Movies", rankBy(itemsByCategory("movie"), "synth"), true)}
        ${listColumn("Shows", rankBy(itemsByCategory("tv"), "synth"))}
        ${listColumn("Games", rankBy(itemsByCategory("game"), "synth"))}
        ${listColumn("Books", rankBy(itemsByCategory("book"), "synth"))}
      </div>`;
    wireCardClicks(area);
    applyArtwork(area);
    return;
  }

  if (q) {
    const matches = itemsByCategory(state.category)
      .filter((it) => it.title.toLowerCase().includes(q) || it.genres.join(" ").toLowerCase().includes(q))
      .map((it) => ({ it, s: scoreItem(it) }));
    area.innerHTML = `
      <div class="section-title">Results in ${cat().plural || ""} <span class="count">${matches.length}</span></div>
      <div class="results-list">
        ${matches.length ? matches.map(({ it, s }) => `
          <div class="result-item" data-slug="${it.slug}">
            ${posterBox(it, "thumb big")}
            <div class="meta">
              <div class="name">${it.title} <span class="yr">(${it.year})</span></div>
              <div class="genres">${it.genres.join(" · ")}</div>
            </div>
            <div class="result-score">${s.synth ?? "—"}</div>
          </div>`).join("")
        : `<div class="empty">No ${(cat().plural || "").toLowerCase()} match “${state.query.trim()}”.</div>`}
      </div>`;
  } else {
    const inCat = itemsByCategory(state.category);
    area.innerHTML = `
      <div class="section-title">Top ${cat().plural || ""}</div>
      <div class="${listsClass()}">
        ${listColumn("This Month", rankThisMonth(inCat), true)}
        ${listColumn("Trending", rankTrending(inCat))}
        ${listColumn("All Time", rankBy(inCat, "synth"))}
      </div>`;
  }
  wireCardClicks(area);
  applyArtwork(area);
}

/* Switching tabs only updates the tab state, the search bar, and the lists —
 * the rest of the page stays put (no full re-render). */
function selectCategory(c) {
  state.category = c;
  state.query = "";
  app.querySelector(".tabs")?.classList.add("has-sel");
  app.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.cat === c));
  const input = document.getElementById("search-input");
  if (input) { input.value = ""; input.placeholder = `Search ${(cat().plural || "").toLowerCase()}…`; }
  openSearch();
  renderResultsArea();
}

function openSearch() {
  state.searchOpen = true;
  app.querySelector(".landing")?.classList.add("searching");
  app.querySelector(".searchbar-wrap")?.classList.remove("collapsed");
  // Reveal the search bar but DON'T auto-focus it — focusing pops the mobile
  // keyboard, which obscures the list results. The user taps it when ready.
  const input = document.getElementById("search-input");
  if (input) input.placeholder = `Search ${(cat().plural || "").toLowerCase()}…`;
}

/* The prominent X closes the search bar and returns the landing to its default,
 * fully-deselected state (no active category, default cross-category lists). */
function closeSearch() {
  state.searchOpen = false;
  state.category = null;
  state.query = "";
  app.querySelector(".landing")?.classList.remove("searching");
  app.querySelector(".tabs")?.classList.remove("has-sel");
  app.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  app.querySelector(".searchbar-wrap")?.classList.add("collapsed");
  const input = document.getElementById("search-input");
  if (input) input.value = "";
  renderResultsArea();
}

function renderLanding() {
  const selected = state.category !== null;
  const tabs = CATEGORIES.map((c) => `
    <button class="tab ${c.id === state.category ? "active" : ""}" data-cat="${c.id}">
      <span class="tab-icon">${catIconSvg(c.id)}</span>
      <span class="tab-label">${c.plural}</span>
    </button>`).join("");

  app.innerHTML = `
    <div class="screen landing-screen">
      <div class="scroll">
        <div class="landing ${state.searchOpen ? "searching" : ""}">
          <div class="landing-head rise">
            ${logo()}
            <div class="tagline">${BRAND.tagline}</div>
          </div>

          <div class="prompt rise d1">What are you looking for?</div>
          <div class="tabs rise d1 ${selected ? "has-sel" : ""}">${tabs}</div>
          <div class="searchbar-wrap ${state.searchOpen ? "" : "collapsed"}">
            <div class="searchbar">
              <span class="search-ic">${ICON.search}</span>
              <input id="search-input" type="search" autocomplete="off"
                placeholder="${selected ? `Search ${(cat().plural || "").toLowerCase()}…` : ""}"
                value="${escapeAttr(state.query)}" />
              <button class="search-clear" aria-label="Close search">${ICON.close}</button>
            </div>
          </div>

          <div class="rise d2" id="results-area"></div>
        </div>
      </div>
      ${fabStack()}
      ${leftFabs()}
    </div>`;

  renderResultsArea();

  app.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => selectCategory(t.dataset.cat)));

  const input = document.getElementById("search-input");
  input.addEventListener("input", (e) => { state.query = e.target.value; renderResultsArea(); });
  app.querySelector(".search-clear")?.addEventListener("click", closeSearch);

  wireHeader(app);
}

/* =====================================================================
 * DETAIL
 * ===================================================================== */
function watchCtas(category) {
  if (category === "movie" || category === "tv") return { primary: "WATCH NOW", opts: "RENT / BUY" };
  if (category === "book") return { primary: "GET IT", opts: "RETAILERS" };
  return { primary: "BUY NOW", opts: "MORE STORES" };
}

function renderWatch(item) {
  const data = item.watch[state.country];
  const ctas = watchCtas(item.category);
  const countrySelect = `
    <div class="country-row">
      ${COUNTRIES[state.country]?.flag || "🌐"}
      <select id="country-select" aria-label="Country">
        ${Object.entries(COUNTRIES).map(([code, c]) =>
          `<option value="${code}" ${code === state.country ? "selected" : ""}>${c.label}</option>`).join("")}
      </select>
    </div>`;

  if (!data || (!data.stream?.length && !data.rentbuy?.length)) {
    return `${countrySelect}<div class="no-watch">No listings found for ${COUNTRIES[state.country]?.label || state.country}. Try another country.</div>`;
  }

  const hasStream = data.stream?.length;
  const primary = hasStream ? data.stream[0] : { name: data.rentbuy[0], color: "#3a3f52" };
  const restStreams = hasStream ? data.stream.slice(1) : [];
  const optChips = [...restStreams.map((s) => s.name), ...(data.rentbuy || [])];

  return `
    ${countrySelect}
    <div class="watch-grid">
      <a class="watch-now" href="${primary.url || "#"}" style="background:linear-gradient(160deg, ${primary.color}, ${primary.color}cc)">
        <span class="svc">${primary.name}</span>
        <span class="cta">${ctas.primary}</span>
      </a>
      <div class="watch-opts">
        <div class="svc-icons">
          ${optChips.length ? optChips.map((n) => `<span class="svc-chip">${n}</span>`).join("") : `<span class="svc-chip">—</span>`}
        </div>
        <span class="cta">${ctas.opts}</span>
      </div>
    </div>`;
}

function ratingColumn(kind, value, rows) {
  const dialKind = kind === "critic" ? "gold" : "teal";
  const title = kind === "critic" ? "Critic Reviews" : "User Reviews";
  const visible = rows.slice(0, 3);
  const hidden = rows.slice(3);
  const rowHtml = (r) => {
    const b = SOURCE_BADGES[r.sourceId] || { text: "?", bg: "#444", fg: "#fff" };
    return `<div class="src-row ${r._hidden ? "extra hidden" : ""}">
        <span class="src-badge" style="background:${b.bg};color:${b.fg}">${b.text}</span>
        <span class="src-name">${r.label}<small>${nativeText(r)}${r.recommendation ? " recommended" : ""}</small></span>
        <span class="src-score">${r.normalized}</span>
      </div>`;
  };
  const more = hidden.length
    ? `<button class="show-more" data-more>Show ${hidden.length} more source${hidden.length > 1 ? "s" : ""}</button>`
    : "";
  return `<div class="col ${kind}">
      <div class="col-title">${title}</div>
      ${dial(value, dialKind, "md")}
      <div class="src-list">
        ${visible.map(rowHtml).join("")}
        ${hidden.map((r) => rowHtml({ ...r, _hidden: true })).join("")}
      </div>
      ${more}
    </div>`;
}

function renderDetail(item) {
  const s = scoreItem(item);
  const metaline = [item.genres.join(" · "), item.certification, item.runtime].filter(Boolean)
    .join('<span class="dot">•</span>');
  const credits = Object.entries(item.credits)
    .map(([k, v]) => `<div class="row"><span class="k">${k}:</span>${v}</div>`).join("");
  const similar = itemsByCategory(item.category)
    .filter((x) => x.slug !== item.slug)
    .map((x) => ({ it: x, s: scoreItem(x) }))
    .sort((a, b) => (b.s.synth ?? 0) - (a.s.synth ?? 0)).slice(0, 10);

  const hasArt = !!item.poster;
  app.innerHTML = `
    <div class="screen detail">
      <div class="backdrop">
        <div class="art" style="background:${backdropBg(item)}"></div>
        <div class="art blur" style="background:${backdropBg(item)}"></div>
        <div class="scrim"></div>
      </div>

      <div class="scroll">
        <div class="detail-head">
          <div class="head-left">
            <button class="icon-btn back-btn" data-back aria-label="Back">${ICON.back}</button>
            ${logo()}
          </div>
          <div class="head-actions">
            ${headSearch()}
          </div>
        </div>

        <div class="video-stage" id="video-stage"></div>

        <div class="hero rise">
          <div class="hero-poster${hasArt ? " has-art" : ""}" data-poster style="background:${posterBg(item)}">
            <span class="hero-fallback">${catIcon(item)}</span>
            <div class="media-bar">
              ${item.category !== "book" ? `<button class="media-btn" data-play="trailer">
                <span class="play-ic">${ICON.play}</span>
                <span class="media-label">Trailer</span>
              </button>` : ""}
              <button class="media-btn" data-play="review">
                <span class="play-ic">${ICON.play}</span>
                <span class="media-label">Review</span>
              </button>
            </div>
          </div>
          <div class="hero-info">
            <h1 class="${item.title.length > 30 ? "xlong" : item.title.length > 19 ? "long" : ""}">${item.title} <span class="yr">(${item.year})</span></h1>
            <div class="metaline">${metaline}</div>
            <div class="quick-info">
              <p class="synopsis">${item.synopsis}</p>
              <button class="read-more" hidden>Read more</button>
              <div class="credits">${credits}</div>
            </div>
          </div>
        </div>

        <div class="panel score-stack rise d1">
          <div class="score-card">
            <div class="score-text">
              <div class="score-label">${BRAND.scoreLabel}</div>
              <div class="score-blurb">${BRAND.scoreBlurb}</div>
              <span class="badge ${s.divergence.level}"><span class="dotmark"></span>${s.divergence.label}</span>
              ${s.reviews ? `<div class="score-blurb" style="margin-top:6px">${formatReviews(s.reviews)} ratings</div>` : ""}
            </div>
            ${dial(s.synth, "gold", "lg")}
          </div>
          <div class="ratings-grid">
            ${ratingColumn("critic", s.critic, s.criticRows)}
            ${ratingColumn("user", s.user, s.userRows)}
          </div>
        </div>

        <div class="sec-head rise d3"><h2>Where to Watch</h2><span class="sub">Powered by JustWatch</span></div>
        <div id="watch-region" class="rise d3">${renderWatch(item)}</div>

        ${similar.length ? `<div class="sec-head rise d4"><h2>More Like This</h2></div>
        <div class="lists cards layout-horizontal rise d4">${listColumn("", similar)}</div>` : ""}
      </div>
      ${fabStack()}
      ${leftFabs()}
    </div>`;

  const wire = () => {
    const sel = document.getElementById("country-select");
    if (sel) sel.addEventListener("change", (e) => {
      state.country = e.target.value;
      document.getElementById("watch-region").innerHTML = renderWatch(item);
      wire();
    });
  };
  wire();

  app.querySelectorAll("[data-more]").forEach((btn) => {
    const label = btn.textContent;
    btn.addEventListener("click", () => {
      const expanded = btn.dataset.expanded === "1";
      btn.closest(".col").querySelectorAll(".src-row.extra").forEach((r) => r.classList.toggle("hidden", expanded));
      btn.dataset.expanded = expanded ? "0" : "1";
      btn.textContent = expanded ? label : "Show fewer";
    });
  });

  // Real artwork (best-effort) only when we don't already ship a static poster.
  if (!item.poster) loadArtwork(item, (url) => {
    const hp = app.querySelector(".hero-poster");
    if (hp) { hp.style.backgroundImage = `url('${url}'), ${gradient(item)}`; hp.classList.add("has-art"); }
    if (!item.backdrop) app.querySelectorAll(".backdrop .art").forEach((a) => { a.style.backgroundImage = `url('${url}')`; });
  });

  // Trailer / Review → 16:9 player that pins beneath the sticky header; page
  // content scrolls underneath it (like the header). Plays the item's YouTube id
  // when known, else a search embed. Minimal YouTube chrome.
  const stage = app.querySelector("#video-stage");
  const scroller = app.querySelector(".scroll");
  stage.style.top = app.querySelector(".detail-head").offsetHeight + "px";
  const closePlayer = () => { stage.classList.remove("playing"); stage.innerHTML = ""; };
  app.querySelectorAll("[data-play]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const kind = btn.dataset.play;
      const id = kind === "trailer" ? item.trailer : item.review;
      const q = kind === "trailer" ? `${item.title} ${item.year} official trailer` : `${item.title} ${item.year} review`;
      const params = "autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&color=white";
      const src = id
        ? `https://www.youtube-nocookie.com/embed/${id}?${params}`
        : `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(q)}&${params}`;
      stage.innerHTML = `
        <div class="video-frame">
          <iframe src="${src}" title="${kind}" frameborder="0"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
          <button class="player-close" aria-label="Close player">${ICON.close}</button>
        </div>`;
      stage.classList.add("playing");
      stage.querySelector(".player-close").addEventListener("click", closePlayer);
      // Bring the header + pinned player to the top; content then scrolls beneath.
      requestAnimationFrame(() => scroller.scrollTo({ top: 0, behavior: "smooth" }));
    }));

  // Read more / less for the synopsis when it overflows the 2-line clamp.
  const syn = app.querySelector(".synopsis");
  const rm = app.querySelector(".read-more");
  if (syn && rm) requestAnimationFrame(() => {
    if (syn.scrollHeight - syn.clientHeight > 2) {
      rm.hidden = false;
      rm.addEventListener("click", () => {
        const ex = syn.classList.toggle("expanded");
        rm.textContent = ex ? "Read less" : "Read more";
      });
    }
  });

  wireCardClicks(app);
  applyArtwork(app);
  wireHeader(app);
  animateDials(app);
}

/* =====================================================================
 * ROUTER
 * ===================================================================== */
function toast(msg) {
  app.querySelector(".toast")?.remove();
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg; app.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 1800);
}
function wireCardClicks(root) {
  root.querySelectorAll("[data-slug]").forEach((c) =>
    c.addEventListener("click", () => {
      if (state.pickMode) { togglePick(); location.hash = "#/studio/poster"; return; }
      location.hash = `#/item/${c.dataset.slug}`;
    }));
  root.querySelectorAll("[data-seeall]").forEach((b) =>
    b.addEventListener("click", (e) => { e.stopPropagation(); toast("Full listing — coming soon"); }));
}

/* =====================================================================
 * STUDIO — component sandbox. A hub (#/studio) links to focused component
 * pages (e.g. #/studio/badge) where tokens are tweaked live on a 2× preview
 * via accelerating steppers + a full colour picker, then exported for baking.
 * ===================================================================== */

/* ---- colour helpers ---- */
function hexToRgb(h) { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); const n = parseInt(h, 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; }
function rgbToHex(r, g, b) { return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join(""); }
function rgbToHsv(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return { h, s: mx ? d / mx : 0, v: mx }; }
function hsvToRgb(h, s, v) { const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c; let r, g, b; if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x]; return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }; }
function parseColor(str) {
  str = String(str).trim();
  let m = str.match(/^rgba?\(([^)]+)\)$/i);
  if (m) { const p = m[1].split(",").map((s) => parseFloat(s)); return { r: p[0] || 0, g: p[1] || 0, b: p[2] || 0, a: p[3] == null ? 1 : p[3] }; }
  if (/^#?[0-9a-f]{3,8}$/i.test(str)) { let h = str.replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); let a = 1; if (h.length === 8) { a = parseInt(h.slice(6, 8), 16) / 255; h = h.slice(0, 6); } const c = hexToRgb(h); return { r: c.r, g: c.g, b: c.b, a }; }
  return { r: 0, g: 0, b: 0, a: 1 };
}
function colorStr(r, g, b, a) { return a >= 1 ? rgbToHex(r, g, b) : `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${+(+a).toFixed(2)})`; }

/* ---- control builders + shadow sub-editor ---- */
function stepperHTML(v, val, step, min) {
  return `<div class="step"${v ? ` data-var="${v}"` : ""} data-step="${step}" data-min="${min}">
      <button class="step-btn" data-dir="-1" aria-label="decrease">−</button>
      <input class="step-val" type="text" inputmode="decimal" value="${val}">
      <button class="step-btn" data-dir="1" aria-label="increase">+</button>
    </div>`;
}
function swatchHTML(v, val) {
  return `<button class="swatch" data-var="${v}" data-val="${val}">
      <span class="swatch-chip"><span style="background:${val}"></span></span>
      <span class="swatch-val">${val}</span></button>`;
}
function controlRow(it) {
  let ctrl;
  if (it.type === "color") ctrl = swatchHTML(it.k, it.val);
  else if (it.type === "shadow") ctrl = `<button class="shadow-btn" data-var="${it.k}">Edit ▸</button>`;
  else ctrl = stepperHTML(it.k, it.val, it.step || 1, it.min == null ? 0 : it.min);
  return `<div class="ctl"><span class="ctl-l">${it.label}</span>${ctrl}</div>`;
}
function groupHTML(g) {
  return `<section class="st-sec"><h2>${g.name}</h2><div class="st-controls">${g.items.map(controlRow).join("")}</div></section>`;
}

/* Accelerating stepper: tap = one step; hold ramps up; value tappable to type. */
function attachStepper(step, onValue) {
  const input = step.querySelector(".step-val");
  const min = parseFloat(step.dataset.min), max = parseFloat(step.dataset.max), size = parseFloat(step.dataset.step);
  const get = () => (parseFloat(input.value) || 0);
  const set = (n) => { if (!isNaN(min) && n < min) n = min; if (!isNaN(max) && n > max) n = max; n = Math.round(n * 100) / 100; input.value = n; onValue(n); };
  input.addEventListener("change", () => set(get()));
  step.querySelectorAll(".step-btn").forEach((btn) => {
    const dir = parseFloat(btn.dataset.dir); let timer = null, delay = 0, count = 0;
    const tick = () => { count++; const m = count > 22 ? 10 : count > 14 ? 5 : count > 7 ? 2 : 1; set(get() + dir * size * m); delay = Math.max(38, delay * 0.82); timer = setTimeout(tick, delay); };
    const start = (e) => { e.preventDefault(); count = 0; delay = 320; set(get() + dir * size); timer = setTimeout(tick, delay); };
    const stop = () => { if (timer) { clearTimeout(timer); timer = null; } };
    btn.addEventListener("pointerdown", start);
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => btn.addEventListener(ev, stop));
  });
}

const SHADOWS = {};
function shadowCss(s) {
  const r = (s.angle * Math.PI) / 180;
  const ox = +(Math.cos(r) * s.distance).toFixed(1), oy = +(Math.sin(r) * s.distance).toFixed(1);
  const c = parseColor(s.color), a = Math.max(0, Math.min(100, s.opacity)) / 100;
  return `${ox}px ${oy}px ${Math.max(0, s.blur)}px rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${a.toFixed(2)})`;
}
function wireGroupControls(root, applyVar) {
  root.querySelectorAll(".st-controls .step[data-var]").forEach((step) =>
    attachStepper(step, (n) => applyVar(step.dataset.var, n + "px")));
  root.querySelectorAll(".swatch").forEach((sw) => sw.addEventListener("click", () =>
    openColorPicker(sw.dataset.val, (val) => {
      sw.dataset.val = val; sw.querySelector(".swatch-chip > span").style.background = val;
      sw.querySelector(".swatch-val").textContent = val; applyVar(sw.dataset.var, val);
    })));
  root.querySelectorAll(".shadow-btn").forEach((btn) => btn.addEventListener("click", () => openShadowEditor(btn.dataset.var, applyVar)));
}

function closeShadowEditor() { app.querySelector(".shed")?.remove(); }
function openShadowEditor(v, applyVar) {
  closeShadowEditor();
  const s = SHADOWS[v] || (SHADOWS[v] = { color: "#000000", opacity: 55, angle: 90, distance: 6, blur: 14 });
  const stepF = (label, f, step, min, max) =>
    `<div class="ctl"><span class="ctl-l">${label}</span><div class="step" data-field="${f}" data-step="${step}" data-min="${min}"${max != null ? ` data-max="${max}"` : ""}><button class="step-btn" data-dir="-1">−</button><input class="step-val" type="text" inputmode="decimal" value="${s[f]}"><button class="step-btn" data-dir="1">+</button></div></div>`;
  const wrap = document.createElement("div");
  wrap.className = "shed";
  wrap.innerHTML = `
    <div class="cp-scrim"></div>
    <div class="cp-sheet">
      <div class="cp-head"><span>Shadow</span><button class="cp-done">Done</button></div>
      <div class="ctl"><span class="ctl-l">Colour</span>${swatchHTML("__shcol", s.color)}</div>
      ${stepF("Angle°", "angle", 5, -100000)}
      ${stepF("Distance", "distance", 1, 0)}
      ${stepF("Blur", "blur", 1, 0)}
      ${stepF("Opacity %", "opacity", 5, 0, 100)}
    </div>`;
  app.appendChild(wrap);
  const upd = () => applyVar(v, shadowCss(s));
  wrap.querySelectorAll(".step[data-field]").forEach((step) => attachStepper(step, (n) => { s[step.dataset.field] = n; upd(); }));
  const sw = wrap.querySelector(".swatch");
  sw.addEventListener("click", () => openColorPicker(s.color, (val) => {
    s.color = val; sw.dataset.val = val; sw.querySelector(".swatch-chip > span").style.background = val; sw.querySelector(".swatch-val").textContent = val; upd();
  }));
  wrap.querySelector(".cp-scrim").addEventListener("click", closeShadowEditor);
  wrap.querySelector(".cp-done").addEventListener("click", closeShadowEditor);
  upd();
}
function closeColorPicker() { app.querySelector(".cp")?.remove(); }
function openColorPicker(initial, onChange) {
  closeColorPicker();
  let { r, g, b, a } = parseColor(initial);
  let { h, s, v } = rgbToHsv(r, g, b);
  const wrap = document.createElement("div");
  wrap.className = "cp";
  wrap.innerHTML = `
    <div class="cp-scrim"></div>
    <div class="cp-sheet">
      <div class="cp-head"><span>Colour</span><button class="cp-done">Done</button></div>
      <div class="cp-sv"><div class="cp-sv-thumb"></div></div>
      <div class="cp-row"><span>Hue</span><input class="cp-hue" type="range" min="0" max="360" step="1"></div>
      <div class="cp-row"><span>Alpha</span><input class="cp-alpha" type="range" min="0" max="100" step="1"></div>
      <div class="cp-fields">
        <label class="cp-f cp-f-hex">HEX<input class="cp-hex" type="text" autocomplete="off" spellcheck="false"></label>
        <label class="cp-f">R<input class="cp-r" type="number" min="0" max="255"></label>
        <label class="cp-f">G<input class="cp-g" type="number" min="0" max="255"></label>
        <label class="cp-f">B<input class="cp-b" type="number" min="0" max="255"></label>
        <label class="cp-f">A%<input class="cp-a" type="number" min="0" max="100"></label>
      </div>
      <button class="cp-brand-btn" type="button">Brand colours ▾</button>
      <div class="cp-brand hidden"></div>
    </div>`;
  app.appendChild(wrap);
  const $ = (s) => wrap.querySelector(s);
  const sv = $(".cp-sv"), thumb = $(".cp-sv-thumb"), hue = $(".cp-hue"), alpha = $(".cp-alpha");
  const hex = $(".cp-hex"), Ri = $(".cp-r"), Gi = $(".cp-g"), Bi = $(".cp-b"), Ai = $(".cp-a");

  function render(emit = true) {
    const rgb = hsvToRgb(h, s, v); r = rgb.r; g = rgb.g; b = rgb.b;
    const hx = rgbToHex(r, g, b);
    sv.style.setProperty("--cp-hue", `hsl(${h} 100% 50%)`);
    thumb.style.left = (s * 100) + "%"; thumb.style.top = ((1 - v) * 100) + "%"; thumb.style.background = hx;
    hue.value = Math.round(h); alpha.value = Math.round(a * 100);
    alpha.style.setProperty("--cp-solid", hx);
    hex.value = hx; Ri.value = Math.round(r); Gi.value = Math.round(g); Bi.value = Math.round(b); Ai.value = Math.round(a * 100);
    if (emit) onChange(colorStr(r, g, b, a));
  }
  function fromRgb() { const hsv = rgbToHsv(+Ri.value || 0, +Gi.value || 0, +Bi.value || 0); h = hsv.h; s = hsv.s; v = hsv.v; render(); }

  const svMove = (e) => {
    const rect = sv.getBoundingClientRect();
    s = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    render();
  };
  sv.addEventListener("pointerdown", (e) => { sv.setPointerCapture(e.pointerId); svMove(e); sv.onpointermove = svMove; });
  sv.addEventListener("pointerup", () => { sv.onpointermove = null; });
  hue.addEventListener("input", () => { h = +hue.value; render(); });
  alpha.addEventListener("input", () => { a = +alpha.value / 100; render(); });
  hex.addEventListener("change", () => { const c = parseColor(hex.value); a = c.a; const hsv = rgbToHsv(c.r, c.g, c.b); h = hsv.h; s = hsv.s; v = hsv.v; render(); });
  [Ri, Gi, Bi].forEach((i) => i.addEventListener("input", fromRgb));
  Ai.addEventListener("input", () => { a = Math.max(0, Math.min(100, +Ai.value || 0)) / 100; render(); });

  // brand swatches (current values from :root, fall back to defaults)
  $(".cp-brand-btn").addEventListener("click", () => {
    const panel = $(".cp-brand");
    panel.classList.toggle("hidden");
    if (!panel.dataset.built) {
      const cs = getComputedStyle(document.documentElement);
      panel.innerHTML = BRAND_COL.map((c) => {
        const val = (cs.getPropertyValue(c.k).trim() || c.val);
        return `<button class="cp-bsw" data-c="${val}" title="${c.label}"><span style="background:${val}"></span>${c.label}</button>`;
      }).join("");
      panel.querySelectorAll(".cp-bsw").forEach((sw) => sw.addEventListener("click", () => {
        const c = parseColor(sw.dataset.c); a = c.a; const hsv = rgbToHsv(c.r, c.g, c.b); h = hsv.h; s = hsv.s; v = hsv.v; render();
      }));
      panel.dataset.built = "1";
    }
  });
  $(".cp-scrim").addEventListener("click", closeColorPicker);
  $(".cp-done").addEventListener("click", closeColorPicker);
  render(false);
}

/* ---- Studio hub ---- */
const STUDIO_COMPONENTS = [
  { id: "poster", name: "PosterCard", desc: "List poster + score badge" },
  { id: "brand", name: "Brand Tokens", desc: "Site-wide colours" },
];
function renderStudioHome() {
  app.innerHTML = `
    <div class="screen studio">
      <div class="scroll">
        <div class="studio-head">
          <button class="icon-btn" data-home aria-label="Home">${ICON.back}</button>
          <h1>Studio</h1><span class="studio-tag">component sandbox</span>
        </div>
        <p class="st-note">Pick a component to focus on — or use the finger button on Home to tap one directly. Tweak its values, then export them to me to bake into the live site.</p>
        <div class="studio-grid">
          ${STUDIO_COMPONENTS.map((c) => `
            <a class="studio-card" href="#/studio/${c.id}">
              <span class="sc-name">${c.name}</span>
              <span class="sc-desc">${c.desc}</span>
            </a>`).join("")}
        </div>
      </div>
      ${fabStack()}
    </div>`;
  wireHeader(app);
}

/* PosterCard editor: the whole list item (poster + score badge). */
function posterGroups() {
  return [
    { name: "Poster card", items: [
      { k: "--pc-radius", label: "Corner radius", val: 8, step: 1, min: 0 },
      { k: "--pc-bw", label: "Border width", val: 1, step: 0.5, min: 0 },
      { k: "--pc-bc", label: "Border colour", type: "color", val: "#f0c469" },
      { k: "--pc-shadow", label: "Drop shadow", type: "shadow" },
    ] },
    { name: "Score chip", items: [
      { k: "--b-inset", label: "Corner inset", val: 1, step: 1, min: 0 },
      { k: "--b-pad", label: "Padding", val: 3, step: 1, min: 0 },
      { k: "--b-gap", label: "Tile–label gap", val: 4, step: 1, min: 0 },
      { k: "--b-chipr", label: "Chip radius", val: 8, step: 1, min: 0 },
      { k: "--b-chip", label: "Chip fill", type: "color", val: "rgba(11,13,19,0.62)" },
      { k: "--b-shadow", label: "Chip shadow", type: "shadow" },
    ] },
    { name: "Score tile", items: [
      { k: "--b-sq", label: "Square size", val: 20, step: 1, min: 6 },
      { k: "--b-numfs", label: "Number font", val: 12, step: 1, min: 6 },
      { k: "--b-tiler", label: "Tile radius", val: 6, step: 1, min: 0 },
      { k: "--b-gold", label: "Tile gold", type: "color", val: "#f0c469" },
    ] },
    { name: "Label", items: [
      { k: "--b-labfs", label: "Label font", val: 8, step: 0.5, min: 5 },
      { k: "--b-lab", label: "Label colour", type: "color", val: "#f0c469" },
    ] },
  ];
}
function renderStudioPoster() {
  const sample = getItem("poor-things") || CATALOG[0];
  const sc = scoreItem(sample);
  const groups = posterGroups();
  const init = [];
  groups.forEach((g) => g.items.forEach((it) => {
    if (it.type === "color") init.push(`${it.k}:${it.val}`);
    else if (it.type !== "shadow") init.push(`${it.k}:${it.val}px`);
  }));
  const initStyle = init.join(";");
  const curBadge = `<span class="score-badge"><span class="sb-num">${sc.synth ?? "—"}</span><span class="sb-lab"><span>Critikl</span><span>Score</span></span></span>`;
  const candBadge = `<span class="sb2"><span class="sb2-num">${sc.synth ?? "—"}</span><span class="sb2-lab"><span>Critikl</span><span>Score</span></span></span>`;
  app.innerHTML = `
    <div class="screen studio">
      <div class="scroll">
        <div class="studio-head">
          <button class="icon-btn" data-back aria-label="Back">${ICON.back}</button>
          <h1>PosterCard</h1>
        </div>
        <div class="st-stage">
          <div class="st-row1">
            <figure class="st-cmp"><div class="pc2" style="background:${posterBg(sample)}">${curBadge}</div><figcaption>Current</figcaption></figure>
            <figure class="st-cmp"><div class="pc2" id="cand" style="background:${posterBg(sample)};${initStyle}">${candBadge}</div><figcaption>Candidate</figcaption></figure>
          </div>
          <div class="st-zoom"><div class="pc-zoom"><div class="pc2" id="candZoom" style="background:${posterBg(sample)};${initStyle}">${candBadge}</div></div></div>
        </div>
        <div id="st-controls-root">${groups.map(groupHTML).join("")}</div>
        <section class="st-sec">
          <h2>Export</h2>
          <button class="st-export" id="st-export">Copy values for Claude</button>
          <textarea class="st-out" id="st-out" readonly rows="10" placeholder="Values appear here…"></textarea>
        </section>
      </div>
      ${fabStack()}
    </div>`;

  const cands = ["#cand", "#candZoom"].map((s) => app.querySelector(s)).filter(Boolean);
  const applyVar = (v, val) => cands.forEach((el) => el.style.setProperty(v, val));
  wireGroupControls(app.querySelector("#st-controls-root"), applyVar);

  app.querySelector("#st-export").addEventListener("click", () => {
    const out = {};
    groups.forEach((g) => g.items.forEach((it) => {
      if (it.type === "color") out[it.k] = app.querySelector(`.swatch[data-var="${it.k}"]`).dataset.val;
      else if (it.type === "shadow") out[it.k] = SHADOWS[it.k] ? shadowCss(SHADOWS[it.k]) : "none";
      else out[it.k] = (parseFloat(app.querySelector(`.step[data-var="${it.k}"] .step-val`).value) || 0) + "px";
    }));
    const text = JSON.stringify({ PosterCard: out }, null, 2);
    app.querySelector("#st-out").value = text;
    navigator.clipboard?.writeText(text).catch(() => {});
    const btn = app.querySelector("#st-export");
    btn.textContent = "Copied ✓ — paste it in chat";
    setTimeout(() => (btn.textContent = "Copy values for Claude"), 2200);
  });
  wireHeader(app);
}

/* ---- Studio: Brand Tokens ---- */
function renderStudioBrand() {
  const group = { name: "Colours", items: [
    { k: "--gold-1", label: "Gold 1", type: "color", val: "#f0c469" },
    { k: "--gold-2", label: "Gold 2", type: "color", val: "#c98f30" },
    { k: "--teal-1", label: "Teal 1", type: "color", val: "#4fd0c8" },
    { k: "--teal-2", label: "Teal 2", type: "color", val: "#2c97a8" },
  ] };
  app.innerHTML = `
    <div class="screen studio">
      <div class="scroll">
        <div class="studio-head">
          <button class="icon-btn" data-back aria-label="Back">${ICON.back}</button>
          <h1>Brand Tokens</h1>
        </div>
        <div id="st-controls-root">${groupHTML(group)}</div>
        <section class="st-sec">
          <h2>Export</h2>
          <button class="st-export" id="st-export">Copy values for Claude</button>
          <textarea class="st-out" id="st-out" readonly rows="7" placeholder="Values appear here…"></textarea>
        </section>
      </div>
      ${fabStack()}
    </div>`;
  const applyVar = (v, val) => document.documentElement.style.setProperty(v, val);
  wireGroupControls(app.querySelector("#st-controls-root"), applyVar);
  app.querySelector("#st-export").addEventListener("click", () => {
    const out = Object.fromEntries(group.items.map((it) => [it.k, app.querySelector(`.swatch[data-var="${it.k}"]`).dataset.val]));
    const text = JSON.stringify({ Brand: out }, null, 2);
    app.querySelector("#st-out").value = text;
    navigator.clipboard?.writeText(text).catch(() => {});
    const btn = app.querySelector("#st-export");
    btn.textContent = "Copied ✓ — paste it in chat";
    setTimeout(() => (btn.textContent = "Copy values for Claude"), 2200);
  });
  wireHeader(app);
}
function router() {
  const hash = location.hash || "#/";
  if (hash === "#/studio") { renderStudioHome(); return; }
  if (hash === "#/studio/poster") { renderStudioPoster(); return; }
  if (hash === "#/studio/brand") { renderStudioBrand(); return; }
  const m = hash.match(/^#\/item\/(.+)$/);
  if (m) {
    const item = getItem(decodeURIComponent(m[1]));
    if (item) { renderDetail(item); return; }
  }
  // Returning to the landing is a full reset, unless a header search submit
  // explicitly asked to carry results across.
  if (!pendingSearch) { state.category = null; state.searchOpen = false; state.query = ""; }
  pendingSearch = false;
  renderLanding();
  app.querySelector(".scroll")?.scrollTo(0, 0);
}

window.addEventListener("hashchange", router);
applyDebug();
// Lock to portrait where supported (installed/standalone PWA + Android Chrome);
// the manifest also declares portrait. Silently ignored where unsupported.
try { screen.orientation?.lock?.("portrait").catch(() => {}); } catch (_) {}
router();

// Warm the image cache so page backgrounds appear instantly on navigation.
function preloadArt() {
  const urls = new Set();
  CATALOG.forEach((it) => { if (it.poster) urls.add(it.poster); if (it.backdrop) urls.add(it.backdrop); });
  urls.forEach((u) => { const img = new Image(); img.decoding = "async"; img.src = u; });
}
(window.requestIdleCallback || ((fn) => setTimeout(fn, 200)))(preloadArt);
