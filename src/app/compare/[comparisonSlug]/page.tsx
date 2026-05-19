import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GitCompareArrows } from "lucide-react";
import { ConfidenceMeter } from "@/components/rent/confidence-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { aggregateRent } from "@/lib/analytics/statistics";
import { getLocality, getSubmissionsForLocality, localities } from "@/lib/data/hyderabad";
import { baseMetadata } from "@/lib/seo";
import { formatINR } from "@/lib/utils";

export function generateStaticParams() {
  return [{ comparisonSlug: "gachibowli-vs-kondapur" }, { comparisonSlug: "madhapur-vs-manikonda" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ comparisonSlug: string }>;
}): Promise<Metadata> {
  const { comparisonSlug } = await params;
  const [leftSlug, rightSlug] = comparisonSlug.split("-vs-");
  const left = leftSlug ? getLocality(leftSlug) : undefined;
  const right = rightSlug ? getLocality(rightSlug) : undefined;
  if (!left || !right) return {};
  return baseMetadata({
    title: `${left.name} vs ${right.name} rent comparison`,
    description: `Compare affordability, rent ranges, confidence, and commute context between ${left.name} and ${right.name}.`,
    alternates: { canonical: `/compare/${comparisonSlug}` },
  });
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ comparisonSlug: string }>;
}) {
  const { comparisonSlug } = await params;
  const [leftSlug, rightSlug] = comparisonSlug.split("-vs-");
  const left = leftSlug ? getLocality(leftSlug) : undefined;
  const right = rightSlug ? getLocality(rightSlug) : undefined;
  if (!left || !right) notFound();

  const leftAggregate = aggregateRent(getSubmissionsForLocality(left.slug), { label: left.name });
  const rightAggregate = aggregateRent(getSubmissionsForLocality(right.slug), { label: right.name });
  const delta = leftAggregate.median - rightAggregate.median;
  const allOther = localities.filter((locality) => ![left.slug, right.slug].includes(locality.slug));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Badge variant="trust">Comparison</Badge>
      <h1 className="mt-4 text-3xl font-semibold tracking-normal">
        {left.name} vs {right.name}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        Compare locality-level rent distributions, confidence, affordability pressure, and commute
        anchors using the same trust-weighted analytics model.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {[left, right].map((locality) => {
          const aggregate = locality.slug === left.slug ? leftAggregate : rightAggregate;
          return (
            <Card key={locality.slug}>
              <CardHeader>
                <CardTitle>{locality.name}</CardTitle>
                <CardDescription>{locality.commuteAnchors.join(", ")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-semibold tracking-normal">{formatINR(aggregate.median)}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatINR(aggregate.p25)} - {formatINR(aggregate.p75)}
                </p>
                <div className="mt-5">
                  <ConfidenceMeter score={aggregate.confidenceScore} level={aggregate.confidenceLevel} />
                </div>
                <Button asChild variant="outline" className="mt-5">
                  <Link href={`/hyderabad/${locality.slug}`}>Open report</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompareArrows className="size-4 text-primary" aria-hidden="true" />
            Affordability analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Median difference</p>
            <p className="mt-2 font-mono text-2xl font-semibold">{formatINR(Math.abs(delta))}</p>
          </div>
          <div className="rounded-md border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Lower median market</p>
            <p className="mt-2 text-2xl font-semibold">{delta > 0 ? right.name : left.name}</p>
          </div>
          <div className="rounded-md border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Income pressure delta</p>
            <p className="mt-2 font-mono text-2xl font-semibold">
              {Math.abs(
                Math.round(
                  (leftAggregate.median / left.medianIncomeAssumption -
                    rightAggregate.median / right.medianIncomeAssumption) *
                    100,
                ),
              )}
              pp
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap gap-2">
        {allOther.slice(0, 3).map((locality) => (
          <Button key={locality.slug} asChild variant="outline" size="sm">
            <Link href={`/compare/${left.slug}-vs-${locality.slug}`}>
              Compare with {locality.name}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
