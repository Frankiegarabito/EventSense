"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Flame,
  Globe2,
  LayoutGrid,
  Megaphone,
  Settings,
} from "lucide-react";
import { TimeRangeSelector } from "@/components/time-range-selector";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Events", icon: LayoutGrid },
  { href: "/heat-map", label: "Heat map", icon: Globe2 },
  { href: "/sentiment", label: "Sentiment", icon: Flame },
  { href: "/referrals", label: "Referrals", icon: Megaphone },
  { href: "/activity", label: "Live activity", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="grid min-h-screen grid-cols-[220px_1fr]">
      <aside className="border-r border-[--color-border]/70 bg-[--color-surface]/40 backdrop-blur-md">
        <div className="px-5 pt-5 pb-7">
          <Link href="/" className="flex items-center gap-2">
            <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-md bg-[--color-accent]/15">
              <span className="absolute inset-0 rounded-md ring-1 ring-[--color-accent]/40 glow-accent" />
              <Flame className="h-4 w-4 text-[--color-accent]" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              EventSense
              <span className="ml-1 text-[10px] uppercase tracking-[0.18em] text-[--color-fg-dim]">
                · CC
              </span>
            </span>
          </Link>
        </div>
        <nav className="px-3 flex flex-col gap-0.5">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-[--color-surface-2] text-[--color-fg]"
                    : "text-[--color-fg-muted] hover:bg-[--color-surface-2]/60 hover:text-[--color-fg]"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-4 text-[11px] text-[--color-fg-dim]">
          <p className="leading-relaxed">
            Vibe & visibility for Clean Culture shows. Data refreshes every 15
            min.
          </p>
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[--color-border]/70 bg-[--color-bg]/70 px-6 backdrop-blur-md">
          <div className="flex items-baseline gap-3">
            <h1 className="text-sm font-medium text-[--color-fg]">
              Social Pulse
            </h1>
            <span className="text-[11px] text-[--color-fg-dim]">
              Updated 2 min ago
            </span>
          </div>
          <TimeRangeSelector />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
