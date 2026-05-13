import { NextResponse } from "next/server";
import { findEventByCity } from "@/lib/mock-data";

/**
 * GET /api/events/[city]
 *
 * Returns the full deep-dive payload for a single city. In production this
 * is where Google Search Console + IG Graph + TikTok Research API responses
 * would be merged into a single EventSummary.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ city: string }> }
) {
  const { city } = await params;
  await new Promise((r) => setTimeout(r, 80));
  const event = findEventByCity(city);
  if (!event) {
    return NextResponse.json({ error: "event_not_found" }, { status: 404 });
  }
  return NextResponse.json({ event });
}
