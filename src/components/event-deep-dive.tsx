"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { fetchEventByCity } from "@/lib/api";
import {
  daysUntil,
  derivePulseStatus,
  yoYDelta,
} from "@/lib/types";
import { formatCompactNumber, formatDate, formatPct } from "@/lib/utils";
import { HistoricalChart } from "@/components/historical-chart";
import { PulseDot } from "@/components/pulse-ring";
import { CountUp } from "@/components/count-up";
import { SocialFeed } from "@/components/social-feed";
import { SeoKeywords } from "@/components/seo-keywords";
import { ReferrersList } from "@/components/referrers-list";

export function EventDeepDive({ city }: { city: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["event", city],
    queryFn: () => fetchEventByCity(city),
  });

  if (isLoading) return <DeepDiveSkeleton />;
  if (error || !data) {
    return (
      <div className="rounded-md border border-[--color-low]/30 bg-[--color-low]/5 p-4 text-sm text-[--color-low]">
        Couldn&apos;t load this event.
      </div>
    );
  }

  const status = derivePulseStatus(data);
  const yoY = yoYDelta(data);
  const sentimentTotal =
    data.social.sentiment.positive +
    data.social.sentiment.neutral +
    data.social.sentiment.negative;

  return (
    <motion.div
      layoutId={`event-${data.id}`}
      className="space-y-5"
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-[11px] text-[--color-fg-muted] hover:text-[--color-fg]"
      >
        <ArrowLeft className="h-3 w-3" />
        All events
      </Link>

      {/* Hero */}
      <section className="rounded-[14px] border border-[--color-border] bg-[--color-surface] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-[--color-fg-dim]">
              <MapPin className="h-3 w-3" />
              {data.state} · {data.venue}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {data.city}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-[12px] text-[--color-fg-muted]">
              <Calendar className="h-3 w-3" />
              {formatDate(data.date)}{" "}
              <span className="text-[--color-fg-dim]">
                · T-{daysUntil(data)}d
              </span>
            </div>
          </div>
          <PulseDot status={status} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
          <Stat label="Projected attendance">
            <CountUp to={data.projectedAttendance} format={formatCompactNumber} />
            <span className="ml-1 text-[11px] text-[--color-fg-dim]">
              vs {formatCompactNumber(data.attendanceLastYear)}
            </span>
          </Stat>
          <Stat label="Search YoY" accent={yoY >= 0 ? "pos" : "neg"}>
            {formatPct(yoY, { signed: true })}
          </Stat>
          <Stat label="Social noise">
            <CountUp to={data.social.noise} />
            <span className="ml-0.5 text-[--color-fg-dim]">/100</span>
          </Stat>
          <Stat label="Share ratio">
            {(data.social.shareRatio * 100).toFixed(1)}%
          </Stat>
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">
              Search velocity vs last year
            </span>
            <span className="text-[10px] text-[--color-fg-dim]">
              Dashed line · prior year same window
            </span>
          </div>
          <div className="mt-2">
            <HistoricalChart event={data} />
          </div>
        </div>
      </section>

      {/* Two-column */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-[14px] border border-[--color-border] bg-[--color-surface]">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[--color-border]/60">
            <div>
              <h2 className="text-sm font-medium">Mentions</h2>
              <p className="text-[11px] text-[--color-fg-dim]">
                {data.social.mentions.length} recent · across IG, TikTok, X,
                forums
              </p>
            </div>
            <SentimentSummary breakdown={data.social.sentiment} total={sentimentTotal} />
          </header>
          <SocialFeed mentions={data.social.mentions} />
        </section>

        <section className="space-y-5">
          <div className="rounded-[14px] border border-[--color-border] bg-[--color-surface] p-4">
            <header className="mb-3 flex items-baseline justify-between">
              <div>
                <h2 className="text-sm font-medium">Entry keywords</h2>
                <p className="text-[11px] text-[--color-fg-dim]">
                  Top driving organic traffic, last 30d
                </p>
              </div>
            </header>
            <SeoKeywords keywords={data.search.topKeywords} />
          </div>
          <div className="rounded-[14px] border border-[--color-border] bg-[--color-surface] p-4">
            <header className="mb-3 flex items-baseline justify-between">
              <div>
                <h2 className="text-sm font-medium">Referring sites</h2>
                <p className="text-[11px] text-[--color-fg-dim]">
                  Power referrals are highlighted
                </p>
              </div>
            </header>
            <ReferrersList referrers={data.referrers} />
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function Stat({
  label,
  children,
  accent,
}: {
  label: string;
  children: React.ReactNode;
  accent?: "pos" | "neg";
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">
        {label}
      </div>
      <div
        className={
          "mt-1 text-xl font-semibold tabular-nums " +
          (accent === "pos"
            ? "text-[--color-trending]"
            : accent === "neg"
              ? "text-[--color-low]"
              : "text-[--color-fg]")
        }
      >
        {children}
      </div>
    </div>
  );
}

function SentimentSummary({
  breakdown,
  total,
}: {
  breakdown: { positive: number; neutral: number; negative: number };
  total: number;
}) {
  const seg = [
    { v: breakdown.positive / total, color: "var(--color-pos)" },
    { v: breakdown.neutral / total, color: "var(--color-neu)" },
    { v: breakdown.negative / total, color: "var(--color-neg)" },
  ];
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-1.5 w-28 overflow-hidden rounded-full bg-[--color-surface-2]">
        {seg.map((s, i) => (
          <span
            key={i}
            style={{ width: `${s.v * 100}%`, background: s.color }}
          />
        ))}
      </div>
      <span className="text-[10px] text-[--color-fg-dim] tabular-nums">
        {(breakdown.positive * 100).toFixed(0)}%+
      </span>
    </div>
  );
}

function DeepDiveSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-44 rounded-[14px] border border-[--color-border] bg-[--color-surface]/60 animate-pulse" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="h-[420px] rounded-[14px] border border-[--color-border] bg-[--color-surface]/60 animate-pulse" />
        <div className="h-[420px] rounded-[14px] border border-[--color-border] bg-[--color-surface]/60 animate-pulse" />
      </div>
    </div>
  );
}
