/* =============================================================================
 * sources.js — registry of every rating source we aggregate.
 *
 * Each source declares its TRUE native scale and how to map a raw value onto a
 * common 0–100 scale. The aggregation engine (normalize.js) and the UI both
 * read from here, so adding a real API later is just adding/wiring entries —
 * no UI or math changes required.
 *
 * Important nuance: Rotten Tomatoes' Tomatometer is the *percentage of critics
 * who were positive*, NOT an average score. It is conceptually different from
 * Metacritic/IMDb averages, so we flag it (`recommendation: true`) and, when an
 * average-style RT value is available, prefer that for the math.
 * ========================================================================== */

/* kind:  "critic" | "user"
 * scale: human-readable native scale (for the "10→100" style hint in the UI)
 * max:   native maximum, used by toHundred
 * toHundred(v): map a native value onto 0–100
 * recommendation: true => value is a "% recommended", not an average score
 */
export const SOURCES = {
  /* ---- Film / TV --------------------------------------------------------- */
  rt_critic: {
    id: "rt_critic", label: "Rotten Tomatoes", kind: "critic",
    scale: "Tomatometer %", max: 100, recommendation: true,
    toHundred: (v) => v,
  },
  rt_audience: {
    id: "rt_audience", label: "RT Audience", kind: "user",
    scale: "Audience %", max: 100, recommendation: true,
    toHundred: (v) => v,
  },
  metacritic_critic: {
    id: "metacritic_critic", label: "Metacritic", kind: "critic",
    scale: "Metascore", max: 100,
    toHundred: (v) => v,
  },
  metacritic_user: {
    id: "metacritic_user", label: "Metacritic Users", kind: "user",
    scale: "0–10", max: 10,
    toHundred: (v) => v * 10,
  },
  imdb: {
    id: "imdb", label: "IMDb", kind: "user",
    scale: "0–10", max: 10,
    toHundred: (v) => v * 10,
  },
  letterboxd: {
    id: "letterboxd", label: "Letterboxd", kind: "user",
    scale: "0–5", max: 5,
    toHundred: (v) => v * 20,
  },
  tmdb: {
    id: "tmdb", label: "TMDB", kind: "user",
    scale: "0–100", max: 100,
    toHundred: (v) => v,
  },
  google: {
    id: "google", label: "Google", kind: "user",
    scale: "% liked", max: 100, recommendation: true,
    toHundred: (v) => v,
  },

  /* ---- Games ------------------------------------------------------------- */
  opencritic: {
    id: "opencritic", label: "OpenCritic", kind: "critic",
    scale: "0–100", max: 100,
    toHundred: (v) => v,
  },
  steam: {
    id: "steam", label: "Steam", kind: "user",
    scale: "% positive", max: 100, recommendation: true,
    toHundred: (v) => v,
  },
  igdb: {
    id: "igdb", label: "IGDB", kind: "user",
    scale: "0–100", max: 100,
    toHundred: (v) => v,
  },

  /* ---- Books ------------------------------------------------------------- */
  goodreads: {
    id: "goodreads", label: "Goodreads", kind: "user",
    scale: "0–5", max: 5,
    toHundred: (v) => v * 20,
  },
  storygraph: {
    id: "storygraph", label: "StoryGraph", kind: "user",
    scale: "0–5", max: 5,
    toHundred: (v) => v * 20,
  },
};

/* Short brand-coloured glyph for each source (kept tiny + dependency-free;
 * real logos can replace these later). Returns { text, bg, fg }. */
export const SOURCE_BADGES = {
  rt_critic:        { text: "RT", bg: "#fa320a", fg: "#fff" },
  rt_audience:      { text: "RT", bg: "#fae0c8", fg: "#7a2a00" },
  metacritic_critic:{ text: "M",  bg: "#ffcc33", fg: "#1a1a1a" },
  metacritic_user:  { text: "M",  bg: "#6c5ce7", fg: "#fff" },
  imdb:             { text: "IMDb", bg: "#f5c518", fg: "#1a1a1a" },
  letterboxd:       { text: "LB", bg: "#202830", fg: "#00e054" },
  tmdb:             { text: "TM", bg: "#01b4e4", fg: "#fff" },
  google:           { text: "G",  bg: "#ffffff", fg: "#4285f4" },
  opencritic:       { text: "OC", bg: "#ff6b35", fg: "#fff" },
  steam:            { text: "S",  bg: "#1b2838", fg: "#66c0f4" },
  igdb:             { text: "IG", bg: "#9147ff", fg: "#fff" },
  goodreads:        { text: "GR", bg: "#553b08", fg: "#f4f1ea" },
  storygraph:       { text: "SG", bg: "#1b2a4a", fg: "#f9a03f" },
};

export function getSource(id) {
  return SOURCES[id];
}
