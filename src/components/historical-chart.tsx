"use client";

import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EventSummary } from "@/lib/types";
import { formatShortDate } from "@/lib/utils";

interface HistoricalChartProps {
  event: EventSummary;
  height?: number;
}

/**
 * Search-velocity time series — current window overlaid against the same
 * window prior year. The area uses an OKLCH gradient that matches the
 * card's accent color; the prior-year line is dashed and dimmed.
 */
export function HistoricalChart({
  event,
  height = 220,
}: HistoricalChartProps) {
  const data = useMemo(() => {
    const eventDate = new Date(event.date);
    const days = event.search.velocity.length;
    return event.search.velocity.map((current, i) => {
      const dayOffset = days - i - 1;
      const d = new Date(eventDate);
      d.setDate(d.getDate() - dayOffset);
      return {
        date: d.toISOString(),
        current,
        prior: event.search.velocityPriorYear[i] ?? 0,
      };
    });
  }, [event]);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
        >
          <defs>
            <linearGradient id="hc-current" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-accent)"
                stopOpacity="0.45"
              />
              <stop
                offset="100%"
                stopColor="var(--color-accent)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--color-border)"
            strokeDasharray="2 3"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="var(--color-fg-dim)"
            tick={{ fontSize: 10, fill: "var(--color-fg-dim)" }}
            tickFormatter={(v) => formatShortDate(v)}
            interval="preserveStartEnd"
            minTickGap={28}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
          />
          <YAxis
            stroke="var(--color-fg-dim)"
            tick={{ fontSize: 10, fill: "var(--color-fg-dim)" }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip content={<HCTooltip />} cursor={{ stroke: "var(--color-border-strong)" }} />
          <Line
            type="monotone"
            dataKey="prior"
            stroke="var(--color-fg-dim)"
            strokeWidth={1.25}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="current"
            stroke="var(--color-accent)"
            strokeWidth={1.75}
            fill="url(#hc-current)"
            isAnimationActive
            animationDuration={650}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TooltipPayload {
  dataKey: string;
  value: number;
  color: string;
}

function HCTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const current = payload.find((p) => p.dataKey === "current")?.value ?? 0;
  const prior = payload.find((p) => p.dataKey === "prior")?.value ?? 0;
  const diff = prior === 0 ? 0 : (current - prior) / prior;
  return (
    <div className="rounded-md border border-[--color-border] bg-[--color-bg]/95 px-3 py-2 text-xs shadow-lg backdrop-blur-md">
      <div className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">
        {label ? formatShortDate(label) : ""}
      </div>
      <div className="mt-1 flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--color-accent)" }}
          />
          <span className="tabular-nums">{current.toLocaleString()}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-[--color-fg-muted]">
          <span className="h-px w-3 bg-[--color-fg-dim]" />
          <span className="tabular-nums">{prior.toLocaleString()}</span>
        </span>
        <span
          className={
            "tabular-nums " +
            (diff > 0.05
              ? "text-[--color-trending]"
              : diff < -0.05
                ? "text-[--color-low]"
                : "text-[--color-fg-muted]")
          }
        >
          {diff > 0 ? "+" : ""}
          {(diff * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
