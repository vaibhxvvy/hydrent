import Link from "next/link";
import { ArrowUpRight, Building2 } from "lucide-react";
import { getAllLocalitiesWithStats } from "@/lib/data/db";
import { formatINR } from "@/lib/utils";

export async function LocalityGrid() {
  let localitiesWithStats: import("@/lib/data/db").LocalityWithStats[] = [];
  try {
    localitiesWithStats = await getAllLocalitiesWithStats();
  } catch {
    // Database unavailable
  }

  if (localitiesWithStats.length === 0) {
    return (
      <div className="rounded-lg border border-[#1f2b1f] bg-[#111811] p-8 text-center">
        <Building2 className="mx-auto size-12 text-[#4b7a4b]" aria-hidden="true" />
        <h3 className="mt-4 text-lg font-semibold text-[#f0fdf4]">No localities indexed yet</h3>
        <p className="mt-2 text-sm text-[#4b7a4b]">Locality pages will appear once Hyderabad localities are added to the database.</p>
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
        const confidenceTier = hasData
          ? locality.confidenceScore >= 70 ? "high" : locality.confidenceScore >= 40 ? "medium" : "low"
          : "none";

        const confidenceColors: Record<string, string> = {
          high: "bg-[#22c55e] text-[#0a0f0a]",
          medium: "bg-[#eab308] text-[#0a0f0a]",
          low: "bg-[#ef4444] text-white",
          none: "bg-[#1f2b1f] text-[#4b7a4b]",
        };

        return (
          <Link
            key={locality.slug}
            href={hasData ? `/hyderabad/${locality.slug}` : "/submit"}
            className="group block animate-fade-in-up"
            style={{ animationDelay: `${idx * 50}ms`, animationFillMode: "both" }}
          >
            <div className={`h-full rounded-xl border bg-[#111811] p-5 transition-all duration-300 ${
              hasData
                ? "border-[#1f2b1f] group-hover:border-[#22c55e] group-hover:shadow-[0_0_40px_rgba(34,197,94,0.12)]"
                : "border-[#1f2b1f] opacity-70 group-hover:border-[#2d3f2d]"
            }`}>
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#22c55e]" />
                    <h3 className="font-semibold text-[#f0fdf4]">{locality.name}</h3>
                  </div>
                  <p className="mt-0.5 text-sm text-[#4b7a4b]">{locality.zone}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${confidenceColors[confidenceTier]}`}>
                  {hasData ? `${locality.confidenceScore}/100` : "No data"}
                </span>
              </div>

              {hasData ? (
                <>
                  {/* Rent */}
                  {locality.median2BHK && (
                    <>
                      <p className="mt-4 font-mono text-3xl font-bold tracking-tight text-[#f0fdf4]">
                        {formatINR(locality.median2BHK)}
                      </p>
                      <p className="mt-0.5 text-sm text-[#4b7a4b]">
                        /month · 2BHK median
                      </p>
                    </>
                  )}

                  {/* Range Bar */}
                  <div className="mt-4">
                    <div className="relative h-1.5 rounded-full bg-[#1f2b1f]">
                      <div
                        className="absolute top-0 h-full rounded-full bg-[#2d3f2d]"
                        style={{ left: "10%", width: "80%" }}
                      />
                      <div
                        className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-[#22c55e] bg-[#22c55e]"
                        style={{ left: "45%" }}
                        title="Median"
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-[#4b7a4b]">
                      <span>P25</span>
                      <span>P75</span>
                    </div>
                  </div>

                  {/* Signals + time */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-[#4b7a4b]">
                      {locality.submissionCount} signal{locality.submissionCount !== 1 ? "s" : ""}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-[#22c55e] group-hover:gap-1.5 transition-all">
                      View report →
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-6 rounded-lg border border-dashed border-[#1f2b1f] bg-[#0a0f0a]/50 p-4 text-center">
                    <p className="text-sm font-medium text-[#4b7a4b]">Be the first to submit rent here</p>
                  </div>
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2d3f2d] px-4 py-1.5 text-sm text-[#86efac] group-hover:bg-[#1a221a] transition-colors">
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
