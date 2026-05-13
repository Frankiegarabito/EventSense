# Design Spec — Five Missing Pages + Affiliate Hub

**Date:** 2026-05-13  
**Project:** EventSense (Clean Culture car event dashboard)  
**Scope:** Build five pages currently missing behind sidebar nav links, plus a new Affiliate Hub with Claude-powered caption generation.

---

## Pages in Scope

| Route | Page | Priority |
|---|---|---|
| `/sentiment` | Cross-event sentiment feed | 1 |
| `/referrals` | Aggregate referral domains | 2 |
| `/activity` | Live search velocity | 3 |
| `/affiliate` | Caption generator + code | 4 |
| `/settings` | Data sources + alerts | 5 |

---

## Shared Architecture

All pages follow the existing pattern:
- `src/app/<route>/page.tsx` — server component, wraps `DashboardShell`
- `src/components/<name>-view.tsx` — client component, owns data fetching via `useQuery`
- Data comes from existing `/api/events` route (no new data sources needed except `/api/generate-caption`)

Sidebar nav in `src/components/dashboard-shell.tsx` already lists all routes — no nav changes needed.

---

## Page 1 — `/sentiment`

### Purpose
Unified sentiment view across all events. The existing `SentimentTicker` stub and `SocialFeed` component get their real home here.

### Layout
- **Summary strip** (top): Positive / Neutral / Negative percentages aggregated across all events + a combined sentiment bar
- **Platform filter chips**: All · Instagram · TikTok · X · YouTube · Forums — filters the mention feed client-side (no refetch)
- **Mentions feed**: All `Mention[]` from all events, merged and sorted by `postedAt` descending, rendered with existing `SocialFeed` and `SentimentBadge` components

### Data
- Calls `fetchEvents()` (existing). Flattens `events[*].social.mentions` into one array.
- Sentiment totals derived from `events[*].social.sentiment` weighted by event noise score.
- No new API route needed.

### Components
- `src/app/sentiment/page.tsx`
- `src/components/sentiment-view.tsx` — replaces the `SentimentTicker` stub as the page-level component

---

## Page 2 — `/referrals`

### Purpose
Cross-event referral domain leaderboard. Shows which external sites are driving the most ticket traffic across all shows.

### Layout
- **Hero stats row**: Total visits · Unique domains · Power referral count
- **Domain table**: Sorted by visits descending. Each row has an inline background bar (width = share%), domain, visit count, share %, Power Referral badge (amber) if `isPower === true`
- Power referrals are visually separated at the top of the list

### Data
- Calls `fetchEvents()`. Merges `events[*].referrers[]`, groups by `domain`, sums `visits`, recalculates `sharePct` against combined total, recalculates `isPower` (>25% of combined total).
- No new API route needed.

### Components
- `src/app/referrals/page.tsx`
- `src/components/referrals-view.tsx`
- Reuses `src/components/referrers-list.tsx` for individual rows

---

## Page 3 — `/activity`

### Purpose
Real-time search velocity monitor across all events. Shows which shows are gaining or losing momentum right now.

### Layout
- **Live indicator**: Pulsing green dot + "Live — refreshing every 60s" label
- **Big counters** (2-up grid): Total searches today · % change vs yesterday (derived from last 2 days of `search.velocity`)
- **Per-event velocity rows**: City name · inline sparkline (last 7 data points) · velocity chip (color-coded ↑ / → / ↓ with %) · time-since label
- Rows sorted by velocity delta descending (most improving first)

### Data
- Calls `fetchEvents()` with `staleTime: 60_000` and `refetchInterval: 60_000` — auto-refreshes every 60s.
- Velocity delta = `(last1d avg - prev1d avg) / prev1d avg` from `search.velocity`.
- No new API route needed.

### Components
- `src/app/activity/page.tsx`
- `src/components/activity-view.tsx`
- Reuses `src/components/sparkline.tsx` for inline sparklines

---

## Page 4 — `/affiliate`

### Purpose
Generate platform-specific social media captions with the user's affiliate/discount code embedded. Captions are written by Claude Haiku, tuned for car culture tone and each platform's norms.

### Layout (two-panel)

**Left panel — controls (300px fixed)**
1. Event picker — list of events from `/api/events`, showing city, pulse dot, days-until, social noise score
2. Platform selector — 6-button grid: Instagram · TikTok · X · Facebook · Reddit · Forum
3. Tone chips (multi-select): Hype 🔥 · Informative · Hook-first · Chill
4. Generate button (full-width, accent color)

**Right panel — output**
- Header: "Generated Captions — [Platform] · [City]" + variant count
- 3 caption cards, each with:
  - Variant label + tag chips (HOOK, HYPE, COMMUNITY, LONG-FORM)
  - Caption body — affiliate code rendered in accent color
  - Footer: char count · Copy button (copies plain text to clipboard)
- Reddit/Forum variant includes a subreddit suggestion block below the card

**Top bar**
- Page title "Affiliate Hub"
- Affiliate code badge (reads from `AFFILIATE_CODE` env var, falls back to `"YOUR CODE"`)

### API Route — `POST /api/generate-caption`

**Request body:**
```ts
{
  event: EventSummary          // full event object
  platform: Platform           // "instagram" | "tiktok" | "x" | "facebook" | "reddit" | "forum"
  tones: Tone[]                // ["hype", "hook-first", "community", "chill"]
  affiliateCode: string
}
```

**Response:**
```ts
{
  captions: Array<{
    variant: string            // "Hook-first" | "Community" | "Long-form"
    text: string               // full caption text, code embedded
    hashtags: string[]         // empty for reddit/forum
    charCount: number
    tags: string[]             // ["HOOK", "HYPE"] etc.
  }>
  subreddits?: string[]        // only for reddit platform
}
```

**Prompt design:**
- System: Car culture expert + social media copywriter. Knows Clean Culture is a car show brand. Knows each platform's norms (TikTok: hook in first 3 words, short; Reddit: no hashtags, sounds organic; X: under 280 chars).
- User: Event details (city, venue, date, days until, social noise score, pulse status) + platform + tones + affiliate code.
- Asks for exactly 3 variants as JSON.
- Model: `claude-haiku-4-5-20251001` (fast, low cost per generation).
- Uses prompt caching on the system prompt (static across calls).

**Environment variable:**
```
AFFILIATE_CODE=<user's GoAffPro code>
```
Add to `.env.local`. Never committed to git (already in `.gitignore` via `.env*.local`).

### Components
- `src/app/affiliate/page.tsx`
- `src/components/affiliate-hub.tsx` — full two-panel UI, client component
- `src/app/api/generate-caption/route.ts` — POST handler

### Type additions (`src/lib/types.ts`)
```ts
export type Platform = "instagram" | "tiktok" | "x" | "facebook" | "reddit" | "forum"
export type Tone = "hype" | "hook-first" | "community" | "chill"
export interface GeneratedCaption {
  variant: string
  text: string
  hashtags: string[]
  charCount: number
  tags: string[]
}
export interface GenerateCaptionResponse {
  captions: GeneratedCaption[]
  subreddits?: string[]
}
```

---

## Page 5 — `/settings`

### Purpose
Configure the dashboard: data source connection status, alert thresholds, and tracked event list.

### Layout (stacked sections)

**Data Sources**
- One row per provider: Google Search Console · Instagram Graph API · TikTok Research API · GA4 / Plausible · Claude (Haiku)
- Each row: status dot (mock = amber, live = green) · provider name · status label · Connect / Revoke button
- For now all show "Mock" — buttons are disabled stubs (real OAuth flows come later)

**Refresh & Alerts**
- Data refresh interval: segmented control (5m / 15m / 30m / 1h)
- Alert on low pulse: toggle (persisted to `localStorage`)
- Low pulse threshold: read-only label showing the `derivePulseStatus` composite threshold (0.85)
- Email digest: toggle stub (disabled, "coming soon" label)

**Tracked Events**
- List of events with city, date, pulse status pill
- "+ Add event" button — stub (disabled for now)

### State
- All settings persisted to `localStorage` under `eventsense:settings`. No backend needed for MVP.

### Components
- `src/app/settings/page.tsx`
- `src/components/settings-view.tsx`

---

## What Is Not In This Spec

- GoAffPro API integration (conversion / commission data) — future work
- Real OAuth flows for data sources — future work
- Email digest — future work
- "+ Add event" functionality — future work
- Time-range selector wired to TanStack Query — separate task
