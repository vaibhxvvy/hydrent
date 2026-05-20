import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RentDistributionChart } from "@/components/charts/rent-distribution-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { aggregateRent } from "@/lib/analytics/statistics";
import { getLocalityBySlug, getSubmissionsForLocality } from "@/lib/data/db";
import { baseMetadata } from "@/lib/seo";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

const filters = ["furnished", "unfurnished", "family", "bachelor"];

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ localitySlug: string; filter: string }>;
}): Promise<Metadata> {
  const { localitySlug, filter } = await params;
  try {
    const locality = await getLocalityBySlug(localitySlug);
    if (!locality) return {};
    return baseMetadata({
      title: `${filter} rentals in ${locality.name}`,
      description: `Filtered rent intelligence for ${filter} homes in ${locality.name}, Hyderabad.`,
      alternates: { canonical: `/locality/${locality.slug}/${filter}` },
    });
  } catch {
    return {};
  }
}

export default async function LocalityFilterPage({
  params,
}: {
  params: Promise<{ localitySlug: string; filter: string }>;
}) {
  const { localitySlug, filter } = await params;

  let locality: Awaited<ReturnType<typeof getLocalityBySlug>> = null;
  try {
    locality = await getLocalityBySlug(localitySlug);
  } catch {
    // DB unavailable
  }
  if (!locality || !filters.includes(filter)) notFound();

  let allSubmissions: import("@/lib/types").RentSubmission[] = [];
  try {
    allSubmissions = await getSubmissionsForLocality(locality.slug);
  } catch {
    // DB unavailable
  }

  const submissions = allSubmissions.filter((submission) => {
    if (filter === "furnished") return submission.furnishing === "FULLY_FURNISHED";
    if (filter === "unfurnished") return submission.furnishing === "UNFURNISHED";
    if (filter === "family") return submission.occupancyType === "FAMILY";
    if (filter === "bachelor") return submission.occupancyType === "BACHELOR";
    return true;
  });
  const aggregate = aggregateRent(submissions.length ? submissions : allSubmissions, {
    label: `${filter} ${locality.name}`,
  });
  const hasData = submissions.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Badge variant="trust">{filter}</Badge>
      <h1 className="mt-4 text-3xl font-semibold tracking-normal">
        {filter} rentals in {locality.name}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        {hasData
          ? `${submissions.length} matching signals for ${filter} rentals.`
          : `No ${filter} data yet for ${locality.name}. Submit your rent to help build this report.`}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Filtered median</CardTitle>
            <CardDescription>
              {hasData ? `${submissions.length} matching signals.` : "No matching submissions yet."}
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
                No data for this filter yet. Try another filter or submit rent data.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribution</CardTitle>
            <CardDescription>
              {hasData ? "Filtered signals and locality context." : "No data to display."}
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

      <Button asChild variant="outline" className="mt-6">
        <Link href={`/hyderabad/${locality.slug}`}>Back to {locality.name}</Link>
      </Button>
    </div>
  );
}
