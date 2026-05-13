"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/lib/api";
import { HeatMap } from "@/components/heat-map";
import { buildEventPoints, buildRegionalHeat } from "@/lib/heat-data";

/**
 * Client wrapper that ties live event data (currently mocked) to the
 * regional heat layer. Splitting the data wiring from the rendering layer
 * keeps HeatMap reusable in tests + Storybook.
 */
export function HeatMapView() {
  const { data, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });

  if (isLoading || !data) {
    return (
      <div className="h-[540px] rounded-[14px] border border-[--color-border] bg-[--color-surface]/60 animate-pulse" />
    );
  }

  const regions = buildRegionalHeat();
  const points = buildEventPoints(data);

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Search & event heat</h2>
          <p className="text-[11px] text-[--color-fg-dim]">
            Regional shading = state-level search interest · Glow markers =
            upcoming shows scaled by social noise + search velocity
          </p>
        </div>
        <div className="text-[11px] text-[--color-fg-dim]">
          {points.length} markets · {regions.filter((r) => r.intensity > 5).length}{" "}
          warm regions
        </div>
      </header>
      <HeatMap regions={regions} points={points} />
    </section>
  );
}
