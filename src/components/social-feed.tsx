"use client";

import { motion } from "motion/react";
import { Heart, Share2 } from "lucide-react";
import type { Mention } from "@/lib/types";
import { SentimentBadge } from "@/components/sentiment-badge";
import { formatCompactNumber, formatRelativeTime } from "@/lib/utils";

const PLATFORM_GLYPH: Record<Mention["platform"], string> = {
  instagram: "IG",
  tiktok: "TT",
  x: "X",
  youtube: "YT",
  forum: "FR",
};

export function SocialFeed({ mentions }: { mentions: Mention[] }) {
  return (
    <ul className="scroll-thin max-h-[640px] overflow-y-auto divide-y divide-[--color-border]/60 pr-1">
      {mentions.map((m, i) => (
        <motion.li
          key={m.id}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.02, duration: 0.3 }}
          className="px-3 py-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="rounded bg-[--color-surface-2] px-1.5 py-[1px] font-mono text-[--color-fg-muted]">
                {PLATFORM_GLYPH[m.platform]}
              </span>
              <span className="font-medium">@{m.authorHandle}</span>
              <span className="text-[--color-fg-dim]">
                · {formatCompactNumber(m.authorFollowers)}
              </span>
            </div>
            <SentimentBadge sentiment={m.sentiment} />
          </div>
          <p className="mt-1 text-sm leading-snug text-[--color-fg]">
            {m.excerpt}
          </p>
          <div className="mt-1 flex items-center gap-3 text-[10px] text-[--color-fg-dim]">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {formatCompactNumber(m.likes)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Share2 className="h-3 w-3" />
              {formatCompactNumber(m.shares)}
            </span>
            <span>{formatRelativeTime(m.postedAt)}</span>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
