import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TrendingUp, FileCheck2, ArrowUpRight, ChevronRight, ShieldCheck } from "lucide-react";
import { aggregateRent } from "@/lib/analytics/statistics";
import { getAllLocalitiesWithStats, getLocalityBySlug, getSubmissionsForLocality, getTrendSeriesForLocality } from "@/lib/data/db";
import { baseMetadata } from "@/lib/seo";
import { formatINR, timeAgo } from "@/lib/utils";
import { TrustSignal } from "@/lib/trust";
import { TrustScoreBadge } from "@/components/ui/trust-score-badge";
import { ConfidenceIndicator } from "@/components/ui/confidence-indicator";
import { ElevatedCard, FilledCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RentTrendChart } from "@/components/charts/rent-trend-chart";
import { generateLocalityJsonLd } from "@/lib/seo";
import { LocalityEmptyState } from "@/components/locality-empty-state";

export const dynamic = "force-dynamic";

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
    return baseMetadata({
      title: `Rent in ${locality.name}, Hyderabad`,
      description: `Trust-weighted rent data for ${locality.name}, Hyderabad. Community-verified submissions, BHK breakdowns, and negotiation intelligence.`,
      alternates: { canonical: `/hyderabad/${localitySlug}` },
    });
  } catch {
    return {};
  }
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
  const jsonLd = generateLocalityJsonLd(locality);
  const hasData = aggregate.sampleSize > 0;

  // BHK breakdown
  const bhks = ["1RK", "1BHK", "2BHK", "3BHK", "4BHK"];
  const bhkBreakdown = bhks.map((bhk) => {
    const bhkSubs = submissions.filter((s) => s.bhk === bhk);
    const bhkAgg = aggregateRent(bhkSubs, { label: bhk });
    return { bhk, count: bhkSubs.length, median: bhkAgg.median, p25: bhkAgg.p25, p75: bhkAgg.p75 };
  });
  const maxBhkCount = Math.max(...bhkBreakdown.map((b) => b.count), 1);

  // Recent submissions
  const recentSubmissions = submissions.slice(0, 10);

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

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
        <Link href="/localities" className="hover:text-[var(--md-sys-color-on-surface)] transition-colors">Localities</Link>
        <ChevronRight className="size-3" />
        <span className="text-[var(--md-sys-color-on-surface)] font-medium">{locality.name}</span>
      </nav>

      {!hasData && (
        <LocalityEmptyState locality={localitySlug} />
      )}

      {hasData && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          {/* ─── LEFT COLUMN ─── */}
          <div className="space-y-8">
            {/* Stats hero */}
            <section>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="section-eyebrow">Trust-weighted median</p>
                  <p className="hero-number">{formatINR(aggregate.median)}</p>
                  <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                    Based on {aggregate.sampleSize} verified signal{aggregate.sampleSize !== 1 ? "s" : ""}
                    <button className="ml-1.5 inline-flex items-center gap-1 text-xs text-[var(--md-sys-color-primary)] hover:underline" onClick={() => document.getElementById("how-to-use")?.scrollIntoView({ behavior: "smooth" })}>
                      <ShieldCheck className="size-3" /> How this works
                    </button>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <TooltipProvider>
                    <TrustScoreBadge score={aggregate.confidenceScore} />
                  </TooltipProvider>
                </div>
              </div>

              {/* P25/P75 range bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">P25 <span className="font-mono text-[var(--md-sys-color-on-surface)]">{formatINR(aggregate.p25)}</span></span>
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">P75 <span className="font-mono text-[var(--md-sys-color-on-surface)]">{formatINR(aggregate.p75)}</span></span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[var(--md-sys-color-surface-container-highest)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--md-sys-color-primary)]/30 relative">
                    <div className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[var(--md-sys-color-primary)] border-2 border-[var(--md-sys-color-surface)] left-1/2 -ml-1" />
                  </div>
                </div>
                <div className="mt-4">
                  <ConfidenceIndicator score={aggregate.confidenceScore} sampleSize={aggregate.sampleSize} />
                </div>
              </div>
            </section>

            {/* BHK Breakdown Table */}
            <section>
              <h2 className="mb-4 text-base font-semibold text-[var(--md-sys-color-on-surface)]">BHK Breakdown</h2>
              <div className="overflow-hidden rounded-[--radius-card] border border-[var(--md-sys-color-outline)]">
                <table className="w-full text-sm">
                  <caption className="sr-only">BHK rent breakdown for {locality.name}</caption>
                  <thead>
                    <tr className="border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)]">
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">BHK</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">Median</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">Range</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">Submissions</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bhkBreakdown.map(({ bhk, count, median, p25, p75 }) => {
                      const isMostCommon = count > 0 && count === Math.max(...bhkBreakdown.map((b) => b.count));
                      return (
                        <tr
                          key={bhk}
                          className={`border-b border-[var(--md-sys-color-outline)] last:border-0 ${
                            isMostCommon ? "bg-[var(--md-sys-color-primary)]/5" : ""
                          }`}
                        >
                          <td className={`px-4 py-3 font-medium ${isMostCommon ? "text-[var(--md-sys-color-primary)]" : "text-[var(--md-sys-color-on-surface)]"}`}>
                            <Link href={`/hyderabad/${localitySlug}/${bhk.toLowerCase()}`} className="hover:underline">
                              {bhk}
                            </Link>
                            {isMostCommon && (
                              <span className="ml-2 rounded-[--radius-pill] bg-[var(--md-sys-color-primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--md-sys-color-primary)]">Most common</span>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono font-semibold ${isMostCommon ? "text-[var(--md-sys-color-primary)]" : "text-[var(--md-sys-color-on-surface)]"}`}>
                            {count > 0 ? formatINR(median) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[var(--md-sys-color-on-surface-variant)]">
                            {count > 0 ? `${formatINR(p25)} – ${formatINR(p75)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[var(--md-sys-color-on-surface)]">
                            {count}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex h-6 items-end gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => {
                                const barHeight = i < Math.round((count / maxBhkCount) * 5) ? 4 + i * 4 : 4;
                                return (
                                  <div
                                    key={i}
                                    className="w-1.5 rounded-t-sm bg-[var(--md-sys-color-primary)]/40 transition-all"
                                    style={{ height: `${Math.max(barHeight, 4)}px` }}
                                  />
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Recent verified rents */}
            {recentSubmissions.length > 0 && (
              <section>
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
                        <span className="shrink-0 rounded-[--radius-sm] bg-[var(--md-sys-color-surface-container-high)] px-2 py-1 font-mono text-xs font-medium text-[var(--md-sys-color-on-surface)]">{sub.bhk}</span>
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
                {submissions.length > 10 && (
                  <a href={`/hyderabad/${localitySlug}`} className="mt-3 flex w-full items-center justify-center rounded-[--radius-md] border border-[var(--md-sys-color-outline)] py-2 text-xs text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors">
                    See all {submissions.length} submissions
                  </a>
                )}
              </section>
            )}

            {/* Trend chart */}
            {trendData.length >= 3 && (
              <section>
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

            {/* How to use this data */}
            <section id="how-to-use">
              <FilledCard>
                <div className="p-5">
                  <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">How to use this data</h2>
                  <div className="mt-4 space-y-4">
                    <div className="flex gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--md-sys-color-primary)]/10 text-sm font-bold text-[var(--md-sys-color-primary)]">1</div>
                      <div>
                        <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">Know your anchor</p>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">Use the P25 as your opening offer. It&apos;s where 25% of renters start.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--md-sys-color-primary)]/10 text-sm font-bold text-[var(--md-sys-color-primary)]">2</div>
                      <div>
                        <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">Compare BHKs</p>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">A 2BHK might cost only 20% more than 1BHK. Check the BHK table to find deals.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--md-sys-color-primary)]/10 text-sm font-bold text-[var(--md-sys-color-primary)]">3</div>
                      <div>
                        <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">Check nearby</p>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">Nearby localities might offer better value. Use the compare tool to decide.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </FilledCard>
            </section>

            {/* Privacy reassurance */}
            <section className="rounded-[--radius-card] border border-[var(--md-sys-color-primary)]/10 bg-[var(--md-sys-color-primary)]/5 p-4 text-center">
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                <span className="text-[var(--md-sys-color-primary)]">Anonymous</span> · No personal data shown · Your landlord cannot identify you
              </p>
            </section>
          </div>

          {/* ─── RIGHT COLUMN — SIDEBAR ─── */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {/* Submit CTA */}
            <ElevatedCard>
              <div className="p-5 text-center">
                <FileCheck2 className="mx-auto size-6 text-[var(--md-sys-color-primary)]" />
                <h3 className="mt-3 text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Know what people pay in {locality.name}?</h3>
                <p className="mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">Submit your rent. Anonymous. Takes 90 seconds.</p>
                <Button asChild className="mt-4 w-full">
                  <Link href="/submit">Submit rent <ArrowUpRight className="size-3" /></Link>
                </Button>
              </div>
            </ElevatedCard>

            {/* Nearby localities */}
            {nearbyLocalities.length > 0 && (
              <ElevatedCard>
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Nearby</h3>
                  <div className="mt-3 space-y-3">
                    {nearbyLocalities.map((nearby) => (
                      <Link
                        key={nearby.slug}
                        href={`/hyderabad/${nearby.slug}`}
                        className="group flex items-center justify-between rounded-[--radius-md] p-2 -mx-2 hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors">{nearby.name}</p>
                          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{nearby.zone}</p>
                        </div>
                        <span className="font-mono text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                          {nearby.median2BHK ? formatINR(nearby.median2BHK) : "—"}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </ElevatedCard>
            )}

            {/* Compare with */}
            {compareLocalities.length > 0 && (
              <ElevatedCard>
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-4 text-[var(--md-sys-color-primary)]" />
                    <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Compare</h3>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {compareLocalities.slice(0, 6).map((other) => (
                      <Link
                        key={other.slug}
                        href={`/compare/${locality.slug}-vs-${other.slug}`}
                        className="rounded-[--radius-pill] border border-[var(--md-sys-color-outline)] px-3 py-1 text-xs text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
                      >
                        {other.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </ElevatedCard>
            )}

            {/* BHK quick links */}
            <ElevatedCard>
              <div className="p-5">
                <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">BHK details</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {bhks.filter((bhk) => bhkBreakdown.find((b) => b.bhk === bhk)?.count ?? 0 > 0).map((bhk) => (
                    <Link
                      key={bhk}
                      href={`/hyderabad/${locality.slug}/${bhk.toLowerCase()}`}
                      className="rounded-[--radius-pill] border border-[var(--md-sys-color-outline)] px-3 py-1 text-xs text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
                    >
                      {bhk}
                    </Link>
                  ))}
                </div>
              </div>
            </ElevatedCard>
          </aside>
        </div>
      )}
    </div>
  );
}
