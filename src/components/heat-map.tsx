"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, Geometry } from "geojson";
import statesTopo from "us-atlas/states-10m.json";
import { cn } from "@/lib/utils";
import type { HeatPoint, HeatRegion, PulseStatus } from "@/lib/types";

export interface HeatMapProps {
  regions: HeatRegion[];
  points: HeatPoint[];
  /** SVG width in design units. The viewBox keeps it responsive. */
  width?: number;
  height?: number;
}

const STATUS_COLOR: Record<PulseStatus, string> = {
  trending: "var(--color-trending)",
  stagnant: "var(--color-stagnant)",
  low: "var(--color-low)",
};

/**
 * Continuous interpolator: intensity 0..100 → OKLCH chroma that blends from
 * surface-2 (cold) through accent (warm) toward trending green (hot).
 */
function regionFill(intensity: number): string {
  if (intensity < 8) return "var(--color-surface-2)";
  // Lightness rises, chroma rises, hue shifts from cyan (215) → green (145)
  const t = Math.min(intensity, 100) / 100;
  const L = 0.22 + t * 0.32;
  const C = 0.04 + t * 0.16;
  const H = 215 - t * 70;
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`;
}

export function HeatMap({
  regions,
  points,
  width = 960,
  height = 540,
}: HeatMapProps) {
  const [hoverFips, setHoverFips] = useState<string | null>(null);

  // Memoized projection + path generator + projected event points.
  const { features, projectedPoints, pathGen } = useMemo(() => {
    const topology = statesTopo as unknown as Topology<{
      states: GeometryCollection;
    }>;
    const fc = feature(topology, topology.objects.states) as unknown as {
      features: Feature<Geometry, { name?: string }>[];
    };
    const projection = geoAlbersUsa()
      .scale(1180)
      .translate([width / 2, height / 2]);
    const pathGen = geoPath(projection);

    const projectedPoints = points
      .map((p) => {
        const xy = projection([p.lng, p.lat]);
        return xy ? { ...p, x: xy[0], y: xy[1] } : null;
      })
      .filter((p): p is HeatPoint & { x: number; y: number } => p !== null);

    return { features: fc.features, projectedPoints, pathGen };
  }, [points, width, height]);

  const regionByFips = useMemo(() => {
    const map = new Map<string, HeatRegion>();
    for (const r of regions) map.set(r.fips, r);
    return map;
  }, [regions]);

  const hoverRegion = hoverFips ? regionByFips.get(hoverFips) : null;

  return (
    <div className="relative overflow-hidden rounded-[14px] border border-[--color-border] bg-[--color-surface]">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_30%,oklch(0.82_0.16_215/0.04),transparent_60%)]" />

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full"
        role="img"
        aria-label="Search-interest heat map of US events"
      >
        <defs>
          <radialGradient id="glow-trending" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={STATUS_COLOR.trending} stopOpacity="0.9" />
            <stop offset="60%" stopColor={STATUS_COLOR.trending} stopOpacity="0.25" />
            <stop offset="100%" stopColor={STATUS_COLOR.trending} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glow-stagnant" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={STATUS_COLOR.stagnant} stopOpacity="0.85" />
            <stop offset="60%" stopColor={STATUS_COLOR.stagnant} stopOpacity="0.2" />
            <stop offset="100%" stopColor={STATUS_COLOR.stagnant} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glow-low" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={STATUS_COLOR.low} stopOpacity="0.85" />
            <stop offset="60%" stopColor={STATUS_COLOR.low} stopOpacity="0.2" />
            <stop offset="100%" stopColor={STATUS_COLOR.low} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Choropleth layer */}
        <g>
          {features.map((f, i) => {
            const fipsRaw = String(f.id ?? "");
            const fips = fipsRaw.padStart(2, "0");
            const region = regionByFips.get(fips);
            const intensity = region?.intensity ?? 0;
            const d = pathGen(f as Feature<Geometry>) ?? "";
            return (
              <motion.path
                key={fips || i}
                d={d}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: i * 0.005 }}
                fill={regionFill(intensity)}
                stroke="var(--color-border)"
                strokeWidth={0.6}
                onMouseEnter={() => setHoverFips(fips)}
                onMouseLeave={() => setHoverFips(null)}
                className={cn(
                  "transition-[filter] duration-200",
                  hoverFips === fips && "[filter:brightness(1.25)]"
                )}
                style={{ cursor: region ? "pointer" : "default" }}
              />
            );
          })}
        </g>

        {/* Event markers — glow + core */}
        <g>
          {projectedPoints.map((p, i) => {
            const r = 6 + (p.magnitude / 100) * 16;
            const gradient =
              p.status === "trending"
                ? "url(#glow-trending)"
                : p.status === "stagnant"
                  ? "url(#glow-stagnant)"
                  : "url(#glow-low)";
            return (
              <motion.g
                key={p.eventId}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.25 + i * 0.08,
                  duration: 0.45,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              >
                <circle cx={p.x} cy={p.y} r={r * 2.2} fill={gradient} />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={STATUS_COLOR[p.status]}
                  fillOpacity="0.9"
                  stroke="var(--color-bg)"
                  strokeWidth={1.5}
                />
                <text
                  x={p.x}
                  y={p.y + r + 12}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--color-fg-muted)"
                  className="font-medium"
                  style={{ pointerEvents: "none" }}
                >
                  {p.city}
                </text>
              </motion.g>
            );
          })}
        </g>
      </svg>

      {/* Hover readout */}
      <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-[--color-border] bg-[--color-bg]/85 px-3 py-2 backdrop-blur-md">
        <div className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">
          Region
        </div>
        <div className="mt-0.5 text-sm font-medium">
          {hoverRegion
            ? `${hoverRegion.stateCode} · ${hoverRegion.intensity}/100`
            : "Hover a state"}
        </div>
      </div>

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[--color-fg-muted]">
        <div className="flex items-center gap-2">
          <span className="text-[--color-fg-dim] text-[10px] uppercase tracking-wider">
            Search interest
          </span>
          <div
            className="h-1.5 w-32 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, var(--color-surface-2), oklch(0.55 0.12 180), oklch(0.86 0.22 145))",
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          <Dot status="trending" label="Trending" />
          <Dot status="stagnant" label="Stagnant" />
          <Dot status="low" label="Low" />
        </div>
      </div>
    </div>
  );
}

function Dot({ status, label }: { status: PulseStatus; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background: STATUS_COLOR[status],
          boxShadow: `0 0 8px ${STATUS_COLOR[status]}`,
        }}
      />
      {label}
    </span>
  );
}
