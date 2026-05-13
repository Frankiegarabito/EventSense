import { Badge } from "@/components/ui/badge";
import type { SentimentLabel } from "@/lib/types";

const MAP: Record<SentimentLabel, { tone: "positive" | "neutral" | "negative"; glyph: string; label: string }> = {
  positive: { tone: "positive", glyph: "↑", label: "Hyped" },
  neutral: { tone: "neutral", glyph: "·", label: "Mixed" },
  negative: { tone: "negative", glyph: "↓", label: "Cold" },
};

export function SentimentBadge({ sentiment }: { sentiment: SentimentLabel }) {
  const m = MAP[sentiment];
  return (
    <Badge tone={m.tone}>
      <span className="text-[10px]">{m.glyph}</span>
      {m.label}
    </Badge>
  );
}
