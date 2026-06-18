# Universal Entertainment Scores (working title: "SYNTH")

A mobile-first review-aggregation app for **movies, TV, games, anime and
books**. Every rating source is normalized onto one **100-point scale**, then
combined into separate **critic** and **user** averages plus a single headline
score — with a poster-driven, frosted-glass UI that fits on one screen.

> The name **SYNTH** is a placeholder. It lives in exactly one place
> (`config.js` → `BRAND`); nothing else in the code is named after it, so
> renaming the whole product is a one-line change.

## Status — v1 prototype

This is a polished **mock-data** prototype: the UI and the rating engine are
real, the catalog (`data.js`) stands in for live APIs. The data layer is shaped
to match the real sources so they can be wired in later without UI changes.

## Run it

Static site, no build step:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Serving over `http(s)` (rather than `file://`) lets the service worker register
and the web fonts load; the app still works offline and falls back to gradient
posters + system fonts when assets are unavailable.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | App shell, fonts, PWA hooks |
| `styles.css` | Design system (dark default + light theme), layouts |
| `config.js` | **Brand placeholder** + engine tuning + theme/category config |
| `sources.js` | Rating-source registry: native scale → 0–100 per source |
| `normalize.js` | The engine: normalize → median → headline score → divergence |
| `data.js` | Mock catalog across all five categories |
| `app.js` | Hash router, rendering, search, theme, interactions |
| `manifest.webmanifest`, `sw.js`, `icons/` | Installable PWA / offline shell |
| `orrery/` | The unrelated earlier project, preserved (served at `/orrery/`) |

## How scores work

Each source declares its true native scale in `sources.js` and how to map it to
0–100. The engine (`normalize.js`) then:

1. Normalizes every raw value to 0–100.
2. Splits sources into **critic** vs **user** and takes the **median** of each
   (robust to a single outlier; method is configurable in `config.js`).
3. Blends them into a **confidence-weighted headline score** (default 60/40
   critic/user).
4. Reports **critic-vs-user divergence** ("Critics & fans agree" → "Divisive").

Note: Rotten Tomatoes' Tomatometer is a *% of positive critics*, not an average,
so it is flagged (`recommendation: true`) and shown as context.

## Mobile / app path

Mobile-first and installable as a PWA today. Because it is plain HTML/CSS/JS
with a hash router and no server dependency, the same build wraps into native
iOS/Android via **Capacitor** (or as a Trusted Web Activity) without a rewrite.

## Deferred to later

Real API integration (TMDB + OMDb, IGDB/OpenCritic/Steam, MAL/AniList,
Goodreads/StoryGraph) behind a proxy; user-submitted ratings + accounts;
persistent watchlist; trailers; final branding.
