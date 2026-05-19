import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Building2, CircleDollarSign, Clock3, Database, MapPinned } from "lucide-react";
import { RentDistributionChart } from "@/components/charts/rent-distribution-chart";
import { RentTrendChart } from "@/components/charts/rent-trend-chart";
import { RentHeatmap } from "@/components/maps/rent-heatmap";
import { ConfidenceMeter } from "@/components/rent/confidence-meter";
import { MetricCard } from "@/components/rent/metric-card";
import { SearchBox } from "@/components/search/search-box";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { aggregateRent } from "@/lib/analytics/statistics";
import {
  buildings,
  getLocality,
  getSubmissionsForLocality,
  localities,
  trendSeries,
} from "@/lib/data/hyderabad";
import { generatedLocalityCopy, generateLocalityJsonLd, localityMetadata } from "@/lib/seo";
import { formatINR } from "@/lib/utils";

export const revalidate = 3600;

export function generateStaticParams() {
  return localities.map((locality) => ({ localitySlug: locality.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ localitySlug: string }>;
}): Promise<Metadata> {
  const { localitySlug } = await params;
  const locality = getLocality(localitySlug);
  if (!locality) return {};
  return localityMetadata(locality, `/hyderabad/${locality.slug}`);
}

export default async function LocalityPage({
  params,
}: {
  params: Promise<{ localitySlug: string }>;
}) {
  const { localitySlug } = await params;
  const locality = getLocality(localitySlug);
  if (!locality) notFound();

  const submissions = getSubmissionsForLocality(locality.slug);
  const aggregate = aggregateRent(submissions, { label: locality.name });
  const copy = generatedLocalityCopy(locality);
  const localityBuildings = buildings.filter((building) => building.localitySlug === locality.slug);
  const trendData = trendSeries[locality.slug] ?? trendSeries.gachibowli ?? [];
  const jsonLd = generateLocalityJsonLd(locality);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="trust">{locality.zone}</Badge>
            <Badge variant="muted">{aggregate.sampleSize} rent signals</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
            {locality.name} rent report
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            {copy.summary}
          </p>
          <div className="mt-5 max-w-2xl">
            <SearchBox />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {["1bhk", "2bhk", "3bhk"].map((bhk) => (
              <Button key={bhk} asChild variant="outline" size="sm">
                <Link href={`/hyderabad/${locality.slug}/${bhk}`}>{bhk.toUpperCase()}</Link>
              </Button>
            ))}
            <Button asChild variant="outline" size="sm">
              <Link href={`/locality/${locality.slug}/furnished`}>Furnished</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verified range</CardTitle>
            <CardDescription>Effective monthly cost with trust-weighted percentiles.</CardDescription>
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
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={CircleDollarSign}
          label="Rent per sqft"
          value={`${formatINR(aggregate.rentPerSqftMedian)}`}
          detail="Median effective cost divided by available area."
        />
        <MetricCard
          icon={Database}
          label="Verified ratio"
          value={`${aggregate.verifiedRatio}%`}
          detail="Share of sample with verified or high-reputation review."
        />
        <MetricCard
          icon={Clock3}
          label="Freshness"
          value={`${aggregate.freshness}/100`}
          detail="Recent verified submissions carry more influence."
        />
        <MetricCard
          icon={MapPinned}
          label="Density"
          value={`${aggregate.density}/100`}
          detail="How much signal HydRent has for this market."
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Trend</CardTitle>
            <CardDescription>Monthly median with percentile context.</CardDescription>
          </CardHeader>
          <CardContent>
            <RentTrendChart data={trendData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribution</CardTitle>
            <CardDescription>Rent bands from available community signals.</CardDescription>
          </CardHeader>
          <CardContent>
            <RentDistributionChart submissions={submissions} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Locality intelligence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>{locality.summary}</p>
            <p>{copy.affordability}</p>
            <p>{copy.nearby}</p>
          </CardContent>
        </Card>
        <div className="min-h-96 overflow-hidden rounded-lg border bg-card p-2">
          <RentHeatmap locality={locality} submissions={submissions} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold tracking-normal">Buildings and societies</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {localityBuildings.map((building) => (
            <Link key={building.slug} href={`/building/${building.slug}`} className="group block">
              <Card className="h-full transition-colors group-hover:border-primary/40">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
                    <h3 className="font-semibold tracking-normal">{building.name}</h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{building.microLocality}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {building.amenities.slice(0, 3).map((amenity) => (
                      <Badge key={amenity} variant="muted">
                        {amenity.replaceAll("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-normal">FAQs</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[
            [
              `What is the realistic rent in ${locality.name}?`,
              `The current trust-weighted median is ${formatINR(
                aggregate.median,
              )}, but the central range is more useful for negotiation.`,
            ],
            [
              "Why use effective monthly cost?",
              "Maintenance can shift affordability materially, so HydRent separates rent and then compares the combined monthly burden.",
            ],
          ].map(([question, answer]) => (
            <div key={question} className="rounded-md border bg-muted/30 p-4">
              <p className="font-medium">{question}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
