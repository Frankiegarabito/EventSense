# Five Pages + Affiliate Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build five missing dashboard pages (/sentiment, /referrals, /activity, /settings, /affiliate) plus a Claude-powered affiliate caption generator with platform-specific copy, where-to-post recommendations, weekend thread targeting, and a low-pulse article mode.

**Architecture:** Each page is a server-component page.tsx wrapping DashboardShell + a client-component *-view.tsx that owns data fetching via useQuery. The affiliate page adds one POST route handler that calls Claude Haiku and returns structured JSON. All pages pull from the existing /api/events mock; only /api/generate-caption is new. No nav changes needed — dashboard-shell.tsx already lists all five routes.

**Tech Stack:** Next.js 15 App Router, React 19, TanStack Query v5, Tailwind v4 CSS-first @theme tokens, Motion, @anthropic-ai/sdk (Claude Haiku 4.5), lucide-react, existing components: SocialFeed, SentimentBadge, Sparkline (props: data/color/height/width/fill/baseline), ReferrersList, cn(), formatCompactNumber(), formatPct()

---

## File Map

**Create:**
- `src/app/sentiment/page.tsx`
- `src/components/sentiment-view.tsx`
- `src/app/referrals/page.tsx`
- `src/components/referrals-view.tsx`
- `src/app/activity/page.tsx`
- `src/components/activity-view.tsx`
- `src/app/settings/page.tsx`
- `src/components/settings-view.tsx`
- `src/app/affiliate/page.tsx`
- `src/components/affiliate-hub.tsx`
- `src/app/api/generate-caption/route.ts`
- `.env.local`

**Modify:**
- `src/lib/types.ts` — append Platform, Tone, GeneratedCaption, WhereToPost, GenerateCaptionResponse

**No changes needed:**
- `src/components/dashboard-shell.tsx` — sidebar already has all five routes
- `src/app/api/events/route.ts` — existing mock, unchanged

---

## Task 1: Types + Anthropic SDK

**Files:**
- Modify: `src/lib/types.ts`
- Create: `.env.local`

- [ ] **Step 1: Install Anthropic SDK**

```bash
npm install @anthropic-ai/sdk
```

Expected: `node_modules/@anthropic-ai/sdk` present, package-lock.json updated.

- [ ] **Step 2: Create .env.local**

Create `.env.local` in the project root:
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
AFFILIATE_CODE=YOUR_GOAFFPRO_CODE_HERE
```

Replace both values. Get your Anthropic API key at https://console.anthropic.com/

- [ ] **Step 3: Append types to src/lib/types.ts**

Append to the end of `src/lib/types.ts`:
```ts
export type Platform =
  | "instagram"
  | "tiktok"
  | "x"
  | "facebook"
  | "reddit"
  | "forum"

export type Tone = "hype" | "hook-first" | "community" | "chill"

export interface GeneratedCaption {
  variant: string
  text: string
  hashtags: string[]
  charCount: number
  tags: string[]
}

export interface WhereToPost {
  name: string
  type: "subreddit" | "facebook_group" | "forum" | "event_site"
  reason: string
  threadHint?: string
}

export interface GenerateCaptionResponse {
  captions: GeneratedCaption[]
  whereToPost: WhereToPost[]
  weekendReply?: string
  article?: string
}
```

- [ ] **Step 4: Verify**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts package.json package-lock.json .env.local
git commit -m "feat: add caption/affiliate types and install @anthropic-ai/sdk"
```

---

## Task 2: Sentiment Page

**Files:**
- Create: `src/app/sentiment/page.tsx`
- Create: `src/components/sentiment-view.tsx`

- [ ] **Step 1: Create src/app/sentiment/page.tsx**

```tsx
import { DashboardShell } from "@/components/dashboard-shell";
import { SentimentView } from "@/components/sentiment-view";

export default function SentimentPage() {
  return (
    <DashboardShell>
      <SentimentView />
    </DashboardShell>
  );
}
```

- [ ] **Step 2: Create src/components/sentiment-view.tsx**

```tsx
"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/lib/api";
import { SocialFeed } from "@/components/social-feed";
import type { Mention, EventSummary } from "@/lib/types";

const PLATFORMS = ["All", "instagram", "tiktok", "x", "youtube", "forum"] as const;
type PlatformFilter = (typeof PLATFORMS)[number];

function aggregateSentiment(events: EventSummary[]) {
  let pos = 0, neu = 0, neg = 0, total = 0;
  for (const e of events) {
    const w = e.social.noise;
    pos += e.social.sentiment.positive * w;
    neu += e.social.sentiment.neutral * w;
    neg += e.social.sentiment.negative * w;
    total += w;
  }
  if (total === 0) return { positive: 0, neutral: 0, negative: 0 };
  return { positive: pos / total, neutral: neu / total, negative: neg / total };
}

export function SentimentView() {
  const [filter, setFilter] = useState<PlatformFilter>("All");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });

  const allMentions = useMemo(() => {
    const m: Mention[] = events.flatMap((e) => e.social.mentions);
    return m.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  }, [events]);

  const filtered = useMemo(
    () => (filter === "All" ? allMentions : allMentions.filter((m) => m.platform === filter)),
    [allMentions, filter]
  );

  const sentiment = useMemo(() => aggregateSentiment(events), [events]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 rounded-[14px] border border-[--color-border] bg-[--color-surface]/60 animate-pulse" />
        <div className="h-[500px] rounded-[14px] border border-[--color-border] bg-[--color-surface]/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[14px] border border-[--color-border] bg-[--color-surface] p-4">
        <div className="flex flex-wrap items-center gap-8">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">Positive</div>
            <div className="text-2xl font-bold text-[--color-pos]">
              {(sentiment.positive * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">Neutral</div>
            <div className="text-2xl font-bold text-[--color-fg-muted]">
              {(sentiment.neutral * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">Negative</div>
            <div className="text-2xl font-bold text-[--color-neg]">
              {(sentiment.negative * 100).toFixed(0)}%
            </div>
          </div>
          <div className="flex-1 min-w-[160px]">
            <div className="text-[10px] uppercase tracking-wider text-[--color-fg-dim] mb-2">
              All shows · weighted by noise
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-[--color-surface-2] gap-0.5">
              <div style={{ width: `${(sentiment.positive * 100).toFixed(1)}%` }} className="rounded-full bg-[--color-pos]" />
              <div style={{ width: `${(sentiment.neutral * 100).toFixed(1)}%` }} className="rounded-full bg-[--color-neu]" />
              <div style={{ width: `${(sentiment.negative * 100).toFixed(1)}%` }} className="rounded-full bg-[--color-neg]" />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[14px] border border-[--color-border] bg-[--color-surface]">
        <header className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[--color-border]/60">
          <div>
            <h2 className="text-sm font-medium">Mentions</h2>
            <p className="text-[11px] text-[--color-fg-dim]">{filtered.length} mentions · all events</p>
          </div>
          <div className="flex flex-wrap gap-1.5 ml-auto">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={[
                  "rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors capitalize",
                  filter === p
                    ? "bg-[--color-accent]/15 text-[--color-accent] ring-1 ring-[--color-accent]/40"
                    : "bg-[--color-surface-2] text-[--color-fg-muted] hover:text-[--color-fg]",
                ].join(" ")}
              >
                {p}
              </button>
            ))}
          </div>
        </header>
        <SocialFeed mentions={filtered} />
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 4: Check in browser**

With `npm run dev` running, open http://localhost:3000/sentiment. Verify: sentiment percentages render, platform chips filter the feed client-side without refetching, no console errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/sentiment/page.tsx src/components/sentiment-view.tsx
git commit -m "feat: add /sentiment page with cross-event mention feed and platform filter"
```

---

## Task 3: Referrals Page

**Files:**
- Create: `src/app/referrals/page.tsx`
- Create: `src/components/referrals-view.tsx`

- [ ] **Step 1: Create src/app/referrals/page.tsx**

```tsx
import { DashboardShell } from "@/components/dashboard-shell";
import { ReferralsView } from "@/components/referrals-view";

export default function ReferralsPage() {
  return (
    <DashboardShell>
      <ReferralsView />
    </DashboardShell>
  );
}
```

- [ ] **Step 2: Create src/components/referrals-view.tsx**

```tsx
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/lib/api";
import { formatCompactNumber } from "@/lib/utils";
import type { EventSummary } from "@/lib/types";

interface MergedReferrer {
  domain: string
  url: string
  visits: number
  sharePct: number
  isPower: boolean
}

function mergeReferrers(events: EventSummary[]): MergedReferrer[] {
  const map = new Map<string, { visits: number; url: string }>();
  for (const e of events) {
    for (const r of e.referrers) {
      const existing = map.get(r.domain);
      if (existing) {
        existing.visits += r.visits;
      } else {
        map.set(r.domain, { visits: r.visits, url: r.url });
      }
    }
  }
  const total = Array.from(map.values()).reduce((s, r) => s + r.visits, 0);
  return Array.from(map.entries())
    .map(([domain, { visits, url }]) => ({
      domain,
      url,
      visits,
      sharePct: total > 0 ? visits / total : 0,
      isPower: total > 0 && visits / total > 0.25,
    }))
    .sort((a, b) => b.visits - a.visits);
}

export function ReferralsView() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });

  const referrers = useMemo(() => mergeReferrers(events), [events]);
  const totalVisits = referrers.reduce((s, r) => s + r.visits, 0);
  const powerCount = referrers.filter((r) => r.isPower).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 rounded-[14px] border border-[--color-border] bg-[--color-surface]/60 animate-pulse" />
        <div className="h-64 rounded-[14px] border border-[--color-border] bg-[--color-surface]/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[14px] border border-[--color-border] bg-[--color-surface] p-4">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">Total visits</div>
            <div className="mt-1 text-2xl font-bold text-[--color-accent]">
              {formatCompactNumber(totalVisits)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">Domains</div>
            <div className="mt-1 text-2xl font-bold">{referrers.length}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">Power referrals</div>
            <div className="mt-1 text-2xl font-bold text-[--color-stagnant]">{powerCount}</div>
          </div>
        </div>
      </section>

      <section className="rounded-[14px] border border-[--color-border] bg-[--color-surface]">
        <header className="px-4 py-3 border-b border-[--color-border]/60">
          <h2 className="text-sm font-medium">Referring domains</h2>
          <p className="text-[11px] text-[--color-fg-dim]">All events · sorted by visits</p>
        </header>
        <div className="divide-y divide-[--color-border]/40">
          {referrers.map((r) => (
            <div key={r.domain} className="relative flex items-center justify-between px-4 py-3">
              <div
                className="absolute left-0 top-0 bottom-0 opacity-[0.07]"
                style={{
                  width: `${(r.sharePct * 100).toFixed(1)}%`,
                  background: r.isPower ? "var(--color-stagnant)" : "var(--color-accent)",
                }}
              />
              <div className="relative flex items-center gap-2">
                <span className="text-sm font-medium">{r.domain}</span>
                {r.isPower && (
                  <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[--color-stagnant]/20 text-[--color-stagnant]">
                    Power
                  </span>
                )}
              </div>
              <div className="relative flex items-center gap-4">
                <span className="text-[11px] text-[--color-fg-muted] tabular-nums">
                  {formatCompactNumber(r.visits)} visits
                </span>
                <span className="text-[11px] font-bold text-[--color-accent] tabular-nums w-10 text-right">
                  {(r.sharePct * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 4: Check in browser**

Open http://localhost:3000/referrals. Verify: hero stats show totals, domain rows render with inline bar fills proportional to share %, Power badge appears for domains with >25% share.

- [ ] **Step 5: Commit**

```bash
git add src/app/referrals/page.tsx src/components/referrals-view.tsx
git commit -m "feat: add /referrals page with cross-event domain leaderboard"
```

---

## Task 4: Live Activity Page

**Files:**
- Create: `src/app/activity/page.tsx`
- Create: `src/components/activity-view.tsx`

- [ ] **Step 1: Create src/app/activity/page.tsx**

```tsx
import { DashboardShell } from "@/components/dashboard-shell";
import { ActivityView } from "@/components/activity-view";

export default function ActivityPage() {
  return (
    <DashboardShell>
      <ActivityView />
    </DashboardShell>
  );
}
```

- [ ] **Step 2: Create src/components/activity-view.tsx**

```tsx
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/lib/api";
import { Sparkline } from "@/components/sparkline";
import { formatPct } from "@/lib/utils";
import type { EventSummary } from "@/lib/types";

function velocityDelta(e: EventSummary): number {
  const v = e.search.velocity;
  if (v.length < 2) return 0;
  const yesterday = v[v.length - 2];
  if (yesterday === 0) return 0;
  return (v[v.length - 1] - yesterday) / yesterday;
}

export function ActivityView() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const sorted = useMemo(
    () => [...events].sort((a, b) => velocityDelta(b) - velocityDelta(a)),
    [events]
  );

  const todayTotal = useMemo(
    () => events.reduce((s, e) => s + (e.search.velocity.at(-1) ?? 0), 0),
    [events]
  );

  const avgDelta = useMemo(
    () => events.length === 0 ? 0 : events.reduce((s, e) => s + velocityDelta(e), 0) / events.length,
    [events]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-[14px] border border-[--color-border] bg-[--color-surface]/60 animate-pulse" />
        <div className="h-64 rounded-[14px] border border-[--color-border] bg-[--color-surface]/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[--color-trending] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[--color-trending]" />
        </span>
        <span className="text-[11px] font-semibold text-[--color-trending]">Live</span>
        <span className="text-[10px] text-[--color-fg-dim]">— refreshing every 60s</span>
      </div>

      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-[14px] border border-[--color-border] bg-[--color-surface] p-4">
          <div className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">Searches today</div>
          <div className="mt-1 text-3xl font-bold text-[--color-accent] tabular-nums">
            {todayTotal.toLocaleString()}
          </div>
        </div>
        <div className="rounded-[14px] border border-[--color-border] bg-[--color-surface] p-4">
          <div className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">vs yesterday</div>
          <div className={[
            "mt-1 text-3xl font-bold tabular-nums",
            avgDelta >= 0 ? "text-[--color-trending]" : "text-[--color-low]",
          ].join(" ")}>
            {formatPct(avgDelta, { signed: true })}
          </div>
        </div>
      </section>

      <section className="rounded-[14px] border border-[--color-border] bg-[--color-surface]">
        <header className="px-4 py-3 border-b border-[--color-border]/60">
          <h2 className="text-sm font-medium">Velocity by event</h2>
          <p className="text-[11px] text-[--color-fg-dim]">Sorted by momentum · last 7 data points</p>
        </header>
        <div className="divide-y divide-[--color-border]/40">
          {sorted.map((e) => {
            const delta = velocityDelta(e);
            const isUp = delta >= 0.05;
            const isDown = delta < -0.05;
            const color = isUp
              ? "var(--color-trending)"
              : isDown
              ? "var(--color-low)"
              : "var(--color-stagnant)";
            return (
              <div key={e.id} className="flex items-center gap-4 px-4 py-3">
                <span className="text-xs font-bold w-4 text-center" style={{ color }}>
                  {isUp ? "↑" : isDown ? "↓" : "→"}
                </span>
                <span className="text-sm font-semibold flex-1">{e.city}, {e.state}</span>
                <div className="w-24">
                  <Sparkline data={e.search.velocity.slice(-7)} color={color} height={24} />
                </div>
                <span className="text-[11px] font-bold tabular-nums w-14 text-right" style={{ color }}>
                  {formatPct(delta, { signed: true })}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 4: Check in browser**

Open http://localhost:3000/activity. Verify: pulsing green dot animates, counters render, events are sorted with trending first, each row has a sparkline and colored delta chip.

- [ ] **Step 5: Commit**

```bash
git add src/app/activity/page.tsx src/components/activity-view.tsx
git commit -m "feat: add /activity page with live 60s velocity monitor and sparklines"
```

---

## Task 5: Settings Page

**Files:**
- Create: `src/app/settings/page.tsx`
- Create: `src/components/settings-view.tsx`

- [ ] **Step 1: Create src/app/settings/page.tsx**

```tsx
import { DashboardShell } from "@/components/dashboard-shell";
import { SettingsView } from "@/components/settings-view";

export default function SettingsPage() {
  return (
    <DashboardShell>
      <SettingsView />
    </DashboardShell>
  );
}
```

- [ ] **Step 2: Create src/components/settings-view.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/lib/api";
import { derivePulseStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "eventsense:settings";

interface Settings {
  refreshInterval: "5m" | "15m" | "30m" | "1h";
  alertLowPulse: boolean;
}

const DEFAULT_SETTINGS: Settings = { refreshInterval: "15m", alertLowPulse: true };
const REFRESH_OPTIONS = ["5m", "15m", "30m", "1h"] as const;

const DATA_SOURCES = [
  { name: "Google Search Console", key: "gsc" },
  { name: "Instagram Graph API", key: "ig" },
  { name: "TikTok Research API", key: "tiktok" },
  { name: "GA4 / Plausible", key: "ga4" },
  { name: "Claude (Haiku)", key: "claude" },
] as const;

const PULSE_LABEL: Record<string, string> = {
  trending: "text-[--color-trending]",
  stagnant: "text-[--color-stagnant]",
  low: "text-[--color-low]",
};

export function SettingsView() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
    } catch {}
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  return (
    <div className="space-y-5 max-w-2xl">
      <section className="rounded-[14px] border border-[--color-border] bg-[--color-surface] p-4">
        <h2 className="text-sm font-semibold mb-4">Data Sources</h2>
        <div className="space-y-2">
          {DATA_SOURCES.map((src) => (
            <div key={src.key} className="flex items-center gap-3 rounded-lg bg-[--color-surface-2] px-3 py-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[--color-stagnant] flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{src.name}</span>
              <span className="text-[10px] text-[--color-fg-dim]">Mock</span>
              <button disabled className="text-[10px] px-2.5 py-1 rounded-md border border-[--color-border] text-[--color-fg-dim] opacity-50 cursor-not-allowed">
                Connect →
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[14px] border border-[--color-border] bg-[--color-surface] p-4">
        <h2 className="text-sm font-semibold mb-4">Refresh & Alerts</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[--color-fg-muted]">Data refresh interval</span>
            <div className="flex gap-1 rounded-md border border-[--color-border] bg-[--color-surface-2] p-0.5">
              {REFRESH_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => update("refreshInterval", opt)}
                  className={cn(
                    "rounded-[5px] px-2.5 py-1 text-[10px] font-medium transition-colors",
                    settings.refreshInterval === opt
                      ? "bg-[--color-surface-3] text-[--color-fg]"
                      : "text-[--color-fg-muted] hover:text-[--color-fg]"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[--color-fg-muted]">Alert on low pulse</div>
              <div className="text-[10px] text-[--color-fg-dim]">composite &lt; 0.85</div>
            </div>
            <button
              role="switch"
              aria-checked={settings.alertLowPulse}
              onClick={() => update("alertLowPulse", !settings.alertLowPulse)}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                settings.alertLowPulse ? "bg-[--color-accent]" : "bg-[--color-surface-3]"
              )}
            >
              <span className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                settings.alertLowPulse ? "translate-x-4" : "translate-x-0.5"
              )} />
            </button>
          </div>

          <div className="flex items-center justify-between opacity-50">
            <div>
              <div className="text-sm text-[--color-fg-muted]">Email digest</div>
              <div className="text-[10px] text-[--color-fg-dim]">Coming soon</div>
            </div>
            <div className="h-5 w-9 rounded-full bg-[--color-surface-3]" />
          </div>
        </div>
      </section>

      <section className="rounded-[14px] border border-[--color-border] bg-[--color-surface] p-4">
        <h2 className="text-sm font-semibold mb-4">Tracked Events</h2>
        <div className="space-y-1.5">
          {events.map((e) => {
            const status = derivePulseStatus(e);
            return (
              <div key={e.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[--color-surface-2]">
                <span className="text-sm flex-1">
                  {e.city}, {e.state}
                  <span className="ml-2 text-[10px] text-[--color-fg-dim]">
                    · {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </span>
                <span className={cn("text-[10px] font-semibold capitalize", PULSE_LABEL[status])}>
                  {status}
                </span>
              </div>
            );
          })}
        </div>
        <button disabled className="mt-3 text-[11px] px-3 py-1.5 rounded-lg border border-[--color-border] text-[--color-fg-dim] opacity-50 cursor-not-allowed">
          + Add event
        </button>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 4: Check in browser**

Open http://localhost:3000/settings. Verify: all three sections render, refresh interval segmented control highlights selected option, alert toggle switches and persists across page reload (check by reloading and confirming toggle state matches localStorage).

- [ ] **Step 5: Commit**

```bash
git add src/app/settings/page.tsx src/components/settings-view.tsx
git commit -m "feat: add /settings page with localStorage-backed refresh and alert config"
```

---

## Task 6: Caption Generation API Route

**Files:**
- Create: `src/app/api/generate-caption/route.ts`

- [ ] **Step 1: Create src/app/api/generate-caption/route.ts**

```ts
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { derivePulseStatus, daysUntil } from "@/lib/types";
import type {
  EventSummary,
  Platform,
  Tone,
  GenerateCaptionResponse,
} from "@/lib/types";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a car culture expert, social media copywriter, and local SEO writer who promotes Clean Culture — a premium car show brand running events across major US cities.

Platform norms (follow strictly):
- instagram: 150-300 chars, emoji-rich, 8-12 hashtags at end, affiliate code prominent, reference "link in bio"
- tiktok: Hook in first 3-5 words to grab attention, under 200 chars, 4-6 hashtags, urgent CTA
- x: Under 280 chars total including hashtags, 1-2 hashtags max, punchy and direct
- facebook: Conversational, 2-3 short paragraphs, 2-3 hashtags max, friendly tone
- reddit: NO hashtags ever, sounds like a genuine community member NOT a promoter, ends with a question to drive replies, 200-400 chars
- forum: Similar to reddit, uses gear-head vocabulary, casual and knowledgeable

Car culture vocabulary to weave in naturally: builds, fitment, stance, clean, low, tucked, hellaflush, JDM, domestic, euro, meet, cruise, show, pull up, turnout.

Always respond with valid JSON only — no markdown, no prose outside JSON.`;

const PLATFORM_NORM: Record<Platform, string> = {
  instagram: "Instagram (emoji-rich, 8-12 hashtags, 150-300 chars, link in bio)",
  tiktok: "TikTok (hook-first 3-5 words, under 200 chars, 4-6 hashtags, urgent CTA)",
  x: "X/Twitter (under 280 chars total, 1-2 hashtags, punchy)",
  facebook: "Facebook (conversational, 2-3 paragraphs, 2-3 hashtags max)",
  reddit: "Reddit (no hashtags, genuine community member tone, end with a question)",
  forum: "Car forum (gear-head vocab, casual, no hashtags)",
};

function buildPrompt(
  event: EventSummary,
  platform: Platform,
  tones: Tone[],
  affiliateCode: string,
  mode: "captions" | "article"
): string {
  const status = derivePulseStatus(event);
  const days = daysUntil(event);
  const toneStr = tones.length > 0 ? tones.join(", ") : "hype";

  const ctx = `Event: Clean Culture ${event.city}, ${event.state}
Venue: ${event.venue}
Date: ${event.date} (${days} days away)
Social noise score: ${event.social.noise}/100
Pulse status: ${status}
Affiliate/discount code: ${affiliateCode}
Platform: ${PLATFORM_NORM[platform]}
Tone: ${toneStr}`;

  if (mode === "article") {
    return `${ctx}

Write a long-form article (400-600 words) to boost SEO and event awareness. Structure:
1. SEO-friendly headline (include city name + "car show")
2. Hook intro paragraph
3. "What to expect" (2-3 paragraphs: builds, atmosphere, Clean Culture experience)
4. Practical details (date, venue, tickets at cleancultureevents.com)
5. CTA with code ${affiliateCode} embedded naturally

Return JSON: { "article": "<full article text with line breaks as \\n>" }`;
  }

  return `${ctx}

Generate exactly 3 caption variants for this platform. Each should take a different angle (e.g. hook-first, community voice, informational). Embed ${affiliateCode} naturally in each caption text (not just hashtags).

Also generate:
- whereToPost: 3-5 specific places to post this content (named subreddits, Facebook groups by city/interest, forums, event listing sites). Each entry needs a "reason" (why good fit) and optional "threadHint" for reddit/forum (e.g. "search 'car meets this weekend Miami' and reply to the top result").
- weekendReply: For reddit/forum platform only — an 80-120 char reply for existing "what to do this weekend" or "any car meets near [city]?" threads. Empty string for other platforms.

Return JSON:
{
  "captions": [
    { "variant": "string", "text": "string", "hashtags": ["string"], "charCount": number, "tags": ["string"] }
  ],
  "whereToPost": [
    { "name": "string", "type": "subreddit|facebook_group|forum|event_site", "reason": "string", "threadHint": "string" }
  ],
  "weekendReply": "string"
}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      event: EventSummary;
      platform: Platform;
      tones: Tone[];
      affiliateCode: string;
      mode?: "captions" | "article";
    };

    const { event, platform, tones, affiliateCode, mode = "captions" } = body;
    const code = affiliateCode || process.env.AFFILIATE_CODE || "YOUR_CODE";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: mode === "article" ? 1500 : 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: buildPrompt(event, platform, tones, code, mode) }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
    const parsed = JSON.parse(raw) as GenerateCaptionResponse;
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[generate-caption]", err);
    return NextResponse.json({ error: "Caption generation failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 3: Smoke test the route**

With dev server running:
```bash
curl -s -X POST http://localhost:3000/api/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "tones": ["hype"],
    "affiliateCode": "TEST20",
    "mode": "captions",
    "event": {
      "id": "1", "city": "Miami", "state": "FL", "date": "2026-06-14",
      "venue": "Bayfront Park", "lat": 25.77, "lng": -80.19,
      "projectedAttendance": 500, "attendanceLastYear": 400,
      "search": {
        "velocity": [10,20,30,40,50,60,70,80,90,100],
        "velocityPriorYear": [8,15,25,35,42,50,55,60,65,70],
        "topKeywords": []
      },
      "social": {
        "noise": 80, "shareRatio": 0.12, "mentions": [],
        "sentiment": { "positive": 0.7, "neutral": 0.2, "negative": 0.1 }
      },
      "referrers": []
    }
  }' | python3 -m json.tool
```

Expected: JSON with `captions` array (3 items), `whereToPost` array, `weekendReply` string.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/generate-caption/route.ts
git commit -m "feat: add /api/generate-caption route with Claude Haiku, prompt caching, article mode"
```

---

## Task 7: Affiliate Hub UI

**Files:**
- Create: `src/app/affiliate/page.tsx`
- Create: `src/components/affiliate-hub.tsx`

- [ ] **Step 1: Create src/app/affiliate/page.tsx**

```tsx
import { DashboardShell } from "@/components/dashboard-shell";
import { AffiliateHub } from "@/components/affiliate-hub";

export default function AffiliatePage() {
  return (
    <DashboardShell>
      <AffiliateHub affiliateCode={process.env.AFFILIATE_CODE ?? "YOUR_CODE"} />
    </DashboardShell>
  );
}
```

- [ ] **Step 2: Create src/components/affiliate-hub.tsx**

```tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/lib/api";
import { derivePulseStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { EventSummary, Platform, Tone, GenerateCaptionResponse } from "@/lib/types";

const PLATFORMS: { id: Platform; emoji: string; label: string }[] = [
  { id: "instagram", emoji: "📸", label: "Instagram" },
  { id: "tiktok", emoji: "🎵", label: "TikTok" },
  { id: "x", emoji: "𝕏", label: "X" },
  { id: "facebook", emoji: "👥", label: "Facebook" },
  { id: "reddit", emoji: "🤖", label: "Reddit" },
  { id: "forum", emoji: "🏁", label: "Forum" },
];

const TONES: { id: Tone; label: string }[] = [
  { id: "hype", label: "Hype 🔥" },
  { id: "hook-first", label: "Hook-first" },
  { id: "community", label: "Community" },
  { id: "chill", label: "Chill" },
];

const PULSE_DOT: Record<string, string> = {
  trending: "bg-[--color-trending] shadow-[0_0_6px_var(--color-trending-glow)]",
  stagnant: "bg-[--color-stagnant]",
  low: "bg-[--color-low]",
};

export function AffiliateHub({ affiliateCode }: { affiliateCode: string }) {
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [tones, setTones] = useState<Tone[]>(["hype"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerateCaptionResponse | null>(null);
  const [mode, setMode] = useState<"captions" | "article">("captions");
  const [copied, setCopied] = useState<string | null>(null);

  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  function toggleTone(tone: Tone) {
    setTones((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone]
    );
  }

  async function generate(activeMode: "captions" | "article") {
    if (!selectedEvent) return;
    setMode(activeMode);
    setIsGenerating(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: selectedEvent, platform, tones, affiliateCode, mode: activeMode }),
      });
      setResult(await res.json());
    } finally {
      setIsGenerating(false);
    }
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const isLow = selectedEvent ? derivePulseStatus(selectedEvent) === "low" : false;

  return (
    <div className="grid grid-cols-[300px_1fr] min-h-[calc(100vh-112px)] -m-6">
      {/* Left panel */}
      <aside className="border-r border-[--color-border] p-5 flex flex-col gap-6 overflow-y-auto">
        <div>
          <div className="text-[9px] uppercase tracking-[0.14em] text-[--color-fg-dim] mb-3">1 — Pick an event</div>
          <div className="space-y-2">
            {events.map((e) => {
              const status = derivePulseStatus(e);
              const isSelected = selectedEvent?.id === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => { setSelectedEvent(e); setResult(null); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-[9px] border px-3 py-2 text-left transition-colors",
                    isSelected
                      ? "border-[--color-accent] bg-[rgba(56,200,240,0.06)]"
                      : "border-[--color-border] bg-[--color-surface-2] hover:border-[--color-border-strong]"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full flex-shrink-0", PULSE_DOT[status])} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[11px] font-semibold">{e.city}, {e.state}</span>
                    <span className="block text-[9px] text-[--color-fg-dim]">
                      {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {status === "low" && (
                        <span className="ml-1.5 text-[--color-stagnant]">· Needs boost</span>
                      )}
                    </span>
                  </span>
                  <span className="text-[9px] text-[--color-fg-muted] flex-shrink-0">Noise {e.social.noise}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[9px] uppercase tracking-[0.14em] text-[--color-fg-dim] mb-3">2 — Platform</div>
          <div className="grid grid-cols-3 gap-1.5">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => { setPlatform(p.id); setResult(null); }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[9px] border py-2 text-[9px] transition-colors",
                  platform === p.id
                    ? "border-[--color-accent] bg-[rgba(56,200,240,0.08)] text-[--color-accent]"
                    : "border-[--color-border] bg-[--color-surface-2] text-[--color-fg-muted] hover:border-[--color-border-strong]"
                )}
              >
                <span className="text-base leading-none">{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[9px] uppercase tracking-[0.14em] text-[--color-fg-dim] mb-3">3 — Tone</div>
          <div className="flex flex-wrap gap-1.5">
            {TONES.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTone(t.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] border transition-colors",
                  tones.includes(t.id)
                    ? "border-[--color-accent] bg-[rgba(56,200,240,0.1)] text-[--color-accent]"
                    : "border-[--color-border] bg-[--color-surface-2] text-[--color-fg-muted] hover:text-[--color-fg]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => generate("captions")}
          disabled={!selectedEvent || isGenerating}
          className={cn(
            "mt-auto w-full rounded-[10px] py-2.5 text-[12px] font-bold transition-opacity",
            "bg-[--color-accent] text-[#0a0a14] shadow-[0_0_20px_rgba(56,200,240,0.25)]",
            (!selectedEvent || isGenerating) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isGenerating ? "Generating…" : "✦ Generate Captions"}
        </button>
      </aside>

      {/* Right panel */}
      <main className="p-6 overflow-y-auto space-y-4">
        {/* Affiliate code badge */}
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-[--color-fg-muted]">
            {selectedEvent
              ? `${PLATFORMS.find((p) => p.id === platform)?.label} · ${selectedEvent.city}`
              : "Select an event to start"}
          </h1>
          <div className="flex items-center gap-2 bg-[--color-surface-2] border border-[--color-border] rounded-lg px-3 py-1.5">
            <span className="text-[9px] uppercase tracking-wider text-[--color-fg-dim]">Your code</span>
            <span className="text-sm font-black text-[--color-accent] font-mono tracking-widest">{affiliateCode}</span>
          </div>
        </div>

        {/* Low-pulse article banner */}
        {isLow && selectedEvent && !isGenerating && (
          <div className="rounded-[10px] border border-[--color-stagnant]/40 bg-[rgba(251,191,36,0.07)] px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-[11px] text-[--color-stagnant]">
              ⚠ This event needs a boost — generate a long-form article for blogs & listings?
            </p>
            <button
              onClick={() => generate("article")}
              className="flex-shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[--color-stagnant]/20 text-[--color-stagnant] hover:bg-[--color-stagnant]/30 transition-colors"
            >
              Generate Article →
            </button>
          </div>
        )}

        {/* Empty state */}
        {!result && !isGenerating && (
          <div className="flex items-center justify-center h-64 text-[--color-fg-dim] text-sm">
            {selectedEvent ? "Hit Generate to create captions" : "Select an event to get started"}
          </div>
        )}

        {/* Loading skeleton */}
        {isGenerating && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-[12px] border border-[--color-border] bg-[--color-surface]/60 animate-pulse" />
            ))}
          </div>
        )}

        {/* Caption output */}
        {result && !isGenerating && mode === "captions" && (
          <>
            {result.captions?.map((cap, i) => (
              <div key={i} className="rounded-[12px] border border-[--color-border] bg-[--color-surface] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[--color-border] bg-[--color-surface-2]">
                  <span className="text-[9px] uppercase tracking-[0.12em] text-[--color-fg-dim]">
                    Variant {i + 1} · {cap.variant}
                  </span>
                  <div className="flex gap-1">
                    {cap.tags?.map((tag) => (
                      <span key={tag} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[rgba(56,200,240,0.12)] text-[--color-accent]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="px-4 py-3 text-[12px] leading-relaxed">
                  <span className="whitespace-pre-wrap">{cap.text}</span>
                  {cap.hashtags?.length > 0 && (
                    <div className="mt-2 text-[11px] text-[--color-fg-muted]">
                      {cap.hashtags.join(" ")}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between px-4 py-2 border-t border-[--color-border]">
                  <span className="text-[9px] text-[--color-fg-dim]">{cap.charCount} chars</span>
                  <button
                    onClick={() => copy(
                      cap.text + (cap.hashtags?.length ? "\n" + cap.hashtags.join(" ") : ""),
                      `cap-${i}`
                    )}
                    className={cn(
                      "text-[10px] font-semibold px-2.5 py-1 rounded-md border transition-colors",
                      copied === `cap-${i}`
                        ? "border-[--color-trending] text-[--color-trending]"
                        : "border-[--color-border] text-[--color-fg-muted] hover:text-[--color-accent] hover:border-[--color-accent]"
                    )}
                  >
                    {copied === `cap-${i}` ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            ))}

            {/* Where to post */}
            {result.whereToPost?.length > 0 && (
              <div className="rounded-[12px] border border-[--color-border] bg-[--color-surface] overflow-hidden">
                <div className="px-4 py-3 border-b border-[--color-border] bg-[--color-surface-2]">
                  <h3 className="text-sm font-semibold">Where to Post</h3>
                  <p className="text-[10px] text-[--color-fg-dim]">Ranked recommendations for this event + platform</p>
                </div>
                <div className="divide-y divide-[--color-border]/40">
                  {result.whereToPost.map((w, i) => (
                    <div key={i} className="px-4 py-3 flex items-start gap-3">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[--color-surface-3] text-[--color-fg-dim] mt-0.5 flex-shrink-0 uppercase tracking-wide">
                        {w.type.replace("_", " ")}
                      </span>
                      <div>
                        <div className="text-[11px] font-semibold">{w.name}</div>
                        <div className="text-[10px] text-[--color-fg-muted] mt-0.5">{w.reason}</div>
                        {w.threadHint && (
                          <div className="text-[10px] text-[--color-accent] mt-1">💡 {w.threadHint}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekend reply */}
            {result.weekendReply && (
              <div className="rounded-[12px] border border-[--color-border] bg-[--color-surface] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[--color-border] bg-[--color-surface-2]">
                  <div>
                    <h3 className="text-sm font-semibold">"What to do this weekend" Reply</h3>
                    <p className="text-[10px] text-[--color-fg-dim]">Paste into existing weekend-plans threads</p>
                  </div>
                  <button
                    onClick={() => copy(result.weekendReply!, "reply")}
                    className={cn(
                      "text-[10px] font-semibold px-2.5 py-1 rounded-md border transition-colors",
                      copied === "reply"
                        ? "border-[--color-trending] text-[--color-trending]"
                        : "border-[--color-border] text-[--color-fg-muted] hover:text-[--color-accent] hover:border-[--color-accent]"
                    )}
                  >
                    {copied === "reply" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="px-4 py-3 text-[12px] leading-relaxed">{result.weekendReply}</div>
              </div>
            )}
          </>
        )}

        {/* Article output */}
        {result && !isGenerating && mode === "article" && result.article && (
          <div className="rounded-[12px] border border-[--color-border] bg-[--color-surface] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[--color-border] bg-[--color-surface-2]">
              <div>
                <h3 className="text-sm font-semibold">Long-form Article</h3>
                <p className="text-[10px] text-[--color-fg-dim]">Submit to local blogs, Do512, Eventbrite editorial, car culture publications</p>
              </div>
              <button
                onClick={() => copy(result.article!, "article")}
                className={cn(
                  "text-[10px] font-semibold px-2.5 py-1 rounded-md border transition-colors",
                  copied === "article"
                    ? "border-[--color-trending] text-[--color-trending]"
                    : "border-[--color-border] text-[--color-fg-muted] hover:text-[--color-accent] hover:border-[--color-accent]"
                )}
              >
                {copied === "article" ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="px-4 py-4 text-[12px] leading-relaxed whitespace-pre-wrap">{result.article}</div>
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck && npm run lint
```

Expected: No errors or warnings.

- [ ] **Step 4: Full end-to-end test in browser**

Open http://localhost:3000/affiliate. Test:
1. Events load with colored pulse dots and "Needs boost" label on low-pulse events
2. Platform grid and tone chips highlight on click
3. Selecting a low-pulse event shows the amber article banner
4. Click "✦ Generate Captions" → loading skeletons appear → 3 caption cards render
5. Each Copy button shows "Copied!" for ~2 seconds
6. "Where to Post" section renders below captions with type badges and threadHints
7. For Reddit/Forum platform: "What to do this weekend Reply" section renders
8. Click "Generate Article →" on a low-pulse event → article renders with Copy button

- [ ] **Step 5: Commit**

```bash
git add src/app/affiliate/page.tsx src/components/affiliate-hub.tsx
git commit -m "feat: add /affiliate hub — caption generator, where-to-post, weekend reply, article mode"
```

---

## Task 8: Final Check + Push

- [ ] **Step 1: Full typecheck and lint**

```bash
npm run typecheck && npm run lint
```

Expected: Zero errors, zero warnings.

- [ ] **Step 2: Check all five routes in browser**

Visit each route and confirm it renders without errors:
- http://localhost:3000/sentiment
- http://localhost:3000/referrals
- http://localhost:3000/activity
- http://localhost:3000/settings
- http://localhost:3000/affiliate

- [ ] **Step 3: Push to GitHub**

```bash
git push origin main
```

Expected: All commits pushed. Verify at https://github.com/Frankiegarabito/EventSense that the new files appear in the main branch.
