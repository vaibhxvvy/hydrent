import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Building2, CircleDollarSign, Clock3, Database, FileCheck2, MapPinned, TrendingUp } from "lucide-react";
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
  getAllBuildings,
  getAllLocalitiesWithStats,
  getLocalityBySlug,
  getSubmissionsForLocality,
  getTrendSeriesForLocality,
} from "@/lib/data/db";
import { generatedLocalityCopy, generateLocalityJsonLd, localityMetadata } from "@/lib/seo";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ localitySlug: string }>;
}): Promise<Metadata> {
  const { localitySlug } = await params;
  const locality = await getLocalityBySlug(localitySlug);
  if (!locality) return {};
  return localityMetadata(locality, `/hyderabad/${locality.slug}`);
}

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

function getTrustBadgeColor(score: number) {
  if (score >= 70) return "bg-green-100 text-green-800";
  if (score >= 40) return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-800";
}

export default async function LocalityPage({
  params,
}: {
  params: Promise<{ localitySlug: string }>;
}) {
  const { localitySlug } = await params;
  const locality = await getLocalityBySlug(localitySlug);
  if (!locality) notFound();

  const [submissions, allBuildings, trendData, allLocalities] = await Promise.all([
    getSubmissionsForLocality(locality.slug),
    getAllBuildings(),
    getTrendSeriesForLocality(locality.slug),
    getAllLocalitiesWithStats(),
  ]);

  const aggregate = aggregateRent(submissions, { label: locality.name });
  const copy = generatedLocalityCopy(locality);
  const localityBuildings = allBuildings.filter((building) => building.localitySlug === locality.slug);
  const jsonLd = generateLocalityJsonLd(locality);
  const hasData = aggregate.sampleSize > 0;

  // BHK breakdown
  const bhks = ["1RK", "1BHK", "2BHK", "3BHK", "4BHK"];
  const bhkBreakdown = bhks.map((bhk) => {
    const bhkSubs = submissions.filter((s) => s.bhk === bhk);
    const bhkAgg = aggregateRent(bhkSubs, { label: bhk });
    return { bhk, count: bhkSubs.length, median: bhkAgg.median, p25: bhkAgg.p25, p75: bhkAgg.p75 };
  });

  // Recent submissions (last 10)
  const recentSubmissions = submissions.slice(0, 10);

  // Nearby localities (3 closest by distance)
  const nearbyLocalities = allLocalities
    .filter((l) => l.slug !== locality.slug && l.submissionCount > 0)
    .map((l) => ({
      ...l,
      distance: Math.sqrt(
        (l.coordinates.lat - locality.coordinates.lat) ** 2 +
        (l.coordinates.lng - locality.coordinates.lng) ** 2,
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  // Other localities for compare dropdown
  const compareLocalities = allLocalities.filter((l) => l.slug !== locality.slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Hero */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="trust">{locality.zone}</Badge>
            <Badge variant="muted">
              {hasData ? `${aggregate.sampleSize} rent signals` : "No submissions yet"}
            </Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
            Rent in {locality.name}, Hyderabad
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
          </div>
        </div>

        {hasData ? (
          <Card>
            <CardHeader>
              <CardTitle>Trust-weighted median</CardTitle>
              <CardDescription>Effective monthly cost with percentile context.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold tracking-normal">{formatINR(aggregate.median)}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatINR(aggregate.p25)} - {formatINR(aggregate.p75)} central range
              </p>
              <div className="mt-5">
                <ConfidenceMeter score={aggregate.confidenceScore} level={aggregate.confidenceLevel} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {aggregate.sampleSize} submissions · {aggregate.verifiedRatio}% verified
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No data yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Be the first to submit rent data for {locality.name}.
              </p>
              <Button asChild className="mt-4">
                <Link href="/submit">Submit rent for {locality.name}</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {hasData && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={CircleDollarSign} label="Rent per sqft" value={formatINR(aggregate.rentPerSqftMedian)} detail="Median effective cost per sqft." />
          <MetricCard icon={Database} label="Verified ratio" value={`${aggregate.verifiedRatio}%`} detail="Share of verified submissions." />
          <MetricCard icon={Clock3} label="Freshness" value={`${aggregate.freshness}/100`} detail="Recent data carries more influence." />
          <MetricCard icon={MapPinned} label="Density" value={`${aggregate.density}/100`} detail="Signal strength for this market." />
        </section>
      )}

      {/* 2. BHK Breakdown Table */}
      {hasData && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold tracking-normal">BHK Breakdown</h2>
          <Card className="mt-4">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium">BHK</th>
                      <th className="px-4 py-3 text-left font-medium">Median</th>
                      <th className="px-4 py-3 text-left font-medium">Range (P25-P75)</th>
                      <th className="px-4 py-3 text-left font-medium">Submissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bhkBreakdown.map(({ bhk, count, median, p25, p75 }) => (
                      <tr key={bhk} className="border-b last:border-b-0">
                        <td className="px-4 py-3 font-medium">{bhk}</td>
                        <td className="px-4 py-3">{count > 0 ? formatINR(median) : "No data"}</td>
                        <td className="px-4 py-3">
                          {count > 0 ? `${formatINR(p25)} - ${formatINR(p75)}` : "—"}
                        </td>
                        <td className="px-4 py-3">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* 3. Recent Submissions */}
      {recentSubmissions.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold tracking-normal">Recent Submissions</h2>
          <div className="mt-4 space-y-3">
            {recentSubmissions.map((sub) => (
              <Card key={sub.id}>
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <Badge variant="outline">{sub.bhk}</Badge>
                  <span className="font-semibold">{formatINR(sub.rentAmount)}</span>
                  <span className="text-sm text-muted-foreground">
                    {sub.furnishing.replace("_", " ").toLowerCase()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {sub.rentType.toLowerCase()}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${getTrustBadgeColor(sub.trustScore)}`}>
                    Trust: {sub.trustScore}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {timeAgo(new Date(sub.submittedAt))}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 4. Trend Chart */}
      {trendData.length > 0 && (
        <section className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Rent Trend (6 months)</CardTitle>
              <CardDescription>Weighted median movement over time.</CardDescription>
            </CardHeader>
            <CardContent>
              <RentTrendChart data={trendData} />
            </CardContent>
          </Card>
        </section>
      )}

      {/* 5. Nearby Localities */}
      {nearbyLocalities.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold tracking-normal">Nearby Localities</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyLocalities.map((nearby) => (
              <Link key={nearby.slug} href={`/hyderabad/${nearby.slug}`} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/40">
                  <CardContent className="p-4">
                    <h3 className="font-medium">{nearby.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{nearby.zone}</p>
                    <p className="mt-2 text-lg font-semibold">{formatINR(nearby.median2BHK ?? 0)}</p>
                    <div className="mt-2">
                      <Badge variant={nearby.confidenceScore >= 70 ? "default" : "secondary"}>
                        {nearby.confidenceScore}/100
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 6. Compare Widget */}
      {compareLocalities.length > 0 && (
        <section className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-4" aria-hidden="true" />
                Compare {locality.name} with...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {compareLocalities.slice(0, 6).map((other) => (
                  <Button key={other.slug} asChild variant="outline" size="sm">
                    <Link href={`/compare/${locality.slug}-vs-${other.slug}`}>
                      {other.name}
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Distribution + Heatmap */}
      {hasData && (
        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Distribution</CardTitle>
              <CardDescription>Rent bands from community signals.</CardDescription>
            </CardHeader>
            <CardContent>
              <RentDistributionChart submissions={submissions} />
            </CardContent>
          </Card>
          <div className="min-h-96 overflow-hidden rounded-lg border bg-card p-2">
            <RentHeatmap locality={locality} submissions={submissions} />
          </div>
        </section>
      )}

      {/* 7. Submit CTA Banner */}
      <section className="mt-8 rounded-lg border bg-primary/5 p-6 text-center sm:p-8">
        <FileCheck2 className="mx-auto size-10 text-primary" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-semibold tracking-normal">
          Know what rent people actually pay in {locality.name}?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Submit yours anonymously. Takes 90 seconds.
        </p>
        <Button asChild className="mt-4">
          <Link href="/submit">Submit your rent</Link>
        </Button>
      </section>

      {/* Buildings */}
      {localityBuildings.length > 0 && (
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
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAQs */}
      <section className="mt-8 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-normal">FAQs</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[
            [
              `What is the realistic rent in ${locality.name}?`,
              hasData
                ? `The trust-weighted median is ${formatINR(aggregate.median)}. The central range (${formatINR(aggregate.p25)} - ${formatINR(aggregate.p75)}) is more useful for negotiation.`
                : `No rent data yet for ${locality.name}. Be the first to submit.`,
            ],
            [
              "Why use effective monthly cost?",
              "Maintenance can shift affordability materially. HydRent separates rent and compares the combined monthly burden.",
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
