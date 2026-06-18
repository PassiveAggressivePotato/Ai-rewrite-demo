/* =============================================================================
 * app.js — router + rendering + interactions. Vanilla ES modules, no build.
 *
 * Two routes via the hash:
 *   #/                -> landing / search
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
  category: CATEGORIES[0].id,
  query: "",
  country: DEFAULT_COUNTRY,
};

const app = document.getElementById("app");

/* ---- Inline icons --------------------------------------------------------- */
const ICON = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9h14v-9"/></svg>`,
  list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
  profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>`,
};

/* ---- Small helpers -------------------------------------------------------- */
const gradient = (item) => `linear-gradient(160deg, ${item.colors[0]}, ${item.colors[1]})`;

function posterBox(item, cls = "thumb") {
  // Gradient card with the category glyph; swaps to real art if a URL exists.
  const cat = CATEGORIES.find((c) => c.id === item.category);
  const bg = item.poster ? `url('${item.poster}') center/cover, ${gradient(item)}` : gradient(item);
  return `<div class="${cls}" style="background:${bg}">${item.poster ? "" : (cat?.icon || "")}</div>`;
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
    root.querySelectorAll(".dial[data-val]").forEach((d) => {
      d.style.setProperty("--val", d.getAttribute("data-val"));
    });
  });
}

function bottomNav(active) {
  const item = (key, icon) =>
    `<button class="nav-btn ${active === key ? "active" : ""}" data-nav="${key}" aria-label="${key}">${icon}</button>`;
  return `<nav class="bottom-nav">
    ${item("search", ICON.search)}${item("home", ICON.home)}${item("list", ICON.list)}${item("profile", ICON.profile)}
  </nav>`;
}

/* =====================================================================
 * THEME
 * ===================================================================== */
function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", state.theme === "dark" ? "#06070c" : "#e9ecf3");
}
function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME.storageKey, state.theme);
  applyTheme();
  const btn = document.querySelector(".theme-toggle");
  if (btn) btn.textContent = state.theme === "dark" ? "☾" : "☀";
}

/* =====================================================================
 * LANDING
 * ===================================================================== */
function rankedList(items, sortKey) {
  return [...items]
    .map((it) => ({ it, s: scoreItem(it) }))
    .sort((a, b) => (b.s[sortKey] ?? 0) - (a.s[sortKey] ?? 0))
    .slice(0, 6);
}

function listColumn(title, rows) {
  const body = rows.length
    ? rows.map(({ it, s }, i) => `
      <div class="list-item" data-slug="${it.slug}">
        <span class="rank">${i + 1}</span>
        ${posterBox(it)}
        <div class="meta">
          <div class="name">${it.title}</div>
          <div class="sc">${s.synth ?? "—"}</div>
        </div>
      </div>`).join("")
    : `<div class="empty">Nothing here yet</div>`;
  return `<div class="list-col"><h3>${title}</h3>${body}</div>`;
}

function renderListsRegion() {
  const region = document.getElementById("lists-region");
  if (!region) return;
  const q = state.query.trim().toLowerCase();

  if (q) {
    const matches = itemsByCategory(state.category)
      .filter((it) => it.title.toLowerCase().includes(q) || it.genres.join(" ").toLowerCase().includes(q))
      .map((it) => ({ it, s: scoreItem(it) }));
    region.innerHTML = `
      <div class="section-title">Results</div>
      <div class="list-col" style="grid-column:1/-1">
        ${matches.length ? matches.map(({ it, s }, i) => `
          <div class="list-item" data-slug="${it.slug}">
            <span class="rank">${i + 1}</span>${posterBox(it)}
            <div class="meta"><div class="name">${it.title} <span style="color:var(--text-faint)">(${it.year})</span></div>
            <div class="sc">${s.synth ?? "—"} · ${it.genres.join(", ")}</div></div>
          </div>`).join("") : `<div class="empty">No matches in ${catLabel()}.</div>`}
      </div>`;
    region.style.gridTemplateColumns = "1fr";
  } else {
    const cat = state.category;
    const inCat = itemsByCategory(cat);
    const games = itemsByCategory("game");
    region.style.gridTemplateColumns = "";
    region.innerHTML =
      listColumn("Top This Month", rankedList(inCat, "synth")) +
      listColumn("Trending This Week", rankedList(inCat.filter((i) => i.trending), "synth")) +
      listColumn("Games · Acclaim", rankedList(games, "critic"));
  }
  wireCardClicks(region);
}

function catLabel() {
  return (CATEGORIES.find((c) => c.id === state.category) || {}).label || "";
}

function renderLanding() {
  const tabs = CATEGORIES.map((c) => `
    <button class="tab ${c.id === state.category ? "active" : ""}" data-cat="${c.id}">
      <span class="tab-icon">${c.icon}</span>${c.label}
    </button>`).join("");

  app.innerHTML = `
    <div class="screen landing-screen">
      <div class="scroll">
        <div class="landing">
          <div class="landing-head rise">
            <button class="theme-toggle" title="Toggle light / dark">${state.theme === "dark" ? "☾" : "☀"}</button>
            <div class="wordmark">${BRAND.name}</div>
            <div class="tagline">${BRAND.tagline}</div>
          </div>

          <div class="search-block rise d1">
            <div class="tabs">${tabs}</div>
            <div class="searchbar">
              ${ICON.search}
              <input id="search-input" type="search" autocomplete="off"
                placeholder="Search ${catLabel().toLowerCase()} like ‘Dune: Part Two’…"
                value="${state.query.replace(/"/g, "&quot;")}" />
            </div>
          </div>

          <div class="section-title rise d2">Top Lists</div>
          <div class="lists rise d2" id="lists-region"></div>
        </div>
      </div>
      ${bottomNav("search")}
    </div>`;

  renderListsRegion();

  // Tabs
  app.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => {
      state.category = t.dataset.cat;
      renderLanding();
      const inp = document.getElementById("search-input");
      if (inp && state.query) inp.focus();
    }));

  // Live search (updates only the results region, keeps input focus)
  const input = document.getElementById("search-input");
  input.addEventListener("input", (e) => {
    state.query = e.target.value;
    renderListsRegion();
  });

  app.querySelector(".theme-toggle").addEventListener("click", toggleTheme);
  wireNav(app);
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
          <div class="wordmark">${BRAND.name}</div>
          <button class="icon-btn" data-home aria-label="Search">${ICON.search}</button>
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

      ${bottomNav("home")}
    </div>`;

  // Country switcher re-renders just the watch region
  const wire = () => {
    const sel = document.getElementById("country-select");
    if (sel) sel.addEventListener("change", (e) => {
      state.country = e.target.value;
      const region = document.getElementById("watch-region");
      region.innerHTML = renderWatch(item);
      wire();
    });
  };
  wire();

  // Show-more toggles
  app.querySelectorAll("[data-more]").forEach((btn) => {
    const label = btn.textContent;
    btn.addEventListener("click", () => {
      const expanded = btn.dataset.expanded === "1";
      btn.closest(".col").querySelectorAll(".src-row.extra").forEach((r) => r.classList.toggle("hidden", expanded));
      btn.dataset.expanded = expanded ? "0" : "1";
      btn.textContent = expanded ? label : "Show fewer";
    });
  });

  app.querySelector("[data-home]").addEventListener("click", () => { location.hash = "#/"; });
  wireNav(app);
  animateDials(app);
}

/* =====================================================================
 * NAV + ROUTER
 * ===================================================================== */
function wireCardClicks(root) {
  root.querySelectorAll("[data-slug]").forEach((c) =>
    c.addEventListener("click", () => { location.hash = `#/item/${c.dataset.slug}`; }));
}
function wireNav(root) {
  root.querySelectorAll("[data-nav]").forEach((b) =>
    b.addEventListener("click", () => {
      // Search & Home both return to the landing in this prototype.
      location.hash = "#/";
    }));
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
router();
