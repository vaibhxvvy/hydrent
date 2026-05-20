import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { aggregateRent } from "@/lib/analytics/statistics";
import { getAllLocalitiesWithStats, getLocalityBySlug, getSubmissionsForLocality } from "@/lib/data/db";
import { baseMetadata } from "@/lib/seo";
import { formatINR } from "@/lib/utils";

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
      description: `Compare affordability, rent ranges, confidence, and commute context between ${left.name} and ${right.name}.`,
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-[#f0fdf4]">
        {left.name} vs {right.name}
      </h1>
      <p className="mt-2 text-sm text-[#4b7a4b]">
        Trust-weighted comparison · {leftAggregate.sampleSize} vs {rightAggregate.sampleSize} verified signals
      </p>

      {hasLeftData && hasRightData ? (
        <>
          {/* Comparison table */}
          <div className="mt-6 overflow-x-auto rounded-xl border border-[#1f2b1f]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f2b1f] bg-[#111811]">
                  <th className="px-5 py-4 text-left font-medium text-[#4b7a4b]">Metric</th>
                  <th className="px-5 py-4 text-right font-medium text-[#22c55e]">{left.name}</th>
                  <th className="px-5 py-4 text-right font-medium text-[#22c55e]">{right.name}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#1f2b1f] hover:bg-[#1a221a] transition-colors">
                  <td className="px-5 py-4 font-medium text-[#f0fdf4]">Median</td>
                  <td className={`px-5 py-4 text-right font-mono font-bold ${isCheaper("left", leftAggregate.median, rightAggregate.median) ? "text-[#22c55e]" : "text-[#f0fdf4]"}`}>
                    {formatINR(leftAggregate.median)}
                  </td>
                  <td className={`px-5 py-4 text-right font-mono font-bold ${isCheaper("right", rightAggregate.median, leftAggregate.median) ? "text-[#22c55e]" : "text-[#f0fdf4]"}`}>
                    {formatINR(rightAggregate.median)}
                  </td>
                </tr>
                <tr className="border-b border-[#1f2b1f] hover:bg-[#1a221a] transition-colors">
                  <td className="px-5 py-4 font-medium text-[#f0fdf4]">P25</td>
                  <td className="px-5 py-4 text-right font-mono text-[#86efac]">{formatINR(leftAggregate.p25)}</td>
                  <td className="px-5 py-4 text-right font-mono text-[#86efac]">{formatINR(rightAggregate.p25)}</td>
                </tr>
                <tr className="border-b border-[#1f2b1f] hover:bg-[#1a221a] transition-colors">
                  <td className="px-5 py-4 font-medium text-[#f0fdf4]">P75</td>
                  <td className="px-5 py-4 text-right font-mono text-[#86efac]">{formatINR(leftAggregate.p75)}</td>
                  <td className="px-5 py-4 text-right font-mono text-[#86efac]">{formatINR(rightAggregate.p75)}</td>
                </tr>
                <tr className="border-b border-[#1f2b1f] hover:bg-[#1a221a] transition-colors">
                  <td className="px-5 py-4 font-medium text-[#f0fdf4]">Confidence</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      leftAggregate.confidenceScore >= 70 ? "bg-[#22c55e] text-[#0a0f0a]" : leftAggregate.confidenceScore >= 40 ? "bg-[#eab308] text-[#0a0f0a]" : "bg-[#ef4444] text-white"
                    }`}>
                      {leftAggregate.confidenceScore}/100 {leftAggregate.confidenceScore >= 70 ? "🟢" : leftAggregate.confidenceScore >= 40 ? "🟡" : "🔴"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      rightAggregate.confidenceScore >= 70 ? "bg-[#22c55e] text-[#0a0f0a]" : rightAggregate.confidenceScore >= 40 ? "bg-[#eab308] text-[#0a0f0a]" : "bg-[#ef4444] text-white"
                    }`}>
                      {rightAggregate.confidenceScore}/100 {rightAggregate.confidenceScore >= 70 ? "🟢" : rightAggregate.confidenceScore >= 40 ? "🟡" : "🔴"}
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-[#1f2b1f] hover:bg-[#1a221a] transition-colors">
                  <td className="px-5 py-4 font-medium text-[#f0fdf4]">Signals</td>
                  <td className="px-5 py-4 text-right font-mono text-[#f0fdf4]">{leftAggregate.sampleSize}</td>
                  <td className="px-5 py-4 text-right font-mono text-[#f0fdf4]">{rightAggregate.sampleSize}</td>
                </tr>

                {/* Separator */}
                <tr className="border-b border-[#1f2b1f]">
                  <td colSpan={3} className="px-5 py-2 text-center text-xs text-[#4b7a4b]">— BHK breakdown —</td>
                </tr>

                {bhks.map((bhk, idx) => {
                  const l = leftBhks[idx]!;
                  const r = rightBhks[idx]!;
                  return (
                    <tr key={bhk} className="border-b border-[#1f2b1f] hover:bg-[#1a221a] transition-colors">
                      <td className="px-5 py-4 font-medium text-[#f0fdf4]">{bhk} median</td>
                      <td className={`px-5 py-4 text-right font-mono ${l.count > 0 ? (l.median < r.median ? "text-[#22c55e]" : "text-[#86efac]") : "text-[#4b7a4b]"}`}>
                        {l.count > 0 ? formatINR(l.median) : "—"}
                      </td>
                      <td className={`px-5 py-4 text-right font-mono ${r.count > 0 ? (r.median < l.median ? "text-[#22c55e]" : "text-[#86efac]") : "text-[#4b7a4b]"}`}>
                        {r.count > 0 ? formatINR(r.median) : "—"}
                      </td>
                    </tr>
                  );
                })}

                {/* Verdict */}
                <tr className="bg-[#22c55e]/10">
                  <td colSpan={3} className="px-5 py-4 text-center font-bold text-[#22c55e]">
                    ✅ {cheaperLocality} is {percentDiff}% cheaper for 2BHK
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#1f2b1f] bg-[#111811] p-4">
              <p className="text-sm text-[#4b7a4b]">Median difference</p>
              <p className="mt-1 font-mono text-2xl font-bold text-[#f0fdf4]">{formatINR(delta)}</p>
            </div>
            <div className="rounded-xl border border-[#1f2b1f] bg-[#111811] p-4">
              <p className="text-sm text-[#4b7a4b]">Lower median market</p>
              <p className="mt-1 text-2xl font-bold text-[#22c55e]">{cheaperLocality}</p>
            </div>
            <div className="rounded-xl border border-[#1f2b1f] bg-[#111811] p-4">
              <p className="text-sm text-[#4b7a4b]">Combined signals</p>
              <p className="mt-1 font-mono text-2xl font-bold text-[#f0fdf4]">{leftAggregate.sampleSize + rightAggregate.sampleSize}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-xl border border-[#1f2b1f] bg-[#111811] p-8 text-center">
          <p className="text-[#86efac]">One or both localities lack sufficient data for comparison.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href={`/hyderabad/${left.slug}`} className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-medium text-[#0a0f0a] hover:bg-[#16a34a] transition-colors">
              View {left.name}
            </Link>
            <Link href={`/hyderabad/${right.slug}`} className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-medium text-[#0a0f0a] hover:bg-[#16a34a] transition-colors">
              View {right.name}
            </Link>
          </div>
        </div>
      )}

      {/* Compare with other localities */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-[#f0fdf4]">Compare with other localities</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {allOther.slice(0, 6).map((locality) => (
            <Link
              key={locality.slug}
              href={`/compare/${left.slug}-vs-${locality.slug}`}
              className="rounded-full border border-[#2d3f2d] px-4 py-1.5 text-sm text-[#86efac] hover:bg-[#1a221a] transition-colors"
            >
              {locality.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
