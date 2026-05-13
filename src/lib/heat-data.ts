import {
  derivePulseStatus,
  type EventSummary,
  type HeatPoint,
  type HeatRegion,
} from "@/lib/types";
import { MOCK_EVENTS } from "@/lib/mock-data";

/**
 * Static reference: USPS code → FIPS code for the contiguous US + AK/HI.
 * Used to join EventSummary.state → topojson features.
 */
const STATE_FIPS: Record<string, string> = {
  AL: "01", AK: "02", AZ: "04", AR: "05", CA: "06", CO: "08",
  CT: "09", DE: "10", FL: "12", GA: "13", HI: "15", ID: "16",
  IL: "17", IN: "18", IA: "19", KS: "20", KY: "21", LA: "22",
  ME: "23", MD: "24", MA: "25", MI: "26", MN: "27", MS: "28",
  MO: "29", MT: "30", NE: "31", NV: "32", NH: "33", NJ: "34",
  NM: "35", NY: "36", NC: "37", ND: "38", OH: "39", OK: "40",
  OR: "41", PA: "42", RI: "44", SC: "45", SD: "46", TN: "47",
  TX: "48", UT: "49", VT: "50", VA: "51", WA: "53", WV: "54",
  WI: "55", WY: "56",
};

export function fipsForState(stateCode: string): string | undefined {
  return STATE_FIPS[stateCode];
}

/**
 * In production this comes from DataForSEO / Google Trends regional report.
 * For now we score states near upcoming events higher, with mild falloff to
 * neighbors so the map doesn't look like five disconnected pixels.
 */
const REGIONAL_OVERRIDES: Record<string, number> = {
  // Active markets
  GA: 86, FL: 92, CA: 81, TX: 64, AZ: 58,
  // Spillover / curious states
  AL: 54, SC: 48, NC: 42, TN: 40, LA: 36, NV: 44,
  NM: 32, OK: 28, NY: 22, IL: 18, OH: 14, WA: 16,
};

export function buildRegionalHeat(): HeatRegion[] {
  return Object.entries(STATE_FIPS).map(([stateCode, fips]) => ({
    stateCode,
    fips,
    intensity: REGIONAL_OVERRIDES[stateCode] ?? 6,
  }));
}

/**
 * Project events to glow markers. Magnitude is a composite of social noise
 * and current 7-day search velocity, both normalized.
 */
export function buildEventPoints(
  events: EventSummary[] = MOCK_EVENTS
): HeatPoint[] {
  const peakVelocity = Math.max(
    ...events.flatMap((e) => e.search.velocity.slice(-7))
  );
  return events.map((e) => {
    const recentVelocity =
      e.search.velocity.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const velocityScore =
      peakVelocity === 0 ? 0 : (recentVelocity / peakVelocity) * 100;
    const magnitude = Math.round(0.5 * velocityScore + 0.5 * e.social.noise);
    return {
      eventId: e.id,
      city: e.city,
      lat: e.lat,
      lng: e.lng,
      magnitude,
      status: derivePulseStatus(e),
    };
  });
}
