import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Building2, TrendingUp, ShieldCheck, HelpCircle } from "lucide-react";
import { getAllLocalitiesWithStats } from "@/lib/data/db";
import { baseMetadata } from "@/lib/seo";
import { formatINR, formatNumber } from "@/lib/utils";
import { ElevatedCard, FilledCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfidenceIndicator } from "@/components/ui/confidence-indicator";

export const dynamic = "force-dynamic";

export const metadata: Metadata = baseMetadata({
  title: "Hyderabad Localities",
  description: "Browse all Hyderabad localities with rent intelligence, BHK breakdowns, and confidence scores.",
  alternates: { canonical: "/localities" },
});

export default async function LocalitiesPage() {
  let localities: import("@/lib/data/db").LocalityWithStats[] = [];
  try {
    localities = await getAllLocalitiesWithStats();
  } catch {
    // DB unavailable
  }

  const sorted = [...localities].sort((a, b) => {
    const aHasData = a.submissionCount > 0;
    const bHasData = b.submissionCount > 0;
    if (aHasData && !bHasData) return -1;
    if (!aHasData && bHasData) return 1;
    return b.confidenceScore - a.confidenceScore;
  });

  const totalSubmissions = localities.reduce((s, l) => s + l.submissionCount, 0);
  const withData = localities.filter((l) => l.submissionCount > 0).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--md-sys-color-on-surface)]">Hyderabad Localities</h1>
        <p className="mt-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
          {withData} localities with data · {formatNumber(totalSubmissions)} total signals
        </p>
      </div>

      {/* Stats overview */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <ElevatedCard>
          <div className="p-4">
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Total localities</p>
            <p className="mt-1 font-mono text-2xl font-bold text-[var(--md-sys-color-on-surface)]">{localities.length}</p>
          </div>
        </ElevatedCard>
        <ElevatedCard>
          <div className="p-4">
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">With data</p>
            <p className="mt-1 font-mono text-2xl font-bold text-[var(--md-sys-color-primary)]">{withData}</p>
          </div>
        </ElevatedCard>
        <ElevatedCard>
          <div className="p-4">
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Total submissions</p>
            <p className="mt-1 font-mono text-2xl font-bold text-[var(--md-sys-color-on-surface)]">{formatNumber(totalSubmissions)}</p>
          </div>
        </ElevatedCard>
      </div>

      {/* Locality list */}
      {sorted.length === 0 ? (
        <div className="rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-12 text-center">
          <Building2 className="mx-auto size-8 text-[var(--md-sys-color-on-surface-variant)]" />
          <h2 className="mt-3 text-lg font-semibold text-[var(--md-sys-color-on-surface)]">No localities loaded</h2>
          <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">Localities will appear once the database is connected</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((locality) => {
            const hasData = locality.submissionCount > 0;
            return (
              <Link
                key={locality.slug}
                href={hasData ? `/hyderabad/${locality.slug}` : "/submit"}
                className="group block"
              >
                <ElevatedCard className="h-full transition-all duration-300 group-hover:border-[var(--md-sys-color-primary)] group-hover:shadow-glow">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">{locality.name}</h2>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">{locality.zone}</p>
                      </div>
                      {hasData && (
                        <Badge variant="secondary" className="shrink-0">
                          {locality.confidenceScore}/100
                        </Badge>
                      )}
                    </div>

                    {hasData ? (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">2BHK median</p>
                            <p className="font-mono text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                              {locality.median2BHK ? formatINR(locality.median2BHK) : "—"}
                            </p>
                          </div>
                          <span className="flex items-center gap-1 text-xs text-[var(--md-sys-color-primary)] group-hover:gap-1.5 transition-all">
                            View <ArrowUpRight className="size-3" />
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                          <span>{locality.submissionCount} submissions</span>
                          <span>·</span>
                          <span>Trust {locality.avgTrustScore}/100</span>
                        </div>

                        {/* BHK chips */}
                        {locality.bhkBreakdown.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {locality.bhkBreakdown.filter((b) => b.count > 0).slice(0, 4).map((b) => (
                              <span key={b.bhk} className="rounded-[--radius-pill] bg-[var(--md-sys-color-primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--md-sys-color-primary)]">
                                {b.bhk} ₹{b.minRent.toLocaleString()}-{b.maxRent.toLocaleString()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-[--radius-md] border border-dashed border-[var(--md-sys-color-outline)] p-4 text-center">
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">No data yet — be the first to submit</p>
                      </div>
                    )}
                  </div>
                </ElevatedCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
