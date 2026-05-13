"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  /** Optional comparison series — drawn dimmed underneath. */
  baseline?: number[];
}

export function Sparkline({
  data,
  width = 120,
  height = 36,
  color = "var(--color-accent)",
  fill = true,
  baseline,
}: SparklineProps) {
  const { path, area, basePath } = useMemo(() => {
    const all = baseline ? [...data, ...baseline] : data;
    const max = Math.max(...all, 1);
    const min = Math.min(...all, 0);
    const range = max - min || 1;

    const toPath = (xs: number[]) => {
      if (xs.length === 0) return "";
      const step = width / Math.max(xs.length - 1, 1);
      return xs
        .map((y, i) => {
          const px = i * step;
          const py = height - ((y - min) / range) * height;
          return `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
        })
        .join(" ");
    };

    const linePath = toPath(data);
    const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
    const baselinePath = baseline ? toPath(baseline) : "";

    return { path: linePath, area: areaPath, basePath: baselinePath };
  }, [data, baseline, width, height]);

  const gradId = useMemo(
    () => `spark-${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden
    >
      {fill && (
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {basePath && (
        <path
          d={basePath}
          stroke="var(--color-fg-dim)"
          strokeOpacity="0.4"
          strokeWidth={1}
          strokeDasharray="2 2"
          fill="none"
        />
      )}
      {fill && <path d={area} fill={`url(#${gradId})`} />}
      <motion.path
        d={path}
        stroke={color}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
      />
    </svg>
  );
}
