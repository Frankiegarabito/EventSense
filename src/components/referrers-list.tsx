import { ExternalLink, Zap } from "lucide-react";
import type { Referrer } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn, formatCompactNumber, formatPct } from "@/lib/utils";

export function ReferrersList({ referrers }: { referrers: Referrer[] }) {
  return (
    <ul className="divide-y divide-[--color-border]/60 rounded-[10px] border border-[--color-border] overflow-hidden">
      {referrers
        .slice()
        .sort((a, b) => b.visits - a.visits)
        .map((r) => (
          <li
            key={r.domain}
            className={cn(
              "flex items-center justify-between px-3 py-2.5",
              r.isPower && "bg-[oklch(0.82_0.16_215/0.05)]"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[--color-fg-dim]" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {r.domain}
                  </span>
                  {r.isPower && (
                    <Badge tone="accent">
                      <Zap className="h-2.5 w-2.5" />
                      Power
                    </Badge>
                  )}
                </div>
                <div className="text-[11px] text-[--color-fg-dim] truncate">
                  {r.url}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0 pl-3">
              <div className="text-sm tabular-nums font-medium">
                {formatCompactNumber(r.visits)}
              </div>
              <div className="text-[11px] text-[--color-fg-dim] tabular-nums">
                {formatPct(r.sharePct)}
              </div>
            </div>
          </li>
        ))}
    </ul>
  );
}
