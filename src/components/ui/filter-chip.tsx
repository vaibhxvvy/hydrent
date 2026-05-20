"use client";

import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "default";
}

export function FilterChip({ label, active, onClick, className, size = "default" }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-[--radius-pill] font-medium transition-all duration-150 active:scale-95",
        active
          ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
          : "border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]",
        size === "sm" ? "h-7 px-3 text-xs" : "h-9 px-4 text-sm",
        className,
      )}
    >
      {label}
    </button>
  );
}
