import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowUpRight, FileCheck2, TrendingUp } from "lucide-react";
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

function TrustDot(score: number) {
  if (score >= 70) return "🟢";
  if (score >= 40) return "🟡";
  return "🔴";
}

function ConfidenceBadge(score: number) {
  if (score >= 70) return { label: `${score}/100`, class: "bg-[#22c55e] text-[#0a0f0a]" };
  if (score >= 40) return { label: `${score}/100 🟡`, class: "bg-[#eab308] text-[#0a0f0a]" };
  return { label: `${score}/100 🔴`, class: "bg-[#ef4444] text-white" };
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

  // Recent submissions (last 10)
  const recentSubmissions = submissions.slice(0, 50);

  // Nearby localities (3 closest by distance)
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

  // Other localities for compare dropdown
  const compareLocalities = allLocalities.filter((l) => l.slug !== locality.slug);

  const confidence = ConfidenceBadge(aggregate.confidenceScore);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* SECTION 1 — Hero stat bar (sticky) */}
      <section className="sticky top-16 z-30 -mx-4 -mt-6 border-b border-[#1f2b1f] bg-[#0a0f0a]/95 backdrop-blur-lg sm:-mx-6 sm:-mt-8">
        <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-3 text-sm sm:px-6">
          <span className="shrink-0 font-semibold text-[#f0fdf4]">{locality.name}</span>
          <span className="text-[#4b7a4b]">·</span>
          <span className="shrink-0 text-[#4b7a4b]">{locality.zone}</span>
          {hasData && (
            <>
              <span className="text-[#4b7a4b]">·</span>
              <span className="shrink-0 font-mono font-bold text-[#22c55e]">{formatINR(aggregate.median)}/mo</span>
              <span className="text-[#4b7a4b]">·</span>
              <span className="shrink-0 text-[#4b7a4b]">P25 {formatINR(aggregate.p25)}</span>
              <span className="text-[#4b7a4b]">·</span>
              <span className="shrink-0 text-[#4b7a4b]">P75 {formatINR(aggregate.p75)}</span>
              <span className="text-[#4b7a4b]">·</span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${confidence.class}`}>
                {confidence.label}
              </span>
              <span className="text-[#4b7a4b]">·</span>
              <span className="shrink-0 text-[#4b7a4b]">{aggregate.sampleSize} signals</span>
            </>
          )}
          <Link
            href="/submit"
            className="ml-auto shrink-0 rounded-full bg-[#22c55e] px-4 py-1.5 text-xs font-medium text-[#0a0f0a] hover:bg-[#16a34a] transition-colors"
          >
            Submit rent here →
          </Link>
        </div>
      </section>

      {/* Hero content */}
      <section className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h1 className="text-3xl font-bold text-[#f0fdf4] sm:text-4xl">
            Rent in {locality.name}, Hyderabad
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#86efac]">
            {copy.summary}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["1bhk", "2bhk", "3bhk"].map((bhk) => (
              <Link
                key={bhk}
                href={`/hyderabad/${locality.slug}/${bhk}`}
                className="rounded-full border border-[#2d3f2d] px-4 py-1.5 text-sm text-[#86efac] hover:bg-[#1a221a] transition-colors"
              >
                {bhk.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
        {hasData && (
          <div className="rounded-xl border border-[#1f2b1f] bg-[#111811] p-6">
            <p className="text-sm text-[#4b7a4b]">Trust-weighted median</p>
            <p className="mt-1 font-mono text-4xl font-bold text-[#f0fdf4]">{formatINR(aggregate.median)}</p>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="text-[#4b7a4b]">P25 <span className="font-mono text-[#86efac]">{formatINR(aggregate.p25)}</span></span>
              <span className="text-[#4b7a4b]">P75 <span className="font-mono text-[#86efac]">{formatINR(aggregate.p75)}</span></span>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${confidence.class}`}>
                  {confidence.label}
                </span>
                <span className="text-xs text-[#4b7a4b]">{aggregate.sampleSize} submissions · {aggregate.verifiedRatio}% verified</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1f2b1f]">
                <div className="h-full rounded-full bg-[#22c55e]" style={{ width: `${aggregate.confidenceScore}%` }} />
              </div>
            </div>
          </div>
        )}
      </section>

      {!hasData && (
        <section className="mt-8 rounded-xl border border-[#1f2b1f] bg-[#111811] p-8 text-center">
          <h2 className="text-xl font-semibold text-[#f0fdf4]">No data yet for {locality.name}</h2>
          <p className="mt-2 text-[#86efac]">Be the first to submit rent data.</p>
          <Link
            href="/submit"
            className="mt-4 inline-block rounded-full bg-[#22c55e] px-6 py-2.5 text-sm font-medium text-[#0a0f0a] hover:bg-[#16a34a] transition-colors"
          >
            Submit rent for {locality.name}
          </Link>
        </section>
      )}

      {/* SECTION 2 — BHK breakdown */}
      {hasData && (
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-[#f0fdf4]">BHK Breakdown</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 max-md:-mx-4 max-md:px-4 md:grid md:grid-cols-5">
            {bhkBreakdown.map(({ bhk, count, median, p25, p75 }) => (
              <div
                key={bhk}
                className={`shrink-0 rounded-xl border p-4 min-w-[160px] ${
                  count > 0
                    ? "border-[#1f2b1f] bg-[#111811]"
                    : "border-dashed border-[#1f2b1f] bg-[#0a0f0a]/50"
                }`}
              >
                <p className={`text-sm font-medium ${count > 0 ? "text-[#f0fdf4]" : "text-[#4b7a4b]"}`}>
                  {bhk}
                </p>
                {count > 0 ? (
                  <>
                    <p className="mt-2 font-mono text-xl font-bold text-[#22c55e]">{formatINR(median)}</p>
                    <p className="mt-1 text-xs text-[#4b7a4b]">
                      {formatINR(p25)} – {formatINR(p75)}
                    </p>
                    <p className="mt-1 text-xs text-[#4b7a4b]">{count} submission{count !== 1 ? "s" : ""}</p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-[#4b7a4b]">No data</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3 — Submission feed */}
      {recentSubmissions.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-[#f0fdf4]">Recent verified rents</h2>
          <div className="space-y-2">
            {recentSubmissions.map((sub, idx) => (
              <div
                key={sub.id}
                className="flex items-center gap-3 rounded-lg border border-[#1f2b1f] bg-[#111811] px-4 py-3 animate-fade-in-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <span className="shrink-0 text-sm">{TrustDot(sub.trustScore)}</span>
                <span className="shrink-0 font-mono text-sm font-medium text-[#f0fdf4]">{sub.bhk}</span>
                <span className="shrink-0 font-mono text-sm font-bold text-[#22c55e]">{formatINR(sub.rentAmount)}</span>
                <span className="text-sm text-[#4b7a4b]">
                  {sub.furnishing.replace("_", " ").toLowerCase()}
                </span>
                <span className="text-sm text-[#4b7a4b]">
                  {sub.rentType.toLowerCase() === "closed" ? "Closed deal" : sub.rentType.toLowerCase() === "renewed" ? "Renewal" : "Asking"}
                </span>
                <span className="text-sm text-[#4b7a4b]">Trust {sub.trustScore}</span>
                <span className="ml-auto shrink-0 text-xs text-[#4b7a4b]">
                  {timeAgo(new Date(sub.submittedAt))}
                </span>
              </div>
            ))}
          </div>
          {submissions.length > 50 && (
            <a href={`/hyderabad/${localitySlug}?all=true`} className="mt-3 flex w-full items-center justify-center rounded-lg border border-[#2d3f2d] py-2 text-sm text-[#86efac] hover:bg-[#1a221a] transition-colors">
              Show all {submissions.length} submissions
            </a>
          )}
        </section>
      )}

      {/* SECTION 4 — Trend chart */}
      {trendData.length >= 3 && (
        <section className="mt-8">
          <div className="rounded-xl border border-[#1f2b1f] bg-[#111811] p-5">
            <h2 className="text-lg font-bold text-[#f0fdf4]">Rent Trend</h2>
            <p className="mt-1 text-sm text-[#4b7a4b]">Weighted median movement over time</p>
            <div className="mt-4">
              <RentTrendChart data={trendData} />
            </div>
          </div>
        </section>
      )}

      {/* SECTION 5 — Nearby localities */}
      {nearbyLocalities.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-[#f0fdf4]">Nearby Localities</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyLocalities.map((nearby) => (
              <Link key={nearby.slug} href={`/hyderabad/${nearby.slug}`} className="group block">
                <div className="h-full rounded-xl border border-[#1f2b1f] bg-[#111811] p-4 transition-all group-hover:border-[#22c55e] group-hover:shadow-[0_0_40px_rgba(34,197,94,0.12)]">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#22c55e]" />
                    <h3 className="font-semibold text-[#f0fdf4]">{nearby.name}</h3>
                  </div>
                  <p className="mt-0.5 text-sm text-[#4b7a4b]">{nearby.zone}</p>
                  <p className="mt-3 font-mono text-xl font-bold text-[#f0fdf4]">{formatINR(nearby.median2BHK ?? 0)}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    nearby.confidenceScore >= 70
                      ? "bg-[#22c55e] text-[#0a0f0a]"
                      : nearby.confidenceScore >= 40
                        ? "bg-[#eab308] text-[#0a0f0a]"
                        : "bg-[#ef4444] text-white"
                  }`}>
                    {nearby.confidenceScore}/100
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 6 — Compare widget */}
      {compareLocalities.length > 0 && (
        <section className="mt-8">
          <div className="rounded-xl border border-[#1f2b1f] bg-[#111811] p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-[#22c55e]" />
              <h2 className="text-lg font-bold text-[#f0fdf4]">Compare {locality.name} with...</h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {compareLocalities.slice(0, 6).map((other) => (
                <Link
                  key={other.slug}
                  href={`/compare/${locality.slug}-vs-${other.slug}`}
                  className="rounded-full border border-[#2d3f2d] px-4 py-1.5 text-sm text-[#86efac] hover:bg-[#1a221a] transition-colors"
                >
                  {other.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 7 — Submit CTA */}
      <section className="mt-8 rounded-xl border border-[#22c55e]/30 bg-[#111811] p-6 text-center sm:p-8">
        <FileCheck2 className="mx-auto size-10 text-[#22c55e]" />
        <h2 className="mt-4 text-xl font-bold text-[#f0fdf4]">
          Know what people actually pay in {locality.name}?
        </h2>
        <p className="mt-2 text-[#86efac]">
          Submit your rent. Anonymous. Takes 90 seconds.
        </p>
        <Link
          href="/submit"
          className="mt-4 inline-block rounded-full bg-[#22c55e] px-6 py-2.5 text-sm font-medium text-[#0a0f0a] hover:bg-[#16a34a] transition-colors"
        >
          Submit rent →
        </Link>
      </section>
    </div>
  );
}
