import { cn } from "@/lib/utils";
import type { PulseStatus } from "@/lib/types";

const STATUS_STYLES: Record<
  PulseStatus,
  { ring: string; dot: string; glow: string; label: string }
> = {
  trending: {
    ring: "ring-[--color-trending]",
    dot: "bg-[--color-trending]",
    glow: "shadow-[0_0_18px_var(--color-trending-glow)]",
    label: "Trending",
  },
  stagnant: {
    ring: "ring-[--color-stagnant]",
    dot: "bg-[--color-stagnant]",
    glow: "shadow-[0_0_14px_var(--color-stagnant-glow)]",
    label: "Stagnant",
  },
  low: {
    ring: "ring-[--color-low]",
    dot: "bg-[--color-low]",
    glow: "shadow-[0_0_14px_var(--color-low-glow)]",
    label: "Low interest",
  },
};

export function PulseDot({
  status,
  className,
}: {
  status: PulseStatus;
  className?: string;
}) {
  const s = STATUS_STYLES[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="relative inline-flex h-2 w-2 items-center justify-center">
        <span
          className={cn(
            "absolute inset-0 rounded-full opacity-60",
            s.dot,
            status === "trending" && "animate-pulse-ring"
          )}
        />
        <span className={cn("relative inline-block h-2 w-2 rounded-full", s.dot, s.glow)} />
      </span>
      <span className="text-[10px] uppercase tracking-wider text-[--color-fg-muted]">
        {s.label}
      </span>
    </span>
  );
}

export function getPulseRingClass(status: PulseStatus) {
  return cn(
    "ring-1 ring-inset transition-shadow duration-500",
    STATUS_STYLES[status].ring,
    status === "trending" && "shadow-[0_0_28px_-6px_var(--color-trending-glow)]"
  );
}
