import Link from "next/link";
import {
  Activity,
  BarChart3,
  DatabaseZap,
  FileCheck2,
  GitCompareArrows,
  ShieldCheck,
  TrendingUp,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { RentTrendChart } from "@/components/charts/rent-trend-chart";
import { LocalityMap } from "@/components/maps/locality-map";
import { LocalityGrid } from "@/components/rent/locality-grid";
import { StatsBar } from "@/components/rent/stats-bar";
import { MetricCard } from "@/components/rent/metric-card";
import { SearchBox } from "@/components/search/search-box";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { aggregateRent } from "@/lib/analytics/statistics";
import { getAllLocalities, getAllLocalitiesWithStats, getAllSubmissions, getCityStats, getTrendSeriesForLocality } from "@/lib/data/db";
import { formatINR, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function HomePage() {
  let localitiesWithStats: import("@/lib/data/db").LocalityWithStats[] = [];
  let submissions: import("@/lib/types").RentSubmission[] = [];
  let cityStats = { totalSubmissions: 0, localitiesWithData: 0, closedRentPercentage: 0, lastUpdated: new Date() };
  let trendData: import("@/lib/types").TrendPoint[] = [];

  try {
    [localitiesWithStats, submissions, cityStats, trendData] = await Promise.all([
      getAllLocalitiesWithStats(),
      getAllSubmissions(),
      getCityStats(),
      getTrendSeriesForLocality("gachibowli"),
    ]);
  } catch {
    // Database unavailable during build - show empty state
  }

  const localities = localitiesWithStats.map(({ submissionCount, confidenceScore, median2BHK, ...loc }) => loc);
  const aggregate = aggregateRent(submissions, { label: "Hyderabad" });
  const verifiedCount = submissions.filter(
    (submission) => submission.verificationState === "VERIFIED",
  ).length;
  const closedCount = submissions.filter((submission) => submission.rentType === "CLOSED").length;

  const mapLocalities = localitiesWithStats.map((loc) => ({
    id: loc.id,
    name: loc.name,
    slug: loc.slug,
    zone: loc.zone,
    lat: loc.coordinates.lat,
    lng: loc.coordinates.lng,
    submissionCount: loc.submissionCount,
    confidenceScore: loc.confidenceScore,
    median2BHK: loc.median2BHK,
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="rounded-lg border bg-card p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="trust">Hyderabad rent data</Badge>
            {cityStats.totalSubmissions > 0 && (
              <Badge variant="muted">{cityStats.totalSubmissions} community submissions</Badge>
            )}
          </div>
          <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-normal sm:text-5xl">
            HydRent
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Real rent intelligence for Hyderabad, built from community-verified rent signals,
            transparent trust scores, and anomaly-resistant statistics.
          </p>
          <div className="mt-6 max-w-2xl">
            <SearchBox />
          </div>
          <div className="mt-4 max-w-2xl">
            <StatsBar
              initial={{
                totalSubmissions: cityStats.totalSubmissions,
                localitiesWithData: cityStats.localitiesWithData,
                closedRentPercentage: cityStats.closedRentPercentage,
                lastUpdated: cityStats.lastUpdated.toISOString(),
              }}
            />
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/submit">
                <FileCheck2 className="size-4" aria-hidden="true" />
                Submit rent
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/how-data-works">
                <ShieldCheck className="size-4" aria-hidden="true" />
                How trust works
              </Link>
            </Button>
          </div>
        </div>

        {cityStats.totalSubmissions > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>City signal</CardTitle>
              <CardDescription>
                Effective monthly costs combine rent and non-included maintenance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Trust-weighted median</p>
                  <p className="mt-1 text-4xl font-semibold tracking-normal">{formatINR(aggregate.median)}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-md border bg-muted/40 p-3">
                    <p className="text-muted-foreground">P25</p>
                    <p className="mt-1 font-mono">{formatINR(aggregate.p25)}</p>
                  </div>
                  <div className="rounded-md border bg-muted/40 p-3">
                    <p className="text-muted-foreground">P75</p>
                    <p className="mt-1 font-mono">{formatINR(aggregate.p75)}</p>
                  </div>
                  <div className="rounded-md border bg-muted/40 p-3">
                    <p className="text-muted-foreground">Confidence</p>
                    <p className="mt-1 font-mono">{aggregate.confidenceScore}</p>
                  </div>
                </div>
                <div className="rounded-md border p-4">
                  <p className="text-sm font-medium">Why this differs from listings</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Asking rents are heavily discounted until validated. Closed rents, renewals,
                    proof-backed submissions, and nearby consensus carry more influence.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Be the first to contribute</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                HydRent needs real rent data from Hyderabad renters like you. Submit your rent
                anonymously to help build trust-weighted rent intelligence for the city.
              </p>
              <Button asChild className="mt-4">
                <Link href="/submit">
                  <FileCheck2 className="size-4" aria-hidden="true" />
                  Submit your rent
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {cityStats.totalSubmissions > 0 && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={DatabaseZap}
            label="Indexed localities"
            value={formatNumber(localities.length)}
            detail="Scalable city → zone → locality → micro-locality hierarchy."
          />
          <MetricCard
            icon={ShieldCheck}
            label="Verified signals"
            value={formatNumber(verifiedCount)}
            detail="Closed and community-reviewed submissions are favored."
          />
          <MetricCard
            icon={UsersRound}
            label="Closed rent share"
            value={`${Math.round((closedCount / submissions.length) * 100)}%`}
            detail="Actual finalized rents have the highest evidentiary quality."
          />
          <MetricCard
            icon={Activity}
            label="Freshness score"
            value={`${aggregate.freshness}/100`}
            detail="Older submissions decay so recent verified data dominates."
          />
        </section>
      )}

      {trendData.length > 0 && (
        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle>West Hyderabad trend</CardTitle>
              <CardDescription>Gachibowli weighted median and upper band movement.</CardDescription>
            </CardHeader>
            <CardContent>
              <RentTrendChart data={trendData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trust architecture</CardTitle>
              <CardDescription>
                Open-source-inspired verification without a single truth gatekeeper.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="score">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="score">Score</TabsTrigger>
                  <TabsTrigger value="fraud">Fraud</TabsTrigger>
                  <TabsTrigger value="privacy">Privacy</TabsTrigger>
                </TabsList>
                <TabsContent value="score" className="space-y-4">
                  <TrustRow
                    icon={ShieldCheck}
                    title="Reputation-weighted consensus"
                    text="OTP, account age, proof, historical reliability, and nearby agreement shape submission weight."
                  />
                  <TrustRow
                    icon={BarChart3}
                    title="Robust aggregation"
                    text="Weighted medians and percentile bands reduce the impact of broker-inflated outliers."
                  />
                </TabsContent>
                <TabsContent value="fraud" className="space-y-4">
                  <TrustRow
                    icon={Activity}
                    title="Anomaly resistance"
                    text="Z-score, IQR, and MAD checks flag suspicious spikes before they influence reports."
                  />
                  <TrustRow
                    icon={UsersRound}
                    title="Delayed publishing"
                    text="Low-trust or clustered submissions can be queued for proof, votes, or duplicate review."
                  />
                </TabsContent>
                <TabsContent value="privacy" className="space-y-4">
                  <TrustRow
                    icon={FileCheck2}
                    title="Private evidence"
                    text="Proof uploads are designed for encrypted private verification, never public display."
                  />
                  <TrustRow
                    icon={GitCompareArrows}
                    title="Aggregate-only outputs"
                    text="Public pages show ranges, distributions, and confidence rather than tenant identities."
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      )}

      {mapLocalities.length > 0 && (
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold tracking-normal">Hyderabad rent map</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap a marker to see locality data. Green = high confidence, yellow = medium, red = low, grey = no data yet.
            </p>
          </div>
          <LocalityMap localities={mapLocalities} />
        </section>
      )}

      <section className="mt-8">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-normal">
              {localities.length > 0 ? "Featured locality reports" : "Localities indexed"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {localities.length > 0
                ? "SEO-ready city intelligence pages built from the same transparent analytics engine."
                : "Locality pages are ready — submit rent data to see real intelligence here."}
            </p>
          </div>
          {localities.length >= 2 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/compare/${localities[0]!.slug}-vs-${localities[1]!.slug}`}>
                <TrendingUp className="size-4" aria-hidden="true" />
                Compare markets
              </Link>
            </Button>
          )}
        </div>
        <LocalityGrid />
      </section>

      {/* FAQ Accordion */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-normal">Frequently Asked Questions</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            ["Is my data anonymous?", "Yes. HydRent does not collect names, emails, or identifiable information. Submissions are aggregated and only statistical ranges are shown publicly."],
            ["How is the median calculated?", "We use a trust-weighted median. Each submission gets a trust score based on lease type, proof, recency, and nearby consensus. Higher trust submissions influence the median more."],
            ["Why different from 99acres/MagicBricks?", "Those sites show asking prices from brokers and owners. HydRent shows actual rents paid by tenants — verified, closed deals only."],
            ["Can my landlord know I submitted?", "No. Submissions are completely anonymous. No personal information is collected or stored."],
            ["What is a trust score?", "A 0-100 score based on: lease type (closed=40pts, renewal=30, asking=20), proof attached (+20), submitter type (tenant=15, owner=10, broker=0), nearby consensus (+15), and recency (+10). Brokers are capped at 30."],
          ].map(([q, a]) => (
            <details key={q} className="rounded-lg border bg-card p-4 group">
              <summary className="cursor-pointer font-medium list-none">{q}</summary>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Issue Report CTA */}
      <section className="mt-12 rounded-lg border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-normal">Found an issue or have an improvement idea?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Help us improve HydRent by reporting bugs or suggesting features.
            </p>
          </div>
          <Button asChild>
            <Link href="/issues">
              Report an Issue
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function TrustRow({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-md border p-4">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
