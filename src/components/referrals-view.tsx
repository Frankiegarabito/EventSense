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
