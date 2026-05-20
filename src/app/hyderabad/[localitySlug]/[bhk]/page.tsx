import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RentDistributionChart } from "@/components/charts/rent-distribution-chart";
import { ConfidenceMeter } from "@/components/rent/confidence-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { aggregateRent } from "@/lib/analytics/statistics";
import { getAllLocalities, getLocalityBySlug, getSubmissionsForLocality } from "@/lib/data/db";
import { baseMetadata } from "@/lib/seo";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

const bhks = ["1rk", "1bhk", "2bhk", "3bhk", "4bhk"];

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ localitySlug: string; bhk: string }>;
}): Promise<Metadata> {
  const { localitySlug, bhk } = await params;
  const locality = await getLocalityBySlug(localitySlug);
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
  const locality = await getLocalityBySlug(localitySlug);
  if (!locality || !bhks.includes(bhk)) notFound();

  const label = bhk.toUpperCase();
  const allSubmissions = await getSubmissionsForLocality(locality.slug);
  const submissions = allSubmissions.filter(
    (submission) => submission.bhk.toLowerCase() === bhk,
  );
  const aggregate = aggregateRent(submissions.length ? submissions : allSubmissions, {
    label: `${label} in ${locality.name}`,
  });
  const hasData = submissions.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Badge variant="trust">{locality.name}</Badge>
      <h1 className="mt-4 text-3xl font-semibold tracking-normal">
        {label} rent in {locality.name}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        {hasData
          ? `${submissions.length} verified ${label} signals from the community.`
          : `No ${label} data yet for ${locality.name}. Submit your rent to help build this report.`}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>{label} verified range</CardTitle>
            <CardDescription>
              {submissions.length} exact BHK signals, {allSubmissions.length} locality signals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <>
                <p className="text-4xl font-semibold tracking-normal">{formatINR(aggregate.median)}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatINR(aggregate.p25)} - {formatINR(aggregate.p75)} central range
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No {label} data available yet. Be the first to submit.
              </p>
            )}
            <div className="mt-5">
              <ConfidenceMeter score={aggregate.confidenceScore} level={aggregate.confidenceLevel} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribution</CardTitle>
            <CardDescription>
              {hasData ? "BHK-specific and locality fallback samples." : "No data to display yet."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <RentDistributionChart submissions={submissions} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Submit your rent to see distribution data here.
              </p>
            )}
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
