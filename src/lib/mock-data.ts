import type { EventSummary, Mention, Referrer } from "@/lib/types";

/**
 * Mock data shaped exactly like real provider responses would be. This is the
 * one place where shape changes happen during the API integration phase —
 * components stay untouched.
 */

function series(base: number, drift: number, len = 30, seed = 1): number[] {
  // Deterministic pseudo-random so SSR and CSR match.
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: len }, (_, i) => {
    const trend = (i / len) * drift;
    const noise = (rand() - 0.5) * base * 0.25;
    return Math.max(0, Math.round(base + trend + noise));
  });
}

function mentions(eventId: string, count: number, seed: number): Mention[] {
  const platforms = ["instagram", "tiktok", "x", "youtube", "forum"] as const;
  const handles = [
    "stancenation", "hellaflushatl", "lowoffsets", "jdmlegend",
    "boostbabes", "carmeetdaily", "rxseven", "speedhunters",
    "atlauto", "houstonstance",
  ];
  const sentiments = ["positive", "positive", "positive", "neutral", "negative"] as const;
  const excerpts = [
    "yo who's pulling up this weekend???",
    "this is the only show that actually has vibes",
    "is it worth driving 4 hours for tho",
    "BRO THE LINEUP IS CRAZY",
    "we got our pre-sale tickets — see y'all there",
    "last year was lowkey overpriced",
    "@friend let's gooo",
    "the food trucks alone are worth it",
    "100% going. bringing the supra.",
    "anyone know about parking situation?",
  ];

  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  return Array.from({ length: count }, (_, i) => ({
    id: `${eventId}-m${i}`,
    platform: platforms[i % platforms.length],
    authorHandle: handles[i % handles.length],
    authorFollowers: Math.round(500 + rand() * 180_000),
    excerpt: excerpts[i % excerpts.length],
    postedAt: new Date(Date.now() - rand() * 86_400_000 * 4).toISOString(),
    sentiment: sentiments[Math.floor(rand() * sentiments.length)],
    likes: Math.round(rand() * 4000),
    shares: Math.round(rand() * 300),
  }));
}

function referrers(seed: number): Referrer[] {
  const sources = [
    { domain: "instagram.com", url: "https://instagram.com/p/abc" },
    { domain: "tiktok.com", url: "https://tiktok.com/@drift/video/123" },
    { domain: "stancenation.com", url: "https://stancenation.com/2026/event" },
    { domain: "speedhunters.com", url: "https://speedhunters.com/feature/cc" },
    { domain: "reddit.com/r/cars", url: "https://reddit.com/r/cars/p/xyz" },
    { domain: "google.com", url: "https://google.com" },
  ];
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const totals = sources.map(() => rand());
  const sum = totals.reduce((a, b) => a + b, 0);
  return sources.map((src, i) => {
    const share = totals[i] / sum;
    return {
      ...src,
      visits: Math.round(share * 12_000),
      sharePct: share,
      isPower: share > 0.25,
    };
  });
}

export const MOCK_EVENTS: EventSummary[] = [
  {
    id: "atl-2026-06",
    city: "Atlanta",
    state: "GA",
    date: "2026-06-14",
    venue: "Atlanta Motor Speedway",
    lat: 33.3858,
    lng: -84.3194,
    projectedAttendance: 8400,
    attendanceLastYear: 6800,
    search: {
      velocity: series(420, 380, 30, 11),
      velocityPriorYear: series(310, 120, 30, 21),
      topKeywords: [
        { query: "clean culture atlanta tickets", impressions: 18400, ctr: 0.072, position: 1.4, changePct: 0.42 },
        { query: "atlanta car meet june 2026", impressions: 9100, ctr: 0.051, position: 2.8, changePct: 0.18 },
        { query: "stance show atl", impressions: 6300, ctr: 0.064, position: 1.9, changePct: 0.28 },
        { query: "import car show georgia", impressions: 4700, ctr: 0.038, position: 4.1, changePct: -0.06 },
      ],
    },
    social: {
      noise: 86,
      shareRatio: 0.094,
      mentions: mentions("atl-2026-06", 24, 11),
      sentiment: { positive: 0.74, neutral: 0.18, negative: 0.08 },
    },
    referrers: referrers(11),
  },
  {
    id: "hou-2026-07",
    city: "Houston",
    state: "TX",
    date: "2026-07-19",
    venue: "NRG Arena",
    lat: 29.6810,
    lng: -95.4112,
    projectedAttendance: 5200,
    attendanceLastYear: 6400,
    search: {
      velocity: series(180, -40, 30, 12),
      velocityPriorYear: series(290, 80, 30, 22),
      topKeywords: [
        { query: "clean culture houston", impressions: 7200, ctr: 0.041, position: 2.6, changePct: -0.21 },
        { query: "houston car show july", impressions: 5400, ctr: 0.033, position: 3.4, changePct: -0.12 },
        { query: "lowered cars texas event", impressions: 2900, ctr: 0.028, position: 5.1, changePct: -0.04 },
      ],
    },
    social: {
      noise: 41,
      shareRatio: 0.038,
      mentions: mentions("hou-2026-07", 14, 12),
      sentiment: { positive: 0.48, neutral: 0.34, negative: 0.18 },
    },
    referrers: referrers(12),
  },
  {
    id: "orl-2026-08",
    city: "Orlando",
    state: "FL",
    date: "2026-08-09",
    venue: "Daytona International Speedway",
    lat: 28.5383,
    lng: -81.3792,
    projectedAttendance: 9200,
    attendanceLastYear: 7100,
    search: {
      velocity: series(510, 460, 30, 13),
      velocityPriorYear: series(360, 100, 30, 23),
      topKeywords: [
        { query: "clean culture orlando tickets", impressions: 22100, ctr: 0.081, position: 1.2, changePct: 0.52 },
        { query: "orlando car meet august 2026", impressions: 11800, ctr: 0.059, position: 2.1, changePct: 0.31 },
        { query: "florida import show", impressions: 7600, ctr: 0.044, position: 3.0, changePct: 0.19 },
        { query: "drift event daytona", impressions: 5400, ctr: 0.071, position: 1.8, changePct: 0.38 },
      ],
    },
    social: {
      noise: 92,
      shareRatio: 0.108,
      mentions: mentions("orl-2026-08", 28, 13),
      sentiment: { positive: 0.79, neutral: 0.15, negative: 0.06 },
    },
    referrers: referrers(13),
  },
  {
    id: "phx-2026-09",
    city: "Phoenix",
    state: "AZ",
    date: "2026-09-20",
    venue: "Phoenix Raceway",
    lat: 33.4484,
    lng: -112.0740,
    projectedAttendance: 4100,
    attendanceLastYear: 4300,
    search: {
      velocity: series(210, 30, 30, 14),
      velocityPriorYear: series(230, 40, 30, 24),
      topKeywords: [
        { query: "clean culture phoenix", impressions: 6100, ctr: 0.045, position: 2.4, changePct: 0.03 },
        { query: "arizona car show fall", impressions: 3300, ctr: 0.031, position: 4.5, changePct: -0.02 },
      ],
    },
    social: {
      noise: 58,
      shareRatio: 0.052,
      mentions: mentions("phx-2026-09", 16, 14),
      sentiment: { positive: 0.61, neutral: 0.27, negative: 0.12 },
    },
    referrers: referrers(14),
  },
  {
    id: "lax-2026-10",
    city: "Los Angeles",
    state: "CA",
    date: "2026-10-11",
    venue: "Auto Club Speedway",
    lat: 34.0522,
    lng: -118.2437,
    projectedAttendance: 11200,
    attendanceLastYear: 9400,
    search: {
      velocity: series(640, 380, 30, 15),
      velocityPriorYear: series(480, 160, 30, 25),
      topKeywords: [
        { query: "clean culture la tickets", impressions: 28400, ctr: 0.078, position: 1.1, changePct: 0.34 },
        { query: "socal car meet october", impressions: 14600, ctr: 0.062, position: 1.9, changePct: 0.22 },
        { query: "import show california", impressions: 8200, ctr: 0.041, position: 3.2, changePct: 0.11 },
      ],
    },
    social: {
      noise: 81,
      shareRatio: 0.086,
      mentions: mentions("lax-2026-10", 30, 15),
      sentiment: { positive: 0.71, neutral: 0.21, negative: 0.08 },
    },
    referrers: referrers(15),
  },
  {
    id: "dal-2026-11",
    city: "Dallas",
    state: "TX",
    date: "2026-11-08",
    venue: "Texas Motor Speedway",
    lat: 32.7767,
    lng: -96.7970,
    projectedAttendance: 6300,
    attendanceLastYear: 5800,
    search: {
      velocity: series(290, 120, 30, 16),
      velocityPriorYear: series(260, 60, 30, 26),
      topKeywords: [
        { query: "clean culture dallas", impressions: 9400, ctr: 0.054, position: 2.0, changePct: 0.14 },
        { query: "dfw car show november", impressions: 4800, ctr: 0.038, position: 3.6, changePct: 0.06 },
      ],
    },
    social: {
      noise: 64,
      shareRatio: 0.061,
      mentions: mentions("dal-2026-11", 18, 16),
      sentiment: { positive: 0.66, neutral: 0.24, negative: 0.10 },
    },
    referrers: referrers(16),
  },
];

export function findEventByCity(city: string): EventSummary | undefined {
  const slug = city.toLowerCase();
  return MOCK_EVENTS.find(
    (e) => e.city.toLowerCase() === slug || e.id.startsWith(slug.slice(0, 3))
  );
}
