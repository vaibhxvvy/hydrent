import { cn } from "@/lib/utils";
import { ShieldCheck, TriangleAlert, HelpCircle } from "lucide-react";

interface ConfidenceIndicatorProps {
  score: number;
  sampleSize: number;
  compact?: boolean;
  className?: string;
}

function getLevel(score: number) {
  if (score >= 70) return { label: "High", color: "#14B8A6", icon: ShieldCheck };
  if (score >= 40) return { label: "Medium", color: "#F59E0B", icon: TriangleAlert };
  return { label: "Low", color: "#FFB4AB", icon: HelpCircle };
}

export function ConfidenceIndicator({ score, sampleSize, compact, className }: ConfidenceIndicatorProps) {
  const level = getLevel(score);
  const Icon = level.icon;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Icon className="size-3.5" style={{ color: level.color }} />
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
            {level.label} confidence
          </span>
        </div>
        <span className="font-mono text-xs text-[var(--md-sys-color-on-surface-variant)]">{score}/100</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--md-sys-color-surface-container-highest)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: level.color }}
        />
      </div>
      {!compact && (
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
          Based on {sampleSize} submission{sampleSize !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
