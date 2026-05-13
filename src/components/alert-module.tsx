import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { daysUntil, yoYDelta, type EventSummary } from "@/lib/types";
import { formatPct } from "@/lib/utils";

export function AlertModule({ events }: { events: EventSummary[] }) {
  if (events.length === 0) return null;
  return (
    <section className="rounded-[14px] border border-[--color-low]/40 bg-[oklch(0.68_0.22_25/0.05)] p-4">
      <header className="flex items-center gap-2 text-[--color-low]">
        <AlertTriangle className="h-4 w-4" />
        <h2 className="text-sm font-medium">Action needed</h2>
      </header>
      <ul className="mt-2 divide-y divide-[--color-low]/15">
        {events.map((e) => {
          const yoY = yoYDelta(e);
          const slug = e.city.toLowerCase().replace(/\s+/g, "-");
          return (
            <li key={e.id} className="flex items-center justify-between py-2">
              <div className="text-sm">
                <span className="font-medium">{e.city}</span>{" "}
                <span className="text-[--color-fg-dim]">
                  is T-{daysUntil(e)}d
                </span>{" "}
                <span className="text-[--color-fg-muted]">
                  · search volume {formatPct(yoY, { signed: true })} vs last yr
                </span>
              </div>
              <Link
                href={`/events/${slug}`}
                className="inline-flex items-center gap-1 text-[11px] text-[--color-fg-muted] hover:text-[--color-fg]"
              >
                Boost
                <ArrowRight className="h-3 w-3" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
