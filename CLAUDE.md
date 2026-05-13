# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Next.js dev server with Turbopack
npm run build      # Production build
npm run lint       # ESLint via next lint
npm run typecheck  # tsc --noEmit (strict mode)
```

There are no tests yet.

## Architecture

EventSense is a Next.js 15 App Router app. Data flows from Route Handlers → TanStack Query → React components. All UI components are **client components**; the Route Handlers are the server boundary that will eventually call real external APIs.

**Key constraint:** `PulseStatus` (`trending` / `stagnant` / `low`) is **never stored** in the data model — it is always derived at render time via `derivePulseStatus()` in `src/lib/types.ts`. Storing it risks a stale ring color. The derivation weights 7-day search velocity YoY (70%) and social noise (30%).

**Data model is provider-agnostic.** `src/lib/types.ts` defines the shared domain types (`EventSummary`, `SearchSignal`, `SocialSignal`, etc.). Today's mock Route Handlers (`src/app/api/events/route.ts` and `src/app/api/events/[city]/route.ts`) are the only thing that needs to change when wiring real providers — components never call outside `/api/events`.

**Map rendering** uses `d3-geo` + `topojson-client` + `us-atlas` (state-level topojson). The choropleth (`HeatRegion[]`) and glow event markers (`HeatPoint[]`) are separate layers so regional search interest and event locations stay visually distinct.

**Charts:** Sparklines are inline SVG (low bundle weight, suitable for cards). Recharts is used only for the heavier historical chart in the deep-dive view.

## Design system

Tailwind v4 with a **CSS-first `@theme` block** — all design tokens are in `src/app/globals.css`, not a JS config file. Colors are OKLCH. Key tokens:

- `--color-accent` — electric cyan, brand/active states
- `--color-trending` / `--color-stagnant` / `--color-low` — pulse ring status colors
- `--color-pos` / `--color-neu` / `--color-neg` — sentiment breakdown
- `--color-surface` through `--color-surface-3` — card depth layers

Utility components (`Card`, `Badge`, `Button`) in `src/components/ui/` are shadcn-style but owned source — edit them directly rather than regenerating.

## Integrating real providers

Replace only the Route Handlers under `src/app/api/events/`. The planned adapters:

- **Google Search Console API** → `SearchSignal`
- **Instagram Graph API + TikTok Research API** → `SocialSignal.mentions` / `noise`
- **GA4 / Plausible / Fathom** → `Referrer[]`
- **Claude Haiku (Anthropic API)** → `Mention.sentiment` classification

The `time-range-selector` component (7d / 30d / 90d / vs last yr) currently holds UI-only state — it needs to be wired into the TanStack Query key to refetch with range params.
