import { NextResponse } from "next/server";
import { MOCK_EVENTS } from "@/lib/mock-data";

/**
 * GET /api/events
 *
 * Returns the high-level list of upcoming shows. This is the swap-in seam
 * for real ticketing + analytics aggregators — when wiring up live data,
 * fan out to providers here and project into EventSummary[].
 */
export async function GET() {
  // Simulated provider latency keeps the loading states honest in dev.
  await new Promise((r) => setTimeout(r, 120));
  return NextResponse.json({ events: MOCK_EVENTS });
}
