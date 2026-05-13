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
