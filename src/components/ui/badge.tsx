import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
  {
    variants: {
      tone: {
        neutral:
          "bg-[--color-surface-2] text-[--color-fg-muted] border border-[--color-border]",
        positive:
          "bg-[oklch(0.86_0.22_145/0.12)] text-[--color-pos] border border-[oklch(0.86_0.22_145/0.3)]",
        negative:
          "bg-[oklch(0.68_0.22_25/0.12)] text-[--color-neg] border border-[oklch(0.68_0.22_25/0.3)]",
        accent:
          "bg-[oklch(0.82_0.16_215/0.12)] text-[--color-accent] border border-[oklch(0.82_0.16_215/0.3)]",
        warning:
          "bg-[oklch(0.82_0.17_75/0.12)] text-[--color-stagnant] border border-[oklch(0.82_0.17_75/0.3)]",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
