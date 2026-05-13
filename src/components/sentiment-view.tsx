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
