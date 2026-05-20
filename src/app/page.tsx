import Link from "next/link";
import { ShieldCheck, TrendingUp } from "lucide-react";
import { RentTrendChart } from "@/components/charts/rent-trend-chart";
import { LocalityMap } from "@/components/maps/locality-map";
import { LocalityGrid } from "@/components/rent/locality-grid";
import { StatsBar } from "@/components/rent/stats-bar";
import { SearchBox } from "@/components/search/search-box";
import { HeroCards } from "@/components/rent/hero-cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ElevatedCard, FilledCard, CardContent } from "@/components/ui/card";
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
    bhkBreakdown: loc.bhkBreakdown,
    furnishingBreakdown: loc.furnishingBreakdown,
    avgTrustScore: loc.avgTrustScore,
    avgRent: loc.avgRent,
    minRent: loc.minRent,
    maxRent: loc.maxRent,
  }));

  const content = (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      {/* SECTION 1 — HERO + STATS (2-column M3 layout) */}
      <section className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div>
          <div className="mb-4">
            <Badge variant="outline" className="gap-1.5">
              <span className="size-1.5 rounded-full bg-[var(--md-sys-color-secondary)]" />
              Open source · Community verified
            </Badge>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-[var(--md-sys-color-on-surface)] sm:text-5xl lg:text-6xl">
            Real rents.<br />
            <span className="text-[var(--md-sys-color-primary)]">Not broker quotes.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--md-sys-color-on-surface-variant)] sm:text-lg">
            Hyderabad&apos;s first community-verified rent intelligence platform. Anonymous submissions. Trust-weighted data. No broker inflation.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/submit">
                Submit your rent →
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
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

      {/* SECTION 2 — SEARCH */}
      <section className="mt-8">
        <div className="mx-auto max-w-2xl">
          <SearchBox />
        </div>
      </section>

      {/* SECTION 3 — KEY METRICS (ElevatedCard grid) */}
      {cityStats.totalSubmissions > 0 && (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ElevatedCard>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">Total submissions</p>
              <p className="mt-3 font-mono text-2xl font-bold text-[var(--md-sys-color-on-surface)]">{formatNumber(cityStats.totalSubmissions)}</p>
            </CardContent>
          </ElevatedCard>
          <ElevatedCard>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">Localities covered</p>
              <p className="mt-3 font-mono text-2xl font-bold text-[var(--md-sys-color-on-surface)]">{formatNumber(cityStats.localitiesWithData)}</p>
            </CardContent>
          </ElevatedCard>
          <ElevatedCard>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">Closed deals</p>
              <p className="mt-3 font-mono text-2xl font-bold text-[var(--md-sys-color-secondary)]">{cityStats.closedRentPercentage}%</p>
            </CardContent>
          </ElevatedCard>
          <ElevatedCard>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">City median</p>
              <p className="mt-3 font-mono text-2xl font-bold text-[var(--md-sys-color-on-surface)]">{formatINR(aggregate.median)}</p>
            </CardContent>
          </ElevatedCard>
        </section>
      )}

      {/* SECTION 4 — TREND + TRUST (ElevatedCard + FilledCard) */}
      {trendData.length > 0 && (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <ElevatedCard>
            <div className="p-5">
              <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">West Hyderabad trend</h2>
              <p className="mt-0.5 text-sm text-[var(--md-sys-color-on-surface-variant)]">Gachibowli weighted median and upper band movement</p>
              <div className="mt-4">
                <RentTrendChart data={trendData} />
              </div>
            </div>
          </ElevatedCard>

          <FilledCard>
            <div className="p-5">
              <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">Trust architecture</h2>
              <p className="mt-0.5 text-sm text-[var(--md-sys-color-on-surface-variant)]">Open-source-inspired verification without a single truth gatekeeper</p>
              <div className="mt-4">
                <Tabs defaultValue="score">
                  <TabsList className="grid w-full grid-cols-3 bg-[var(--md-sys-color-surface-container-high)]">
                    <TabsTrigger value="score">Score</TabsTrigger>
                    <TabsTrigger value="fraud">Fraud</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy</TabsTrigger>
                  </TabsList>
                  <TabsContent value="score" className="space-y-3 pt-3">
                    <TrustRow title="Reputation-weighted consensus" text="OTP, account age, proof, historical reliability, and nearby agreement shape submission weight." />
                    <TrustRow title="Robust aggregation" text="Weighted medians and percentile bands reduce the impact of broker-inflated outliers." />
                  </TabsContent>
                  <TabsContent value="fraud" className="space-y-3 pt-3">
                    <TrustRow title="Anomaly resistance" text="Z-score, IQR, and MAD checks flag suspicious spikes before they influence reports." />
                    <TrustRow title="Delayed publishing" text="Low-trust or clustered submissions can be queued for proof, votes, or duplicate review." />
                  </TabsContent>
                  <TabsContent value="privacy" className="space-y-3 pt-3">
                    <TrustRow title="Private evidence" text="Proof uploads are designed for encrypted private verification, never public display." />
                    <TrustRow title="Aggregate-only outputs" text="Public pages show ranges, distributions, and confidence rather than tenant identities." />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </FilledCard>
        </section>
      )}

      {/* SECTION 5 — MAP */}
      {mapLocalities.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">Hyderabad rent map</h2>
              <p className="mt-0.5 text-sm text-[var(--md-sys-color-on-surface-variant)]">Confidence-weighted markers · Tap for locality data</p>
            </div>
          </div>
          <LocalityMap localities={mapLocalities} />
        </section>
      )}

      {/* SECTION 6 — LOCALITY GRID */}
      <section className="mt-8">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">
              {localities.length > 0 ? "Featured locality reports" : "Localities indexed"}
            </h2>
            <p className="mt-0.5 text-sm text-[var(--md-sys-color-on-surface-variant)]">
              {localities.length > 0
                ? "SEO-ready city intelligence pages built from the same transparent analytics engine"
                : "Locality pages are ready — submit rent data to see real intelligence here"}
            </p>
          </div>
          {localities.length >= 2 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/compare/${localities[0]!.slug}-vs-${localities[1]!.slug}`}>
                <TrendingUp className="size-4" />
                Compare markets
              </Link>
            </Button>
          )}
        </div>
        <LocalityGrid />
      </section>

      {/* SECTION 7 — FAQ */}
      <section className="mt-12">
        <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">Frequently Asked Questions</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            ["Is my data anonymous?", "Yes. HydRent does not collect names, emails, or identifiable information. Submissions are aggregated and only statistical ranges are shown publicly."],
            ["How is the median calculated?", "We use a trust-weighted median. Each submission gets a trust score based on lease type, proof, recency, and nearby consensus. Higher trust submissions influence the median more."],
            ["Why different from 99acres/MagicBricks?", "Those sites show asking prices from brokers and owners. HydRent shows actual rents paid by tenants — verified, closed deals only."],
            ["Can my landlord know I submitted?", "No. Submissions are completely anonymous. No personal information is collected or stored."],
            ["What is a trust score?", "A 0-100 score based on: lease type (closed=40pts, renewal=30, asking=20), proof attached (+20), submitter type (tenant=15, owner=10, broker=0), nearby consensus (+15), and recency (+10). Brokers are capped at 30."],
          ].map(([q, a]) => (
            <details key={q} className="rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-4 group">
              <summary className="cursor-pointer text-sm font-medium text-[var(--md-sys-color-on-surface)] list-none">{q}</summary>
              <p className="mt-2 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* SECTION 8 — ISSUE CTA */}
      <section className="mt-12 rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-2)] p-6 sm:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">Found an issue or have an improvement idea?</h2>
            <p className="mt-0.5 text-sm text-[var(--md-sys-color-on-surface-variant)]">Help us improve HydRent by reporting bugs or suggesting features</p>
          </div>
          <Button asChild>
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
    <div className="flex gap-3 rounded-[--radius-md] border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-high)] p-4">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--md-sys-color-primary)]" />
      <div>
        <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">{text}</p>
      </div>
    </div>
  );
}
