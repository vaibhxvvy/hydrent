import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { RentTrendChart } from "@/components/charts/rent-trend-chart";
import { LocalityMap } from "@/components/maps/locality-map";
import { LocalityGrid } from "@/components/rent/locality-grid";
import { StatsBar } from "@/components/rent/stats-bar";
import { SearchBox } from "@/components/search/search-box";
import { HeroCards } from "@/components/rent/hero-cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { aggregateRent } from "@/lib/analytics/statistics";
import { getAllLocalities, getAllLocalitiesWithStats, getAllSubmissions, getCityStats, getTrendSeriesForLocality } from "@/lib/data/db";
import { formatINR, formatNumber } from "@/lib/utils";
import { HomeClient } from "@/components/home/home-client";

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

  const content = (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      {/* HERO SECTION */}
      <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <div className="mb-4">
            <Badge className="bg-[#1a221a] text-[#4ade80] border-[#2d3f2d] px-3 py-1 text-xs">
              🟢 Open source · Community verified
            </Badge>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-[#f0fdf4] sm:text-5xl lg:text-6xl">
            Real rents.<br />
            <span className="text-[#22c55e]">Not broker quotes.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#86efac] sm:text-lg">
            Hyderabad&apos;s first community-verified rent intelligence platform. Anonymous submissions. Trust-weighted data. No broker inflation.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full bg-[#22c55e] text-[#0a0f0a] hover:bg-[#16a34a] px-6 font-semibold">
              <Link href="/submit">
                Submit your rent →
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-[#2d3f2d] text-[#86efac] hover:bg-[#1a221a] hover:text-[#f0fdf4] px-6">
              <Link href="/explore">
                Explore localities
              </Link>
            </Button>
          </div>
          <div className="mt-6">
            <StatsBar
              initial={{
                totalSubmissions: cityStats.totalSubmissions,
                localitiesWithData: cityStats.localitiesWithData,
                closedRentPercentage: cityStats.closedRentPercentage,
                lastUpdated: cityStats.lastUpdated.toISOString(),
              }}
            />
          </div>
        </div>

        <div className="hidden lg:block">
          <HeroCards />
        </div>
      </section>

      {/* SEARCH BAR */}
      <section className="mt-8">
        <div className="mx-auto max-w-2xl">
          <SearchBox />
        </div>
      </section>

      {/* METRIC CARDS */}
      {cityStats.totalSubmissions > 0 && (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-[#111811] border-[#1f2b1f]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#4b7a4b]">Total submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-bold text-[#f0fdf4]">{formatNumber(cityStats.totalSubmissions)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111811] border-[#1f2b1f]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#4b7a4b]">Localities covered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-bold text-[#f0fdf4]">{formatNumber(cityStats.localitiesWithData)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111811] border-[#1f2b1f]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#4b7a4b]">Closed deals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-bold text-[#22c55e]">{cityStats.closedRentPercentage}%</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111811] border-[#1f2b1f]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#4b7a4b]">City median</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-bold text-[#f0fdf4]">{formatINR(aggregate.median)}</p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* TREND + TRUST SECTION */}
      {trendData.length > 0 && (
        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="bg-[#111811] border-[#1f2b1f]">
            <CardHeader>
              <CardTitle className="text-[#f0fdf4]">West Hyderabad trend</CardTitle>
              <CardDescription className="text-[#4b7a4b]">Gachibowli weighted median and upper band movement.</CardDescription>
            </CardHeader>
            <CardContent>
              <RentTrendChart data={trendData} />
            </CardContent>
          </Card>

          <Card className="bg-[#111811] border-[#1f2b1f]">
            <CardHeader>
              <CardTitle className="text-[#f0fdf4]">Trust architecture</CardTitle>
              <CardDescription className="text-[#4b7a4b]">Open-source-inspired verification without a single truth gatekeeper.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="score">
                <TabsList className="grid w-full grid-cols-3 bg-[#1a221a]">
                  <TabsTrigger value="score" className="text-[#86efac] data-[state=active]:bg-[#22c55e] data-[state=active]:text-[#0a0f0a]">Score</TabsTrigger>
                  <TabsTrigger value="fraud" className="text-[#86efac] data-[state=active]:bg-[#22c55e] data-[state=active]:text-[#0a0f0a]">Fraud</TabsTrigger>
                  <TabsTrigger value="privacy" className="text-[#86efac] data-[state=active]:bg-[#22c55e] data-[state=active]:text-[#0a0f0a]">Privacy</TabsTrigger>
                </TabsList>
                <TabsContent value="score" className="space-y-4">
                  <TrustRow title="Reputation-weighted consensus" text="OTP, account age, proof, historical reliability, and nearby agreement shape submission weight." />
                  <TrustRow title="Robust aggregation" text="Weighted medians and percentile bands reduce the impact of broker-inflated outliers." />
                </TabsContent>
                <TabsContent value="fraud" className="space-y-4">
                  <TrustRow title="Anomaly resistance" text="Z-score, IQR, and MAD checks flag suspicious spikes before they influence reports." />
                  <TrustRow title="Delayed publishing" text="Low-trust or clustered submissions can be queued for proof, votes, or duplicate review." />
                </TabsContent>
                <TabsContent value="privacy" className="space-y-4">
                  <TrustRow title="Private evidence" text="Proof uploads are designed for encrypted private verification, never public display." />
                  <TrustRow title="Aggregate-only outputs" text="Public pages show ranges, distributions, and confidence rather than tenant identities." />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      )}

      {/* MAP */}
      {mapLocalities.length > 0 && (
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-[#f0fdf4]">Hyderabad rent map</h2>
            <p className="mt-1 text-sm text-[#4b7a4b]">Tap a marker to see locality data. Green = high confidence, yellow = medium, red = low, grey = no data yet.</p>
          </div>
          <LocalityMap localities={mapLocalities} />
        </section>
      )}

      {/* LOCALITY GRID */}
      <section className="mt-8">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#f0fdf4]">
              {localities.length > 0 ? "Featured locality reports" : "Localities indexed"}
            </h2>
            <p className="mt-1 text-sm text-[#4b7a4b]">
              {localities.length > 0
                ? "SEO-ready city intelligence pages built from the same transparent analytics engine."
                : "Locality pages are ready — submit rent data to see real intelligence here."}
            </p>
          </div>
          {localities.length >= 2 && (
            <Button asChild variant="outline" size="sm" className="border-[#2d3f2d] text-[#86efac] hover:bg-[#1a221a]">
              <Link href={`/compare/${localities[0]!.slug}-vs-${localities[1]!.slug}`}>
                Compare markets
              </Link>
            </Button>
          )}
        </div>
        <LocalityGrid />
      </section>

      {/* FAQ */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-[#f0fdf4]">Frequently Asked Questions</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            ["Is my data anonymous?", "Yes. HydRent does not collect names, emails, or identifiable information. Submissions are aggregated and only statistical ranges are shown publicly."],
            ["How is the median calculated?", "We use a trust-weighted median. Each submission gets a trust score based on lease type, proof, recency, and nearby consensus. Higher trust submissions influence the median more."],
            ["Why different from 99acres/MagicBricks?", "Those sites show asking prices from brokers and owners. HydRent shows actual rents paid by tenants — verified, closed deals only."],
            ["Can my landlord know I submitted?", "No. Submissions are completely anonymous. No personal information is collected or stored."],
            ["What is a trust score?", "A 0-100 score based on: lease type (closed=40pts, renewal=30, asking=20), proof attached (+20), submitter type (tenant=15, owner=10, broker=0), nearby consensus (+15), and recency (+10). Brokers are capped at 30."],
          ].map(([q, a]) => (
            <details key={q} className="rounded-lg border border-[#1f2b1f] bg-[#111811] p-4 group">
              <summary className="cursor-pointer font-medium text-[#f0fdf4] list-none">{q}</summary>
              <p className="mt-2 text-sm leading-6 text-[#86efac]">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Issue CTA */}
      <section className="mt-12 rounded-lg border border-[#1f2b1f] bg-[#111811] p-6 sm:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#f0fdf4]">Found an issue or have an improvement idea?</h2>
            <p className="mt-1 text-sm text-[#86efac]">Help us improve HydRent by reporting bugs or suggesting features.</p>
          </div>
          <Button asChild className="rounded-full bg-[#22c55e] text-[#0a0f0a] hover:bg-[#16a34a]">
            <Link href="/issues">Report an Issue</Link>
          </Button>
        </div>
      </section>
    </div>
  );

  return (
    <HomeClient mapLocalities={mapLocalities}>
      {content}
    </HomeClient>
  );
}

function TrustRow({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-[#1f2b1f] bg-[#1a221a] p-4">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#22c55e]" />
      <div>
        <p className="text-sm font-medium text-[#f0fdf4]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#86efac]">{text}</p>
      </div>
    </div>
  );
}
