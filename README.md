# EventSense

Vibe & visibility tracker for Clean Culture shows. Built as the SEO + social
companion to the main Outreach tool.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The home page is the event grid; click any
card to deep-dive that show (`/events/[city]`).

Scripts:

```bash
npm run dev        # next dev with turbopack
npm run build      # production build
npm run start      # serve production build
npm run lint       # eslint via next lint
npm run typecheck  # tsc --noEmit, strict
```

## Stack

| Layer            | Choice                                     | Why                                                                 |
| ---------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| Framework        | Next.js 15 App Router + React 19           | Server Components keep API keys server-side; Route Handlers replace a separate backend during MVP. |
| Styling          | Tailwind v4 (CSS-first `@theme`)           | All design tokens live in `src/app/globals.css` as CSS variables.   |
| Animation        | Motion (Framer Motion)                     | Shared-element transitions via `layoutId`; counters, sparklines, stagger. |
| Data fetching    | TanStack Query + mock Route Handlers       | Real fetch boundaries today, swap to real providers without touching components. |
| Charts           | Inline SVG (sparklines) + Recharts (heavier views) | Keep card bundle weight low. |
| Icons            | lucide-react                               | Stroke-based, scales to the neon aesthetic.                         |

Maps: built on **`d3-geo` + `topojson-client` + `us-atlas`** (state-level
topojson). Chosen over react-simple-maps (stuck on React 18 peers) and over
tile-based libraries like Mapbox/Leaflet (photoreal tiles fight the dark/neon
aesthetic).

## Architecture

```
src/
├── app/
│   ├── layout.tsx              Root + QueryProvider
│   ├── page.tsx                / → DashboardShell + EventGrid
│   ├── globals.css             Tailwind v4 @theme tokens (dark/neon)
│   ├── api/events/route.ts     GET /api/events           (mock)
│   ├── api/events/[city]/route.ts  GET /api/events/[city]   (mock)
│   └── events/[city]/page.tsx  Deep-dive route
├── components/
│   ├── dashboard-shell.tsx     Sidebar + top bar (sticky) + time range
│   ├── event-card.tsx          Pulse ring · sparkline · social noise · CountUp
│   ├── event-grid.tsx          useQuery → cards + AlertModule
│   ├── event-deep-dive.tsx     Hero + 2-column (mentions | SEO+refs)
│   ├── alert-module.tsx        "Action needed" — low-interest events
│   ├── heat-map.tsx            US choropleth + glow markers (d3-geo)
│   ├── heat-map-view.tsx       Data-wiring wrapper for the page route
│   ├── historical-chart.tsx    Recharts: current vs. prior-year overlay
│   ├── sentiment-ticker.tsx    STUB — live social feed
│   ├── social-feed.tsx         Mentions list w/ sentiment badges
│   ├── seo-keywords.tsx        Entry-keyword table
│   ├── referrers-list.tsx      Referring sites + Power Referral highlight
│   ├── sparkline.tsx           Inline SVG, animates path on mount
│   ├── count-up.tsx            Motion animate() over MotionValue
│   ├── pulse-ring.tsx          Status indicator (trending / stagnant / low)
│   ├── social-noise-meter.tsx  12-segment bar
│   ├── sentiment-badge.tsx     Hyped / Mixed / Cold pill
│   ├── time-range-selector.tsx 7d / 30d / 90d / vs last yr
│   └── ui/                     card · badge · button (shadcn-style, owned source)
└── lib/
    ├── types.ts                EventSummary, signals, HeatRegion/HeatPoint
    ├── mock-data.ts            Realistic deterministic mock dataset
    ├── heat-data.ts            STATE_FIPS table + region/event-point builders
    ├── api.ts                  fetchEvents / fetchEventByCity
    ├── query-client.tsx        TanStack QueryClient provider
    └── utils.ts                cn() + number/date formatters
```

## Design system

All colors are OKLCH (perceptually uniform, better gradient interpolation than HSL):

| Token              | Use                                           |
| ------------------ | --------------------------------------------- |
| `--color-bg`       | Deep near-black surface                       |
| `--color-surface`  | Card backdrop                                 |
| `--color-accent`   | Electric cyan — brand & active states         |
| `--color-trending` | Neon green — high-velocity events             |
| `--color-stagnant` | Amber — flat events                           |
| `--color-low`      | Red — needs intervention                      |
| `--color-pos/neu/neg` | Sentiment breakdown                        |

## Data model & the "pulse status" rule

`PulseStatus` (trending / stagnant / low) is **never stored** — it's
derived on every render from current 7-day search velocity vs. same window
last year, weighted with social noise. See
[`derivePulseStatus`](src/lib/types.ts). Storing it would let the ring color
go stale.

## What's next

Wiring up real providers means replacing **only**
`src/app/api/events/*/route.ts`:

- Google Search Console API → `SearchSignal`
- Instagram Graph API + TikTok Research API → `SocialSignal.mentions` & `noise`
- A referrer source (Google Analytics 4, Plausible, Fathom) → `Referrer[]`
- LLM sentiment classifier (Anthropic Claude Haiku or similar) → `Mention.sentiment`

The UI never reaches outside `/api/events`, so adapters can be developed
independently behind feature flags.

Built:

- US heat map (regional choropleth + glow event markers, hover readout, legend)
- Per-event historical chart in deep-dive (recharts, YoY overlay, custom tooltip)

Build-out priority order remaining:

1. Real regional data source (DataForSEO Google Trends regional report → `HeatRegion[]`)
2. SentimentTicker → SSE stream from server
3. Competitor benchmarking leaderboard
4. Auth + multi-org if multiple promoters share the dashboard
5. Time-range selector → TanStack Query key — currently UI-only state
