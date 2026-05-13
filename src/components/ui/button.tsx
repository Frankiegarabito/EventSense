import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[--color-accent] text-[--color-bg] hover:brightness-110",
        ghost:
          "bg-transparent text-[--color-fg-muted] hover:bg-[--color-surface-2] hover:text-[--color-fg]",
        outline:
          "border border-[--color-border-strong] text-[--color-fg] bg-transparent hover:bg-[--color-surface-2]",
      },
      size: {
        sm: "h-7 px-2.5 rounded-md",
        md: "h-9 px-3.5 rounded-md",
        lg: "h-10 px-4 rounded-lg",
        icon: "h-8 w-8 rounded-md",
      },
    },
    defaultVariants: { variant: "ghost", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
