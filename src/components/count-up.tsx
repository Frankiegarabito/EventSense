"use client";

import { animate, useMotionValue, useTransform, motion } from "motion/react";
import { useEffect } from "react";

interface CountUpProps {
  to: number;
  durationMs?: number;
  format?: (n: number) => string;
  className?: string;
}

export function CountUp({
  to,
  durationMs = 900,
  format = (n) => Math.round(n).toLocaleString(),
  className,
}: CountUpProps) {
  const mv = useMotionValue(0);
  const rendered = useTransform(mv, (v) => format(v));

  useEffect(() => {
    const controls = animate(mv, to, {
      duration: durationMs / 1000,
      ease: [0.25, 1, 0.5, 1],
    });
    return () => controls.stop();
  }, [to, durationMs, mv]);

  return <motion.span className={className}>{rendered}</motion.span>;
}
