"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const RANGES = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
  { id: "yoy", label: "vs last yr" },
] as const;

type RangeId = (typeof RANGES)[number]["id"];

export function TimeRangeSelector() {
  // TODO: lift into context once charts subscribe to the selection.
  const [active, setActive] = useState<RangeId>("30d");
  return (
    <div
      role="tablist"
      className="flex items-center gap-0.5 rounded-md border border-[--color-border] bg-[--color-surface]/80 p-0.5"
    >
      {RANGES.map((r) => (
        <button
          key={r.id}
          role="tab"
          aria-selected={active === r.id}
          onClick={() => setActive(r.id)}
          className={cn(
            "rounded-[6px] px-2.5 py-1 text-[11px] font-medium transition-colors",
            active === r.id
              ? "bg-[--color-surface-3] text-[--color-fg]"
              : "text-[--color-fg-muted] hover:text-[--color-fg]"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
