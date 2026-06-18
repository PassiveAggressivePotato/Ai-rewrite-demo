# Orrery — a living, breakable solar system

A mobile-first, single-page WebGL solar-system simulator. Fly in through a
warp-speed title screen with procedurally generated ambient music, then zoom
out to the whole system. Tap any body to read an endless stream of facts and
see a live photo, drag to orbit the camera, and use the sliders to bend the
laws of the system to your will.

## Features

- **Real 3D** (three.js) with textured, sunlit spheres — so day/night
  terminators (planet phases) render correctly. Camera angle presets
  (Oblique / Top / Side / Follow) plus drag-to-orbit and pinch / wheel zoom.
- **Cinematic intro** — a warp starfield + title, then a zoom-out reveal of
  the system when you enter.
- **Procedural audio** (Tone.js): an evolving ambient pad for the title and
  sim, plus **Harmony of the Spheres** sonification — each planet plays a tone
  as it completes an orbit, so speeding up the sim plays a chord.
- **Time control**: a log-scaled speed dial from fractions of a day per second
  up to years per second, in either direction, plus play/pause.
- **Live parameters that change the system**:
  - *Sun mass* — rescales orbital speeds (Kepler's third law), the Sun's
    brightness/size, and the live **habitable-zone ring**.
  - *Distance scale* — blend from a compact, readable layout to true-to-life
    AU spacing.
  - *Planet size boost* — real planets are invisibly small at true scale, so
    exaggerate them to taste.
  - Per-body *size*, *orbit distance*, and *spin* controls for the selected
    planet, moon, or the Sun.
- **"What if…" sandbox** (all reversible): ignite Jupiter into a brown dwarf,
  give Earth a ring system, add a binary companion star, send a rogue planet
  tearing through, or swell the Sun into a red giant.
- **Facts & photos**: curated facts ship in `data.js` for an always-available,
  endless next/prev stream; live **Wikipedia** summaries and images are merged
  in when you're online, with a link out to the full article.

## Running it

It's a static site — no build step.

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000 on your phone or desktop
```

Opening `index.html` directly via `file://` also works for the 3D, audio, and
curated facts; serving over `http(s)` is recommended so the live Wikipedia
fetches succeed reliably. Add it to your phone's home screen for a full-screen,
app-like experience.

## Tech / structure

| File | Purpose |
|------|---------|
| `index.html` | Markup + HUD/overlays, loads three.js & Tone.js from CDN |
| `styles.css` | Mobile-first styling, safe-area aware |
| `data.js` | Planet physical parameters + curated fact pools |
| `app.js` | Scene, procedural textures, Keplerian physics, camera, audio, UI |

### Physics model

Stable **Keplerian** orbits by default (mean motion `n = 2π·√M / T`), which
keeps the system beautiful and predictable while still responding to the Sun's
mass. Orbits are drawn near-circular for clarity. A full N-body "chaos" sandbox
is a natural next step.

## Roadmap ideas

- Free-orbit camera and device-tilt parallax.
- N-body gravity mode where things can actually collide or get ejected.
- Save/share custom systems to local storage.
- Tap-to-compare two planets side by side.
