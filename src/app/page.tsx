import Link from "next/link";
import { ShieldCheck, TrendingUp, ArrowUpRight, MapPin } from "lucide-react";
import { RentTrendChart } from "@/components/charts/rent-trend-chart";
import { LocalityMap } from "@/components/maps/locality-map";
import { LocalityGrid } from "@/components/rent/locality-grid";
import { StatsBar } from "@/components/rent/stats-bar";
import { SubmissionCounter } from "@/components/rent/submission-counter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ElevatedCard, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { aggregateRent } from "@/lib/analytics/statistics";
import { getAllLocalitiesWithStats, getAllSubmissions, getCityStats, getTrendSeriesForLocality } from "@/lib/data/db";
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
    // Database unavailable during build
  }

  const localities = localitiesWithStats.map(({ submissionCount, confidenceScore, median2BHK, ...loc }) => loc);
  const aggregate = aggregateRent(submissions, { label: "Hyderabad" });

  const mapLocalities = localitiesWithStats.map((loc) => ({
    id: loc.id, name: loc.name, slug: loc.slug, zone: loc.zone,
    lat: loc.coordinates.lat, lng: loc.coordinates.lng,
    submissionCount: loc.submissionCount, confidenceScore: loc.confidenceScore, median2BHK: loc.median2BHK,
    bhkBreakdown: loc.bhkBreakdown, furnishingBreakdown: loc.furnishingBreakdown,
    avgTrustScore: loc.avgTrustScore, avgRent: loc.avgRent, minRent: loc.minRent, maxRent: loc.maxRent,
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      {/* HERO — compact, map-first */}
      <section className="relative overflow-hidden rounded-[--radius-xl] border border-[var(--md-sys-color-outline)] p-6 sm:p-8 lg:p-10 mb-8">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <Badge variant="outline" className="gap-1.5 text-xs mb-3">
              <span className="size-1.5 rounded-full bg-[var(--md-sys-color-secondary)]" />
              Hyderabad&apos;s rent truth layer
            </Badge>
            <h1 className="font-display text-3xl leading-[1.05] text-[var(--md-sys-color-on-surface)] sm:text-4xl lg:text-5xl">
              What your neighbours<br />
              <em className="font-display italic text-[var(--md-sys-color-primary)] not-italic">actually pay</em>
            </h1>
            <div className="mt-4">
              <StatsBar
                initial={{
                  totalSubmissions: cityStats.totalSubmissions,
                  localitiesWithData: cityStats.localitiesWithData,
                  closedRentPercentage: cityStats.closedRentPercentage,
                  lastUpdated: cityStats.lastUpdated.toISOString(),
                }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" className="gap-1.5">
                <Link href="/explore">
                  <MapPin className="size-4" />
                  Explore map
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/submit">
                  Submit rent
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
          <SubmissionCounter totalSubmissions={cityStats.totalSubmissions} />
        </div>
      </section>

      {/* SECTION 2 — MAP (primary experience) */}
      {mapLocalities.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Hyderabad rent map</h2>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Tap any pin for locality data</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/explore">
                <MapPin className="size-3.5" />
                Explore
              </Link>
            </Button>
          </div>
          <LocalityMap localities={mapLocalities} />
          <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-[#22c55e]" /> High confidence</span>
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-[#eab308]" /> Medium</span>
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-[#ef4444]" /> Low</span>
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-[#6b7280]" /> No data</span>
          </div>
        </section>
      )}

      {/* SECTION 3 — KEY METRICS */}
      {cityStats.totalSubmissions > 0 && (
        <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ElevatedCard>
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)]">Total submissions</p>
              <p className="mt-2 font-mono text-xl font-bold text-[var(--md-sys-color-on-surface)]">{formatNumber(cityStats.totalSubmissions)}</p>
            </CardContent>
          </ElevatedCard>
          <ElevatedCard>
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)]">Localities covered</p>
              <p className="mt-2 font-mono text-xl font-bold text-[var(--md-sys-color-on-surface)]">{formatNumber(cityStats.localitiesWithData)}</p>
            </CardContent>
          </ElevatedCard>
          <ElevatedCard>
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)]">Closed deals</p>
              <p className="mt-2 font-mono text-xl font-bold text-[var(--md-sys-color-secondary)]">{cityStats.closedRentPercentage}%</p>
            </CardContent>
          </ElevatedCard>
          <ElevatedCard>
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)]">City median</p>
              <p className="mt-2 font-mono text-xl font-bold text-[var(--md-sys-color-on-surface)]">{formatINR(aggregate.median)}</p>
            </CardContent>
          </ElevatedCard>
        </section>
      )}

      {/* SECTION 4 — TREND + TRUST */}
      {trendData.length > 0 && (
        <section className="mb-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <ElevatedCard>
            <div className="p-4">
              <h2 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">West Hyderabad trend</h2>
              <p className="mt-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">Gachibowli weighted median movement</p>
              <div className="mt-3">
                <RentTrendChart data={trendData} />
              </div>
            </div>
          </ElevatedCard>

          <ElevatedCard>
            <div className="p-4">
              <h2 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Trust architecture</h2>
              <p className="mt-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">Open-source-inspired verification</p>
              <div className="mt-3">
                <Tabs defaultValue="score">
                  <TabsList className="grid w-full grid-cols-3 bg-[var(--md-sys-color-surface-container-high)]">
                    <TabsTrigger value="score">Score</TabsTrigger>
                    <TabsTrigger value="fraud">Fraud</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy</TabsTrigger>
                  </TabsList>
                  <TabsContent value="score" className="space-y-2 pt-2">
                    <TrustRow title="Reputation-weighted consensus" text="OTP, account age, proof, historical reliability, and nearby agreement shape submission weight." />
                    <TrustRow title="Robust aggregation" text="Weighted medians and percentile bands reduce the impact of broker-inflated outliers." />
                  </TabsContent>
                  <TabsContent value="fraud" className="space-y-2 pt-2">
                    <TrustRow title="Anomaly resistance" text="Z-score, IQR, and MAD checks flag suspicious spikes before they influence reports." />
                    <TrustRow title="Delayed publishing" text="Low-trust or clustered submissions can be queued for proof, votes, or duplicate review." />
                  </TabsContent>
                  <TabsContent value="privacy" className="space-y-2 pt-2">
                    <TrustRow title="Private evidence" text="Proof uploads designed for encrypted private verification, never public display." />
                    <TrustRow title="Aggregate-only outputs" text="Public pages show ranges and distributions, never tenant identities." />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ElevatedCard>
        </section>
      )}

      {/* SECTION 5 — LOCALITY GRID */}
      <section className="mb-8">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
              {localities.length > 0 ? "Featured locality reports" : "Localities indexed"}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
              {localities.length > 0
                ? "SEO-ready city intelligence pages from the same transparent analytics engine"
                : "Locality pages are ready — submit rent data to see real intelligence here"}
            </p>
          </div>
          {localities.length >= 2 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/compare/${localities[0]!.slug}-vs-${localities[1]!.slug}`}>
                <TrendingUp className="size-3.5" />
                Compare markets
              </Link>
            </Button>
          )}
        </div>
        <LocalityGrid />
      </section>

      {/* SECTION 6 — FAQ */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Frequently Asked Questions</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {[
            ["Is my data anonymous?", "Yes. HydRent does not collect names, emails, or identifiable information. Submissions are aggregated and only statistical ranges are shown publicly."],
            ["How is the median calculated?", "We use a trust-weighted median. Each submission gets a trust score based on lease type, proof, recency, and nearby consensus."],
            ["Why different from 99acres/MagicBricks?", "Those sites show asking prices from brokers. HydRent shows actual rents paid by tenants — verified, closed deals only."],
            ["Can my landlord know I submitted?", "No. Submissions are completely anonymous. No personal information is collected or stored."],
            ["What is a trust score?", "A 0-100 score based on: lease type (closed=40pts, renewal=30, asking=20), proof attached (+20), submitter type (+15), nearby consensus (+15), recency (+10). Brokers capped at 30."],
          ].map(([q, a]) => (
            <details key={q} className="rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-3 group">
              <summary className="cursor-pointer text-xs font-medium text-[var(--md-sys-color-on-surface)] list-none">{q}</summary>
              <p className="mt-1.5 text-xs leading-5 text-[var(--md-sys-color-on-surface-variant)]">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* SECTION 7 — ISSUE CTA */}
      <section className="rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-2)] p-5 sm:p-6">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Found an issue or have an improvement idea?</h2>
            <p className="mt-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">Help us improve HydRent by reporting bugs or suggesting features</p>
          </div>
          <Button asChild size="sm">
            <Link href="/issues">Report an Issue</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function TrustRow({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-2 rounded-[--radius-md] border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-high)] p-3">
      <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--md-sys-color-primary)]" />
      <div>
        <p className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-[var(--md-sys-color-on-surface-variant)]">{text}</p>
      </div>
    </div>
  );
}
