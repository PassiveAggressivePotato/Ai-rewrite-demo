/* =============================================================================
 * config.js — single source of truth for branding + tunable knobs.
 *
 * The product name is a PLACEHOLDER. Nothing else in the codebase hard-codes
 * the name: every visible label reads from BRAND below, and no file / CSS class
 * / DOM id is named after the brand. To rename the whole product, edit `name`
 * (and optionally `scoreLabel`) here and you are done.
 * ========================================================================== */

export const BRAND = {
  name: "SYNTH",                              // placeholder wordmark
  tagline: "Universal Entertainment Scores",
  scoreLabel: "UNIVERSAL SCORE",             // headline (gold) score label
  scoreBlurb: "Calculated, combined normalized average",
};

/* Tunables for the aggregation engine. Kept here so product/UX can tweak the
 * feel of the headline score without touching the math. */
export const TUNING = {
  // Headline score = blend of critic & user averages (weights need not sum to 1;
  // they are normalized). Critics weighted slightly higher by default.
  synthWeights: { critic: 0.6, user: 0.4 },

  // Central tendency used for each of the critic / user averages.
  //   "median" — robust to a single outlier source (default)
  //   "mean"   — plain average
  //   "weighted" — confidence-weighted mean (by review count)
  average: "median",

  // Divergence (critic vs user gap) thresholds, in normalized points.
  divergence: { agree: 6, mixed: 15 }, // <=6 agree, <=15 mixed, else divisive
};

/* Default + available UI themes. Dark is the default; light is opt-in and
 * persisted to localStorage by app.js. */
export const THEME = {
  default: "dark",
  available: ["dark", "light"],
  storageKey: "ui.theme",
};

/* Content categories shown as tabs on the landing page (order matters). */
export const CATEGORIES = [
  { id: "movie", label: "Movies",   icon: "🎬" },
  { id: "tv",    label: "TV Shows", icon: "📺" },
  { id: "game",  label: "Games",    icon: "🎮" },
  { id: "anime", label: "Anime",    icon: "🌸" },
  { id: "book",  label: "Books",    icon: "📚" },
];

/* Default country for the "Where to Watch / Get it" panel. */
export const DEFAULT_COUNTRY = "US";
