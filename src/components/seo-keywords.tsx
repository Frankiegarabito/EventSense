import type { KeywordEntry } from "@/lib/types";
import { cn, formatCompactNumber, formatPct } from "@/lib/utils";

export function SeoKeywords({ keywords }: { keywords: KeywordEntry[] }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-[--color-border]">
      <table className="w-full text-sm">
        <thead className="bg-[--color-surface-2] text-[10px] uppercase tracking-wider text-[--color-fg-dim]">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Query</th>
            <th className="px-3 py-2 text-right font-medium">Impr.</th>
            <th className="px-3 py-2 text-right font-medium">CTR</th>
            <th className="px-3 py-2 text-right font-medium">Pos.</th>
            <th className="px-3 py-2 text-right font-medium">Δ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[--color-border]/60">
          {keywords.map((k) => (
            <tr key={k.query}>
              <td className="px-3 py-2 font-medium text-[--color-fg]">
                {k.query}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-[--color-fg-muted]">
                {formatCompactNumber(k.impressions)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-[--color-fg-muted]">
                {(k.ctr * 100).toFixed(1)}%
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-[--color-fg-muted]">
                {k.position.toFixed(1)}
              </td>
              <td
                className={cn(
                  "px-3 py-2 text-right tabular-nums",
                  k.changePct > 0.05 && "text-[--color-trending]",
                  k.changePct < -0.05 && "text-[--color-low]",
                  k.changePct >= -0.05 &&
                    k.changePct <= 0.05 &&
                    "text-[--color-fg-muted]"
                )}
              >
                {formatPct(k.changePct, { signed: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
