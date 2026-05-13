"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/lib/api";
import { derivePulseStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "eventsense:settings";

interface Settings {
  refreshInterval: "5m" | "15m" | "30m" | "1h";
  alertLowPulse: boolean;
}

const DEFAULT_SETTINGS: Settings = { refreshInterval: "15m", alertLowPulse: true };
const REFRESH_OPTIONS = ["5m", "15m", "30m", "1h"] as const;

const DATA_SOURCES = [
  { name: "Google Search Console", key: "gsc" },
  { name: "Instagram Graph API", key: "ig" },
  { name: "TikTok Research API", key: "tiktok" },
  { name: "GA4 / Plausible", key: "ga4" },
  { name: "Claude (Haiku)", key: "claude" },
] as const;

const PULSE_LABEL: Record<string, string> = {
  trending: "text-[--color-trending]",
  stagnant: "text-[--color-stagnant]",
  low: "text-[--color-low]",
};

export function SettingsView() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
    } catch {}
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  return (
    <div className="space-y-5 max-w-2xl">
      <section className="rounded-[14px] border border-[--color-border] bg-[--color-surface] p-4">
        <h2 className="text-sm font-semibold mb-4">Data Sources</h2>
        <div className="space-y-2">
          {DATA_SOURCES.map((src) => (
            <div key={src.key} className="flex items-center gap-3 rounded-lg bg-[--color-surface-2] px-3 py-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[--color-stagnant] flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{src.name}</span>
              <span className="text-[10px] text-[--color-fg-dim]">Mock</span>
              <button disabled className="text-[10px] px-2.5 py-1 rounded-md border border-[--color-border] text-[--color-fg-dim] opacity-50 cursor-not-allowed">
                Connect →
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[14px] border border-[--color-border] bg-[--color-surface] p-4">
        <h2 className="text-sm font-semibold mb-4">Refresh & Alerts</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[--color-fg-muted]">Data refresh interval</span>
            <div className="flex gap-1 rounded-md border border-[--color-border] bg-[--color-surface-2] p-0.5">
              {REFRESH_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => update("refreshInterval", opt)}
                  className={cn(
                    "rounded-[5px] px-2.5 py-1 text-[10px] font-medium transition-colors",
                    settings.refreshInterval === opt
                      ? "bg-[--color-surface-3] text-[--color-fg]"
                      : "text-[--color-fg-muted] hover:text-[--color-fg]"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[--color-fg-muted]">Alert on low pulse</div>
              <div className="text-[10px] text-[--color-fg-dim]">composite &lt; 0.85</div>
            </div>
            <button
              role="switch"
              aria-checked={settings.alertLowPulse}
              onClick={() => update("alertLowPulse", !settings.alertLowPulse)}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                settings.alertLowPulse ? "bg-[--color-accent]" : "bg-[--color-surface-3]"
              )}
            >
              <span className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                settings.alertLowPulse ? "translate-x-4" : "translate-x-0.5"
              )} />
            </button>
          </div>

          <div className="flex items-center justify-between opacity-50">
            <div>
              <div className="text-sm text-[--color-fg-muted]">Email digest</div>
              <div className="text-[10px] text-[--color-fg-dim]">Coming soon</div>
            </div>
            <div className="h-5 w-9 rounded-full bg-[--color-surface-3]" />
          </div>
        </div>
      </section>

      <section className="rounded-[14px] border border-[--color-border] bg-[--color-surface] p-4">
        <h2 className="text-sm font-semibold mb-4">Tracked Events</h2>
        <div className="space-y-1.5">
          {events.map((e) => {
            const status = derivePulseStatus(e);
            return (
              <div key={e.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[--color-surface-2]">
                <span className="text-sm flex-1">
                  {e.city}, {e.state}
                  <span className="ml-2 text-[10px] text-[--color-fg-dim]">
                    · {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </span>
                <span className={cn("text-[10px] font-semibold capitalize", PULSE_LABEL[status])}>
                  {status}
                </span>
              </div>
            );
          })}
        </div>
        <button disabled className="mt-3 text-[11px] px-3 py-1.5 rounded-lg border border-[--color-border] text-[--color-fg-dim] opacity-50 cursor-not-allowed">
          + Add event
        </button>
      </section>
    </div>
  );
}
