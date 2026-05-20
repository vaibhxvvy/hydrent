import Link from "next/link";
import { ArrowUpRight, Building2, FileCheck2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfidenceMeter } from "@/components/rent/confidence-meter";
import { aggregateRent } from "@/lib/analytics/statistics";
import { getAllLocalitiesWithStats, getSubmissionsForLocality } from "@/lib/data/db";
import { formatINR } from "@/lib/utils";

function timeAgo(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export async function LocalityGrid() {
  const localitiesWithStats = await getAllLocalitiesWithStats();

  if (localitiesWithStats.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <Building2 className="mx-auto size-12 text-muted-foreground" aria-hidden="true" />
        <h3 className="mt-4 text-lg font-semibold">No localities indexed yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Locality pages will appear once Hyderabad localities are added to the database.
        </p>
      </div>
    );
  }

  // Sort: has data + confidence 70+ first, then 40-70, then below 40, then no data last
  const sorted = [...localitiesWithStats].sort((a, b) => {
    const aHasData = a.submissionCount > 0;
    const bHasData = b.submissionCount > 0;
    if (aHasData && !bHasData) return -1;
    if (!aHasData && bHasData) return 1;
    if (!aHasData && !bHasData) return a.name.localeCompare(b.name);
    return b.confidenceScore - a.confidenceScore;
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sorted.map(async (locality) => {
        const submissions = await getSubmissionsForLocality(locality.slug);
        const aggregate = aggregateRent(submissions, { label: locality.name });
        const hasData = aggregate.sampleSize > 0;
        const confidenceTier = hasData
          ? aggregate.confidenceScore >= 70
            ? "high"
            : aggregate.confidenceScore >= 40
              ? "medium"
              : "low"
          : "none";

        return (
          <Link
            key={locality.slug}
            href={hasData ? `/hyderabad/${locality.slug}` : "/submit"}
            className="group block"
          >
            <Card className="h-full transition-colors group-hover:border-primary/40">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
                      <h3 className="font-semibold tracking-normal">{locality.name}</h3>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{locality.zone}</p>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>

                {hasData ? (
                  <>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge
                        variant={
                          confidenceTier === "high"
                            ? "default"
                            : confidenceTier === "medium"
                              ? "secondary"
                              : "warning"
                        }
                      >
                        {aggregate.confidenceScore}/100
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {aggregate.sampleSize} submission{aggregate.sampleSize !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="mt-4 text-2xl font-semibold tracking-normal">
                      {formatINR(aggregate.median)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatINR(aggregate.p25)} - {formatINR(aggregate.p75)} central range
                    </p>
                    <div className="mt-4">
                      <ConfidenceMeter
                        compact
                        score={aggregate.confidenceScore}
                        level={aggregate.confidenceLevel}
                      />
                    </div>
                    {submissions.length > 0 && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Updated {timeAgo(new Date(Math.max(...submissions.map((s) => new Date(s.submittedAt).getTime()))))}
                      </p>
                    )}
                    <div className="mt-4">
                      <Badge variant="outline" className="gap-1">
                        View report
                        <ArrowUpRight className="size-3" aria-hidden="true" />
                      </Badge>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mt-4">
                      <Badge variant="outline" className="text-muted-foreground">
                        No data yet
                      </Badge>
                    </div>
                    <div className="mt-4 rounded-md border bg-muted/30 p-4 text-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        Be the first to submit rent here
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-center">
                      <Badge variant="muted" className="gap-1">
                        <FileCheck2 className="size-3" aria-hidden="true" />
                        Submit rent
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
