import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[--radius-pill] px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]",
        secondary: "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]",
        outline: "border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)]",
        trust: "bg-[rgba(34,197,94,0.12)] text-[#22C55E] border border-[rgba(34,197,94,0.2)]",
        warning: "bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border border-[rgba(245,158,11,0.2)]",
        muted: "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
