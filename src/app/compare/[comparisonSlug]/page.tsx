import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TrendingUp, ArrowLeftRight } from "lucide-react";
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
      description: `Compare affordability, rent ranges, confidence, and commute context between ${left.name} and ${right.name}`,
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
    return { bhk, count: subs.length, median: aggregateRent(subs, { label: bhk }).median };
  });
  const rightBhks = bhks.map((bhk) => {
    const subs = rightSubmissions.filter((s) => s.bhk === bhk);
    return { bhk, count: subs.length, median: aggregateRent(subs, { label: bhk }).median };
  });

  const cheaperLocality = leftAggregate.median < rightAggregate.median ? left.name : right.name;
  const delta = Math.abs(leftAggregate.median - rightAggregate.median);
  const percentDiff = leftAggregate.median > 0 ? Math.round((delta / Math.max(leftAggregate.median, rightAggregate.median)) * 100) : 0;

  const allOther = allLocalities.filter((locality) => ![left.slug, right.slug].includes(locality.slug));

  function isCheaper(side: "left" | "right", value: number, other: number) {
    return value > 0 && value < other;
  }

  const leftColor = isCheaper("left", leftAggregate.median, rightAggregate.median) ? "var(--md-sys-color-secondary)" : "var(--md-sys-color-on-surface)";
  const rightColor = isCheaper("right", rightAggregate.median, leftAggregate.median) ? "var(--md-sys-color-secondary)" : "var(--md-sys-color-on-surface)";

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
        Trust-weighted comparison · {leftAggregate.sampleSize} vs {rightAggregate.sampleSize} verified signals
      </p>

      {hasLeftData && hasRightData ? (
        <>
          {/* Key insight banner */}
          <FilledCard className="mt-6">
            <div className="p-4 flex items-center gap-3">
              <TrendingUp className="size-5 shrink-0 text-[var(--md-sys-color-primary)]" />
              <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                <span className="text-[var(--md-sys-color-secondary)]">{cheaperLocality}</span> is {percentDiff}% cheaper — median rent {formatINR(delta)} less
              </p>
            </div>
          </FilledCard>

          {/* Side-by-side ElevatedCard layout */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {/* Left locality card */}
            <ElevatedCard>
              <div className="p-5">
                <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">{left.name}</h2>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{left.zone}</p>

                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Median rent</p>
                    <p className="mt-0.5 font-mono text-2xl font-bold" style={{ color: leftColor }}>{formatINR(leftAggregate.median)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">P25</p>
                      <p className="font-mono text-sm text-[var(--md-sys-color-on-surface)]">{formatINR(leftAggregate.p25)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">P75</p>
                      <p className="font-mono text-sm text-[var(--md-sys-color-on-surface)]">{formatINR(leftAggregate.p75)}</p>
                    </div>
                  </div>

                  <ConfidenceIndicator score={leftAggregate.confidenceScore} sampleSize={leftAggregate.sampleSize} />

                  {/* BHK breakdown */}
                  <div className="border-t border-[var(--md-sys-color-outline)] pt-3">
                    <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-2">BHK medians</p>
                    <div className="space-y-1.5">
                      {leftBhks.map(({ bhk, count, median }) => (
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
                  href={`/hyderabad/${left.slug}`}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--md-sys-color-primary)] hover:gap-1.5 transition-all"
                >
                  View full report →
                </Link>
              </div>
            </ElevatedCard>

            {/* Right locality card */}
            <ElevatedCard>
              <div className="p-5">
                <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">{right.name}</h2>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{right.zone}</p>

                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Median rent</p>
                    <p className="mt-0.5 font-mono text-2xl font-bold" style={{ color: rightColor }}>{formatINR(rightAggregate.median)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">P25</p>
                      <p className="font-mono text-sm text-[var(--md-sys-color-on-surface)]">{formatINR(rightAggregate.p25)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">P75</p>
                      <p className="font-mono text-sm text-[var(--md-sys-color-on-surface)]">{formatINR(rightAggregate.p75)}</p>
                    </div>
                  </div>

                  <ConfidenceIndicator score={rightAggregate.confidenceScore} sampleSize={rightAggregate.sampleSize} />

                  {/* BHK breakdown */}
                  <div className="border-t border-[var(--md-sys-color-outline)] pt-3">
                    <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-2">BHK medians</p>
                    <div className="space-y-1.5">
                      {rightBhks.map(({ bhk, count, median }) => (
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
                  href={`/hyderabad/${right.slug}`}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--md-sys-color-primary)] hover:gap-1.5 transition-all"
                >
                  View full report →
                </Link>
              </div>
            </ElevatedCard>
          </div>
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
          {allOther.slice(0, 6).map((locality) => (
            <Link
              key={locality.slug}
              href={`/compare/${left.slug}-vs-${locality.slug}`}
              className="rounded-[--radius-pill] border border-[var(--md-sys-color-outline)] px-4 py-1.5 text-sm text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
            >
              {locality.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
