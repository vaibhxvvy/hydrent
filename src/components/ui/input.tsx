import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "focus-ring flex h-10 w-full rounded-[--radius-input] border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-dim)] px-3 py-2 text-sm text-[var(--md-sys-color-on-surface)] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--md-sys-color-on-surface-variant)] disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
