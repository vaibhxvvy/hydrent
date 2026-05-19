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
import { buildings, getBuilding, getLocality, getSubmissionsForBuilding } from "@/lib/data/hyderabad";
import { baseMetadata } from "@/lib/seo";
import { formatINR } from "@/lib/utils";

export function generateStaticParams() {
  return buildings.map((building) => ({ buildingSlug: building.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ buildingSlug: string }>;
}): Promise<Metadata> {
  const { buildingSlug } = await params;
  const building = getBuilding(buildingSlug);
  if (!building) return {};
  return baseMetadata({
    title: `${building.name} rent history`,
    description: `Verified rent ranges, amenities, aliases, and building-level rental intelligence for ${building.name}, Hyderabad.`,
    alternates: { canonical: `/building/${building.slug}` },
  });
}

export default async function BuildingPage({
  params,
}: {
  params: Promise<{ buildingSlug: string }>;
}) {
  const { buildingSlug } = await params;
  const building = getBuilding(buildingSlug);
  if (!building) notFound();

  const locality = getLocality(building.localitySlug);
  const submissions = getSubmissionsForBuilding(building.slug);
  const aggregate = aggregateRent(submissions, { label: building.name });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <Badge variant="trust">{locality?.name ?? "Hyderabad"}</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
            {building.name}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Building-level intelligence for {building.microLocality}. Aliases are normalized so
            nicknames like {building.aliases.slice(0, 3).join(", ")} resolve to the same society.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {building.amenities.map((amenity) => (
              <Badge key={amenity} variant="muted">
                {amenity.replaceAll("_", " ")}
              </Badge>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verified building range</CardTitle>
            <CardDescription>{submissions.length} available rent signals.</CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length ? (
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
            <MetadataRow label="Age" value={`${building.ageYears} years`} />
            <MetadataRow label="Gated society" value={building.gated ? "Yes" : "No"} />
            <MetadataRow label="Micro-locality" value={building.microLocality} />
            <MetadataRow label="Known aliases" value={building.aliases.join(", ")} />
          </CardContent>
        </Card>
      </section>

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
