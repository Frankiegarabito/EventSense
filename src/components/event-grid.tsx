"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/lib/api";
import { EventCard } from "@/components/event-card";
import { AlertModule } from "@/components/alert-module";
import { derivePulseStatus, type EventSummary } from "@/lib/types";

export function EventGrid() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });

  if (isLoading) return <GridSkeleton />;
  if (error || !data) return <ErrorState />;

  const lowInterest = data.filter((e) => derivePulseStatus(e) === "low");

  return (
    <div className="flex flex-col gap-6">
      {lowInterest.length > 0 && <AlertModule events={lowInterest} />}

      <section>
        <header className="mb-3 flex items-baseline justify-between">
          <div>
            <h2 className="text-sm font-medium">Upcoming shows</h2>
            <p className="text-[11px] text-[--color-fg-dim]">
              {data.length} events · sorted by date
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[--color-fg-dim]">
            <LegendDot color="var(--color-trending)" label="Trending" />
            <LegendDot color="var(--color-stagnant)" label="Stagnant" />
            <LegendDot color="var(--color-low)" label="Low" />
          </div>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((e: EventSummary, i: number) => (
            <EventCard key={e.id} event={e} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      {label}
    </span>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[240px] rounded-[14px] border border-[--color-border] bg-[--color-surface]/60 animate-pulse"
        />
      ))}
    </div>
  );
}

function ErrorState() {
  return (
    <div className="rounded-md border border-[--color-low]/30 bg-[--color-low]/5 p-4 text-sm text-[--color-low]">
      Failed to load events. Check the /api/events route.
    </div>
  );
}
