"use client";

/**
 * STUB — Real-time vertical scroller of social mentions with AI sentiment
 * badges. Production version subscribes to a websocket / SSE stream and
 * uses CSS marquee + GPU translateY for the auto-scroll.
 */

import type { Mention } from "@/lib/types";
import { SocialFeed } from "@/components/social-feed";

export function SentimentTicker({ mentions }: { mentions: Mention[] }) {
  return (
    <div className="rounded-[14px] border border-[--color-border] bg-[--color-surface]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[--color-border]/60">
        <div>
          <h2 className="text-sm font-medium">Live ticker</h2>
          <p className="text-[11px] text-[--color-fg-dim]">
            Aggregated mentions · auto-refresh every 60s
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-[--color-fg-muted]">
          <span className="h-1.5 w-1.5 rounded-full bg-[--color-trending] shadow-[0_0_8px_var(--color-trending-glow)]" />
          Live
        </span>
      </header>
      <SocialFeed mentions={mentions} />
    </div>
  );
}
