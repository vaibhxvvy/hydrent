import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TrendingUp, ArrowLeftRight, ChevronDown, ChevronUp, Minus } from "lucide-react";
import { aggregateRent } from "@/lib/analytics/statistics";
import { getAllLocalitiesWithStats, getLocalityBySlug, getSubmissionsForLocality } from "@/lib/data/db";
import { baseMetadata } from "@/lib/seo";
import { formatINR } from "@/lib/utils";
import { ConfidenceIndicator } from "@/components/ui/confidence-indicator";
import { ElevatedCard, FilledCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ comparisonSlug: string }>;
}): Promise<Metadata> {
  const { comparisonSlug } = await params;
  const [leftSlug, rightSlug] = comparisonSlug.split("-vs-");
  try {
    const left = leftSlug ? await getLocalityBySlug(leftSlug) : undefined;
    const right = rightSlug ? await getLocalityBySlug(rightSlug) : undefined;
    if (!left || !right) return {};
    return baseMetadata({
      title: `${left.name} vs ${right.name} rent comparison`,
      description: `Compare real rent data between ${left.name} and ${right.name} in Hyderabad. Trust-weighted medians, BHK breakdowns, P25/P75 bands.`,
      alternates: { canonical: `/compare/${comparisonSlug}` },
    });
  } catch {
    return {};
  }
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ comparisonSlug: string }>;
}) {
  const { comparisonSlug } = await params;
  const [leftSlug, rightSlug] = comparisonSlug.split("-vs-");

  let left: Awaited<ReturnType<typeof getLocalityBySlug>> = null;
  let right: Awaited<ReturnType<typeof getLocalityBySlug>> = null;
  try {
    left = leftSlug ? await getLocalityBySlug(leftSlug) : null;
    right = rightSlug ? await getLocalityBySlug(rightSlug) : null;
  } catch {
    // DB unavailable
  }
  if (!left || !right) notFound();

  let leftSubmissions: import("@/lib/types").RentSubmission[] = [];
  let rightSubmissions: import("@/lib/types").RentSubmission[] = [];
  let allLocalities: import("@/lib/data/db").LocalityWithStats[] = [];

  try {
    [leftSubmissions, rightSubmissions, allLocalities] = await Promise.all([
      getSubmissionsForLocality(left.slug),
      getSubmissionsForLocality(right.slug),
      getAllLocalitiesWithStats(),
    ]);
  } catch {
    // DB unavailable
  }

  const leftAggregate = aggregateRent(leftSubmissions, { label: left.name });
  const rightAggregate = aggregateRent(rightSubmissions, { label: right.name });
  const hasLeftData = leftAggregate.sampleSize > 0;
  const hasRightData = rightAggregate.sampleSize > 0;

  // BHK breakdowns
  const bhks = ["1BHK", "2BHK", "3BHK"];
  const leftBhks = bhks.map((bhk) => {
    const subs = leftSubmissions.filter((s) => s.bhk === bhk);
    return { bhk, count: subs.length, median: aggregateRent(subs, { label: bhk }).median, p25: aggregateRent(subs, { label: bhk }).p25, p75: aggregateRent(subs, { label: bhk }).p75 };
  });
  const rightBhks = bhks.map((bhk) => {
    const subs = rightSubmissions.filter((s) => s.bhk === bhk);
    return { bhk, count: subs.length, median: aggregateRent(subs, { label: bhk }).median, p25: aggregateRent(subs, { label: bhk }).p25, p75: aggregateRent(subs, { label: bhk }).p75 };
  });

  const cheaperLocality = leftAggregate.median < rightAggregate.median ? left.name : right.name;
  const delta = Math.abs(leftAggregate.median - rightAggregate.median);
  const percentDiff = leftAggregate.median > 0 ? Math.round((delta / Math.max(leftAggregate.median, rightAggregate.median)) * 100) : 0;

  const allOther = allLocalities.filter((locality) => ![left.slug, right.slug].includes(locality.slug));

  function renderDelta(value: number, other: number) {
    if (value <= 0 || other <= 0) return <span className="text-[var(--md-sys-color-on-surface-variant)]">—</span>;
    const diff = value - other;
    const isCheaper = diff < 0;
    return (
      <span className={`inline-flex items-center gap-0.5 font-mono text-sm font-medium ${isCheaper ? "text-[var(--md-sys-color-primary)]" : "text-[var(--md-sys-color-tertiary)]"}`}>
        {isCheaper ? <ChevronDown className="size-3" /> : diff > 0 ? <ChevronUp className="size-3" /> : <Minus className="size-3" />}
        {formatINR(Math.abs(diff))}
      </span>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <ArrowLeftRight className="size-5 text-[var(--md-sys-color-primary)]" />
        <h1 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] sm:text-3xl">
          {left.name} vs {right.name}
        </h1>
      </div>
      <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
        Rent comparison · {leftAggregate.sampleSize} vs {rightAggregate.sampleSize} verified signals
      </p>

      {hasLeftData && hasRightData ? (
        <>
          {/* Key insight banner */}
          <FilledCard className="mt-6">
            <div className="p-5 flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--md-sys-color-primary)]/10">
                <TrendingUp className="size-6 text-[var(--md-sys-color-primary)]" />
              </div>
              <div>
                <p className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">
                  <span className="text-[var(--md-sys-color-primary)]">{cheaperLocality}</span> is <span className="font-bold">{percentDiff}% cheaper</span>
                </p>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                  Median rent {formatINR(delta)} less per month
                </p>
              </div>
            </div>
          </FilledCard>

          {/* Side-by-side stat cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { locality: left, aggregate: leftAggregate, bhks: leftBhks },
              { locality: right, aggregate: rightAggregate, bhks: rightBhks },
            ].map(({ locality, aggregate, bhks }) => (
              <ElevatedCard key={locality.slug}>
                <div className="p-5">
                  <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">{locality.name}</h2>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{locality.zone}</p>

                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Median rent</p>
                      <p className="mt-0.5 hero-number">{formatINR(aggregate.median)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">P25</p>
                        <p className="font-mono text-sm text-[var(--md-sys-color-on-surface)]">{formatINR(aggregate.p25)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">P75</p>
                        <p className="font-mono text-sm text-[var(--md-sys-color-on-surface)]">{formatINR(aggregate.p75)}</p>
                      </div>
                    </div>

                    <ConfidenceIndicator score={aggregate.confidenceScore} sampleSize={aggregate.sampleSize} />

                    {/* BHK medians */}
                    <div className="border-t border-[var(--md-sys-color-outline)] pt-3">
                      <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-2">BHK medians</p>
                      <div className="space-y-1.5">
                        {bhks.map(({ bhk, count, median }) => (
                          <div key={bhk} className="flex items-center justify-between text-xs">
                            <span className="text-[var(--md-sys-color-on-surface-variant)]">{bhk}</span>
                            <span className="font-mono text-[var(--md-sys-color-on-surface)]">
                              {count > 0 ? formatINR(median) : "—"}
                              <span className="text-[var(--md-sys-color-on-surface-variant)] ml-1">({count})</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/hyderabad/${locality.slug}`}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--md-sys-color-primary)] hover:gap-1.5 transition-all"
                  >
                    View full report →
                  </Link>
                </div>
              </ElevatedCard>
            ))}
          </div>

          {/* BHK Comparison Table with Delta */}
          <section className="mt-8">
            <h2 className="mb-4 text-base font-semibold text-[var(--md-sys-color-on-surface)]">BHK Comparison</h2>
            <div className="overflow-hidden rounded-[--radius-card] border border-[var(--md-sys-color-outline)]">
              <table className="w-full text-sm">
                <caption className="sr-only">BHK comparison between {left.name} and {right.name}</caption>
                <thead>
                  <tr className="border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)]">
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">BHK</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">{left.name}</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">{right.name}</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {bhks.map((bhk, idx) => {
                    const leftBhk = leftBhks[idx]!;
                    const rightBhk = rightBhks[idx]!;
                    return (
                      <tr key={bhk} className="border-b border-[var(--md-sys-color-outline)] last:border-0 hover:bg-[var(--md-sys-color-surface-container)]/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">{bhk}</td>
                        <td className="px-4 py-3 text-right font-mono text-[var(--md-sys-color-on-surface)]">
                          {leftBhk.count > 0 ? formatINR(leftBhk.median) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[var(--md-sys-color-on-surface)]">
                          {rightBhk.count > 0 ? formatINR(rightBhk.median) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {leftBhk.count > 0 && rightBhk.count > 0
                            ? renderDelta(leftBhk.median, rightBhk.median)
                            : <span className="text-[var(--md-sys-color-on-surface-variant)]">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)] text-right">
              <span className="inline-flex items-center gap-1"><ChevronDown className="size-3 text-[var(--md-sys-color-primary)]" /> Cheaper</span>
              <span className="mx-2">·</span>
              <span className="inline-flex items-center gap-1"><ChevronUp className="size-3 text-[var(--md-sys-color-tertiary)]" /> More expensive</span>
            </div>
          </section>
        </>
      ) : (
        <div className="mt-6 rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-8 text-center">
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">One or both localities lack sufficient data for comparison</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href={`/hyderabad/${left.slug}`} className="rounded-[--radius-pill] bg-[var(--md-sys-color-primary)] px-4 py-2 text-sm font-medium text-[var(--md-sys-color-on-primary)] hover:brightness-110 transition-all">
              View {left.name}
            </Link>
            <Link href={`/hyderabad/${right.slug}`} className="rounded-[--radius-pill] bg-[var(--md-sys-color-primary)] px-4 py-2 text-sm font-medium text-[var(--md-sys-color-on-primary)] hover:brightness-110 transition-all">
              View {right.name}
            </Link>
          </div>
        </div>
      )}

      {/* Compare with other localities */}
      <div className="mt-8">
        <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">Compare with other localities</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {allOther.slice(0, 12).map((locality) => (
            <Link
              key={locality.slug}
              href={`/compare/${left.slug}-vs-${locality.slug}`}
              className="rounded-[--radius-pill] border border-[var(--md-sys-color-outline)] px-3 py-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
            >
              {locality.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
