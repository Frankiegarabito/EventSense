"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface SocialNoiseMeterProps {
  /** 0..100 */
  value: number;
  className?: string;
}

export function SocialNoiseMeter({ value, className }: SocialNoiseMeterProps) {
  const segments = 12;
  const active = Math.round((value / 100) * segments);
  return (
    <div
      className={cn("flex items-center gap-[3px]", className)}
      aria-label={`Social noise ${value} of 100`}
    >
      {Array.from({ length: segments }).map((_, i) => {
        const on = i < active;
        const intensity = i / segments;
        const color = on
          ? `oklch(${0.7 + intensity * 0.18} ${0.15 + intensity * 0.1} ${215 - intensity * 70})`
          : "var(--color-surface-3)";
        return (
          <motion.span
            key={i}
            initial={{ scaleY: 0.4, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ delay: i * 0.025, duration: 0.35 }}
            className="block h-3 w-[3px] rounded-[1px] origin-bottom"
            style={{ background: color }}
          />
        );
      })}
    </div>
  );
}
