import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { derivePulseStatus, daysUntil } from "@/lib/types";
import type {
  EventSummary,
  Platform,
  Tone,
  GenerateCaptionResponse,
} from "@/lib/types";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a car culture expert, social media copywriter, and local SEO writer who promotes Clean Culture — a premium car show brand running events across major US cities.

Platform norms (follow strictly):
- instagram: 150-300 chars, emoji-rich, 8-12 hashtags at end, affiliate code prominent, reference "link in bio"
- tiktok: Hook in first 3-5 words to grab attention, under 200 chars, 4-6 hashtags, urgent CTA
- x: Under 280 chars total including hashtags, 1-2 hashtags max, punchy and direct
- facebook: Conversational, 2-3 short paragraphs, 2-3 hashtags max, friendly tone
- reddit: NO hashtags ever, sounds like a genuine community member NOT a promoter, ends with a question to drive replies, 200-400 chars
- forum: Similar to reddit, uses gear-head vocabulary, casual and knowledgeable

Car culture vocabulary to weave in naturally: builds, fitment, stance, clean, low, tucked, hellaflush, JDM, domestic, euro, meet, cruise, show, pull up, turnout.

Always respond with valid JSON only — no markdown, no prose outside JSON.`;

const PLATFORM_NORM: Record<Platform, string> = {
  instagram: "Instagram (emoji-rich, 8-12 hashtags, 150-300 chars, link in bio)",
  tiktok: "TikTok (hook-first 3-5 words, under 200 chars, 4-6 hashtags, urgent CTA)",
  x: "X/Twitter (under 280 chars total, 1-2 hashtags, punchy)",
  facebook: "Facebook (conversational, 2-3 paragraphs, 2-3 hashtags max)",
  reddit: "Reddit (no hashtags, genuine community member tone, end with a question)",
  forum: "Car forum (gear-head vocab, casual, no hashtags)",
};

function buildPrompt(
  event: EventSummary,
  platform: Platform,
  tones: Tone[],
  affiliateCode: string,
  mode: "captions" | "article"
): string {
  const status = derivePulseStatus(event);
  const days = daysUntil(event);
  const toneStr = tones.length > 0 ? tones.join(", ") : "hype";

  const ctx = `Event: Clean Culture ${event.city}, ${event.state}
Venue: ${event.venue}
Date: ${event.date} (${days} days away)
Social noise score: ${event.social.noise}/100
Pulse status: ${status}
Affiliate/discount code: ${affiliateCode}
Platform: ${PLATFORM_NORM[platform]}
Tone: ${toneStr}`;

  if (mode === "article") {
    return `${ctx}

Write a long-form article (400-600 words) to boost SEO and event awareness. Structure:
1. SEO-friendly headline (include city name + "car show")
2. Hook intro paragraph
3. "What to expect" (2-3 paragraphs: builds, atmosphere, Clean Culture experience)
4. Practical details (date, venue, tickets at cleancultureevents.com)
5. CTA with code ${affiliateCode} embedded naturally

Return JSON: { "article": "<full article text with line breaks as \\n>" }`;
  }

  return `${ctx}

Generate exactly 3 caption variants for this platform. Each should take a different angle (e.g. hook-first, community voice, informational). Embed ${affiliateCode} naturally in each caption text (not just hashtags).

Also generate:
- whereToPost: 3-5 specific places to post this content (named subreddits, Facebook groups by city/interest, forums, event listing sites). Each entry needs a "reason" (why good fit) and optional "threadHint" for reddit/forum (e.g. "search 'car meets this weekend Miami' and reply to the top result").
- weekendReply: For reddit/forum platform only — an 80-120 char reply for existing "what to do this weekend" or "any car meets near [city]?" threads. Empty string for other platforms.

Return JSON:
{
  "captions": [
    { "variant": "string", "text": "string", "hashtags": ["string"], "charCount": number, "tags": ["string"] }
  ],
  "whereToPost": [
    { "name": "string", "type": "subreddit|facebook_group|forum|event_site", "reason": "string", "threadHint": "string" }
  ],
  "weekendReply": "string"
}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      event: EventSummary;
      platform: Platform;
      tones: Tone[];
      affiliateCode: string;
      mode?: "captions" | "article";
    };

    const { event, platform, tones, affiliateCode, mode = "captions" } = body;
    const code = affiliateCode || process.env.AFFILIATE_CODE || "YOUR_CODE";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: mode === "article" ? 1500 : 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: buildPrompt(event, platform, tones, code, mode) }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
    const parsed = JSON.parse(raw) as GenerateCaptionResponse;
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[generate-caption]", err);
    return NextResponse.json({ error: "Caption generation failed" }, { status: 500 });
  }
}
