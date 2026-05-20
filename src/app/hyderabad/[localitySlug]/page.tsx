import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowUpRight, FileCheck2, TrendingUp, HelpCircle, ShieldCheck, TriangleAlert } from "lucide-react";
import { RentTrendChart } from "@/components/charts/rent-trend-chart";
import { aggregateRent } from "@/lib/analytics/statistics";
import {
  getAllLocalitiesWithStats,
  getLocalityBySlug,
  getSubmissionsForLocality,
  getTrendSeriesForLocality,
} from "@/lib/data/db";
import { generatedLocalityCopy, generateLocalityJsonLd, localityMetadata } from "@/lib/seo";
import { formatINR } from "@/lib/utils";
import { ConfidenceIndicator } from "@/components/ui/confidence-indicator";
import { ElevatedCard, FilledCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  try {
    const locality = await getLocalityBySlug(localitySlug);
    if (!locality) return {};
    return localityMetadata(locality, `/hyderabad/${locality.slug}`);
  } catch {
    return {};
  }
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

function TrustSignal(score: number) {
  if (score >= 70) return { icon: ShieldCheck, color: "var(--md-sys-color-secondary)" };
  if (score >= 40) return { icon: TriangleAlert, color: "var(--md-sys-color-tertiary)" };
  return { icon: HelpCircle, color: "var(--md-sys-color-error)" };
}

export default async function LocalityPage({
  params,
}: {
  params: Promise<{ localitySlug: string }>;
}) {
  const { localitySlug } = await params;

  let locality: Awaited<ReturnType<typeof getLocalityBySlug>> = null;
  try {
    locality = await getLocalityBySlug(localitySlug);
  } catch {
    // DB unavailable
  }
  if (!locality) notFound();

  let submissions: import("@/lib/types").RentSubmission[] = [];
  let trendData: import("@/lib/types").TrendPoint[] = [];
  let allLocalities: import("@/lib/data/db").LocalityWithStats[] = [];

  try {
    [submissions, trendData, allLocalities] = await Promise.all([
      getSubmissionsForLocality(locality.slug),
      getTrendSeriesForLocality(locality.slug),
      getAllLocalitiesWithStats(),
    ]);
  } catch {
    // DB unavailable - render with empty data
  }

  const aggregate = aggregateRent(submissions, { label: locality.name });
  const copy = generatedLocalityCopy(locality);
  const jsonLd = generateLocalityJsonLd(locality);
  const hasData = aggregate.sampleSize > 0;

  // BHK breakdown
  const bhks = ["1RK", "1BHK", "2BHK", "3BHK", "4BHK"];
  const bhkBreakdown = bhks.map((bhk) => {
    const bhkSubs = submissions.filter((s) => s.bhk === bhk);
    const bhkAgg = aggregateRent(bhkSubs, { label: bhk });
    return { bhk, count: bhkSubs.length, median: bhkAgg.median, p25: bhkAgg.p25, p75: bhkAgg.p75 };
  });

  // Recent submissions
  const recentSubmissions = submissions.slice(0, 50);

  // Nearby localities
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

  const compareLocalities = allLocalities.filter((l) => l.slug !== locality.slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* SECTION 1 — Sticky stat bar */}
      <section className="sticky top-14 z-30 -mx-4 -mt-6 border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-dim)]/95 backdrop-blur-lg sm:-mx-6 sm:-mt-8">
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-4 py-2.5 text-xs sm:px-6">
          <span className="shrink-0 font-semibold text-[var(--md-sys-color-on-surface)]">{locality.name}</span>
          <span className="text-[var(--md-sys-color-on-surface-variant)]">·</span>
          <span className="shrink-0 text-[var(--md-sys-color-on-surface-variant)]">{locality.zone}</span>
          {hasData && (
            <>
              <span className="text-[var(--md-sys-color-on-surface-variant)]">·</span>
              <span className="shrink-0 font-mono font-bold text-[var(--md-sys-color-primary)]">{formatINR(aggregate.median)}/mo</span>
              <span className="text-[var(--md-sys-color-on-surface-variant)]">·</span>
              <span className="shrink-0 text-[var(--md-sys-color-on-surface-variant)]">P25 {formatINR(aggregate.p25)}</span>
              <span className="text-[var(--md-sys-color-on-surface-variant)]">·</span>
              <span className="shrink-0 text-[var(--md-sys-color-on-surface-variant)]">P75 {formatINR(aggregate.p75)}</span>
              <span className="text-[var(--md-sys-color-on-surface-variant)]">·</span>
              <span className="shrink-0 text-[var(--md-sys-color-on-surface-variant)]">{aggregate.sampleSize} signals</span>
            </>
          )}
          <Link
            href="/submit"
            className="ml-auto shrink-0 rounded-[--radius-pill] bg-[var(--md-sys-color-primary)] px-4 py-1.5 text-xs font-medium text-[var(--md-sys-color-on-primary)] hover:brightness-110 transition-all"
          >
            Submit rent →
          </Link>
        </div>
      </section>

      {/* SECTION 2 — Hero content */}
      <section className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h1 className="text-3xl font-bold text-[var(--md-sys-color-on-surface)] sm:text-4xl">
            Rent in {locality.name}, Hyderabad
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
            {copy.summary}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["1bhk", "2bhk", "3bhk"].map((bhk) => (
              <Link
                key={bhk}
                href={`/hyderabad/${locality.slug}/${bhk}`}
                className="rounded-[--radius-pill] border border-[var(--md-sys-color-outline)] px-4 py-1.5 text-sm text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
              >
                {bhk.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
        {hasData && (
          <ElevatedCard>
            <div className="p-5">
              <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">Trust-weighted median</p>
              <p className="mt-1 font-mono text-3xl font-bold text-[var(--md-sys-color-on-surface)]">{formatINR(aggregate.median)}</p>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">P25 <span className="font-mono text-[var(--md-sys-color-on-surface)]">{formatINR(aggregate.p25)}</span></span>
                <span className="text-[var(--md-sys-color-on-surface-variant)]">P75 <span className="font-mono text-[var(--md-sys-color-on-surface)]">{formatINR(aggregate.p75)}</span></span>
              </div>
              <div className="mt-4">
                <ConfidenceIndicator score={aggregate.confidenceScore} sampleSize={aggregate.sampleSize} />
              </div>
            </div>
          </ElevatedCard>
        )}
      </section>

      {!hasData && (
        <section className="mt-8 rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-8 text-center">
          <HelpCircle className="mx-auto size-8 text-[var(--md-sys-color-on-surface-variant)]" />
          <h2 className="mt-3 text-lg font-semibold text-[var(--md-sys-color-on-surface)]">No data yet for {locality.name}</h2>
          <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">Be the first to submit rent data</p>
          <Button asChild className="mt-4">
            <Link href="/submit">Submit rent for {locality.name}</Link>
          </Button>
        </section>
      )}

      {/* SECTION 3 — BHK breakdown */}
      {hasData && (
        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold text-[var(--md-sys-color-on-surface)]">BHK Breakdown</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 max-md:-mx-4 max-md:px-4 md:grid md:grid-cols-5">
            {bhkBreakdown.map(({ bhk, count, median, p25, p75 }) => {
              const hasBhk = count > 0;
              return (
                <div
                  key={bhk}
                  className={`shrink-0 rounded-[--radius-card] p-4 min-w-[160px] ${
                    hasBhk
                      ? "bg-[var(--elevation-level-1)] border border-[var(--md-sys-color-outline)]"
                      : "border border-dashed border-[var(--md-sys-color-outline)] bg-transparent"
                  }`}
                >
                  <p className={`text-xs font-medium ${hasBhk ? "text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-on-surface-variant)]"}`}>
                    {bhk}
                  </p>
                  {hasBhk ? (
                    <>
                      <p className="mt-2 font-mono text-xl font-bold text-[var(--md-sys-color-primary)]">{formatINR(median)}</p>
                      <p className="mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                        {formatINR(p25)} – {formatINR(p75)}
                      </p>
                      <p className="mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">{count} submission{count !== 1 ? "s" : ""}</p>
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">No data</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 4 — Recent verified rents */}
      {recentSubmissions.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold text-[var(--md-sys-color-on-surface)]">Recent verified rents</h2>
          <div className="space-y-2">
            {recentSubmissions.map((sub, idx) => {
              const signal = TrustSignal(sub.trustScore);
              const Icon = signal.icon;
              return (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 rounded-[--radius-md] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] px-4 py-3 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <Icon className="size-4 shrink-0" style={{ color: signal.color }} />
                  <span className="shrink-0 font-mono text-xs font-medium text-[var(--md-sys-color-on-surface)]">{sub.bhk}</span>
                  <span className="shrink-0 font-mono text-sm font-bold text-[var(--md-sys-color-primary)]">{formatINR(sub.rentAmount)}</span>
                  <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    {sub.furnishing.replace("_", " ").toLowerCase()}
                  </span>
                  <Badge variant="muted" className="text-[10px]">
                    {sub.rentType.toLowerCase() === "closed" ? "Closed deal" : sub.rentType.toLowerCase() === "renewed" ? "Renewal" : "Asking"}
                  </Badge>
                  <span className="ml-auto shrink-0 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    {timeAgo(new Date(sub.submittedAt))}
                  </span>
                </div>
              );
            })}
          </div>
          {submissions.length > 50 && (
            <a href={`/hyderabad/${localitySlug}?all=true`} className="mt-3 flex w-full items-center justify-center rounded-[--radius-md] border border-[var(--md-sys-color-outline)] py-2 text-xs text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors">
              Show all {submissions.length} submissions
            </a>
          )}
        </section>
      )}

      {/* SECTION 5 — Trend chart */}
      {trendData.length >= 3 && (
        <section className="mt-8">
          <ElevatedCard>
            <div className="p-5">
              <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">Rent Trend</h2>
              <p className="mt-0.5 text-sm text-[var(--md-sys-color-on-surface-variant)]">Weighted median movement over time · {submissions.length} data points</p>
              <div className="mt-4">
                <RentTrendChart data={trendData} />
              </div>
            </div>
          </ElevatedCard>
        </section>
      )}

      {/* SECTION 6 — Nearby localities */}
      {nearbyLocalities.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold text-[var(--md-sys-color-on-surface)]">Nearby Localities</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyLocalities.map((nearby) => (
              <Link key={nearby.slug} href={`/hyderabad/${nearby.slug}`} className="group block">
                <div className="h-full rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-4 transition-all group-hover:border-[var(--md-sys-color-primary)] group-hover:bg-[var(--elevation-level-2)]">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[var(--md-sys-color-primary)]" />
                    <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">{nearby.name}</h3>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">{nearby.zone}</p>
                  <p className="mt-3 font-mono text-lg font-bold text-[var(--md-sys-color-on-surface)]">{formatINR(nearby.median2BHK ?? 0)}</p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-[--radius-pill] bg-[var(--md-sys-color-secondary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--md-sys-color-secondary)]">
                    {nearby.confidenceScore}/100
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 7 — Compare widget */}
      {compareLocalities.length > 0 && (
        <section className="mt-8">
          <FilledCard>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="size-4 text-[var(--md-sys-color-primary)]" />
                <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">Compare {locality.name} with...</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {compareLocalities.slice(0, 6).map((other) => (
                  <Link
                    key={other.slug}
                    href={`/compare/${locality.slug}-vs-${other.slug}`}
                    className="rounded-[--radius-pill] border border-[var(--md-sys-color-outline)] px-4 py-1.5 text-sm text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
                  >
                    {other.name}
                  </Link>
                ))}
              </div>
            </div>
          </FilledCard>
        </section>
      )}

      {/* SECTION 8 — Submit CTA */}
      <section className="mt-8 rounded-[--radius-card] border border-[var(--md-sys-color-primary)]/20 bg-[var(--elevation-level-1)] p-6 text-center sm:p-8">
        <FileCheck2 className="mx-auto size-8 text-[var(--md-sys-color-primary)]" />
        <h2 className="mt-3 text-lg font-semibold text-[var(--md-sys-color-on-surface)]">
          Know what people actually pay in {locality.name}?
        </h2>
        <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Submit your rent. Anonymous. Takes 90 seconds.
        </p>
        <Button asChild className="mt-4">
          <Link href="/submit">Submit rent →</Link>
        </Button>
      </section>
    </div>
  );
}
