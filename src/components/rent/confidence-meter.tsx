import { ShieldCheck, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ConfidenceLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const labels: Record<ConfidenceLevel, string> = {
  LOW: "Low confidence",
  MEDIUM: "Medium confidence",
  HIGH: "High confidence",
  VERY_HIGH: "Very high confidence",
};

export function ConfidenceMeter({
  score,
  level,
  compact = false,
}: {
  score: number;
  level: ConfidenceLevel;
  compact?: boolean;
}) {
  const isStrong = score >= 70;

  return (
    <div className={cn("grid gap-2", compact && "gap-1")}>
      <div className="flex items-center justify-between gap-3">
        <Badge variant={isStrong ? "trust" : "warning"} className="gap-1">
          {isStrong ? (
            <ShieldCheck className="size-3" aria-hidden="true" />
          ) : (
            <TriangleAlert className="size-3" aria-hidden="true" />
          )}
          {labels[level]}
        </Badge>
        <span className="font-mono text-sm text-muted-foreground">{score}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.max(6, Math.min(100, score))}%` }}
        />
      </div>
    </div>
  );
}
