import Link from "next/link";
import { ArrowUpRight, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfidenceMeter } from "@/components/rent/confidence-meter";
import { aggregateRent } from "@/lib/analytics/statistics";
import { getSubmissionsForLocality, localities } from "@/lib/data/hyderabad";
import { formatINR } from "@/lib/utils";

export function LocalityGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {localities.map((locality) => {
        const aggregate = aggregateRent(getSubmissionsForLocality(locality.slug), {
          label: locality.name,
        });

        return (
          <Link key={locality.slug} href={`/hyderabad/${locality.slug}`} className="group block">
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
                <p className="mt-5 text-2xl font-semibold tracking-normal">
                  {formatINR(aggregate.median)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatINR(aggregate.p25)} - {formatINR(aggregate.p75)} central range
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {locality.commuteAnchors.slice(0, 2).map((anchor) => (
                    <Badge key={anchor} variant="muted">
                      {anchor}
                    </Badge>
                  ))}
                </div>
                <div className="mt-5">
                  <ConfidenceMeter
                    compact
                    score={aggregate.confidenceScore}
                    level={aggregate.confidenceLevel}
                  />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
