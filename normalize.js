/* =============================================================================
 * normalize.js — the rating engine. Pure functions, no DOM, no globals.
 *
 * Responsibilities:
 *   1. Map each raw source value onto a common 0–100 scale.
 *   2. Aggregate critic and user scores separately (median by default).
 *   3. Produce a single headline "synth" score (confidence-weighted blend).
 *   4. Describe critic-vs-user divergence (the polarization signal).
 *
 * Everything is data-driven from sources.js + config.js so the same engine
 * works for movies, TV, games, anime and books.
 * ========================================================================== */

import { SOURCES } from "./sources.js";
import { TUNING } from "./config.js";

/* --- small stats helpers --------------------------------------------------- */
export function mean(xs) {
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function weightedMean(pairs) {
  // pairs: [{ value, weight }]
  const wsum = pairs.reduce((a, p) => a + (p.weight || 0), 0);
  if (!wsum) return mean(pairs.map((p) => p.value));
  return pairs.reduce((a, p) => a + p.value * (p.weight || 0), 0) / wsum;
}

/* --- per-source normalization --------------------------------------------- */
/* Returns a normalized rating row enriched for both math and UI:
 * { sourceId, kind, label, scale, raw, normalized (0–100, rounded),
 *   reviewCount, recommendation } — or null if the source is unknown. */
export function normalizeRating(rating) {
  const src = SOURCES[rating.sourceId];
  if (!src) return null;
  const normalized = clamp(src.toHundred(rating.value), 0, 100);
  return {
    sourceId: src.id,
    kind: src.kind,
    label: src.label,
    scale: src.scale,
    raw: rating.value,
    normalized: Math.round(normalized),
    normalizedExact: normalized,
    reviewCount: rating.reviewCount ?? null,
    recommendation: !!src.recommendation,
  };
}

export function normalizeAll(ratings = []) {
  return ratings.map(normalizeRating).filter(Boolean);
}

/* --- aggregation ----------------------------------------------------------- */
function central(rows, method) {
  if (!rows.length) return null;
  const values = rows.map((r) => r.normalizedExact);
  if (method === "mean") return mean(values);
  if (method === "weighted") {
    return weightedMean(rows.map((r) => ({ value: r.normalizedExact, weight: r.reviewCount || 1 })));
  }
  return median(values); // default
}

/* Split normalized rows into critic/user buckets and compute each average.
 * Returns { critic, user, criticRows, userRows } with averages rounded for
 * display (null when a bucket is empty). */
export function aggregate(ratings = [], method = TUNING.average) {
  const rows = normalizeAll(ratings);
  const criticRows = rows.filter((r) => r.kind === "critic");
  const userRows = rows.filter((r) => r.kind === "user");
  const c = central(criticRows, method);
  const u = central(userRows, method);
  return {
    critic: c == null ? null : Math.round(c),
    user: u == null ? null : Math.round(u),
    criticExact: c,
    userExact: u,
    criticRows,
    userRows,
  };
}

/* Headline score: confidence-weighted blend of the critic & user averages.
 * Falls back gracefully when only one side is present. */
export function synthScore(agg, weights = TUNING.synthWeights) {
  const parts = [];
  if (agg.criticExact != null) parts.push({ value: agg.criticExact, weight: weights.critic });
  if (agg.userExact != null) parts.push({ value: agg.userExact, weight: weights.user });
  if (!parts.length) return null;
  return Math.round(weightedMean(parts));
}

/* Divergence between critic & user sentiment — the polarization signal. */
export function divergence(agg, thresholds = TUNING.divergence) {
  if (agg.criticExact == null || agg.userExact == null) {
    return { gap: null, level: "n/a", label: "Not enough data" };
  }
  const gap = Math.round(Math.abs(agg.criticExact - agg.userExact));
  let level, label;
  if (gap <= thresholds.agree) { level = "agree"; label = "Critics & fans agree"; }
  else if (gap <= thresholds.mixed) { level = "mixed"; label = "Mixed reception"; }
  else { level = "divisive"; label = "Divisive"; }
  // Add a direction hint when meaningfully split.
  if (level !== "agree") {
    label += agg.criticExact > agg.userExact ? " · critics warmer" : " · fans warmer";
  }
  return { gap, level, label };
}

/* Total number of reviews behind an item — drives the small trust hint. */
export function confidence(ratings = []) {
  const total = normalizeAll(ratings)
    .reduce((a, r) => a + (r.reviewCount || 0), 0);
  return total;
}

/* One call that does everything the UI needs for an item. */
export function scoreItem(item) {
  const agg = aggregate(item.ratings);
  return {
    ...agg,
    synth: synthScore(agg),
    divergence: divergence(agg),
    reviews: confidence(item.ratings),
  };
}

/* --- utils ----------------------------------------------------------------- */
export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function formatReviews(n) {
  if (!n) return "";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
