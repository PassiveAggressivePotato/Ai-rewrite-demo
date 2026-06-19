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
  query: "",
  country: DEFAULT_COUNTRY,
};

const app = document.getElementById("app");

/* ---- Inline icons --------------------------------------------------------- */
const ICON = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  // Solid sun (filled disc + rays) and a solid crescent moon (disc with a cutout).
  sun: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M19.4 4.6l-1.7 1.7M6.3 17.7l-1.7 1.7"/></g></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
};

/* CRITIKL wordmark, drawn from the supplied logo path (recoloured to gold). */
const LOGO_PATH = "M55 0 H164 L215 57 V142 H135 V83 H83 V313 H135 V254 H215 V339 L161 396 H55 L0 339 V57 Z M244 0 H401 L458 58 V157 L424 196 L458 238 V396 H378 V240 H324 V396 H244 Z M324 83 H379 V157 H324 Z M486 0 H568 V396 H486 Z M587 0 H806 V82 H735 V396 H657 V82 H587 Z M827 0 H907 V396 H827 Z M930 0 H1010 V158 L1069 0 H1144 L1075 190 L1144 396 H1072 L1010 237 V396 H930 Z M1168 0 H1248 V313 H1333 V396 H1168 Z";
function logo(cls = "") {
  return `<span class="wordmark home-link ${cls}" data-home role="button" aria-label="${BRAND.name} — home">
    <svg class="logo" viewBox="0 0 1333 396" role="img" aria-label="${BRAND.name}">
      <defs><linearGradient id="logo-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f3cd7a"/><stop offset="1" stop-color="#c2872b"/>
      </linearGradient></defs>
      <path fill="url(#logo-gold)" fill-rule="evenodd" d="${LOGO_PATH}"/>
    </svg></span>`;
}

/* ---- Small helpers -------------------------------------------------------- */
const gradient = (item) => `linear-gradient(160deg, ${item.colors[0]}, ${item.colors[1]})`;
const posterBg = (item) => item.poster ? `url('${item.poster}') center/cover, ${gradient(item)}` : gradient(item);
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
// Floating theme toggle, pinned bottom-right above the content on every page.
function themeFab() {
  return `<button class="theme-toggle theme-fab" title="Switch to ${state.theme === "dark" ? "light" : "dark"} mode" aria-label="Toggle theme">${themeIcon()}</button>`;
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
      data-hcat="${c.id}" title="${c.plural}">${c.icon}</button>`).join("");

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

/* Submit a header search → go to the landing and show the results there. */
function goHomeWithQuery(q) {
  const matches = searchAll(q);
  state.query = q;
  if (matches.length) state.category = matches[0].category;
  else if (state.category === null) state.category = CATEGORIES[0].id;
  if ((location.hash || "#/") === "#/" || location.hash === "") renderLanding();
  else location.hash = "#/";
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
  const tb = root.querySelector(".theme-toggle");
  if (tb) tb.addEventListener("click", toggleTheme);
  root.querySelectorAll("[data-home]").forEach((el) =>
    el.addEventListener("click", () => {
      if ((location.hash || "#/") !== "#/" && location.hash !== "") location.hash = "#/";
      else app.querySelector(".scroll")?.scrollTo({ top: 0, behavior: "smooth" });
    }));
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
  const body = rows.length
    ? rows.map(({ it, s }) => `
      <button class="list-item" data-slug="${it.slug}">
        <div class="poster-card" style="background:${posterBg(it)}">
          ${it.poster ? "" : catIcon(it)}
          <span class="score-badge">${s.synth ?? "—"}</span>
        </div>
        <div class="card-title">${it.title}</div>
      </button>`).join("")
    : `<div class="empty">—</div>`;
  return `<div class="list-col ${featured ? "featured" : ""}"><h3>${title}</h3>${body}</div>`;
}

function renderResultsArea() {
  const area = document.getElementById("results-area");
  if (!area) return;
  const q = state.query.trim().toLowerCase();

  // Before any category is chosen: a cross-category sampler.
  if (state.category === null) {
    area.innerHTML = `
      <div class="section-title">Popular Right Now</div>
      <div class="lists cards">
        ${listColumn("Movies", rankBy(itemsByCategory("movie"), "synth"), true)}
        ${listColumn("Shows", rankBy(itemsByCategory("tv"), "synth"))}
        ${listColumn("Games", rankBy(itemsByCategory("game"), "synth"))}
      </div>`;
    wireCardClicks(area);
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
      <div class="lists cards">
        ${listColumn("This Month", rankThisMonth(inCat), true)}
        ${listColumn("Trending", rankTrending(inCat))}
        ${listColumn("All Time", rankBy(inCat, "synth"))}
      </div>`;
  }
  wireCardClicks(area);
}

/* Switching tabs only updates the tab state, the search bar, and the lists —
 * the rest of the page stays put (no full re-render). */
function selectCategory(c) {
  state.category = c;
  state.query = "";
  app.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.cat === c));
  const wrap = app.querySelector(".searchbar-wrap");
  if (wrap) wrap.classList.remove("collapsed");
  const input = document.getElementById("search-input");
  if (input) { input.value = ""; input.placeholder = `Search ${(cat().plural || "").toLowerCase()}…`; }
  renderResultsArea();
}

function renderLanding() {
  const selected = state.category !== null;
  const tabs = CATEGORIES.map((c) => `
    <button class="tab ${c.id === state.category ? "active" : ""}" data-cat="${c.id}">
      <span class="tab-icon">${c.icon}</span>
      <span class="tab-label">${c.plural}</span>
    </button>`).join("");

  app.innerHTML = `
    <div class="screen landing-screen">
      <div class="scroll">
        <div class="landing">
          <div class="landing-head rise">
            ${logo()}
            <div class="tagline">${BRAND.tagline}</div>
          </div>

          <div class="prompt rise d1">What are you looking for?</div>
          <div class="tabs rise d1">${tabs}</div>
          <div class="searchbar-wrap ${selected ? "" : "collapsed"}">
            <div class="searchbar">
              ${ICON.search}
              <input id="search-input" type="search" autocomplete="off"
                placeholder="${selected ? `Search ${(cat().plural || "").toLowerCase()}…` : ""}"
                value="${escapeAttr(state.query)}" />
            </div>
          </div>

          <div class="rise d2" id="results-area"></div>
        </div>
      </div>
      ${themeFab()}
    </div>`;

  renderResultsArea();

  app.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => selectCategory(t.dataset.cat)));

  const input = document.getElementById("search-input");
  input.addEventListener("input", (e) => { state.query = e.target.value; renderResultsArea(); });

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

  app.innerHTML = `
    <div class="screen detail">
      <div class="backdrop">
        <div class="art" style="background:${item.poster ? `url('${item.poster}')` : gradient(item)}"></div>
        <div class="art blur" style="background:${item.poster ? `url('${item.poster}')` : gradient(item)}"></div>
        <div class="scrim"></div>
      </div>

      <div class="scroll">
        <div class="detail-head">
          ${logo()}
          <div class="head-actions">
            ${headSearch()}
          </div>
        </div>

        <div class="title-block rise">
          <h1>${item.title} <span style="opacity:.7;font-weight:700">(${item.year})</span></h1>
          <div class="metaline">${metaline}</div>
        </div>

        <div class="panel score-card rise d1">
          <div class="score-text">
            <div class="score-label">${BRAND.scoreLabel}</div>
            <div class="score-blurb">${BRAND.scoreBlurb}</div>
            <span class="badge ${s.divergence.level}"><span class="dotmark"></span>${s.divergence.label}</span>
            ${s.reviews ? `<div class="score-blurb" style="margin-top:6px">${formatReviews(s.reviews)} ratings</div>` : ""}
          </div>
          ${dial(s.synth, "gold", "lg")}
        </div>

        <div class="sec-head rise d2"><h2>Where to Watch</h2><span class="sub">Powered by JustWatch</span></div>
        <div id="watch-region" class="rise d2">${renderWatch(item)}</div>

        <div class="sec-head rise d3"><h2>Normalized Ratings</h2><span class="sub">Equalized 100-pt scale</span></div>
        <div class="panel ratings-grid rise d3">
          ${ratingColumn("critic", s.critic, s.criticRows)}
          ${ratingColumn("user", s.user, s.userRows)}
        </div>

        <div class="sec-head rise d4"><h2>Quick Info</h2></div>
        <div class="panel panel-pad quick-info rise d4">
          <p class="synopsis">${item.synopsis}</p>
          <div class="credits">${credits}</div>
        </div>
      </div>
      ${themeFab()}
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
  renderLanding();
  app.querySelector(".scroll")?.scrollTo(0, 0);
}

window.addEventListener("hashchange", router);
applyTheme();
// Lock to portrait where supported (installed/standalone PWA + Android Chrome);
// the manifest also declares portrait. Silently ignored where unsupported.
try { screen.orientation?.lock?.("portrait").catch(() => {}); } catch (_) {}
router();
