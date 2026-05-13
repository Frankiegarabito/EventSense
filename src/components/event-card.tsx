"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Calendar, MapPin } from "lucide-react";
import {
  derivePulseStatus,
  yoYDelta,
  daysUntil,
  type EventSummary,
} from "@/lib/types";
import { cn, formatCompactNumber, formatPct, formatShortDate } from "@/lib/utils";
import { Sparkline } from "@/components/sparkline";
import { SocialNoiseMeter } from "@/components/social-noise-meter";
import { PulseDot, getPulseRingClass } from "@/components/pulse-ring";
import { CountUp } from "@/components/count-up";

const STATUS_ACCENT: Record<
  ReturnType<typeof derivePulseStatus>,
  { stroke: string }
> = {
  trending: { stroke: "var(--color-trending)" },
  stagnant: { stroke: "var(--color-stagnant)" },
  low: { stroke: "var(--color-low)" },
};

export function EventCard({
  event,
  index = 0,
}: {
  event: EventSummary;
  index?: number;
}) {
  const status = derivePulseStatus(event);
  const yoY = yoYDelta(event);
  const dDays = daysUntil(event);
  const slug = event.city.toLowerCase().replace(/\s+/g, "-");

  return (
    <motion.div
      layoutId={`event-${event.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: index * 0.05,
        ease: [0.25, 1, 0.5, 1],
      }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative overflow-hidden rounded-[14px] border border-[--color-border]",
        "bg-[--color-surface]",
        "transition-colors hover:border-[--color-border-strong]",
        getPulseRingClass(status)
      )}
    >
      <Link
        href={`/events/${slug}`}
        className="block p-4 focus:outline-none"
        aria-label={`Open ${event.city} deep dive`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[--color-fg-dim] text-[11px]">
              <MapPin className="h-3 w-3" />
              {event.state}
            </div>
            <h3 className="mt-0.5 text-base font-semibold tracking-tight">
              {event.city}
            </h3>
          </div>
          <PulseDot status={status} />
        </div>

        {/* Date row */}
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[--color-fg-muted]">
          <Calendar className="h-3 w-3" />
          <span>{formatShortDate(event.date)}</span>
          <span className="text-[--color-fg-dim]">·</span>
          <span className="text-[--color-fg-dim]">T-{dDays}d</span>
        </div>

        {/* Velocity */}
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">
              Search velocity
            </span>
            <span
              className={cn(
                "text-[11px] font-medium",
                yoY > 0.05 && "text-[--color-trending]",
                yoY < -0.05 && "text-[--color-low]",
                yoY >= -0.05 && yoY <= 0.05 && "text-[--color-fg-muted]"
              )}
            >
              {formatPct(yoY, { signed: true })} YoY
            </span>
          </div>
          <div className="mt-1">
            <Sparkline
              data={event.search.velocity}
              baseline={event.search.velocityPriorYear}
              color={STATUS_ACCENT[status].stroke}
              width={188}
              height={42}
            />
          </div>
        </div>

        {/* Social noise + projected attendance */}
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">
              Social noise
            </div>
            <SocialNoiseMeter value={event.social.noise} className="mt-1.5" />
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-[--color-fg-dim]">
              Projected
            </div>
            <div className="text-base font-semibold leading-tight tabular-nums">
              <CountUp
                to={event.projectedAttendance}
                format={formatCompactNumber}
              />
            </div>
            <div className="text-[10px] text-[--color-fg-dim]">
              last yr {formatCompactNumber(event.attendanceLastYear)}
            </div>
          </div>
        </div>

        {/* CTA hint */}
        <div
          className={cn(
            "mt-4 flex items-center gap-1 text-[11px] text-[--color-fg-muted]",
            "opacity-60 transition-opacity group-hover:opacity-100"
          )}
        >
          Open deep dive
          <ArrowUpRight className="h-3 w-3" />
        </div>
      </Link>
    </motion.div>
  );
}
