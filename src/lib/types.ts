/**
 * EventSense domain model.
 *
 * Everything the dashboard renders flows through these types. The contract is
 * deliberately decoupled from any specific data source (Google Trends, IG
 * Graph API, TikTok Research API, etc.) — adapters live in `src/lib/adapters/*`
 * and shape provider payloads into these shared types.
 */

export type PulseStatus = "trending" | "stagnant" | "low";

export type SentimentLabel = "positive" | "neutral" | "negative";

export interface SentimentBreakdown {
  positive: number; // 0..1
  neutral: number;
  negative: number;
}

export interface SearchSignal {
  /** Daily search-volume time series for queries like
   *  `clean culture <city> tickets`, last N days. Index 0 = oldest. */
  velocity: number[];
  /** Same window from the prior year, used for year-over-year comparisons. */
  velocityPriorYear: number[];
  /** Top entry keywords driving traffic this window. */
  topKeywords: KeywordEntry[];
}

export interface KeywordEntry {
  query: string;
  impressions: number;
  ctr: number; // 0..1
  position: number; // avg SERP position
  changePct: number; // window-over-window
}

export interface SocialSignal {
  /** Composite "noise" score 0..100 — share-weighted reach. */
  noise: number;
  /** Share-to-reach ratio over the window. */
  shareRatio: number;
  /** Recent tagged mentions (cap to ~50 for the UI scroll). */
  mentions: Mention[];
  sentiment: SentimentBreakdown;
}

export interface Mention {
  id: string;
  platform: "instagram" | "tiktok" | "x" | "youtube" | "forum";
  authorHandle: string;
  authorFollowers: number;
  excerpt: string;
  postedAt: string; // ISO
  sentiment: SentimentLabel;
  likes: number;
  shares: number;
}

export interface Referrer {
  domain: string;
  url: string;
  visits: number;
  sharePct: number; // 0..1 of total inbound
  isPower: boolean; // single source >25% → "Power Referral"
}

/**
 * Regional search-interest heat (state-level US choropleth).
 * Score 0..100 normalized to the highest region in the window — matches
 * how DataForSEO / Google Trends report relative interest.
 */
export interface HeatRegion {
  /** Two-letter USPS state code. */
  stateCode: string;
  /** Numeric FIPS, padded to 2 chars — joins to us-atlas topojson `id`. */
  fips: string;
  intensity: number; // 0..100
}

/**
 * Event marker on the map. Magnitude drives glow radius — we render it
 * separately from the choropleth so search interest (regional) and event
 * geo (point) stay visually distinct.
 */
export interface HeatPoint {
  eventId: string;
  city: string;
  lat: number;
  lng: number;
  magnitude: number; // 0..100, composite of social noise + search velocity
  status: PulseStatus;
}

export interface EventSummary {
  id: string;
  city: string;
  state: string;
  /** ISO date — event start. */
  date: string;
  venue: string;
  /** Coordinates for the heat map. */
  lat: number;
  lng: number;
  /** Pulled from ticketing platform or estimated. */
  projectedAttendance: number;
  attendanceLastYear: number;
  search: SearchSignal;
  social: SocialSignal;
  referrers: Referrer[];
}

/* ------------------------------------------------------------------ */
/* Derived selectors                                                   */
/* ------------------------------------------------------------------ */

/**
 * Pulse status is derived, never stored — so a stale field can't produce a
 * misleading color ring. We compare current 7-day search velocity to the
 * same window prior year, combined with social noise.
 */
export function derivePulseStatus(e: EventSummary): PulseStatus {
  const recent = avg(e.search.velocity.slice(-7));
  const priorRecent = avg(e.search.velocityPriorYear.slice(-7));
  const yoY = priorRecent === 0 ? 1 : recent / priorRecent;

  const composite = yoY * 0.7 + (e.social.noise / 100) * 0.3;

  if (composite >= 1.05) return "trending";
  if (composite >= 0.85) return "stagnant";
  return "low";
}

export function yoYDelta(e: EventSummary): number {
  const recent = avg(e.search.velocity.slice(-7));
  const prior = avg(e.search.velocityPriorYear.slice(-7));
  if (prior === 0) return 0;
  return (recent - prior) / prior;
}

export function daysUntil(e: EventSummary, now = new Date()): number {
  const ms = new Date(e.date).getTime() - now.getTime();
  return Math.ceil(ms / 86_400_000);
}

function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
