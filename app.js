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
  finger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V11"/><path d="M12 11V7a1.5 1.5 0 0 1 3 0v4"/><path d="M15 11.5a1.5 1.5 0 0 1 3 0V15c0 3.3-2 5.5-5.2 5.5-2.1 0-3.4-.8-4.4-2.3l-2.6-3.9a1.5 1.5 0 0 1 2.5-1.7L9.5 14V11"/></svg>`,
  zoom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.7-4.7M10.5 7.8v5.4M7.8 10.5h5.4"/></svg>`,
  toolbox: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5h18V19a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19z"/><path d="M8 8.5V6a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 16 6v2.5"/><path d="M3 13h6v2h6v-2h6"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`,
  smooth: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="7.5"/></svg>`,
  pixel: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="9" y="3.5" width="6" height="5"/><rect x="15" y="9" width="5" height="6"/><rect x="9" y="15.5" width="6" height="5"/><rect x="3.5" y="9" width="5" height="6"/></svg>`,
  shuffle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>`,
  chev: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`,
  reset: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5v5h5"/><path d="M3.5 10a8 8 0 1 1-1 5"/></svg>`,
  next: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`,
  /* Title link chevron — tight viewBox so the glyph fills the box (sizes/aligns
   * cleanly next to a heading); slightly larger than the caps it sits beside. */
  go: `<svg viewBox="7.5 4.5 9 15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`,
  scale: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`,
};

/* CRITIKL wordmark, drawn from the supplied logo path (recoloured to gold). */
const LOGO_PATH = "M55 0 H164 L215 57 V142 H135 V83 H83 V313 H135 V254 H215 V339 L161 396 H55 L0 339 V57 Z M244 0 H401 L458 58 V157 L424 196 L458 238 V396 H378 V240 H324 V396 H244 Z M324 83 H379 V157 H324 Z M486 0 H568 V396 H486 Z M587 0 H806 V82 H735 V396 H657 V82 H587 Z M827 0 H907 V396 H827 Z M930 0 H1010 V158 L1069 0 H1144 L1075 190 L1144 396 H1072 L1010 237 V396 H930 Z M1168 0 H1248 V313 H1333 V396 H1168 Z";
/* The wordmark is rendered as a CSS-masked box (not an inline <svg fill>), so its
 * fill accepts ANY colour or gradient from the colour picker. The shape is the
 * LOGO_PATH supplied as a mask image (registered once on :root as --logo-src). */
const LOGO_SVG = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1333 396"><path fill-rule="evenodd" d="${LOGO_PATH}"/></svg>`)}`;
document.documentElement.style.setProperty("--logo-src", `url("${LOGO_SVG}")`);
function logo(cls = "") {
  return `<span class="wordmark home-link ${cls}" data-home role="button" aria-label="${BRAND.name} — home">
    <span class="logo" role="img" aria-label="${BRAND.name}"></span></span>`;
}

/* Polished category icons — rendered as CSS masks so their colour/gradient is
 * controllable (default = gold). Each variant supplies its source + aspect ratio. */
function catIconSvg(id) {
  return `<span class="cat-ic cat-${id}" role="img" aria-hidden="true"></span>`;
}

/* ---- Small helpers -------------------------------------------------------- */
const gradient = (item) => `linear-gradient(160deg, ${item.colors[0]}, ${item.colors[1]})`;
const posterBg = (item) => item.poster ? `url('${item.poster}') center/cover, ${gradient(item)}` : gradient(item);
const backdropArt = (item) => item.backdrop || item.poster || "";
/* Books have no wide backdrop art, so the detail page background is a flat wash
 * of the cover's own average colour (computed lazily, see paintBookColors). */
const backdropBg = (item) => {
  if (item.category === "book") return item.avg || item.colors[0];
  const a = backdropArt(item); return a ? `url('${a}') center/cover` : gradient(item);
};

/* Average colour of an image, sampled from a tiny canvas. Cached by URL. */
const _avgColorCache = new Map();
function averageColor(src) {
  if (_avgColorCache.has(src)) return Promise.resolve(_avgColorCache.get(src));
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = 20, h = 30;
        const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
        const cx = cv.getContext("2d", { willReadFrequently: true });
        cx.drawImage(img, 0, 0, w, h);
        const d = cx.getImageData(0, 0, w, h).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 8) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
        const hex = n ? "#" + [r, g, b].map((v) => Math.round(v / n).toString(16).padStart(2, "0")).join("") : null;
        if (hex) _avgColorCache.set(src, hex);
        resolve(hex);
      } catch (_) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
/* Average colour of just the TOP strip of an image — used to extend the homepage
 * backdrop upward in "colour fill" mode so its top edge melts into the head. */
const _topColorCache = new Map();
function topStripColor(src) {
  if (!src) return Promise.resolve(null);
  if (_topColorCache.has(src)) return Promise.resolve(_topColorCache.get(src));
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = 24, h = 24, rows = 4;
        const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
        const cx = cv.getContext("2d", { willReadFrequently: true });
        cx.drawImage(img, 0, 0, w, h);
        const d = cx.getImageData(0, 0, w, rows).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 8) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
        const hex = n ? "#" + [r, g, b].map((v) => Math.round(v / n).toString(16).padStart(2, "0")).join("") : null;
        if (hex) _topColorCache.set(src, hex);
        resolve(hex);
      } catch (_) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
/* The backdrop is shown dimmed (brightness .66 + a dark overlay). Darken a raw
 * sampled colour the same way so the flat fill matches the displayed image top. */
function adjustForBackdrop(hex) {
  const c = parseColor(hex), k = 0.66, ov = 0.28;
  const mix = (x, o) => Math.round(x * k * (1 - ov) + o * ov);
  return "#" + [mix(c.r, 10), mix(c.g, 12), mix(c.b, 16)].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
}
/* Resolve the homepage backdrop's top-strip fill colour onto a scope element. */
function paintTopFill(scopeEl, art) {
  if (!scopeEl || !art) return;
  topStripColor(art).then((hex) => { if (hex) scopeEl.style.setProperty("--home-fill-col", adjustForBackdrop(hex)); });
}

/* After a render, fill each book's detail-page background with the cover's true
 * average colour. Once computed it's cached on the item, so later renders are
 * exact and this becomes a no-op. */
function paintBookColors(root) {
  const scope = root || document;
  CATALOG.forEach((it) => {
    if (it.category !== "book" || !it.poster || it.avg) return;
    averageColor(it.poster).then((hex) => {
      if (!hex) return;
      it.avg = hex;
      scope.querySelectorAll(`.backdrop[data-slug="${it.slug}"] .art`).forEach((el) => { el.style.background = hex; });
    });
  });
}
const catIcon = (item) => catIconSvg(item.category);
const escapeAttr = (s) => String(s).replace(/"/g, "&quot;");
const cat = () => CATEGORIES.find((c) => c.id === state.category) || {};

function posterBox(item, cls = "thumb") {
  return `<div class="${cls}" style="background:${posterBg(item)}">${item.poster ? "" : catIconSvg(item.category)}</div>`;
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
/* Bottom-right toolbox: collapsed to one icon; tap to expand the tools upward
 * (each with a label); auto-collapses after a while. */
function toolbox() {
  const onStudio = (location.hash || "").startsWith("#/studio");
  const tools = [
    { t: "studio", label: onStudio ? "Home" : "Studio", ic: ICON.studio, on: onStudio },
    { t: "pick", label: "Pick", ic: ICON.finger, on: state.pickMode },
    { t: "debug", label: "Debug", ic: ICON.debug, on: state.debugTap },
  ];
  return `<div class="toolbox" data-toolbox>
    <div class="tools">
      ${tools.map((x) => `<button class="tool ${x.on ? "on" : ""}" data-tool="${x.t}"><span class="tool-label">${x.label}</span><span class="tool-ic">${x.ic}</span></button>`).join("")}
    </div>
    <button class="tb-btn" data-tb aria-label="Tools">${ICON.toolbox}</button>
  </div>`;
}
let tbTimer = null;
function wireToolbox(root) {
  const box = root.querySelector(".toolbox");
  if (!box) return;
  const arm = () => { clearTimeout(tbTimer); tbTimer = setTimeout(() => box.classList.remove("open"), 10000); };
  box.querySelector("[data-tb]").addEventListener("click", () => { box.classList.toggle("open"); if (box.classList.contains("open")) arm(); });
  box.querySelectorAll("[data-tool]").forEach((b) => b.addEventListener("click", () => {
    arm();
    const t = b.dataset.tool;
    if (t === "studio") location.hash = (location.hash || "").startsWith("#/studio") ? "#/" : "#/studio";
    else if (t === "pick") { togglePick(); box.classList.remove("open"); }
    else if (t === "zoom") {
      if (document.querySelector(".loupe")) closeLoupe(); else openLoupe();
      b.classList.toggle("on", !!document.querySelector(".loupe"));
    } else if (t === "debug") toggleDebug();
  }));
}
function togglePick() {
  state.pickMode = !state.pickMode;
  document.documentElement.classList.toggle("pick-mode", state.pickMode);
  document.querySelectorAll('.tool[data-tool="pick"]').forEach((b) => b.classList.toggle("on", state.pickMode));
}

function applyDebug() {
  document.documentElement.classList.toggle("tap-debug", state.debugTap);
}
function toggleDebug() {
  state.debugTap = !state.debugTap;
  localStorage.setItem("debug.tap", state.debugTap ? "1" : "0");
  applyDebug();
  document.querySelectorAll('.tool[data-tool="debug"]').forEach((b) => b.classList.toggle("on", state.debugTap));
}

/* =====================================================================
 * ZOOM LOUPE — a movable magnifier. Mirrors the current screen (DOM clone) so
 * text stays vector-sharp ("Sharp"); a "Pixel" mode shows raster pixels. It
 * floats (stays on screen) by default, or locks to the page and scrolls away.
 * ===================================================================== */
let loupeAbort = null, currentLoupe = null;
function fxLayer() {
  let fx = document.getElementById("fx");
  if (!fx) { fx = document.createElement("div"); fx.id = "fx"; document.body.appendChild(fx); }
  return fx;
}
function closeLoupe() {
  document.querySelector(".loupe")?.remove();
  loupeAbort?.abort(); loupeAbort = null; currentLoupe = null;
  document.querySelectorAll('.tool[data-tool="zoom"]').forEach((b) => b.classList.remove("on"));
}
function openLoupe() {
  if (document.querySelector(".loupe")) return;
  const lp = document.createElement("div");
  lp.className = "loupe";
  lp.innerHTML = `
    <div class="loupe-frame">
      <div class="loupe-drag" data-drag aria-label="Move"><span></span><span></span><span></span></div>
      <div class="loupe-view"><div class="loupe-clone"></div></div>
      <button class="loupe-ic loupe-lock" data-lock aria-label="Lock">${ICON.lock}</button>
      <button class="loupe-x" data-close aria-label="Close">${ICON.close}</button>
      <div class="loupe-size" data-size aria-hidden="true"><span></span></div>
    </div>
    <div class="loupe-jog">
      <div class="jog-track"><div class="jog-knob"><span class="jog-pct">200%</span></div></div>
    </div>`;
  fxLayer().appendChild(lp);
  const frame = lp.querySelector(".loupe-frame");
  const view = lp.querySelector(".loupe-view");
  const cloneHost = lp.querySelector(".loupe-clone");
  const ar = app.getBoundingClientRect();
  const S = { z: 2, w: 250, h: 210, locked: false, x: ar.left + Math.max(8, (ar.width - 250) / 2), y: ar.top + Math.round(ar.height * 0.28), lockCx: 0, lockCy: 0, lockBaseY: 0, lockBaseScroll: 0 };
  const clampZ = (v) => Math.max(1, Math.min(12, +(+v).toFixed(2)));

  const setSize = () => { frame.style.width = S.w + "px"; frame.style.height = S.h + "px"; };
  const setPos = () => { lp.style.left = S.x + "px"; lp.style.top = S.y + "px"; };
  const setPct = () => { lp.querySelector(".jog-pct").textContent = Math.round(S.z * 100) + "%"; };

  function buildClone() {
    const screen = app.querySelector(".screen"); if (!screen) return;
    const sr = screen.getBoundingClientRect();
    const c = screen.cloneNode(true);
    c.querySelectorAll(".loupe, .toolbox, .cp, .shed, .toast").forEach((n) => n.remove());
    c.style.width = sr.width + "px"; c.style.height = sr.height + "px";
    cloneHost.innerHTML = ""; cloneHost.style.width = sr.width + "px"; cloneHost.appendChild(c);
    syncScroll(); position();
  }
  function syncScroll() {
    const rs = app.querySelector(".screen .scroll"), cs = cloneHost.querySelector(".scroll");
    if (rs && cs) cs.scrollTop = rs.scrollTop;
  }
  function centre() {
    const sr = app.querySelector(".screen").getBoundingClientRect(), vr = view.getBoundingClientRect();
    return { cx: (vr.left + vr.width / 2) - sr.left, cy: (vr.top + vr.height / 2) - sr.top };
  }
  function position() {
    if (!app.querySelector(".screen")) return;
    const c = S.locked ? { cx: S.lockCx, cy: S.lockCy } : centre();
    cloneHost.style.transformOrigin = "0 0";
    cloneHost.style.transform = `translate(${S.w / 2 - c.cx * S.z}px, ${S.h / 2 - c.cy * S.z}px) scale(${S.z})`;
  }
  setSize(); setPos(); setPct(); buildClone();
  currentLoupe = { rebuild: buildClone };

  // top-left drag handle + view single-finger drag (axis-locked) + pinch
  function startDrag(sx, sy) { return { sx, sy, ox: S.x, oy: S.y, axis: null }; }
  function moveDrag(g, cxp, cyp) {
    const dx = cxp - g.sx, dy = cyp - g.sy;
    if (!g.axis) { if (Math.hypot(dx, dy) < 5) return; g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y"; }
    if (g.axis === "x") S.x = g.ox + dx; else S.y = g.oy + dy;
    setPos(); position();
  }
  const handle = lp.querySelector("[data-drag]");
  handle.addEventListener("pointerdown", (e) => {
    e.preventDefault(); e.stopPropagation(); handle.setPointerCapture(e.pointerId);
    const g = startDrag(e.clientX, e.clientY);
    handle.onpointermove = (ev) => moveDrag(g, ev.clientX, ev.clientY);
    handle.onpointerup = () => { handle.onpointermove = null; if (S.locked) { const sc = app.querySelector(".scroll"); S.lockBaseY = S.y; S.lockBaseScroll = sc ? sc.scrollTop : 0; } };
  });

  const ptrs = new Map(); let gesture = null;
  view.addEventListener("pointerdown", (e) => {
    view.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; gesture = { type: "pinch", d: Math.hypot(a.x - b.x, a.y - b.y), z: S.z }; }
    else if (!S.locked) gesture = Object.assign({ type: "drag" }, startDrag(e.clientX, e.clientY));
  });
  view.addEventListener("pointermove", (e) => {
    if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesture?.type === "pinch") {
      const [a, b] = [...ptrs.values()]; if (!a || !b) return;
      S.z = clampZ(gesture.z * (Math.hypot(a.x - b.x, a.y - b.y) / gesture.d)); setPct(); position();
    } else if (gesture?.type === "drag") moveDrag(gesture, e.clientX, e.clientY);
  });
  const up = (e) => { ptrs.delete(e.pointerId); gesture = ptrs.size === 2 ? gesture : null; };
  view.addEventListener("pointerup", up); view.addEventListener("pointercancel", up);

  // spring-lever zoom (snaps to centre; speed scales with how far it's pushed)
  const knob = lp.querySelector(".jog-knob"), track = lp.querySelector(".jog-track");
  let jogRAF = null, jogOff = 0;
  knob.addEventListener("pointerdown", (e) => {
    e.preventDefault(); e.stopPropagation(); knob.setPointerCapture(e.pointerId); knob.classList.add("active");
    const r = track.getBoundingClientRect(), half = r.width / 2, cx = r.left + half;
    const mv = (ev) => { jogOff = Math.max(-1, Math.min(1, (ev.clientX - cx) / half)); knob.style.left = `calc(50% + ${jogOff * half * 0.78}px)`; };
    mv(e); knob.onpointermove = mv;
    const stop = () => { knob.onpointermove = null; knob.classList.remove("active"); jogOff = 0; knob.style.left = "50%"; cancelAnimationFrame(jogRAF); jogRAF = null; };
    knob.onpointerup = stop; knob.onpointercancel = stop;
    let last = performance.now();
    const loop = (t) => { const dt = (t - last) / 1000; last = t; if (jogOff) { S.z = clampZ(S.z + Math.sign(jogOff) * Math.pow(Math.abs(jogOff), 1.6) * 4 * dt); setPct(); position(); } jogRAF = requestAnimationFrame(loop); };
    jogRAF = requestAnimationFrame(loop);
  });

  lp.querySelector("[data-lock]").addEventListener("click", (e) => {
    e.stopPropagation(); S.locked = !S.locked; lp.classList.toggle("locked", S.locked);
    const sc = app.querySelector(".scroll");
    if (S.locked) { const c = centre(); S.lockCx = c.cx; S.lockCy = c.cy; S.lockBaseY = S.y; S.lockBaseScroll = sc ? sc.scrollTop : 0; } else position();
  });
  lp.querySelector("[data-close]").addEventListener("click", (e) => { e.stopPropagation(); closeLoupe(); });

  const sizeEl = lp.querySelector("[data-size]");
  sizeEl.addEventListener("pointerdown", (e) => {
    e.preventDefault(); e.stopPropagation(); sizeEl.setPointerCapture(e.pointerId);
    const sx = e.clientX, sy = e.clientY, ow = S.w, oh = S.h;
    sizeEl.onpointermove = (ev) => { S.w = Math.max(150, ow + (ev.clientX - sx)); S.h = Math.max(120, oh + (ev.clientY - sy)); setSize(); position(); };
    sizeEl.onpointerup = () => { sizeEl.onpointermove = null; };
  });

  // scroll: float → content moves under; locked → loupe scrolls away, image frozen
  loupeAbort = new AbortController();
  app.addEventListener("scroll", () => {
    if (!lp.isConnected) { loupeAbort.abort(); return; }
    const sc = app.querySelector(".scroll"); if (!sc) return;
    if (S.locked) { S.y = S.lockBaseY - (sc.scrollTop - S.lockBaseScroll); setPos(); }
    else { syncScroll(); position(); }
  }, { capture: true, signal: loupeAbort.signal });
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

let _docClick = null, _landingClick = null;
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
  root.querySelectorAll("[data-home]").forEach((el) =>
    el.addEventListener("click", goHome));
  root.querySelectorAll("[data-back]").forEach((el) =>
    el.addEventListener("click", () => { if (history.length > 1) history.back(); else location.hash = "#/"; }));
  wireToolbox(root);
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
          <span class="poster-type" aria-hidden="true">${catIconSvg(it.category)}</span>
          <span class="score-badge"><span class="sb-num">${s.synth ?? "—"}</span><span class="sb-lab"><span>Critikl</span><span>Score</span></span></span>
        </div>
        <div class="li-text">
          <span class="li-title">${it.title}</span>
          <span class="li-year">${it.year}</span>
        </div>
      </button>`).join("")
    : `<div class="empty">—</div>`;
  const seeAll = rows.length ? seeAllTile("More") : "";
  return `<div class="list-col">${title ? `<h3>${titleLink(title)}</h3>` : ""}<div class="col-items">${items}${seeAll}</div></div>`;
}
/* A title that links to its own page gets a trailing chevron as the affordance. */
/* Chevron nested INSIDE the title text so it flows after the last word — on the
 * 2nd line for multi-line titles (e.g. the creator name) — and aligns to it. */
const titleLink = (text) => `<span class="title-text">${text}<span class="title-go" aria-hidden="true">${ICON.go}</span></span>`;

const listsClass = () => "lists cards layout-horizontal";

/* A title matches a query if its name or any genre contains it. */
const queryMatches = (it, q) => it.title.toLowerCase().includes(q) || it.genres.join(" ").toLowerCase().includes(q);
const categoryMatchCount = (catId, q) => itemsByCategory(catId).filter((it) => queryMatches(it, q)).length;
/* Notification-style count badges on the inactive tabs while a search is active. */
function updateTabBadges() {
  const q = state.query.trim().toLowerCase();
  app.querySelectorAll(".tabs .tab").forEach((tab) => {
    const badge = tab.querySelector(".tab-badge");
    if (!badge) return;
    const n = (q && !tab.classList.contains("active")) ? categoryMatchCount(tab.dataset.cat, q) : 0;
    badge.textContent = n > 99 ? "99+" : n;
    badge.hidden = n === 0;
  });
}

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
      .filter((it) => queryMatches(it, q))
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
  // Tapping the already-active tab toggles the whole thing closed again.
  if (state.category === c && state.searchOpen) { closeSearch(); return; }
  state.category = c;
  app.querySelector(".tabs")?.classList.add("has-sel");
  app.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.cat === c));
  // Keep any typed query so switching tabs simply re-filters the new category.
  const input = document.getElementById("search-input");
  if (input) input.placeholder = `Search ${(cat().plural || "").toLowerCase()}…`;
  const clearText = app.querySelector(".search-cleartext");
  if (clearText) clearText.hidden = !state.query.trim();
  openSearch();
  renderResultsArea();
  updateTabBadges();
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
  updateTabBadges();
}

function renderLanding() {
  const selected = state.category !== null;
  const tabs = CATEGORIES.map((c) => `
    <button class="tab ${c.id === state.category ? "active" : ""}" data-cat="${c.id}">
      <span class="tab-icon">${catIconSvg(c.id)}</span>
      <span class="tab-label">${c.plural}</span>
      <span class="tab-badge" hidden></span>
    </button>`).join("");

  const hasText = !!state.query.trim();
  // A random movie/TV/game backdrop sits (blurred, static) behind the homepage.
  const arts = CATALOG.filter((i) => i.category !== "book" && backdropArt(i));
  const randArt = arts[Math.floor(Math.random() * arts.length)];
  const randSrc = randArt ? backdropArt(randArt) : "";
  app.innerHTML = `
    <div class="screen landing-screen">
      ${randArt ? `<div class="home-bg" style="background:${backdropBg(randArt)}"></div>
      <div class="home-fill"></div>
      <div class="home-mirror" style="background-image:url('${randSrc}')"></div>
      <div class="home-scrim"></div>` : ""}
      <div class="landing-sticky">
        <div class="head-left">${logo()}</div>
        <div class="head-actions">${headSearch()}</div>
      </div>
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
              <div class="search-field">
                <span class="search-ic">${ICON.search}</span>
                <input id="search-input" type="search" autocomplete="off"
                  placeholder="${selected ? `Search ${(cat().plural || "").toLowerCase()}…` : ""}"
                  value="${escapeAttr(state.query)}" />
                <button class="search-cleartext" ${hasText ? "" : "hidden"}>Clear</button>
                <button class="search-clear" aria-label="Close search">${ICON.close}</button>
              </div>
            </div>
          </div>

          <div class="rise d2" id="results-area"></div>
        </div>
      </div>
      ${toolbox()}
    </div>`;

  // Extend the backdrop upward in "colour fill" mode: sample its top strip.
  paintTopFill(app.querySelector(".landing-screen"), randSrc);

  renderResultsArea();
  updateTabBadges();

  app.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", (e) => { e.stopPropagation(); selectCategory(t.dataset.cat); }));

  const input = document.getElementById("search-input");
  const clearText = app.querySelector(".search-cleartext");
  input.addEventListener("input", (e) => {
    state.query = e.target.value;
    if (clearText) clearText.hidden = !e.target.value.trim();
    renderResultsArea();
    updateTabBadges();
  });
  clearText?.addEventListener("click", () => {
    state.query = ""; input.value = ""; clearText.hidden = true;
    renderResultsArea(); updateTabBadges(); input.focus();
  });
  app.querySelector(".search-clear")?.addEventListener("click", closeSearch);

  // Scroll past the hero → slide the compact header (logo + search) down.
  const scroller = app.querySelector(".scroll");
  const screen = app.querySelector(".landing-screen");
  scroller.addEventListener("scroll", () => {
    screen.classList.toggle("show-sticky", scroller.scrollTop > 120);
  }, { passive: true });

  // Tapping outside the tabs / search bar closes the open search.
  if (_landingClick) document.removeEventListener("click", _landingClick);
  _landingClick = (e) => {
    if (!state.searchOpen) return;
    if (e.target.closest(".tabs") || e.target.closest(".searchbar-wrap") || e.target.closest(".landing-sticky")) return;
    if (e.target.closest("#results-area")) return;
    closeSearch();
  };
  document.addEventListener("click", _landingClick);

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

/* A horizontally-scrolling row of cast members (photo / initials + name + role). */
function personCard(p) {
  const initials = p.name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return `<div class="person-card">
    <div class="person-photo${p.photo ? " has-photo" : ""}"${p.photo ? ` style="background-image:url('${p.photo}')"` : ""}>
      ${p.photo ? "" : `<span class="person-initials">${initials}</span>`}
    </div>
    <div class="person-name">${p.name}</div>
    ${p.character ? `<div class="person-char">${p.character}</div>` : ""}
  </div>`;
}
function castSection(item) {
  if (!item.cast || !item.cast.length) return "";
  return `<section class="dsec cast-sec rise d3">
    ${secHead("Actors")}
    <div class="dsec-body"><div class="cast-row">${item.cast.map(personCard).join("")}${seeAllTile()}</div></div>
  </section>`;
}

/* Collapsible section header (chevron toggles the section's .dsec-body). */
function secHead(title, sub) {
  return `<div class="sec-head"><h2>${titleLink(title)}</h2><span class="sec-right">${sub ? `<span class="sub">${sub}</span>` : ""}<button class="sec-toggle" data-collapse aria-label="Toggle section">${ICON.chev}</button></span></div>`;
}
/* "More" tile that caps a horizontal row (cast / poster lists). */
function seeAllTile(label = "More") {
  return `<button class="see-all" data-seeall aria-label="${label}"><span class="sa-ic">${ICON.back}</span><span class="sa-t">${label}</span></button>`;
}
/* "Where to Watch" adapts to the medium. */
const WATCH_TITLE = { movie: "Where to Watch", tv: "Where to Watch", game: "Where to Play", book: "Where to Read" };
const watchTitle = (item) => WATCH_TITLE[item.category] || "Where to Watch";
const watchSub = (item) => (item.category === "movie" || item.category === "tv") ? "Powered by JustWatch" : "";

/* ---- Related-content lists on the item page (all copy lives in REL) ---- */
const CREATOR_KEY = { movie: "Director", tv: "Creator", game: "Developer", book: "Author" };
const NEXT_VERB = { movie: "Watch Next", tv: "Binge Next", game: "Play Next", book: "Read Next" };
const NEXT_CAT = { movie: "Movies", tv: "Shows", game: "Games", book: "Books" };
/* "Watch Next Movies" etc. — the category word is gold (uppercased via CSS). */
const nextTitle = (cat) => `${NEXT_VERB[cat]} <span class="rel-cat">${NEXT_CAT[cat]}</span>`;
const REL = {
  universe: "The Same Universe",
  mind: (name) => `From the Same Mind:<br><span class="rel-creator">${name}</span>`,
};
/* Other items in a category, ranked by shared-genre relevance to `item`
 * (tie-broken by score; falls back to top score when nothing overlaps). */
function relatedInCategory(item, cat) {
  const mine = new Set(item.genres || []);
  return itemsByCategory(cat)
    .filter((x) => x.slug !== item.slug)
    .map((x) => ({ it: x, s: scoreItem(x), o: (x.genres || []).filter((g) => mine.has(g)).length }))
    .sort((a, b) => (b.o - a.o) || ((b.s.synth ?? 0) - (a.s.synth ?? 0)))
    .slice(0, 10)
    .map(({ it, s }) => ({ it, s }));
}
/* Every item sharing this item's franchise tag, across all media (chronological). */
function franchiseItems(item) {
  if (!item.franchiseId) return [];
  return CATALOG
    .filter((x) => x.franchiseId === item.franchiseId && x.slug !== item.slug)
    .map((x) => ({ it: x, s: scoreItem(x) }))
    .sort((a, b) => (a.it.year - b.it.year) || ((b.s.synth ?? 0) - (a.s.synth ?? 0)));
}
/* All same-medium titles in one series/franchise, in order (by seriesIndex).
 * Same category only: sequels/prequels (film, games), spin-offs (TV), series (books). */
function seriesItems(item) {
  if (!item.series) return [];
  return CATALOG
    .filter((x) => x.series === item.series && x.category === item.category)
    .sort((a, b) => (a.seriesIndex || 0) - (b.seriesIndex || 0) || (a.year - b.year));
}
/* Category-appropriate label for the "more in this series" link. */
const SERIES_LINK = { movie: "Sequels & prequels", tv: "Spin-offs & related", game: "Sequels & prequels", book: "In this series" };
const seriesLinkLabel = (item) => SERIES_LINK[item.category] || "In this series";
/* Other titles crediting the same primary creator (Director/Creator/Developer/
 * Author), matched by name across the whole catalog. */
function sameCreator(item) {
  const key = CREATOR_KEY[item.category];
  const names = new Set((item.credits?.[key] || "").split(",").map((n) => n.trim()).filter(Boolean));
  if (!names.size) return { creator: "", rows: [] };
  const rows = CATALOG
    .filter((x) => x.slug !== item.slug)
    .filter((x) => (x.credits?.[CREATOR_KEY[x.category]] || "").split(",").some((n) => names.has(n.trim())))
    .map((x) => ({ it: x, s: scoreItem(x) }))
    .sort((a, b) => (b.s.synth ?? 0) - (a.s.synth ?? 0))
    .slice(0, 12);
  return { creator: [...names][0], rows };
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

  // Related-content lists (specificity-first). The top list is the page's own
  // category ("Watch Next Movies" on a movie, etc. — replaces "More Like This"),
  // then exact franchise → same creator → cross-medium discovery. Empties drop.
  const cr = sameCreator(item);
  const OTHER = ["movie", "tv", "game", "book"].filter((c) => c !== item.category);
  const relatedSecs = [
    { title: nextTitle(item.category), sub: "", rows: similar },
    { title: REL.universe, sub: "", rows: franchiseItems(item) },
    { title: REL.mind(cr.creator), sub: "", rows: cr.rows },
    ...OTHER.map((c) => ({ title: nextTitle(c), sub: "", rows: relatedInCategory(item, c) })),
  ].filter((d) => d.rows.length);
  const renderRelatedSec = (d, i) => `<section class="dsec rel-sec rise d${Math.min(4 + i, 6)}">
          ${secHead(d.title, d.sub)}
          <div class="dsec-body"><div class="lists cards layout-horizontal">${listColumn("", d.rows)}</div></div>
        </section>`;

  const hasArt = !!item.poster;
  app.innerHTML = `
    <div class="screen detail">
      <div class="backdrop" data-slug="${item.slug}">
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
              ${seriesItems(item).length > 1 ? `<button class="series-link" data-series-link>${seriesLinkLabel(item)} ${ICON.go}</button>` : ""}
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

        <section class="dsec rise d3">
          ${secHead(watchTitle(item), watchSub(item))}
          <div class="dsec-body"><div id="watch-region">${renderWatch(item)}</div></div>
        </section>

        ${castSection(item)}

        ${relatedSecs.map(renderRelatedSec).join("")}
      </div>
      ${toolbox()}
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

  app.querySelector("[data-series-link]")?.addEventListener("click", () => openSeriesPopup(item));

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

  // Collapsible sections: the chevron (or empty header area) toggles the body;
  // a tap on the title text navigates to its full page instead.
  app.querySelectorAll(".dsec .sec-head [data-collapse]").forEach((btn) =>
    btn.addEventListener("click", (e) => { e.stopPropagation(); btn.closest(".dsec").classList.toggle("collapsed"); }));
  app.querySelectorAll(".dsec .sec-head h2").forEach((h) =>
    h.addEventListener("click", (e) => { e.stopPropagation(); toast("Full listing — coming soon"); }));

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
/* Popup listing every book in a title's series (reading order); the current book
 * is marked, the others link to their own pages. */
function openSeriesPopup(item) {
  const rows = seriesItems(item);
  if (rows.length < 2) return;
  const ov = document.createElement("div");
  ov.className = "series-pop";
  ov.innerHTML = `
    <div class="sp-scrim"></div>
    <div class="sp-sheet">
      <div class="sp-head"><h3>${item.series}</h3><button class="sp-x" aria-label="Close">${ICON.close}</button></div>
      <div class="sp-list">
        ${rows.map((it) => {
          const cur = it.slug === item.slug;
          return `<button class="sp-row${cur ? " current" : ""}"${cur ? "" : ` data-slug="${it.slug}"`}>
            ${posterBox(it, "thumb")}
            <div class="meta"><div class="name">${it.seriesIndex ? `<span class="sp-num">${it.seriesIndex}.</span> ` : ""}${it.title} <span class="yr">(${it.year})</span></div><div class="genres">${cur ? `<span class="sp-here">Viewing now</span>` : it.genres.join(" · ")}</div></div>
            <div class="result-score">${scoreItem(it).synth ?? "—"}</div>
          </button>`;
        }).join("")}
      </div>
    </div>`;
  app.appendChild(ov);
  const close = () => ov.remove();
  ov.querySelector(".sp-scrim").addEventListener("click", close);
  ov.querySelector(".sp-x").addEventListener("click", close);
  ov.querySelectorAll("[data-slug]").forEach((b) =>
    b.addEventListener("click", () => { close(); location.hash = `#/item/${b.dataset.slug}`; }));
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

/* ---- gradient parsing / serialising (every colour chooser can emit one) ---- */
function splitTop(s) {
  const out = []; let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++; else if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}
function gradCss(g) {
  const stops = g.stops.map((s) => `${s.color} ${Math.round(s.pos)}%`).join(", ");
  return g.type === "radial"
    ? `radial-gradient(circle at ${Math.round(g.off)}% ${Math.round(g.offY == null ? 50 : g.offY)}%, ${stops})`
    : `linear-gradient(${Math.round(g.angle)}deg, ${stops})`;
}
/* Parse any colour-or-gradient string into a uniform editor model. */
function parseValue(str) {
  str = String(str || "").trim();
  const m = str.match(/^(linear|radial)-gradient\((.*)\)$/i);
  if (m) {
    const type = m[1].toLowerCase();
    let parts = splitTop(m[2]); let angle = 90, off = 50, offY = 50;
    if (type === "linear") { const a = (parts[0] || "").match(/(-?\d+(?:\.\d+)?)deg/); if (a) { angle = +a[1]; parts = parts.slice(1); } }
    else { const o = (parts[0] || "").match(/at\s+(-?\d+(?:\.\d+)?)%(?:\s+(-?\d+(?:\.\d+)?)%)?/); if (o) { off = +o[1]; if (o[2] != null) offY = +o[2]; parts = parts.slice(1); } }
    const stops = parts.map((p) => {
      const t = p.trim(); const pm = t.match(/\s(-?\d+(?:\.\d+)?)%\s*$/);
      return { color: (pm ? t.slice(0, pm.index) : t).trim() || "#888888", pos: pm ? +pm[1] : null };
    });
    stops.forEach((s, i) => { if (s.pos == null) s.pos = stops.length > 1 ? Math.round((i / (stops.length - 1)) * 100) : 0; });
    while (stops.length < 2) stops.push({ color: "#000000", pos: 100 });
    return { mode: "grad", color: stops[0].color, grad: { type, angle, off, offY, stops } };
  }
  const c = str || "#888888";
  return { mode: "solid", color: c, grad: { type: "linear", angle: 90, off: 50, offY: 50, stops: [{ color: c, pos: 0 }, { color: "#000000", pos: 100 }] } };
}

/* ---- control builders + shadow sub-editor ---- */
function stepperHTML(v, val, step, min, max, unit, fine, noauto) {
  const u = unit == null ? "px" : unit;
  const f = fine == null ? 0.1 : fine;
  return `<div class="step"${v ? ` data-var="${v}"` : ""}${noauto ? " data-noauto" : ""} data-min="${min}"${max != null ? ` data-max="${max}"` : ""} data-unit="${u}">
      <button class="step-btn big" data-d="${-step}" aria-label="minus ${step}">«</button>
      <button class="step-btn" data-d="${-f}" aria-label="minus ${f}">‹</button>
      <input class="step-val" type="text" inputmode="decimal" value="${val}">
      <button class="step-btn" data-d="${f}" aria-label="plus ${f}">›</button>
      <button class="step-btn big" data-d="${step}" aria-label="plus ${step}">»</button>
    </div>`;
}
function swatchHTML(v, val, layer) {
  return `<button class="swatch" data-var="${v}" data-val="${val}"${layer ? ' data-layer="1"' : ""}>
      <span class="swatch-chip"><span style="background:${val}"></span></span>
      <span class="swatch-val">${val}</span></button>`;
}
/* A bare colour is illegal in a non-final CSS background layer, so colours bound
 * to a background layer are coerced to a (degenerate) gradient when applied. */
function asImage(v) { return /gradient\(/i.test(v) ? v : `linear-gradient(${v}, ${v})`; }
const FONT_OPTS = [
  { v: "var(--font-display)", l: "Display" },
  { v: "var(--font)", l: "Body" },
  { v: "system-ui, sans-serif", l: "System" },
  { v: "Georgia, 'Times New Roman', serif", l: "Serif" },
  { v: "ui-monospace, Menlo, Consolas, monospace", l: "Mono" },
];
function selectHTML(v, val, opts) {
  return `<select class="st-select" data-var="${v}">${opts.map((o) => `<option value="${o.v}"${o.v === val ? " selected" : ""}>${o.l}</option>`).join("")}</select>`;
}
/* Corner-radius control: a single all-corners stepper + ⊞ (by the label) to
 * expand into four vertical per-corner steppers (the single one then hides). */
function radiusRow(it) {
  const step = it.step || 1, min = it.min == null ? 0 : it.min;
  const corners = ["Top-left", "Top-right", "Bottom-right", "Bottom-left"];
  return `<div class="ctl ctl-radius" data-var="${it.k}" data-step="${step}" data-min="${min}" data-default="${it.val}">
    <div class="ctl-top">
      <span class="ctl-l">${it.label} <button class="rad-exp" data-rad-exp aria-label="Per-corner">⊞</button></span>
      <div class="rad-main">${stepperHTML("", it.val, step, min)}</div>
      <button class="ctl-reset" data-reset-main aria-label="Reset">${ICON.reset}</button>
    </div>
    <div class="rad-quad hidden">
      ${corners.map((c) => `<div class="rq"><span class="rq-l">${c}</span>${stepperHTML("", it.val, step, min)}<button class="ctl-reset" data-reset-corner aria-label="Reset">${ICON.reset}</button></div>`).join("")}
    </div>
  </div>`;
}
function controlRow(it) {
  if (it.type === "radius") return radiusRow(it);
  // "lock" = a plain checkbox (e.g. lock aspect), no token, no reset.
  if (it.type === "lock") return `<div class="ctl"><span class="ctl-l">${it.label}</span><input type="checkbox" class="scale-lock"${it.on ? " checked" : ""} aria-label="${it.label}"></div>`;
  let ctrl;
  // Colours & shadows can be switched off entirely (off = transparent / no shadow).
  const toggleable = it.type === "color" || it.type === "shadow";
  const startOff = !!it.off;
  if (it.type === "color") ctrl = swatchHTML(it.k, it.val, it.layer);
  else if (it.type === "shadow") ctrl = `<button class="shadow-btn" data-var="${it.k}">Edit ▸</button>`;
  else if (it.type === "outline") ctrl = `<button class="outline-btn" data-var="${it.k}">Edit ▸</button>`;
  else if (it.type === "text") ctrl = `<input class="st-text" type="text" data-var="${it.k}" value="${escapeAttr(String(it.val))}">`;
  else if (it.type === "select") ctrl = selectHTML(it.k, it.val, it.opts || FONT_OPTS);
  else ctrl = stepperHTML(it.k, it.val, it.step || 1, it.min == null ? 0 : it.min, it.max, it.unit, it.fine, it.noauto);
  const def = (it.type === "shadow" || it.type === "outline") ? "" : ` data-default="${escapeAttr(String(it.val))}"`;
  const tog = toggleable ? `<input type="checkbox" class="ctl-tog"${startOff ? "" : " checked"} aria-label="Enable ${it.label}">` : "";
  return `<div class="ctl${toggleable ? " has-tog" : ""}${startOff ? " off" : ""}"${def}>${tog}<span class="ctl-l">${it.label}</span>${ctrl}<button class="ctl-reset" data-reset aria-label="Reset ${it.label}">${ICON.reset}</button></div>`;
}
/* Inline starting style for an "After" candidate: colours/selects raw, numeric
 * tokens with their unit; text + shadow are skipped (applied separately). */
function studioInitStyle(groups) {
  const out = [];
  groups.forEach((g) => g.items.forEach((it) => {
    if (it.type === "lock" || it.type === "text" || it.type === "shadow" || it.type === "outline") return;
    if (it.type === "color" || it.type === "select") out.push(`${it.k}:${it.val}`);
    else if (it.type === "radius") out.push(`${it.k}:${it.val}px`);
    else out.push(`${it.k}:${it.val}${it.unit == null ? "px" : it.unit}`);
  }));
  return out.join(";");
}
function groupHTML(g, open) {
  const scaleBtn = g.scale ? `<button class="grp-scale" data-grp-scale="${g.scale}" aria-label="Scale ${g.name}">${ICON.scale}</button>` : "";
  return `<section class="st-sec ${open ? "" : "collapsed"}">
    <div class="st-h" data-acc><h2>${g.name}</h2><span class="acc-right">${scaleBtn}<span class="acc-ic">${ICON.back}</span></span></div>
    <div class="st-body"><div class="st-controls">${g.items.map(controlRow).join("")}</div></div>
  </section>`;
}

/* Accelerating stepper: each button carries its own delta (data-d). Outer = one
 * whole step, inner = 0.1; tap once or hold to ramp up. Value tappable to type. */
function attachStepper(step, onValue) {
  const input = step.querySelector(".step-val");
  const min = parseFloat(step.dataset.min), max = parseFloat(step.dataset.max);
  const get = () => (parseFloat(input.value) || 0);
  const set = (n) => { if (!isNaN(min) && n < min) n = min; if (!isNaN(max) && n > max) n = max; n = Math.round(n * 100) / 100; input.value = n; onValue(n); };
  input.addEventListener("change", () => set(get()));
  step.querySelectorAll(".step-btn").forEach((btn) => {
    const d = parseFloat(btn.dataset.d); let timer = null, delay = 0, count = 0;
    const tick = () => { count++; const m = count > 22 ? 8 : count > 14 ? 4 : count > 7 ? 2 : 1; set(get() + d * m); delay = Math.max(40, delay * 0.82); timer = setTimeout(tick, delay); };
    const start = (e) => { e.preventDefault(); e.stopPropagation(); count = 0; delay = 320; set(get() + d); timer = setTimeout(tick, delay); };
    const stop = () => { if (timer) { clearTimeout(timer); timer = null; } };
    btn.addEventListener("pointerdown", start);
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => btn.addEventListener(ev, stop));
  });
}

const SHADOWS = {};
const SHADOW_DEFAULT = { color: "rgba(0,0,0,0.55)", angle: 90, distance: 6, blur: 14, scale: 1 };
/* Opacity comes from the colour's own alpha; `scale` multiplies offset + blur
 * (an overall size multiplier that works for box- and drop-shadows alike). */
function shadowCss(s) {
  const sc = s.scale == null ? 1 : s.scale;
  const r = (s.angle * Math.PI) / 180;
  const ox = +(Math.cos(r) * s.distance * sc).toFixed(1), oy = +(Math.sin(r) * s.distance * sc).toFixed(1);
  const c = parseColor(s.color), a = c.a == null ? 1 : c.a;
  return `${ox}px ${oy}px ${Math.max(0, s.blur * sc).toFixed(1)}px rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${a.toFixed(2)})`;
}
function wireGroupControls(root, applyVar, onText) {
  root.querySelectorAll(".st-h[data-acc]").forEach((h) =>
    h.addEventListener("click", () => h.closest(".st-sec").classList.toggle("collapsed")));
  root.querySelectorAll(".st-text").forEach((inp) =>
    inp.addEventListener("input", () => onText?.(inp.dataset.var, inp.value)));
  root.querySelectorAll("[data-grp-scale]").forEach((btn) =>
    btn.addEventListener("click", (e) => { e.stopPropagation(); openScaleEditor(btn.dataset.grpScale, applyVar); }));
  root.querySelectorAll(".st-controls .step[data-var]:not([data-noauto])").forEach((step) =>
    attachStepper(step, (n) => applyVar(step.dataset.var, n + (step.dataset.unit ?? "px"))));
  root.querySelectorAll(".swatch").forEach((sw) => sw.addEventListener("click", () =>
    openColorPicker(sw.dataset.val, (val) => {
      sw.dataset.val = val; sw.querySelector(".swatch-chip > span").style.background = val;
      sw.querySelector(".swatch-val").textContent = val;
      applyVar(sw.dataset.var, sw.dataset.layer ? asImage(val) : val);
    })));
  root.querySelectorAll(".st-select").forEach((sel) =>
    sel.addEventListener("change", () => applyVar(sel.dataset.var, sel.value)));
  // per-corner radius: single value, or 4-value shorthand when expanded
  root.querySelectorAll(".ctl-radius").forEach((rc) => {
    const vvar = rc.dataset.var, def = parseFloat(rc.dataset.default) || 0;
    const mainStep = rc.querySelector(".rad-main .step");
    const quad = rc.querySelector(".rad-quad");
    const quadSteps = [...quad.querySelectorAll(".step")];
    const sval = (st) => parseFloat(st.querySelector(".step-val").value) || 0;
    const apply = () => applyVar(vvar, rc.classList.contains("expanded")
      ? quadSteps.map((s) => sval(s) + "px").join(" ")
      : sval(mainStep) + "px");
    attachStepper(mainStep, apply);
    quadSteps.forEach((s) => attachStepper(s, apply));
    rc.querySelector("[data-rad-exp]").addEventListener("click", () => {
      const exp = !rc.classList.contains("expanded");
      rc.classList.toggle("expanded", exp);
      quad.classList.toggle("hidden", !exp);
      if (exp) quadSteps.forEach((s) => (s.querySelector(".step-val").value = sval(mainStep)));
      apply();
    });
    rc.querySelector("[data-reset-main]").addEventListener("click", () => { mainStep.querySelector(".step-val").value = def; apply(); });
    rc.querySelectorAll("[data-reset-corner]").forEach((btn, i) =>
      btn.addEventListener("click", () => { quadSteps[i].querySelector(".step-val").value = def; apply(); }));
  });
  root.querySelectorAll(".shadow-btn").forEach((btn) => btn.addEventListener("click", () => openShadowEditor(btn.dataset.var, applyVar)));
  root.querySelectorAll(".outline-btn").forEach((btn) => btn.addEventListener("click", () => openOutlineEditor(btn.dataset.var, applyVar)));
  // Enable/disable toggles (colours & shadows). Off = transparent / no shadow.
  root.querySelectorAll(".ctl-tog").forEach((cb) => {
    const ctl = cb.closest(".ctl");
    if (cb.checked === false) applyCtlToggle(ctl, false, applyVar);
    cb.addEventListener("change", () => { ctl.classList.toggle("off", !cb.checked); applyCtlToggle(ctl, cb.checked, applyVar); });
  });
  // per-property reset (every standard .ctl row carries its default value)
  root.querySelectorAll(".ctl:not(.ctl-radius) > [data-reset]").forEach((btn) => {
    const ctl = btn.closest(".ctl"), def = ctl.dataset.default;
    btn.addEventListener("click", () => {
      const step = ctl.querySelector(":scope > .step[data-var]");
      const sw = ctl.querySelector(":scope > .swatch");
      const sel = ctl.querySelector(":scope > .st-select");
      const sh = ctl.querySelector(":scope > .shadow-btn");
      const ol = ctl.querySelector(":scope > .outline-btn");
      const txt = ctl.querySelector(":scope > .st-text");
      if (step) { step.querySelector(".step-val").value = def; applyVar(step.dataset.var, def + (step.dataset.unit ?? "px")); }
      else if (sw) { sw.dataset.val = def; sw.querySelector(".swatch-chip > span").style.background = def; sw.querySelector(".swatch-val").textContent = def; applyVar(sw.dataset.var, sw.dataset.layer ? asImage(def) : def); }
      else if (sel) { sel.value = def; applyVar(sel.dataset.var, def); }
      else if (txt) { txt.value = def; onText?.(txt.dataset.var, def); }
      else if (sh) { const v = sh.dataset.var; SHADOWS[v] = { ...SHADOW_DEFAULT }; applyVar(v, shadowCss(SHADOWS[v])); }
      else if (ol) { const v = ol.dataset.var; OUTLINES[v] = { ...OUTLINE_DEFAULT }; applyVar(v, ""); }
    });
  });
}

/* Read control values for export. With `changedOnly`, items still at their
 * default are skipped (so the export only carries what actually changed). */
function readGroupValues(groups, changedOnly = true) {
  const out = {};
  const isOff = (sel) => { const c = app.querySelector(sel)?.closest(".ctl"); return !!c && c.classList.contains("off"); };
  groups.forEach((g) => g.items.forEach((it) => {
    if (it.type === "lock") return;
    let cur, def, off = false;
    if (it.type === "color") { off = isOff(`.swatch[data-var="${it.k}"]`); cur = off ? "transparent" : app.querySelector(`.swatch[data-var="${it.k}"]`).dataset.val; def = it.val; }
    else if (it.type === "select") { cur = app.querySelector(`.st-select[data-var="${it.k}"]`).value; def = it.val; }
    else if (it.type === "text") { cur = app.querySelector(`.st-text[data-var="${it.k}"]`).value; def = it.val; }
    else if (it.type === "shadow") { off = isOff(`.shadow-btn[data-var="${it.k}"]`); def = it.def || "none"; cur = off ? "none" : (SHADOWS[it.k] ? shadowCss(SHADOWS[it.k]) : def); }
    else if (it.type === "outline") { def = ""; cur = OUTLINES[it.k] ? outlineCss(OUTLINES[it.k]) : ""; }
    else if (it.type === "radius") {
      const rc = app.querySelector(`.ctl-radius[data-var="${it.k}"]`);
      cur = rc.classList.contains("expanded")
        ? [...rc.querySelectorAll(".rad-quad .step-val")].map((i) => (parseFloat(i.value) || 0) + "px").join(" ")
        : (parseFloat(rc.querySelector(".rad-main .step-val").value) || 0) + "px";
      def = it.val + "px";
    }
    else { const u = it.unit == null ? "px" : it.unit; cur = (parseFloat(app.querySelector(`.step[data-var="${it.k}"] .step-val`).value) || 0) + u; def = it.val + u; }
    // Disabled (unticked) controls are always emitted so the "off" reaches us.
    if (off || !changedOnly || cur !== def) out[it.k] = cur;
  }));
  // Per-section scale (set via the Scale popup) — only emit when not 1.
  groups.forEach((g) => { const s = g.scale && SCALES[g.scale]; if (s) { if (s.sx !== 1) out[g.scale + "-sx"] = s.sx; if (s.sy !== 1) out[g.scale + "-sy"] = s.sy; } });
  return out;
}

/* Apply a control's enabled/disabled state (off = transparent fill / no shadow). */
function applyCtlToggle(ctl, on, applyVar) {
  const sw = ctl.querySelector(".swatch");
  const sh = ctl.querySelector(".shadow-btn");
  if (sw) {
    const val = on ? sw.dataset.val : "transparent";
    applyVar(sw.dataset.var, sw.dataset.layer ? asImage(val) : val);
  } else if (sh) {
    const v = sh.dataset.var;
    // A no-op shadow that's valid in box-shadow, text-shadow AND drop-shadow()
    // (drop-shadow(none) is invalid and would void a whole filter chain).
    if (!on) applyVar(v, "0 0 0 transparent");
    else if (SHADOWS[v]) applyVar(v, shadowCss(SHADOWS[v]));
    else applyVar(v, "");   // re-enabled, untouched → fall back to the CSS default
  }
}

function closeShadowEditor() { app.querySelector(".shed")?.remove(); }
/* Position a bottom sheet so its top sits just below the sticky preview stage
 * (whose height varies per editor), then let its own content scroll. */
function sheetTopOffset() {
  const stage = app.querySelector(".st-stage");
  if (!stage) return 0;
  const ar = app.getBoundingClientRect(), sr = stage.getBoundingClientRect();
  return Math.max(0, Math.round(sr.bottom - ar.top) + 8);
}
function placeSheet(wrap) {
  const sheet = wrap.querySelector(".cp-sheet");
  if (sheet) { sheet.style.top = sheetTopOffset() + "px"; sheet.style.maxHeight = "none"; }
}
function openShadowEditor(v, applyVar) {
  closeShadowEditor();
  const s = SHADOWS[v] || (SHADOWS[v] = { ...SHADOW_DEFAULT });
  if (s.scale == null) s.scale = 1;
  const stepF = (label, f, step, min, max, fine) => {
    const d = fine == null ? 0.1 : fine;
    return `<div class="ctl"><span class="ctl-l">${label}</span><div class="step" data-field="${f}" data-min="${min}"${max != null ? ` data-max="${max}"` : ""}><button class="step-btn big" data-d="${-step}">«</button><button class="step-btn" data-d="${-d}">‹</button><input class="step-val" type="text" inputmode="decimal" value="${s[f]}"><button class="step-btn" data-d="${d}">›</button><button class="step-btn big" data-d="${step}">»</button></div></div>`;
  };
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
      ${stepF("Scale", "scale", 0.1, 0, null, 0.05)}
    </div>`;
  app.appendChild(wrap);
  placeSheet(wrap);
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

/* Outline = a ring of offset drop-shadows (width + colour) applied on the parent
 * wordmark. Robust everywhere (no SVG filter / mask-on-element quirks). */
const OUTLINES = {};
const OUTLINE_DEFAULT = { width: 0, color: "#ffffff" };
function outlineCss(o) {
  const w = +o.width || 0;
  if (w <= 0) return "";
  const c = o.color || "#ffffff";
  const n = w <= 1.5 ? 8 : 12;   // denser ring for thicker outlines
  const pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * 2 * Math.PI; pts.push(`drop-shadow(${(Math.cos(a) * w).toFixed(2)}px ${(Math.sin(a) * w).toFixed(2)}px 0 ${c})`); }
  return pts.join(" ");
}
function closeOutlineEditor() { app.querySelector(".oled")?.remove(); }
function openOutlineEditor(v, applyVar) {
  closeOutlineEditor();
  const o = OUTLINES[v] || (OUTLINES[v] = { ...OUTLINE_DEFAULT });
  const wrap = document.createElement("div");
  wrap.className = "shed oled";
  wrap.innerHTML = `
    <div class="cp-scrim"></div>
    <div class="cp-sheet">
      <div class="cp-head"><span>Outline</span><button class="cp-done">Done</button></div>
      <div class="ctl"><span class="ctl-l">Width</span><div class="step" data-field="width" data-min="0" data-max="10" data-unit=""><button class="step-btn big" data-d="-1">«</button><button class="step-btn" data-d="-0.5">‹</button><input class="step-val" type="text" inputmode="decimal" value="${o.width}"><button class="step-btn" data-d="0.5">›</button><button class="step-btn big" data-d="1">»</button></div></div>
      <div class="ctl"><span class="ctl-l">Colour</span>${swatchHTML("__olcol", o.color)}</div>
    </div>`;
  app.appendChild(wrap);
  placeSheet(wrap);
  const upd = () => applyVar(v, outlineCss(o));
  wrap.querySelectorAll(".step[data-field]").forEach((step) => attachStepper(step, (n) => { o[step.dataset.field] = n; upd(); }));
  const sw = wrap.querySelector(".swatch");
  sw.addEventListener("click", () => openColorPicker(o.color, (val) => {
    o.color = val; sw.dataset.val = val; sw.querySelector(".swatch-chip > span").style.background = val; sw.querySelector(".swatch-val").textContent = val; upd();
  }));
  wrap.querySelector(".cp-scrim").addEventListener("click", closeOutlineEditor);
  wrap.querySelector(".cp-done").addEventListener("click", closeOutlineEditor);
  upd();
}

/* Reusable Scale popup — sets `${prefix}-sx` / `${prefix}-sy` on the candidate.
 * Used for the whole component and each section (the group's `scale` prefix).
 * Lock mirrors X/Y both on edit and on reset. */
const SCALES = {};
function closeScaleEditor() { app.querySelector(".scaleed")?.remove(); }
function openScaleEditor(prefix, applyVar) {
  closeScaleEditor();
  const st = SCALES[prefix] || (SCALES[prefix] = { sx: 1, sy: 1, lock: true });
  const row = (label, key) =>
    `<div class="ctl"><span class="ctl-l">${label}</span><div class="step" data-skey="${key}" data-min="0.3" data-max="3" data-unit=""><button class="step-btn big" data-d="-0.05">«</button><button class="step-btn" data-d="-0.01">‹</button><input class="step-val" type="text" inputmode="decimal" value="${st[key]}"><button class="step-btn" data-d="0.01">›</button><button class="step-btn big" data-d="0.05">»</button></div><button class="ctl-reset" data-skreset="${key}" aria-label="Reset">${ICON.reset}</button></div>`;
  const wrap = document.createElement("div");
  wrap.className = "shed scaleed";
  wrap.innerHTML = `
    <div class="cp-scrim"></div>
    <div class="cp-sheet">
      <div class="cp-head"><span>Scale</span><button class="cp-done">Done</button></div>
      ${row("Scale X", "sx")}
      ${row("Scale Y", "sy")}
      <div class="ctl"><span class="ctl-l">Lock aspect</span><input type="checkbox" class="scale-lock"${st.lock ? " checked" : ""}></div>
    </div>`;
  app.appendChild(wrap); placeSheet(wrap);
  const lock = wrap.querySelector(".scale-lock");
  const steps = { sx: wrap.querySelector('.step[data-skey="sx"]'), sy: wrap.querySelector('.step[data-skey="sy"]') };
  const setField = (key, n) => { steps[key].querySelector(".step-val").value = n; st[key] = n; applyVar(prefix + "-" + key, n); };
  const onVal = (key) => (n) => { setField(key, n); if (lock.checked) setField(key === "sx" ? "sy" : "sx", n); };
  attachStepper(steps.sx, onVal("sx"));
  attachStepper(steps.sy, onVal("sy"));
  wrap.querySelectorAll("[data-skreset]").forEach((btn) => btn.addEventListener("click", () => onVal(btn.dataset.skreset)(1)));
  lock.addEventListener("change", () => { st.lock = lock.checked; if (lock.checked) onVal("sx")(st.sx); });
  wrap.querySelector(".cp-scrim").addEventListener("click", closeScaleEditor);
  wrap.querySelector(".cp-done").addEventListener("click", closeScaleEditor);
}
/* Brand swatches shown in the colour picker (current :root values, else these). */
const BRAND_COL = [
  { k: "--gold-1", val: "#f0c469", label: "Gold 1" },
  { k: "--gold-2", val: "#c98f30", label: "Gold 2" },
  { k: "--teal-1", val: "#4fd0c8", label: "Teal 1" },
  { k: "--teal-2", val: "#2c97a8", label: "Teal 2" },
];
function closeColorPicker() { app.querySelector(".cp")?.remove(); }
function openColorPicker(initial, onChange) {
  closeColorPicker();
  const model = parseValue(initial);
  let mode = model.mode;          // "solid" | "grad"
  const grad = model.grad;        // { type, angle, off, stops:[{color,pos}] }
  let active = 0;                 // index of the gradient stop being edited
  let r, g, b, a, h, s, v;
  const wrap = document.createElement("div");
  wrap.className = "cp";
  wrap.innerHTML = `
    <div class="cp-scrim"></div>
    <div class="cp-sheet">
      <div class="cp-head"><span>Colour</span><button class="cp-done">Done</button></div>
      <label class="cp-grad-tog"><input class="cp-grad-on" type="checkbox"> Gradient</label>
      <div class="cp-grad hidden">
        <div class="cp-grad-prev"><div class="cp-grad-marks"></div></div>
        <div class="cp-stops"></div>
        <div class="cp-grow">
          <span>Stops</span>
          <div class="cp-seg" data-seg="count">
            <button data-n="2">2</button><button data-n="3">3</button><button data-n="4">4</button>
          </div>
        </div>
        <div class="cp-grow">
          <span>Type</span>
          <div class="cp-seg" data-seg="type">
            <button data-t="linear">Linear</button><button data-t="radial">Radial</button>
          </div>
        </div>
        <div class="cp-grow cp-grow-angle"><span class="cp-anglab">Angle°</span>
          <input class="cp-angle" type="range" min="0" max="360" step="1"><span class="cp-val cp-angle-v"></span></div>
        <div class="cp-grow cp-grow-cy hidden"><span>Centre Y %</span>
          <input class="cp-offy" type="range" min="0" max="100" step="1"><span class="cp-val cp-offy-v"></span></div>
        <div class="cp-grow"><span>Stop offset %</span>
          <input class="cp-stoppos" type="range" min="0" max="100" step="1"><span class="cp-val cp-stoppos-v"></span></div>
      </div>
      <div class="cp-sv"><div class="cp-sv-thumb"></div></div>
      <div class="cp-row"><span>Hue</span><input class="cp-hue" type="range" min="0" max="360" step="1"></div>
      <div class="cp-row"><span>Sat</span><input class="cp-sat" type="range" min="0" max="100" step="1"></div>
      <div class="cp-row"><span>Bright</span><input class="cp-bri" type="range" min="0" max="100" step="1"></div>
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
  placeSheet(wrap);
  const $ = (s) => wrap.querySelector(s);
  const sv = $(".cp-sv"), thumb = $(".cp-sv-thumb"), hue = $(".cp-hue"), alpha = $(".cp-alpha");
  const sat = $(".cp-sat"), bri = $(".cp-bri");
  const hex = $(".cp-hex"), Ri = $(".cp-r"), Gi = $(".cp-g"), Bi = $(".cp-b"), Ai = $(".cp-a");
  const gradBox = $(".cp-grad"), gradOn = $(".cp-grad-on");

  // load a colour string into the HSV editor state
  function loadColor(str) { const c = parseColor(str); a = c.a; const hsv = rgbToHsv(c.r, c.g, c.b); h = hsv.h; s = hsv.s; v = hsv.v; }
  loadColor(mode === "grad" ? grad.stops[active].color : model.color);

  function emit() { onChange(mode === "grad" ? gradCss(grad) : colorStr(r, g, b, a)); }

  function paintMarks() {
    // Small circle per stop along the preview; the active one filled/highlighted.
    $(".cp-grad-marks").innerHTML = grad.stops.map((st, i) =>
      `<span class="cp-mark ${i === active ? "on" : ""}" style="left:${Math.round(st.pos)}%;--mk:${st.color}"></span>`).join("");
  }
  function paintGradUI() {
    gradBox.classList.toggle("hidden", mode !== "grad");
    gradOn.checked = mode === "grad";
    if (mode !== "grad") return;
    $(".cp-grad-prev").style.background = gradCss(grad);
    $(".cp-stops").innerHTML = grad.stops.map((st, i) =>
      `<button class="cp-stop ${i === active ? "on" : ""}" data-i="${i}" style="background:${st.color}"></button>`).join("");
    $(".cp-stops").querySelectorAll(".cp-stop").forEach((bt) => bt.addEventListener("click", () => {
      active = +bt.dataset.i; loadColor(grad.stops[active].color); render(false); paintGradUI();
    }));
    wrap.querySelectorAll('[data-seg="count"] button').forEach((bt) => bt.classList.toggle("on", +bt.dataset.n === grad.stops.length));
    wrap.querySelectorAll('[data-seg="type"] button').forEach((bt) => bt.classList.toggle("on", bt.dataset.t === grad.type));
    const isRadial = grad.type === "radial";
    const angLab = $(".cp-anglab"), ang = $(".cp-angle");
    angLab.textContent = isRadial ? "Centre X %" : "Angle°";
    ang.value = isRadial ? grad.off : grad.angle;
    $(".cp-angle-v").textContent = isRadial ? Math.round(grad.off) + "%" : Math.round(grad.angle) + "°";
    $(".cp-grow-cy").classList.toggle("hidden", !isRadial);
    if (grad.offY == null) grad.offY = 50;
    $(".cp-offy").value = Math.round(grad.offY);
    $(".cp-offy-v").textContent = Math.round(grad.offY) + "%";
    $(".cp-stoppos").value = Math.round(grad.stops[active].pos);
    $(".cp-stoppos-v").textContent = Math.round(grad.stops[active].pos) + "%";
    paintMarks();
  }

  function render(emitNow = true) {
    const rgb = hsvToRgb(h, s, v); r = rgb.r; g = rgb.g; b = rgb.b;
    const hx = rgbToHex(r, g, b);
    sv.style.setProperty("--cp-hue", `hsl(${h} 100% 50%)`);
    thumb.style.left = (s * 100) + "%"; thumb.style.top = ((1 - v) * 100) + "%"; thumb.style.background = hx;
    hue.value = Math.round(h); alpha.value = Math.round(a * 100);
    sat.value = Math.round(s * 100); bri.value = Math.round(v * 100);
    alpha.style.setProperty("--cp-solid", hx);
    hex.value = hx; Ri.value = Math.round(r); Gi.value = Math.round(g); Bi.value = Math.round(b); Ai.value = Math.round(a * 100);
    if (mode === "grad") { grad.stops[active].color = colorStr(r, g, b, a); $(".cp-grad-prev").style.background = gradCss(grad); const sb = $(`.cp-stop[data-i="${active}"]`); if (sb) sb.style.background = grad.stops[active].color; const mk = $(`.cp-mark.on`); if (mk) mk.style.setProperty("--mk", grad.stops[active].color); }
    if (emitNow) emit();
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
  sat.addEventListener("input", () => { s = +sat.value / 100; render(); });
  bri.addEventListener("input", () => { v = +bri.value / 100; render(); });
  alpha.addEventListener("input", () => { a = +alpha.value / 100; render(); });
  hex.addEventListener("change", () => { loadColor(hex.value); render(); });
  [Ri, Gi, Bi].forEach((i) => i.addEventListener("input", fromRgb));
  Ai.addEventListener("input", () => { a = Math.max(0, Math.min(100, +Ai.value || 0)) / 100; render(); });

  // gradient toggle + controls
  gradOn.addEventListener("change", () => {
    mode = gradOn.checked ? "grad" : "solid";
    if (mode === "grad") { grad.stops[0].color = colorStr(r, g, b, a); active = 0; loadColor(grad.stops[0].color); }
    else loadColor(grad.stops[active].color);
    paintGradUI(); render();
  });
  wrap.querySelector('[data-seg="count"]').addEventListener("click", (e) => {
    const bt = e.target.closest("button"); if (!bt) return;
    const n = +bt.dataset.n, cur = grad.stops.length;
    if (n > cur) for (let i = cur; i < n; i++) grad.stops.push({ color: grad.stops[grad.stops.length - 1].color, pos: Math.round((i / (n - 1)) * 100) });
    else grad.stops.length = n;
    grad.stops.forEach((st, i) => (st.pos = Math.round((i / (n - 1)) * 100)));
    if (active >= n) active = n - 1;
    loadColor(grad.stops[active].color); paintGradUI(); render();
  });
  wrap.querySelector('[data-seg="type"]').addEventListener("click", (e) => {
    const bt = e.target.closest("button"); if (!bt) return;
    grad.type = bt.dataset.t; paintGradUI(); render();
  });
  $(".cp-angle").addEventListener("input", (e) => { const val = +e.target.value; if (grad.type === "radial") { grad.off = val; $(".cp-angle-v").textContent = val + "%"; } else { grad.angle = val; $(".cp-angle-v").textContent = val + "°"; } $(".cp-grad-prev").style.background = gradCss(grad); emit(); });
  $(".cp-offy").addEventListener("input", (e) => { grad.offY = +e.target.value; $(".cp-offy-v").textContent = grad.offY + "%"; $(".cp-grad-prev").style.background = gradCss(grad); emit(); });
  $(".cp-stoppos").addEventListener("input", (e) => { grad.stops[active].pos = +e.target.value; $(".cp-stoppos-v").textContent = e.target.value + "%"; paintMarks(); $(".cp-grad-prev").style.background = gradCss(grad); emit(); });

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
      panel.querySelectorAll(".cp-bsw").forEach((sw) => sw.addEventListener("click", () => { loadColor(sw.dataset.c); render(); }));
      panel.dataset.built = "1";
    }
  });
  $(".cp-scrim").addEventListener("click", closeColorPicker);
  $(".cp-done").addEventListener("click", closeColorPicker);
  paintGradUI(); render(false);
}

/* ---- Studio hub ---- */
const STUDIO_COMPONENTS = [
  { id: "home", name: "Homepage", desc: "Backdrop, top blend, type + spacing",
    thumb: `<span class="sc-thumb" style="background:linear-gradient(180deg,#171726,#0c0d14)"></span>` },
  { id: "logo", name: "Logo", desc: "Wordmark — fill, size, outline, shadow",
    thumb: `<span class="sc-thumb sc-thumb-logo"></span>` },
  { id: "poster", name: "Poster Card", desc: "List poster + score badge",
    thumb: `<span class="sc-thumb" style="background:url('assets/poor-things-poster.webp') center/cover"></span>` },
  { id: "tab", name: "Active Tab", desc: "Selected category tab",
    thumb: `<span class="sc-thumb sc-thumb-pad"><img src="assets/icons/movie.svg" alt=""></span>` },
  { id: "tab-idle", name: "Idle Tab", desc: "Resting tab (no selection yet)",
    thumb: `<span class="sc-thumb sc-thumb-pad"><img src="assets/icons/tv.svg" alt=""></span>` },
  { id: "tab-dim", name: "Inactive Tab", desc: "Faded tab (while another is active)",
    thumb: `<span class="sc-thumb sc-thumb-pad" style="opacity:.5"><img src="assets/icons/game.svg" alt=""></span>` },
  { id: "brand", name: "Brand Tokens", desc: "Site-wide colours",
    thumb: `<span class="sc-thumb sc-thumb-brand"><i style="background:#f0c469"></i><i style="background:#c98f30"></i><i style="background:#4fd0c8"></i><i style="background:#2c97a8"></i></span>` },
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
              ${c.thumb || ""}
              <span class="sc-text">
                <span class="sc-name">${c.name}</span>
                <span class="sc-desc">${c.desc}</span>
              </span>
            </a>`).join("")}
        </div>
      </div>
      ${toolbox()}
    </div>`;
  wireHeader(app);
}

/* PosterCard editor: the whole list item (poster + score badge). */
function posterGroups() {
  return [
    { name: "Poster card", scale: "--pc", items: [
      { k: "--pc-radius", label: "Corner radius", type: "radius", val: 8, step: 1, min: 0 },
      { k: "--pc-bw", label: "Border width", val: 1, step: 0.5, min: 0 },
      { k: "--pc-bc", label: "Border colour", type: "color", val: "#f0c469" },
      { k: "--pc-shadow", label: "Drop shadow", type: "shadow" },
    ] },
    { name: "Score chip", scale: "--b-chip", items: [
      { k: "--b-inset", label: "Corner inset", val: 1, step: 1, min: 0 },
      { k: "--b-pad", label: "Padding", val: 3, step: 1, min: 0 },
      { k: "--b-gap", label: "Tile–label gap", val: 4, step: 1, min: 0 },
      { k: "--b-chipr", label: "Chip radius", type: "radius", val: 8, step: 1, min: 0 },
      { k: "--b-chip", label: "Chip fill", type: "color", val: "rgba(11,13,19,0.62)" },
      { k: "--b-shadow", label: "Chip shadow", type: "shadow" },
    ] },
    { name: "Score tile", scale: "--b-tile", items: [
      { k: "--b-sq", label: "Square size", val: 20, step: 1, min: 6 },
      { k: "--b-numfs", label: "Number font size", val: 12, step: 1, min: 6 },
      { k: "--b-numff", label: "Number typeface", type: "select", val: "var(--font-display)" },
      { k: "--b-numls", label: "Number spacing", val: 0, step: 0.5, min: -5 },
      { k: "--b-tiler", label: "Tile radius", type: "radius", val: 6, step: 1, min: 0 },
      { k: "--b-gold", label: "Tile gold", type: "color", val: "#f0c469" },
    ] },
    { name: "Label", scale: "--b-lab", items: [
      { k: "--b-labfs", label: "Label font size", val: 8, step: 0.5, min: 5 },
      { k: "--b-labff", label: "Label typeface", type: "select", val: "var(--font-display)" },
      { k: "--b-labls", label: "Label spacing", val: 0, step: 0.5, min: -5 },
      { k: "--b-lab", label: "Label colour", type: "color", val: "#f0c469" },
    ] },
    { name: "Title", scale: "--li", items: [
      { k: "--li-title-fs", label: "Title font size", val: 13, step: 0.5, min: 6 },
      { k: "--li-title-ff", label: "Title typeface", type: "select", val: "var(--font)" },
      { k: "--li-title-w", label: "Title weight", val: 600, step: 100, min: 100, max: 900, unit: "" },
      { k: "--li-title-col", label: "Title colour", type: "color", val: "#f3f4f8" },
      { k: "--li-year-fs", label: "Year font size", val: 11, step: 0.5, min: 6 },
      { k: "--li-year-col", label: "Year colour", type: "color", val: "#9aa1b0" },
    ] },
  ];
}
/* Tap-to-inspect: a popup with an enlarged copy of a component. The clone keeps
 * the source's exact pixel size (so its ratio never changes), then is scaled to
 * fit; +/- buttons, pinch, and drag let you zoom and pan around it. */
function openInspect(srcSel) {
  const src = app.querySelector(srcSel); if (!src) return;
  const cw = src.offsetWidth || 88, ch = src.offsetHeight || 132;
  const ov = document.createElement("div");
  ov.className = "inspect";
  ov.innerHTML = `
    <div class="inspect-scrim"></div>
    <div class="inspect-stage"><div class="inspect-pan"></div></div>
    <div class="inspect-zoom">
      <button class="iz-btn" data-zin aria-label="Zoom in">+</button>
      <button class="iz-btn" data-zout aria-label="Zoom out">−</button>
    </div>
    <button class="inspect-x" aria-label="Close">${ICON.close}</button>`;
  const clone = src.cloneNode(true); clone.removeAttribute("id");
  clone.style.width = cw + "px"; clone.style.height = ch + "px"; clone.style.flex = "none"; clone.style.margin = "0";
  const pan = ov.querySelector(".inspect-pan");
  pan.style.width = cw + "px"; pan.style.height = ch + "px";
  pan.appendChild(clone);
  app.appendChild(ov);

  const fit = Math.min((app.clientWidth * 0.92) / cw, (app.clientHeight * 0.78) / ch);
  const S = { z: fit, x: 0, y: 0 };
  const clampZ = (z) => Math.max(fit * 0.5, Math.min(fit * 8, z));
  const apply = () => { pan.style.transform = `translate(${S.x}px, ${S.y}px) scale(${S.z})`; };
  apply();

  const stage = ov.querySelector(".inspect-stage");
  ov.querySelector("[data-zin]").addEventListener("click", (e) => { e.stopPropagation(); S.z = clampZ(S.z * 1.25); apply(); });
  ov.querySelector("[data-zout]").addEventListener("click", (e) => { e.stopPropagation(); S.z = clampZ(S.z / 1.25); apply(); });

  const ptrs = new Map(); let pinch = null, drag = null, moved = false;
  stage.addEventListener("pointerdown", (e) => {
    stage.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = false;
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: S.z }; drag = null; }
    else drag = { x: e.clientX, y: e.clientY, ox: S.x, oy: S.y };
  });
  stage.addEventListener("pointermove", (e) => {
    if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size >= 2) { const [a, b] = [...ptrs.values()]; S.z = clampZ(pinch.z * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d)); moved = true; apply(); }
    else if (drag && ptrs.size === 1) { S.x = drag.ox + (e.clientX - drag.x); S.y = drag.oy + (e.clientY - drag.y); if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4) moved = true; apply(); }
  });
  const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (ptrs.size === 0) drag = null; };
  stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);

  const close = () => ov.remove();
  stage.addEventListener("click", (e) => { if (e.target === stage && !moved) close(); });
  ov.querySelector(".inspect-x").addEventListener("click", close);
}

/* Prev/Next arrows that flank the Before/After stage, + a wiring helper that
 * cycles an index through a fixed length in either direction. */
function cycleArrows() {
  return `<button class="cyc-btn cyc-prev" data-prev aria-label="Previous example">${ICON.back}</button>
          <button class="cyc-btn cyc-next" data-next aria-label="Next example">${ICON.next}</button>`;
}
function wireCycle(len, start, onIdx) {
  let i = ((start % len) + len) % len;
  const go = (d) => { i = (i + d + len) % len; onIdx(i); };
  app.querySelector("[data-prev]").addEventListener("click", () => go(-1));
  app.querySelector("[data-next]").addEventListener("click", () => go(1));
}

/* ---- Studio: Homepage (landing backdrop, top blend + type & spacing) ---- */
const TOP_MODE_OPTS = [{ v: "0", l: "Colour fill" }, { v: "1", l: "Mirror" }];
function homeGroups() {
  return [
    { name: "Background", items: [
      { k: "--home-blur", label: "Backdrop blur", val: 5, step: 1, min: 0, max: 80 },
      { k: "--home-fade-col", label: "Base colour", type: "color", val: "#0f0f1a" },
      { k: "--home-fade-soft", label: "Image top offset", val: 35, step: 1, min: 0, max: 95, unit: "" },
    ] },
    { name: "Top blend", items: [
      { k: "--home-top-mode", label: "Top extension", type: "select", val: "0", opts: TOP_MODE_OPTS },
      { k: "--home-fill-col", label: "Fill colour", type: "color", val: "#0f0f1a" },
      { k: "--home-seam", label: "Seam feather", val: 48, step: 1, min: 0, max: 400 },
      { k: "--home-mirror-h", label: "Mirror height", val: 220, step: 2, min: 0, max: 600 },
      { k: "--home-mirror-blur", label: "Mirror blur", val: 18, step: 1, min: 0, max: 80 },
      { k: "--home-mirror-op", label: "Mirror strength", val: 85, step: 1, min: 0, max: 100, unit: "" },
    ] },
    { name: "Logo", items: [
      { k: "--home-logo-gap-top", label: "Space above logo", val: 16, step: 1, min: 0 },
      { k: "--home-logo-gap-bot", label: "Space below logo", val: 0, step: 1, min: 0 },
    ] },
    { name: "Tagline", items: [
      { k: "--home-tag-size", label: "Tagline size", val: 13, step: 0.5, min: 6 },
      { k: "--home-tag-col", label: "Tagline colour", type: "color", val: "#9aa1b0" },
      { k: "--home-tag-gap", label: "Tagline spacing", val: 10, step: 1, min: 0 },
      { k: "--home-tag-text", label: "Tagline wording", type: "text", val: BRAND.tagline },
    ] },
    { name: "Prompt", items: [
      { k: "--home-prompt-size", label: "Prompt size", val: 13, step: 0.5, min: 6 },
      { k: "--home-prompt-col", label: "Prompt colour", type: "color", val: "#9aa1b0" },
      { k: "--home-prompt-gap-top", label: "Space above prompt", val: 35, step: 1, min: 0 },
      { k: "--home-prompt-gap-bot", label: "Space below prompt", val: 12, step: 1, min: 0 },
      { k: "--home-prompt-text", label: "Prompt wording", type: "text", val: "What are you looking for?" },
    ] },
    { name: "Spacing", items: [
      { k: "--home-tabs-gap", label: "Tabs spacing", val: 8, step: 1, min: 0 },
      { k: "--home-search-gap", label: "Search spacing", val: 0, step: 1, min: 0 },
      { k: "--home-lists-gap", label: "Lists spacing", val: 16, step: 1, min: 0 },
    ] },
  ];
}
/* A fully-populated, static snapshot of the landing page for the preview frame.
 * Mirrors renderLanding's structure/classes so the live CSS (and the editable
 * tokens) apply 1:1. */
function homePreviewHTML(bg, art) {
  const tabs = CATEGORIES.map((c) => `<button class="tab" tabindex="-1"><span class="tab-icon">${catIconSvg(c.id)}</span><span class="tab-label">${c.plural}</span></button>`).join("");
  const lists = `<div class="section-title">Popular Right Now</div>
    <div class="lists cards layout-horizontal">
      ${listColumn("Movies", rankBy(itemsByCategory("movie"), "synth"), true)}
      ${listColumn("Shows", rankBy(itemsByCategory("tv"), "synth"))}
      ${listColumn("Games", rankBy(itemsByCategory("game"), "synth"))}
      ${listColumn("Books", rankBy(itemsByCategory("book"), "synth"))}
    </div>`;
  return `
    <div class="home-bg" style="background:${bg}"></div>
    <div class="home-fill"></div>
    <div class="home-mirror"${art ? ` style="background-image:url('${art}')"` : ""}></div>
    <div class="home-scrim"></div>
    <div class="landing">
      <div class="landing-head">${logo()}<div class="tagline">${BRAND.tagline}</div></div>
      <div class="prompt">What are you looking for?</div>
      <div class="tabs">${tabs}</div>
      <div class="searchbar-wrap">
        <div class="searchbar"><div class="search-field">
          <span class="search-ic">${ICON.search}</span>
          <input type="search" placeholder="Search ${BRAND.name.toLowerCase()}…" tabindex="-1" disabled />
        </div></div>
      </div>
      ${lists}
    </div>`;
}
function renderStudioHomepage() {
  const groups = homeGroups();
  const arts = CATALOG.filter((i) => i.category !== "book" && backdropArt(i));
  const item = arts[Math.floor(Math.random() * arts.length)] || CATALOG[0];
  const bg = backdropBg(item), art = backdropArt(item);
  const initStyle = studioInitStyle(groups);
  const mini = (id, style) => `<div class="home-frame"><div class="home-mini" id="${id}"${style ? ` style="${style}"` : ""}>${homePreviewHTML(bg, art)}</div></div>`;
  app.innerHTML = `
    <div class="screen studio">
      <div class="scroll">
        <div class="studio-head">
          <button class="icon-btn" data-back aria-label="Back">${ICON.back}</button>
          <h1>Homepage</h1>
        </div>
        <div class="st-stage st-compare st-home">
          <figure class="st-cmp">${mini("cur", "")}<figcaption>Before <button class="inspect-btn" data-inspect="#cur" aria-label="Inspect (zoom)">${ICON.zoom}</button></figcaption></figure>
          <figure class="st-cmp">${mini("cand", initStyle)}<figcaption>After <button class="inspect-btn" data-inspect="#cand" aria-label="Inspect (zoom)">${ICON.zoom}</button></figcaption></figure>
        </div>
        <div id="st-controls-root">${groups.map((g, i) => groupHTML(g, i === 0)).join("")}</div>
        <section class="st-sec">
          <h2>Export</h2>
          <button class="st-export" id="st-export">Copy values for Claude</button>
          <textarea class="st-out" id="st-out" readonly rows="8" placeholder="Values appear here…"></textarea>
        </section>
      </div>
      ${toolbox()}
    </div>`;
  const cand = app.querySelector("#cand");
  const applyVar = (v, val) => cand.style.setProperty(v, val);
  // Live-edit the tagline / prompt wording in the After mini.
  const onText = (key, val) => {
    const sel = key === "--home-tag-text" ? ".tagline" : key === "--home-prompt-text" ? ".prompt" : null;
    const node = sel && cand.querySelector(sel); if (node) node.textContent = val;
  };
  // Both minis show the sampled top-strip fill (so Before/After match the live look).
  paintTopFill(app.querySelector("#cur"), art);
  paintTopFill(cand, art);
  wireGroupControls(app.querySelector("#st-controls-root"), applyVar, onText);
  app.querySelectorAll("[data-inspect]").forEach((b) => b.addEventListener("click", () => openInspect(b.dataset.inspect)));
  app.querySelector("#st-export").addEventListener("click", () => {
    const text = JSON.stringify({ Homepage: readGroupValues(groups) }, null, 2);
    app.querySelector("#st-out").value = text;
    navigator.clipboard?.writeText(text).catch(() => {});
    const btn = app.querySelector("#st-export");
    btn.textContent = "Copied ✓ — paste it in chat";
    setTimeout(() => (btn.textContent = "Copy values for Claude"), 2200);
  });
  wireHeader(app);
}

/* ---- Studio: Logo (wordmark — fully customisable, header + front-page) ---- */
const LOGO_GOLD = "linear-gradient(180deg, #fdecc0 0%, #f4cf72 32%, #e3ad44 55%, #b9791f 100%)";
const LOGO_TARGETS = { fp: { name: "Front page", size: 54 }, hd: { name: "Header", size: 30 } };
function logoGroups(t) {
  const size = LOGO_TARGETS[t].size;
  return [
    { name: "Logo", items: [
      { k: `--logo-${t}-size`, label: "Size", val: size, step: 4, fine: 1, min: 8, max: 200 },
      { k: `--logo-${t}-fill`, label: "Fill", type: "color", val: LOGO_GOLD },
      { k: `--logo-${t}-op`, label: "Opacity", val: 1, step: 0.1, fine: 0.05, min: 0, max: 1, unit: "" },
      { k: `--logo-${t}-rot`, label: "Rotation", val: 0, step: 5, fine: 1, min: -180, max: 180, unit: "deg" },
      { k: `--logo-${t}-shadow`, label: "Drop shadow", type: "shadow", def: "3px 4px 2px rgba(0,0,0,0.65)" },
    ] },
    { name: "Outline", items: [
      { k: `--logo-${t}-outline`, label: "Outline (width + colour)", type: "outline" },
    ] },
  ];
}
function renderStudioLogo(target) {
  const t = LOGO_TARGETS[target] ? target : "fp";
  const groups = logoGroups(t);
  const initStyle = studioInitStyle(groups);
  const seg = (id, label) => `<a class="st-seg ${id === t ? "on" : ""}" href="#/studio/logo${id === "hd" ? "-header" : ""}">${label}</a>`;
  const prev = (id, style) => `<div class="logo-prev"><div class="logo-scope-${t}" id="${id}"${style ? ` style="${style}"` : ""}><span class="wordmark"><span class="logo" role="img" aria-label="${BRAND.name}"></span></span></div></div>`;
  app.innerHTML = `
    <div class="screen studio">
      <div class="scroll">
        <div class="studio-head">
          <button class="icon-btn" data-back aria-label="Back">${ICON.back}</button>
          <h1>Logo</h1>
        </div>
        <div class="st-segs">${seg("fp", "Front page")}${seg("hd", "Header")}</div>
        <div class="st-stage st-compare">
          <figure class="st-cmp">${prev("cur", "")}<figcaption>Before <button class="inspect-btn" data-inspect="#cur" aria-label="Inspect (zoom)">${ICON.zoom}</button></figcaption></figure>
          <figure class="st-cmp">${prev("cand", initStyle)}<figcaption>After <button class="inspect-btn" data-inspect="#cand" aria-label="Inspect (zoom)">${ICON.zoom}</button></figcaption></figure>
        </div>
        <div id="st-controls-root">${groups.map((g, i) => groupHTML(g, i === 0)).join("")}</div>
        <section class="st-sec">
          <h2>Export</h2>
          <button class="st-export" id="st-export">Copy values for Claude</button>
          <textarea class="st-out" id="st-out" readonly rows="8" placeholder="Values appear here…"></textarea>
        </section>
      </div>
      ${toolbox()}
    </div>`;
  const cand = app.querySelector("#cand");
  const applyVar = (v, val) => cand.style.setProperty(v, val);
  wireGroupControls(app.querySelector("#st-controls-root"), applyVar);
  app.querySelectorAll("[data-inspect]").forEach((b) => b.addEventListener("click", () => openInspect(b.dataset.inspect)));
  app.querySelector("#st-export").addEventListener("click", () => {
    const text = JSON.stringify({ [`Logo (${LOGO_TARGETS[t].name})`]: readGroupValues(groups) }, null, 2);
    app.querySelector("#st-out").value = text;
    navigator.clipboard?.writeText(text).catch(() => {});
    const btn = app.querySelector("#st-export");
    btn.textContent = "Copied ✓ — paste it in chat";
    setTimeout(() => (btn.textContent = "Copy values for Claude"), 2200);
  });
  wireHeader(app);
}

function renderStudioPoster() {
  const sample = getItem("poor-things") || CATALOG[0];
  const sc = scoreItem(sample);
  const groups = posterGroups();
  const init = [];
  groups.forEach((g) => g.items.forEach((it) => {
    if (it.type === "color" || it.type === "select") init.push(`${it.k}:${it.val}`);
    else if (it.type !== "shadow") init.push(`${it.k}:${it.val}px`);
  }));
  const initStyle = init.join(";");
  const curBadge = `<span class="score-badge"><span class="sb-num">${sc.synth ?? "—"}</span><span class="sb-lab"><span>Critikl</span><span>Score</span></span></span>`;
  const candBadge = `<span class="sb2"><span class="sb2-num">${sc.synth ?? "—"}</span><span class="sb2-lab"><span>Critikl</span><span>Score</span></span></span>`;
  const titleText = (it) => `<div class="li-text"><span class="li-title">${it.title}</span><span class="li-year">${it.year}</span></div>`;
  app.innerHTML = `
    <div class="screen studio">
      <div class="scroll">
        <div class="studio-head">
          <button class="icon-btn" data-back aria-label="Back">${ICON.back}</button>
          <h1>PosterCard</h1>
        </div>
        <div class="st-stage st-compare">
          ${cycleArrows()}
          <figure class="st-cmp"><div class="li2" id="cur"><div class="pc2" style="background:${posterBg(sample)}">${curBadge}</div>${titleText(sample)}</div><figcaption>Before <button class="inspect-btn" data-inspect="#cur" aria-label="Inspect (zoom)">${ICON.zoom}</button></figcaption></figure>
          <figure class="st-cmp">
            <div class="li2" id="cand" style="${initStyle}"><div class="pc2" style="background:${posterBg(sample)}">${candBadge}</div>${titleText(sample)}</div>
            <figcaption>After <button class="inspect-btn" data-inspect="#cand" aria-label="Inspect (zoom)">${ICON.zoom}</button></figcaption>
          </figure>
        </div>
        <div id="st-controls-root">${groups.map((g, i) => groupHTML(g, i === 0)).join("")}</div>
        <section class="st-sec">
          <h2>Export</h2>
          <button class="st-export" id="st-export">Copy values for Claude</button>
          <textarea class="st-out" id="st-out" readonly rows="10" placeholder="Values appear here…"></textarea>
        </section>
      </div>
      ${toolbox()}
    </div>`;

  const cands = [app.querySelector("#cand")].filter(Boolean);
  const applyVar = (v, val) => cands.forEach((el) => el.style.setProperty(v, val));
  wireGroupControls(app.querySelector("#st-controls-root"), applyVar);
  app.querySelectorAll("[data-inspect]").forEach((b) => b.addEventListener("click", () => openInspect(b.dataset.inspect)));
  wireCycle(CATALOG.length, Math.max(0, CATALOG.indexOf(sample)), (i) => {
    const it = CATALOG[i], num = scoreItem(it).synth ?? "—", bg = posterBg(it);
    ["#cur", "#cand"].forEach((sel) => {
      const el = app.querySelector(sel); if (!el) return;
      const pc = el.querySelector(".pc2"); if (pc) pc.style.background = bg;
      el.querySelectorAll(".sb-num, .sb2-num").forEach((n) => (n.textContent = num));
      const t = el.querySelector(".li-title"); if (t) t.textContent = it.title;
      const y = el.querySelector(".li-year"); if (y) y.textContent = it.year;
    });
  });

  app.querySelector("#st-export").addEventListener("click", () => {
    const text = JSON.stringify({ PosterCard: readGroupValues(groups) }, null, 2);
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
        <div id="st-controls-root">${groupHTML(group, true)}</div>
        <section class="st-sec">
          <h2>Export</h2>
          <button class="st-export" id="st-export">Copy values for Claude</button>
          <textarea class="st-out" id="st-out" readonly rows="7" placeholder="Values appear here…"></textarea>
        </section>
      </div>
      ${toolbox()}
    </div>`;
  const applyVar = (v, val) => document.documentElement.style.setProperty(v, val);
  wireGroupControls(app.querySelector("#st-controls-root"), applyVar);
  app.querySelector("#st-export").addEventListener("click", () => {
    const text = JSON.stringify({ Brand: readGroupValues([group]) }, null, 2);
    app.querySelector("#st-out").value = text;
    navigator.clipboard?.writeText(text).catch(() => {});
    const btn = app.querySelector("#st-export");
    btn.textContent = "Copied ✓ — paste it in chat";
    setTimeout(() => (btn.textContent = "Copy values for Claude"), 2200);
  });
  wireHeader(app);
}

/* ---- Studio: Tab states (Active / Idle / Inactive) ---------------------------
 * One editor per state. Shared layout tokens (--tab-radius/pad/gap/icon-size/
 * label-size) sit alongside that state's own visual tokens (--tab-<state>-*). */
const GOLD_GRAD = "linear-gradient(122deg, #fff0cf 0%, #dfb24b 33%, #fff8ee 67%, #634515 100%)";
const FAINT_GOLD = "linear-gradient(160deg, rgba(243,205,118,0.55), rgba(140,100,40,0.22))";
const DARK_FILL = "linear-gradient(180deg, #16161f, #0e0f16)";
const ICON_GOLD = "radial-gradient(circle at 38% 30%, #fff0cf, #f3cd76 45%, #dca63f 80%, #a9761f)";
const ACT_FILL = "radial-gradient(circle at 50% 50%, #222b35 0%, #222b35 56%, #161b1f 100%)";
const ACT_OUTLINE = "linear-gradient(164deg, #dfb24b 0%, #fff0cf 90%)";
const ACT_ICON = "radial-gradient(circle at 40% 50%, #f9e2a8 0%, #f9e2a8 11%, #d6a94f 79%)";
const TAB_STATES = {
  active: { title: "Active Tab", key: "ActiveTab", prefix: "act", cls: "tab active", sx: 1.04, sy: 1.04,
    d: { fill: ACT_FILL, bg: "transparent", outline: ACT_OUTLINE, outlineW: 1.5,
         icon: ACT_ICON, iconShadow: "0px -5px 15px rgba(206, 164, 81, 1.00)", label: "#ddb75d", labelShadow: "0px 0px 5px rgba(179, 102, 0, 0.55)" } },
  idle: { title: "Idle Tab", key: "IdleTab", prefix: "idle", cls: "tab", sx: 1, sy: 1,
    d: { fill: "transparent", bg: DARK_FILL, outline: FAINT_GOLD, outlineW: 1.5, icon: ICON_GOLD, iconShadow: "none", label: "#f0c469", labelShadow: "none" } },
  dim: { title: "Inactive Tab", key: "InactiveTab", prefix: "dim", cls: "tab is-dim", sx: 1, sy: 1,
    d: { fill: "#374a57", bg: "transparent", outline: "#2c3844", outlineW: 2.5, icon: "#1f2933", iconShadow: "none", label: "#1f2933", labelShadow: "none" } },
};
// Discrete icon-outline widths (feMorphology filters defined in index.html).
// Capped at radius 2 — beyond that the ring overwhelms the small icons.
const ICON_OL_OPTS = [
  { v: "none", l: "Off" },
  { v: "url(#io-05)", l: "Subtle" },
  { v: "url(#io-1)", l: "Medium" },
  { v: "url(#io-15)", l: "Bold" },
  { v: "url(#io-2)", l: "Heavy" },
];
function tabGroups(prefix, cfg) {
  const d = cfg.d;
  return [
    { name: "Layout", scale: `--tab-${prefix}`, items: [
      { k: "--tab-radius", label: "Corner radius", type: "radius", val: 15, step: 1, min: 0 },
      { k: "--tab-pad", label: "Vertical padding", val: 14, step: 1, min: 0 },
      { k: "--tab-gap", label: "Icon–label gap", val: 8, step: 1, min: 0 },
      { k: "--tab-icon-size", label: "Icon size", val: 40, step: 1, min: 12 },
      { k: "--tab-label-size", label: "Label size", val: 13, step: 0.5, min: 6 },
    ] },
    { name: "Tab", items: [
      { k: `--tab-${prefix}-fill`, label: "Fill", type: "color", val: d.fill, layer: true },
      { k: `--tab-${prefix}-bg`, label: "Background", type: "color", val: d.bg, layer: true },
      { k: `--tab-${prefix}-outline`, label: "Outline colour", type: "color", val: d.outline, layer: true },
      { k: `--tab-${prefix}-outline-w`, label: "Outline width", val: d.outlineW, step: 0.5, min: 0 },
      { k: `--tab-${prefix}-shadow`, label: "Shadow", type: "shadow" },
    ] },
    { name: "Icon", scale: `--tab-${prefix}-icon`, items: [
      { k: `--tab-${prefix}-icon`, label: "Icon colour", type: "color", val: d.icon },
      { k: `--tab-${prefix}-icon-ol-col`, label: "Icon outline", type: "color", val: "#ffffff" },
      { k: `--tab-${prefix}-icon-ol-filter`, label: "Icon outline width", type: "select", val: "none", opts: ICON_OL_OPTS },
      { k: `--tab-${prefix}-icon-shadow`, label: "Icon shadow", type: "shadow", def: d.iconShadow },
    ] },
    { name: "Label", scale: `--tab-${prefix}-label`, items: [
      { k: `--tab-${prefix}-label`, label: "Label colour", type: "color", val: d.label },
      { k: `--tab-${prefix}-label-shadow`, label: "Label shadow", type: "shadow", def: d.labelShadow },
    ] },
  ];
}
function renderStudioTab(state) {
  const cfg = TAB_STATES[state];
  const groups = tabGroups(cfg.prefix, cfg);
  const start = Math.max(0, CATEGORIES.findIndex((c) => c.id === "movie"));
  const tabHTML = (c, id) => `<div class="tabwrap"><button class="${cfg.cls}" id="${id}">
      <span class="tab-icon">${catIconSvg(c.id)}</span><span class="tab-label">${c.plural}</span></button></div>`;
  app.innerHTML = `
    <div class="screen studio">
      <div class="scroll">
        <div class="studio-head">
          <button class="icon-btn" data-back aria-label="Back">${ICON.back}</button>
          <h1>${cfg.title}</h1>
        </div>
        <div class="st-stage st-compare">
          ${cycleArrows()}
          <figure class="st-cmp">${tabHTML(CATEGORIES[start], "tabcur")}<figcaption>Before <button class="inspect-btn" data-inspect="#tabcur" aria-label="Inspect (zoom)">${ICON.zoom}</button></figcaption></figure>
          <figure class="st-cmp">${tabHTML(CATEGORIES[start], "tabcand")}<figcaption>After <button class="inspect-btn" data-inspect="#tabcand" aria-label="Inspect (zoom)">${ICON.zoom}</button></figcaption></figure>
        </div>
        <div id="st-controls-root">${groups.map((g, i) => groupHTML(g, i === 0)).join("")}</div>
        <section class="st-sec">
          <h2>Export</h2>
          <button class="st-export" id="st-export">Copy values for Claude</button>
          <textarea class="st-out" id="st-out" readonly rows="9" placeholder="Changed values appear here…"></textarea>
        </section>
      </div>
      ${toolbox()}
    </div>`;
  const cand = app.querySelector("#tabcand");
  const applyVar = (v, val) => cand.style.setProperty(v, val);
  wireGroupControls(app.querySelector("#st-controls-root"), applyVar);
  app.querySelectorAll("[data-inspect]").forEach((b) => b.addEventListener("click", () => openInspect(b.dataset.inspect)));
  wireCycle(CATEGORIES.length, start, (i) => {
    const c = CATEGORIES[i];
    ["#tabcur", "#tabcand"].forEach((sel) => {
      const el = app.querySelector(sel); if (!el) return;
      el.querySelector(".tab-icon").innerHTML = catIconSvg(c.id);
      el.querySelector(".tab-label").textContent = c.plural;
    });
  });
  app.querySelector("#st-export").addEventListener("click", () => {
    const text = JSON.stringify({ [cfg.key]: readGroupValues(groups) }, null, 2);
    app.querySelector("#st-out").value = text;
    navigator.clipboard?.writeText(text).catch(() => {});
    const btn = app.querySelector("#st-export");
    btn.textContent = "Copied ✓ — paste it in chat";
    setTimeout(() => (btn.textContent = "Copy values for Claude"), 2200);
  });
  wireHeader(app);
}
function route() {
  const hash = location.hash || "#/";
  if (hash === "#/studio") { renderStudioHome(); return; }
  if (hash === "#/studio/home") { renderStudioHomepage(); return; }
  if (hash === "#/studio/logo") { renderStudioLogo("fp"); return; }
  if (hash === "#/studio/logo-header") { renderStudioLogo("hd"); return; }
  if (hash === "#/studio/poster") { renderStudioPoster(); return; }
  if (hash === "#/studio/tab") { renderStudioTab("active"); return; }
  if (hash === "#/studio/tab-idle") { renderStudioTab("idle"); return; }
  if (hash === "#/studio/tab-dim") { renderStudioTab("dim"); return; }
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
// The zoom loupe lives in a persistent layer; after each navigation rebuild its
// mirror so it shows the new page while keeping its position/zoom.
function router() { route(); paintBookColors(); requestAnimationFrame(() => currentLoupe?.rebuild?.()); }

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
