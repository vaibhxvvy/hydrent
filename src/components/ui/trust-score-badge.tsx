"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  score: number;
  label?: string;
}

export function TrustScoreBadge({ score, label }: Props) {
  const level = score >= 70 ? "High" : score >= 50 ? "Medium" : "Low";
  const colorMap = {
    High: { bg: "bg-[var(--md-sys-color-primary)]/10", text: "text-[var(--md-sys-color-primary)]", border: "border-[var(--md-sys-color-primary)]/20" },
    Medium: { bg: "bg-[var(--md-sys-color-tertiary)]/10", text: "text-[var(--md-sys-color-tertiary)]", border: "border-[var(--md-sys-color-tertiary)]/20" },
    Low: { bg: "bg-[var(--md-sys-color-error)]/10", text: "text-[var(--md-sys-color-error)]", border: "border-[var(--md-sys-color-error)]/20" },
  };
  const c = colorMap[level];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`cursor-help inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${c.bg} ${c.text} ${c.border}`}>
          {score}/{label ? `100 · ${label}` : `100 · ${level}`}
        </span>
      </TooltipTrigger>
      <TooltipContent sideOffset={5} className="max-w-[240px] text-xs leading-relaxed z-50">
        <p>Trust score reflects how many submissions are verified closed deals vs asking rents. Higher = more reliable.</p>
        <a href="/how-data-works" className="text-[var(--md-sys-color-primary)] hover:underline mt-1 inline-block">Learn more →</a>
      </TooltipContent>
    </Tooltip>
  );
}
