import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-ring inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[--radius-button] px-5 text-sm font-medium transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:brightness-110",
        secondary: "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:brightness-110",
        tonal: "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] hover:brightness-110",
        outline: "border border-[var(--md-sys-color-outline)] bg-transparent hover:bg-[var(--md-sys-color-surface-container-high)]",
        ghost: "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]",
        destructive: "bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] hover:brightness-110",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
