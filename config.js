/* =============================================================================
 * config.js — single source of truth for branding + tunable knobs.
 *
 * The product name is a PLACEHOLDER. Nothing else in the codebase hard-codes
 * the name: every visible label reads from BRAND below, and no file / CSS class
 * / DOM id is named after the brand. To rename the whole product, edit `name`
 * (and optionally `scoreLabel`) here and you are done.
 * ========================================================================== */

export const BRAND = {
  name: "CRITIKL",                            // wordmark (rendered as the SVG logo)
  tagline: "Universal Entertainment Scores",
  scoreLabel: "CRITIKL SCORE",               // headline (gold) score label
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

/* Content categories shown as tabs on the landing page (order matters).
 * `short` = tab label, `plural` = used in section headings ("Top Movies"). */
export const CATEGORIES = [
  { id: "movie", label: "Movies",   short: "Movie", plural: "Movies", icon: "🎬" },
  { id: "tv",    label: "TV Shows", short: "Show",  plural: "Shows",  icon: "📺" },
  { id: "game",  label: "Games",    short: "Game",  plural: "Games",  icon: "🎮" },
  { id: "book",  label: "Books",    short: "Book",  plural: "Books",  icon: "📚" },
];

/* Default country for the "Where to Watch / Get it" panel. */
export const DEFAULT_COUNTRY = "US";
