import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Building2, ShieldCheck } from "lucide-react";
import { RentDistributionChart } from "@/components/charts/rent-distribution-chart";
import { ConfidenceMeter } from "@/components/rent/confidence-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { aggregateRent } from "@/lib/analytics/statistics";
import { getBuildingBySlug, getLocalityBySlug, getSubmissionsForBuilding } from "@/lib/data/db";
import { baseMetadata } from "@/lib/seo";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ buildingSlug: string }>;
}): Promise<Metadata> {
  const { buildingSlug } = await params;
  try {
    const building = await getBuildingBySlug(buildingSlug);
    if (!building) return {};
    return baseMetadata({
      title: `${building.name} rent history`,
      description: `Verified rent ranges, amenities, aliases, and building-level rental intelligence for ${building.name}, Hyderabad.`,
      alternates: { canonical: `/building/${building.slug}` },
    });
  } catch {
    return {};
  }
}

export default async function BuildingPage({
  params,
}: {
  params: Promise<{ buildingSlug: string }>;
}) {
  const { buildingSlug } = await params;

  let building: Awaited<ReturnType<typeof getBuildingBySlug>> = null;
  try {
    building = await getBuildingBySlug(buildingSlug);
  } catch {
    // DB unavailable
  }
  if (!building) notFound();

  let locality: Awaited<ReturnType<typeof getLocalityBySlug>> = null;
  let submissions: import("@/lib/types").RentSubmission[] = [];
  try {
    [locality, submissions] = await Promise.all([
      getLocalityBySlug(building.localitySlug),
      getSubmissionsForBuilding(building.slug),
    ]);
  } catch {
    // DB unavailable
  }

  const aggregate = aggregateRent(submissions, { label: building.name });
  const hasData = aggregate.sampleSize > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <Badge variant="trust">{locality?.name ?? "Hyderabad"}</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
            {building.name}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Building-level intelligence for {building.microLocality || locality?.name || "Hyderabad"}.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {building.amenities.length > 0 ? (
              building.amenities.map((amenity) => (
                <Badge key={amenity} variant="muted">
                  {amenity.replaceAll("_", " ")}
                </Badge>
              ))
            ) : (
              <Badge variant="muted">Amenities data coming soon</Badge>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verified building range</CardTitle>
            <CardDescription>
              {hasData ? `${submissions.length} available rent signals.` : "No submissions yet."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <>
                <p className="text-4xl font-semibold tracking-normal">{formatINR(aggregate.median)}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatINR(aggregate.p25)} - {formatINR(aggregate.p75)} central range
                </p>
                <div className="mt-5">
                  <ConfidenceMeter score={aggregate.confidenceScore} level={aggregate.confidenceLevel} />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Building-specific public aggregation will appear after enough validated submissions.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {hasData && (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Rent distribution</CardTitle>
              <CardDescription>Building-level sample spread.</CardDescription>
            </CardHeader>
            <CardContent>
              <RentDistributionChart submissions={submissions} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Building metadata</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <MetadataRow label="Age" value={building.ageYears > 0 ? `${building.ageYears} years` : "Unknown"} />
              <MetadataRow label="Gated society" value={building.gated ? "Yes" : "No"} />
              <MetadataRow label="Micro-locality" value={building.microLocality || "—"} />
            </CardContent>
          </Card>
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={`/hyderabad/${building.localitySlug}`}>
            <Building2 className="size-4" aria-hidden="true" />
            Locality report
          </Link>
        </Button>
        <Button asChild>
          <Link href="/submit">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Add rent evidence
          </Link>
        </Button>
      </div>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-72 text-right font-medium">{value}</span>
    </div>
  );
}
