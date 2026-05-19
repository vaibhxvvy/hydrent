import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RentDistributionChart } from "@/components/charts/rent-distribution-chart";
import { ConfidenceMeter } from "@/components/rent/confidence-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { aggregateRent } from "@/lib/analytics/statistics";
import { getLocality, getSubmissionsForLocality, localities } from "@/lib/data/hyderabad";
import { baseMetadata } from "@/lib/seo";
import { formatINR } from "@/lib/utils";

const bhks = ["1rk", "1bhk", "2bhk", "3bhk", "4bhk"];

export function generateStaticParams() {
  return localities.flatMap((locality) =>
    bhks.map((bhk) => ({ localitySlug: locality.slug, bhk })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ localitySlug: string; bhk: string }>;
}): Promise<Metadata> {
  const { localitySlug, bhk } = await params;
  const locality = getLocality(localitySlug);
  if (!locality) return {};
  const label = bhk.toUpperCase();
  return baseMetadata({
    title: `${label} rent in ${locality.name}`,
    description: `${label} rent ranges, confidence score, and verified community signals for ${locality.name}, Hyderabad.`,
    alternates: { canonical: `/hyderabad/${locality.slug}/${bhk}` },
  });
}

export default async function BhkPage({
  params,
}: {
  params: Promise<{ localitySlug: string; bhk: string }>;
}) {
  const { localitySlug, bhk } = await params;
  const locality = getLocality(localitySlug);
  if (!locality || !bhks.includes(bhk)) notFound();

  const label = bhk.toUpperCase();
  const submissions = getSubmissionsForLocality(locality.slug).filter(
    (submission) => submission.bhk.toLowerCase() === bhk,
  );
  const fallbackSubmissions = getSubmissionsForLocality(locality.slug);
  const aggregate = aggregateRent(submissions.length ? submissions : fallbackSubmissions, {
    label: `${label} in ${locality.name}`,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Badge variant="trust">{locality.name}</Badge>
      <h1 className="mt-4 text-3xl font-semibold tracking-normal">
        {label} rent in {locality.name}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        Programmatic SEO report generated from the same trust-weighted rent engine used across
        HydRent. When BHK-specific data is sparse, the page clearly falls back to locality context.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>{label} verified range</CardTitle>
            <CardDescription>
              {submissions.length} exact BHK signals, {fallbackSubmissions.length} locality signals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold tracking-normal">{formatINR(aggregate.median)}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatINR(aggregate.p25)} - {formatINR(aggregate.p75)} central range
            </p>
            <div className="mt-5">
              <ConfidenceMeter score={aggregate.confidenceScore} level={aggregate.confidenceLevel} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribution</CardTitle>
            <CardDescription>Available BHK-specific and locality fallback samples.</CardDescription>
          </CardHeader>
          <CardContent>
            <RentDistributionChart submissions={submissions.length ? submissions : fallbackSubmissions} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/hyderabad/${locality.slug}`}>Full locality report</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/submit">Submit a verified rent</Link>
        </Button>
      </div>
    </div>
  );
}
