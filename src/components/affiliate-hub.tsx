"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/lib/api";
import { derivePulseStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { EventSummary, Platform, Tone, GenerateCaptionResponse } from "@/lib/types";

const PLATFORMS: { id: Platform; emoji: string; label: string }[] = [
  { id: "instagram", emoji: "📸", label: "Instagram" },
  { id: "tiktok", emoji: "🎵", label: "TikTok" },
  { id: "x", emoji: "𝕏", label: "X" },
  { id: "facebook", emoji: "👥", label: "Facebook" },
  { id: "reddit", emoji: "🤖", label: "Reddit" },
  { id: "forum", emoji: "🏁", label: "Forum" },
];

const TONES: { id: Tone; label: string }[] = [
  { id: "hype", label: "Hype 🔥" },
  { id: "hook-first", label: "Hook-first" },
  { id: "community", label: "Community" },
  { id: "chill", label: "Chill" },
];

const PULSE_DOT: Record<string, string> = {
  trending: "bg-[--color-trending] shadow-[0_0_6px_var(--color-trending-glow)]",
  stagnant: "bg-[--color-stagnant]",
  low: "bg-[--color-low]",
};

export function AffiliateHub({ affiliateCode }: { affiliateCode: string }) {
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [tones, setTones] = useState<Tone[]>(["hype"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerateCaptionResponse | null>(null);
  const [mode, setMode] = useState<"captions" | "article">("captions");
  const [copied, setCopied] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  function toggleTone(tone: Tone) {
    setTones((prev) => {
      if (prev.includes(tone)) return prev.length > 1 ? prev.filter((t) => t !== tone) : prev;
      return [...prev, tone];
    });
  }

  async function generate(activeMode: "captions" | "article") {
    if (!selectedEvent) return;
    setMode(activeMode);
    setIsGenerating(true);
    setResult(null);
    setGenerateError(null);
    try {
      const res = await fetch("/api/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: selectedEvent, platform, tones, affiliateCode, mode: activeMode }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard unavailable or permission denied — do not show "Copied!"
    }
  }

  const isLow = selectedEvent ? derivePulseStatus(selectedEvent) === "low" : false;

  return (
    <div className="grid grid-cols-[300px_1fr] min-h-[calc(100vh-112px)] -m-6">
      {/* Left panel */}
      <aside className="border-r border-[--color-border] p-5 flex flex-col gap-6 overflow-y-auto">
        <div>
          <div className="text-[9px] uppercase tracking-[0.14em] text-[--color-fg-dim] mb-3">1 — Pick an event</div>
          <div className="space-y-2">
            {events.map((e) => {
              const status = derivePulseStatus(e);
              const isSelected = selectedEvent?.id === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => { setSelectedEvent(e); setResult(null); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-[9px] border px-3 py-2 text-left transition-colors",
                    isSelected
                      ? "border-[--color-accent] bg-[rgba(56,200,240,0.06)]"
                      : "border-[--color-border] bg-[--color-surface-2] hover:border-[--color-border-strong]"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full flex-shrink-0", PULSE_DOT[status])} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[11px] font-semibold">{e.city}, {e.state}</span>
                    <span className="block text-[9px] text-[--color-fg-dim]">
                      {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {status === "low" && (
                        <span className="ml-1.5 inline-flex items-center rounded px-1.5 py-0.5 text-[8px] font-bold bg-[--color-stagnant]/20 text-[--color-stagnant]">Needs boost</span>
                      )}
                    </span>
                  </span>
                  <span className="text-[9px] text-[--color-fg-muted] flex-shrink-0">Noise {e.social.noise}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[9px] uppercase tracking-[0.14em] text-[--color-fg-dim] mb-3">2 — Platform</div>
          <div className="grid grid-cols-3 gap-1.5">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => { setPlatform(p.id); setResult(null); }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[9px] border py-2 text-[9px] transition-colors",
                  platform === p.id
                    ? "border-[--color-accent] bg-[rgba(56,200,240,0.08)] text-[--color-accent]"
                    : "border-[--color-border] bg-[--color-surface-2] text-[--color-fg-muted] hover:border-[--color-border-strong]"
                )}
              >
                <span className="text-base leading-none">{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[9px] uppercase tracking-[0.14em] text-[--color-fg-dim] mb-3">3 — Tone</div>
          <div className="flex flex-wrap gap-1.5">
            {TONES.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTone(t.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] border transition-colors",
                  tones.includes(t.id)
                    ? "border-[--color-accent] bg-[rgba(56,200,240,0.1)] text-[--color-accent]"
                    : "border-[--color-border] bg-[--color-surface-2] text-[--color-fg-muted] hover:text-[--color-fg]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => generate("captions")}
          disabled={!selectedEvent || isGenerating}
          className={cn(
            "mt-auto w-full rounded-[10px] py-2.5 text-[12px] font-bold transition-opacity",
            "bg-[--color-accent] text-[#0a0a14] shadow-[0_0_20px_rgba(56,200,240,0.25)]",
            (!selectedEvent || isGenerating) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isGenerating ? "Generating…" : "✦ Generate Captions"}
        </button>
      </aside>

      {/* Right panel */}
      <main className="p-6 overflow-y-auto space-y-4">
        {/* Affiliate code badge */}
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-[--color-fg-muted]">
            {selectedEvent
              ? `${PLATFORMS.find((p) => p.id === platform)?.label} · ${selectedEvent.city}`
              : "Select an event to start"}
          </h1>
          <div className="flex items-center gap-2 bg-[--color-surface-2] border border-[--color-border] rounded-lg px-3 py-1.5">
            <span className="text-[9px] uppercase tracking-wider text-[--color-fg-dim]">Your code</span>
            <span className="text-sm font-black text-[--color-accent] font-mono tracking-widest">{affiliateCode}</span>
          </div>
        </div>

        {/* Low-pulse article banner */}
        {isLow && selectedEvent && !isGenerating && (
          <div className="rounded-[10px] border border-[--color-stagnant]/40 bg-[rgba(251,191,36,0.07)] px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-[11px] text-[--color-stagnant]">
              ⚠ This event needs a boost — generate a long-form article for blogs & listings?
            </p>
            <button
              onClick={() => generate("article")}
              className="flex-shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[--color-stagnant]/20 text-[--color-stagnant] hover:bg-[--color-stagnant]/30 transition-colors"
            >
              Generate Article →
            </button>
          </div>
        )}

        {/* Error state */}
        {generateError && !isGenerating && (
          <div className="rounded-[10px] border border-[--color-neg]/40 bg-[--color-neg]/5 px-4 py-3">
            <p className="text-[11px] text-[--color-neg]">⚠ {generateError}</p>
          </div>
        )}

        {/* Empty state */}
        {!result && !isGenerating && !generateError && (
          <div className="flex items-center justify-center h-64 text-[--color-fg-dim] text-sm">
            {selectedEvent ? "Hit Generate to create captions" : "Select an event to get started"}
          </div>
        )}

        {/* Loading skeleton */}
        {isGenerating && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-[12px] border border-[--color-border] bg-[--color-surface]/60 animate-pulse" />
            ))}
          </div>
        )}

        {/* Caption output */}
        {result && !isGenerating && mode === "captions" && (
          <>
            {result.captions?.map((cap, i) => (
              <div key={i} className="rounded-[12px] border border-[--color-border] bg-[--color-surface] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[--color-border] bg-[--color-surface-2]">
                  <span className="text-[9px] uppercase tracking-[0.12em] text-[--color-fg-dim]">
                    Variant {i + 1} · {cap.variant}
                  </span>
                  <div className="flex gap-1">
                    {cap.tags?.map((tag) => (
                      <span key={tag} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[rgba(56,200,240,0.12)] text-[--color-accent]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="px-4 py-3 text-[12px] leading-relaxed">
                  <span className="whitespace-pre-wrap">{cap.text}</span>
                  {cap.hashtags && cap.hashtags.length > 0 && (
                    <div className="mt-2 text-[11px] text-[--color-fg-muted]">
                      {cap.hashtags.join(" ")}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between px-4 py-2 border-t border-[--color-border]">
                  <span className="text-[9px] text-[--color-fg-dim]">{cap.charCount} chars</span>
                  <button
                    onClick={() => copy(
                      cap.text + (cap.hashtags?.length ? "\n" + cap.hashtags?.join(" ") : ""),
                      `cap-${i}`
                    )}
                    className={cn(
                      "text-[10px] font-semibold px-2.5 py-1 rounded-md border transition-colors",
                      copied === `cap-${i}`
                        ? "border-[--color-trending] text-[--color-trending]"
                        : "border-[--color-border] text-[--color-fg-muted] hover:text-[--color-accent] hover:border-[--color-accent]"
                    )}
                  >
                    {copied === `cap-${i}` ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            ))}

            {/* Where to post */}
            {result.whereToPost?.length > 0 && (
              <div className="rounded-[12px] border border-[--color-border] bg-[--color-surface] overflow-hidden">
                <div className="px-4 py-3 border-b border-[--color-border] bg-[--color-surface-2]">
                  <h3 className="text-sm font-semibold">Where to Post</h3>
                  <p className="text-[10px] text-[--color-fg-dim]">Ranked recommendations for this event + platform</p>
                </div>
                <div className="divide-y divide-[--color-border]/40">
                  {result.whereToPost.map((w, i) => (
                    <div key={i} className="px-4 py-3 flex items-start gap-3">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[--color-surface-3] text-[--color-fg-dim] mt-0.5 flex-shrink-0 uppercase tracking-wide">
                        {w.type.replace("_", " ")}
                      </span>
                      <div>
                        <div className="text-[11px] font-semibold">{w.name}</div>
                        <div className="text-[10px] text-[--color-fg-muted] mt-0.5">{w.reason}</div>
                        {w.threadHint && (
                          <div className="text-[10px] text-[--color-accent] mt-1">💡 {w.threadHint}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekend reply */}
            {result.weekendReply && (
              <div className="rounded-[12px] border border-[--color-border] bg-[--color-surface] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[--color-border] bg-[--color-surface-2]">
                  <div>
                    <h3 className="text-sm font-semibold">&ldquo;What to do this weekend&rdquo; Reply</h3>
                    <p className="text-[10px] text-[--color-fg-dim]">Paste into existing weekend-plans threads</p>
                  </div>
                  <button
                    onClick={() => copy(result.weekendReply!, "reply")}
                    className={cn(
                      "text-[10px] font-semibold px-2.5 py-1 rounded-md border transition-colors",
                      copied === "reply"
                        ? "border-[--color-trending] text-[--color-trending]"
                        : "border-[--color-border] text-[--color-fg-muted] hover:text-[--color-accent] hover:border-[--color-accent]"
                    )}
                  >
                    {copied === "reply" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="px-4 py-3 text-[12px] leading-relaxed">{result.weekendReply}</div>
              </div>
            )}
          </>
        )}

        {/* Article output */}
        {result && !isGenerating && mode === "article" && result.article && (
          <div className="rounded-[12px] border border-[--color-border] bg-[--color-surface] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[--color-border] bg-[--color-surface-2]">
              <div>
                <h3 className="text-sm font-semibold">Long-form Article</h3>
                <p className="text-[10px] text-[--color-fg-dim]">Submit to local blogs, Do512, Eventbrite editorial, car culture publications</p>
              </div>
              <button
                onClick={() => copy(result.article!, "article")}
                className={cn(
                  "text-[10px] font-semibold px-2.5 py-1 rounded-md border transition-colors",
                  copied === "article"
                    ? "border-[--color-trending] text-[--color-trending]"
                    : "border-[--color-border] text-[--color-fg-muted] hover:text-[--color-accent] hover:border-[--color-accent]"
                )}
              >
                {copied === "article" ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="px-4 py-4 text-[12px] leading-relaxed whitespace-pre-wrap">{result.article}</div>
          </div>
        )}
      </main>
    </div>
  );
}
