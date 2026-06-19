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

import { BRAND, THEME, CATEGORIES, DEFAULT_COUNTRY } from "./config.js";
import { CATALOG, COUNTRIES, getItem, itemsByCategory } from "./data.js";
import { scoreItem, formatReviews } from "./normalize.js";
import { SOURCE_BADGES } from "./sources.js";

/* ---- App state ------------------------------------------------------------ */
const state = {
  theme: localStorage.getItem(THEME.storageKey) || THEME.default,
  category: null,          // null until the user picks a tab for the first time
  searchOpen: false,       // landing search bar visible?
  query: "",
  country: DEFAULT_COUNTRY,
  debugTap: localStorage.getItem("debug.tap") === "1", // temporary tap-highlight debug
  listLayout: localStorage.getItem("listLayout") || "vertical", // landing lists: vertical | horizontal
};
let pendingSearch = false; // set when a header search submit should survive the home reset

const app = document.getElementById("app");

/* ---- Inline icons --------------------------------------------------------- */
const ICON = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  debug: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/><path d="M12 1.5v3.5M12 19v3.5M1.5 12h3.5M19 12h3.5" stroke-linecap="round"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5.5 19 12 7 18.5z"/></svg>`,
  layout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="6.5" height="15" rx="1.5"/><line x1="13" y1="7" x2="21" y2="7"/><line x1="13" y1="11" x2="21" y2="11"/><line x1="13" y1="15" x2="18.5" y2="15"/></svg>`,
  // Solid sun (filled disc + rays) and a solid crescent moon (disc with a cutout).
  sun: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M19.4 4.6l-1.7 1.7M6.3 17.7l-1.7 1.7"/></g></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
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
 * THEME
 * ===================================================================== */
function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", state.theme === "dark" ? "#06070c" : "#e9ecf3");
}
// Show the destination theme's icon: a sun while in dark mode, a moon in light.
function themeIcon() { return state.theme === "dark" ? ICON.sun : ICON.moon; }

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME.storageKey, state.theme);
  applyTheme();
  document.querySelectorAll(".theme-toggle").forEach((b) => {
    b.innerHTML = themeIcon();
    b.title = `Switch to ${state.theme === "dark" ? "light" : "dark"} mode`;
  });
}

/* =====================================================================
 * SHARED HEADER: wordmark (home link), theme toggle, slide-out search
 * ===================================================================== */
// Floating control stack pinned bottom-right: a TEMPORARY tap-highlight debug
// toggle (to be removed later) plus the theme toggle.
function fabStack({ layout = false } = {}) {
  const layoutBtn = layout
    ? `<button class="layout-toggle ${state.listLayout === "horizontal" ? "on" : ""}" title="Switch to ${state.listLayout === "horizontal" ? "vertical" : "horizontal"} lists" aria-label="Toggle list layout">${ICON.layout}</button>`
    : "";
  return `<div class="fab-stack">
    ${layoutBtn}
    <button class="debug-toggle ${state.debugTap ? "on" : ""}" title="Tap-highlight (debug)" aria-label="Toggle tap highlight">${ICON.debug}</button>
    <button class="theme-toggle" title="Switch to ${state.theme === "dark" ? "light" : "dark"} mode" aria-label="Toggle theme">${themeIcon()}</button>
  </div>`;
}

function toggleLayout() {
  state.listLayout = state.listLayout === "vertical" ? "horizontal" : "vertical";
  localStorage.setItem("listLayout", state.listLayout);
  document.querySelectorAll(".layout-toggle").forEach((b) => {
    b.classList.toggle("on", state.listLayout === "horizontal");
    b.title = `Switch to ${state.listLayout === "horizontal" ? "vertical" : "horizontal"} lists`;
  });
  renderResultsArea();
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
  root.querySelector(".theme-toggle")?.addEventListener("click", toggleTheme);
  root.querySelector(".debug-toggle")?.addEventListener("click", toggleDebug);
  root.querySelector(".layout-toggle")?.addEventListener("click", toggleLayout);
  root.querySelectorAll("[data-home]").forEach((el) =>
    el.addEventListener("click", goHome));
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
          <span class="score-badge">${s.synth ?? "—"}</span>
        </div>
        <div class="li-text">
          <span class="li-title">${it.title}</span>
          <span class="li-year">${it.year}</span>
        </div>
      </button>`).join("")
    : `<div class="empty">—</div>`;
  return `<div class="list-col ${featured ? "featured" : ""}"><h3>${title}</h3><div class="col-items">${items}</div></div>`;
}

const listsClass = () => `lists cards layout-${state.listLayout}`;

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
  const input = document.getElementById("search-input");
  if (input) { input.placeholder = `Search ${(cat().plural || "").toLowerCase()}…`; setTimeout(() => input.focus(), 30); }
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
      ${fabStack({ layout: true })}
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
          ${logo()}
          <div class="head-actions">
            ${headSearch()}
          </div>
        </div>

        <div class="video-stage" id="video-stage"></div>

        <div class="hero rise">
          <div class="hero-poster${hasArt ? " has-art" : ""}" data-poster style="background:${posterBg(item)}">
            <span class="hero-fallback">${catIcon(item)}</span>
            <div class="media-bar">
              <button class="media-btn" data-play="trailer">
                <span class="play-ic">${ICON.play}</span>
                <span class="media-label">Trailer</span>
              </button>
              <button class="media-btn" data-play="review">
                <span class="play-ic">${ICON.play}</span>
                <span class="media-label">Review</span>
              </button>
            </div>
          </div>
          <div class="hero-info">
            <h1 class="${item.title.length > 30 ? "xlong" : item.title.length > 19 ? "long" : ""}">${item.title} <span class="yr">(${item.year})</span></h1>
            <div class="metaline">${metaline}</div>
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

        <div class="sec-head rise d2"><h2>Where to Watch</h2><span class="sub">Powered by JustWatch</span></div>
        <div id="watch-region" class="rise d2">${renderWatch(item)}</div>

        <div class="sec-head rise d3"><h2>Quick Info</h2></div>
        <div class="panel panel-pad quick-info rise d3">
          <p class="synopsis">${item.synopsis}</p>
          <button class="read-more" hidden>Read more</button>
          <div class="credits">${credits}</div>
        </div>
      </div>
      ${fabStack()}
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

  // Trailer / Review → 16:9 player that grows over the title area, pushing
  // content down. Plays the item's YouTube id when known, else a search embed.
  const stage = app.querySelector("#video-stage");
  const closePlayer = () => { stage.classList.remove("playing"); stage.innerHTML = ""; };
  app.querySelectorAll("[data-play]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const kind = btn.dataset.play;
      const id = kind === "trailer" ? item.trailer : item.review;
      const q = kind === "trailer" ? `${item.title} ${item.year} official trailer` : `${item.title} ${item.year} review`;
      const src = id
        ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
        : `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(q)}&autoplay=1&rel=0`;
      stage.innerHTML = `
        <div class="video-frame">
          <iframe src="${src}" title="${kind}" frameborder="0"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
          <button class="player-close" aria-label="Close player">${ICON.close}</button>
        </div>`;
      stage.classList.add("playing");
      stage.querySelector(".player-close").addEventListener("click", closePlayer);
      // Wait for the grow transition, then scroll it clear of the sticky header
      // (scroll-margin-top on .video-stage reserves the header's height).
      requestAnimationFrame(() => stage.scrollIntoView({ behavior: "smooth", block: "start" }));
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

  wireHeader(app);
  animateDials(app);
}

/* =====================================================================
 * ROUTER
 * ===================================================================== */
function wireCardClicks(root) {
  root.querySelectorAll("[data-slug]").forEach((c) =>
    c.addEventListener("click", () => { location.hash = `#/item/${c.dataset.slug}`; }));
}

function router() {
  const hash = location.hash || "#/";
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
applyTheme();
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
