# CRITIKL — project guide for Claude

## Project overview
CRITIKL is a mobile-first **entertainment-scores PWA** (movies / TV / games / books)
that normalises critic & user ratings to a 0–100 scale and shows a combined score.
It doubles as a design playground via an in-app **Studio**.

- **Stack:** plain HTML/CSS/vanilla-JS **ES modules — no build step, no framework.**
  (A "PWA" = a website that can be installed to a phone home screen and work offline.)
- **Hosting:** GitHub Pages, deployed automatically from the `main` branch.
- **Primary working dir:** repo root.

## Module map
- `index.html` — app shell + font links + SVG filter defs.
- `app.js` — everything: hash router, landing + detail rendering, search, the whole
  Studio, and the shared control system. (Large single file; edit surgically.)
- `config.js` — `BRAND` (name/tagline/score label) + engine tuning + `CATEGORIES`.
- `data.js` — `CATALOG` (mock items) + helpers (`getItem`, `itemsByCategory`).
- `normalize.js` — pure scoring engine (normalize → aggregate → headline + divergence).
- `sources.js` — per-rating-source scale + badge registry.
- `quotes.js` — `QUOTES` array shown under the homepage logo (non-repeating shuffle).
- `tasks.js` — `TASKS`: the canonical project checklist rendered by Studio → Tasks.
- `styles.css` — design system; CSS custom properties ("tokens", e.g. `--gold`) drive theming.
- `sw.js` — service worker = the bit that caches the app on the phone for offline use.
- `.github/workflows/pages.yml` — deploy; copies an explicit file list to the site.

## The Studio (in-app design tool)
Routes are `#/studio` (hub) and `#/studio/<id>` (editors: homepage, logo, poster,
corner, search, tabs, brand, type, tasks, lab). Editors share a "groups" system
(`groupHTML` / `controlRow` / `wireGroupControls` / `readGroupValues`) and reusable
pop-up editors (`openColorPicker`, `openShadowEditor`, `openTypeEditor`).

**Studio workflow = "edit locally → export → bake":** the user tweaks values in the
browser and taps **Export**; that JSON is pasted back in chat; Claude "bakes" it into
the source (CSS fallbacks + the editor's default values, kept in sync). Studio v2
**Lab** auto-detects any element and edits its live styles.

## Conventions
- **Theming via CSS tokens** with sensible fallbacks: `var(--token, fallback)`. When
  baking a value, update BOTH the CSS fallback and the Studio default so they match.
- **Adding a new top-level file** (e.g. a new `*.js`): add it to the `cp` list in
  `pages.yml` AND, if it's part of the app shell, to the `SHELL` array in `sw.js`.
  (A missing file there = the live site 404s/blanks — it has bitten us before.)
- Match surrounding code style; prefer small targeted edits over rewrites.

## Git & deployment
- Develop on the current feature branch; **commit, then merge to `main`** (Pages
  deploys from `main`). Push with `git push -u origin <branch>`.
- **Bump `sw.js` `CACHE`** (e.g. `scores-shell-vNN` → `vNN+1`) on every deploy that
  changes a shell asset, so phones fetch the new version instead of a cached one.
- Caching means users often see a stale version: always remind the user to
  **hard-refresh or use a private/incognito tab** after a deploy.

## Testing & verification
- **Verify UI changes in a real browser before deploying.** Tooling: Playwright
  (a tool that drives an automated browser) via
  `/opt/node22/lib/node_modules/playwright/index.js`, viewport **430×910**, serving
  with `python3 -m http.server 8765`. Confirm behaviour + zero console errors.
- For visual changes, offer the user a **screenshot** before shipping.
- A recurring harmless error in tests is a cross-origin `ERR_CONNECTION_CLOSED`
  (best-effort Google Fonts / artwork) — not an app bug.

## Communicating with this user
- **Explain technical terms in plain words the first time they appear** (e.g.
  "service worker — caches the app on the phone"). Don't assume jargon is known.
- **Lead with the plain-English takeaway**, then detail — the user may skim, so the
  key point must not be buried.
- Keep the build → test → deploy rhythm; report outcomes honestly (if a test fails,
  say so).
