import Link from "next/link";
import { Building2, ArrowUpRight } from "lucide-react";
import { getAllLocalitiesWithStats } from "@/lib/data/db";
import { formatINR } from "@/lib/utils";
import { ConfidenceIndicator } from "@/components/ui/confidence-indicator";

export async function LocalityGrid() {
  let localitiesWithStats: import("@/lib/data/db").LocalityWithStats[] = [];
  try {
    localitiesWithStats = await getAllLocalitiesWithStats();
  } catch {
    // Database unavailable
  }

  if (localitiesWithStats.length === 0) {
    return (
      <div className="rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-8 text-center">
        <Building2 className="mx-auto size-10 text-[var(--md-sys-color-on-surface-variant)]" aria-hidden="true" />
        <h3 className="mt-4 text-base font-semibold text-[var(--md-sys-color-on-surface)]">No localities indexed yet</h3>
        <p className="mt-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">Locality pages will appear once Hyderabad localities are added to the database</p>
      </div>
    );
  }

  const sorted = [...localitiesWithStats].sort((a, b) => {
    const aHasData = a.submissionCount > 0;
    const bHasData = b.submissionCount > 0;
    if (aHasData && !bHasData) return -1;
    if (!aHasData && bHasData) return 1;
    if (!aHasData && !bHasData) return a.name.localeCompare(b.name);
    return b.confidenceScore - a.confidenceScore;
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sorted.map((locality, idx) => {
        const hasData = locality.submissionCount > 0;

        return (
          <Link
            key={locality.slug}
            href={hasData ? `/hyderabad/${locality.slug}` : "/submit"}
            className="group block animate-fade-in-up"
            style={{ animationDelay: `${idx * 50}ms`, animationFillMode: "both" }}
          >
            <div className={`h-full rounded-[--radius-card] border bg-[var(--elevation-level-1)] p-5 transition-all duration-300 ${
              hasData
                ? "border-[var(--md-sys-color-outline)] group-hover:border-[var(--md-sys-color-primary)] group-hover:bg-[var(--elevation-level-2)]"
                : "border-[var(--md-sys-color-outline)] opacity-70"
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[var(--md-sys-color-primary)]" />
                    <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">{locality.name}</h3>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">{locality.zone}</p>
                </div>
                {hasData && (
                  <span className="inline-flex items-center gap-1 rounded-[--radius-pill] bg-[var(--md-sys-color-secondary)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--md-sys-color-secondary)]">
                    {locality.confidenceScore}/100
                  </span>
                )}
              </div>

              {hasData ? (
                <>
                  {locality.median2BHK && (
                    <>
                      <p className="mt-4 font-mono text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
                        {formatINR(locality.median2BHK)}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                        /month · 2BHK median
                      </p>
                    </>
                  )}

                  <div className="mt-4">
                    <div className="relative h-1 rounded-full bg-[var(--md-sys-color-surface-container-highest)]">
                      <div className="absolute top-0 h-full rounded-full bg-[var(--md-sys-color-outline)]" style={{ left: "10%", width: "80%" }} />
                      <div className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full border-2 border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]" style={{ left: "45%" }} />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      <span>P25</span>
                      <span>P75</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      {locality.submissionCount} signal{locality.submissionCount !== 1 ? "s" : ""}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--md-sys-color-primary)] group-hover:gap-1.5 transition-all">
                      View report
                      <ArrowUpRight className="size-3" />
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-6 rounded-[--radius-md] border border-dashed border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-dim)]/50 p-4 text-center">
                    <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">Be the first to submit rent here</p>
                  </div>
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1 rounded-[--radius-pill] border border-[var(--md-sys-color-outline)] px-4 py-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)] group-hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors">
                      Submit rent →
                    </span>
                  </div>
                </>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
