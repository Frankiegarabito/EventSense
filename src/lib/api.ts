import type { EventSummary } from "@/lib/types";

/**
 * Client-side fetch helpers. All UI components funnel through these so the
 * data layer can swap to RSC streaming, server actions, or a real backend
 * without component rewrites.
 */

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  if (!res.ok) throw new Error(`fetch failed: ${res.status} ${url}`);
  return res.json();
}

export async function fetchEvents(): Promise<EventSummary[]> {
  const data = await fetchJson<{ events: EventSummary[] }>("/api/events");
  return data.events;
}

export async function fetchEventByCity(city: string): Promise<EventSummary> {
  const data = await fetchJson<{ event: EventSummary }>(
    `/api/events/${encodeURIComponent(city)}`
  );
  return data.event;
}
