"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Building2, Search, X } from "lucide-react";
import type { LocalityWithStats } from "@/lib/data/db";
import { formatINR, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const ZONES = ["All", "West", "Central", "North", "South", "East"];
const SORTS = [
  { value: "median", label: "Median ↓" },
  { value: "trust", label: "Trust score" },
  { value: "count", label: "Submission count" },
];

export function LocalitiesClient({ localities: raw }: { localities: LocalityWithStats[] }) {
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("All");
  const [sortBy, setSortBy] = useState("median");

  const localities = useMemo(() => {
    return raw
      .filter((l) => l.name.toLowerCase().includes(search.toLowerCase()))
      .filter((l) => zone === "All" || l.zone === zone)
      .sort((a, b) => {
        if (sortBy === "trust") return b.confidenceScore - a.confidenceScore;
        if (sortBy === "count") return b.submissionCount - a.submissionCount;
        return (b.median2BHK ?? 0) - (a.median2BHK ?? 0);
      });
  }, [raw, search, zone, sortBy]);

  const filteredOut = raw.length - localities.length;
  const totalSubmissions = raw.reduce((s, l) => s + l.submissionCount, 0);
  const withData = raw.filter((l) => l.submissionCount > 0).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--md-sys-color-on-surface)]">All Hyderabad Localities</h1>
        <p className="mt-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
          {withData} localities with data · {formatNumber(totalSubmissions)} total signals
        </p>
      </div>

      {/* Stats overview */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-4">
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Total localities</p>
          <p className="mt-1 font-mono text-2xl font-bold text-[var(--md-sys-color-on-surface)]">{raw.length}</p>
        </div>
        <div className="rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-4">
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">With data</p>
          <p className="mt-1 font-mono text-2xl font-bold text-[var(--md-sys-color-primary)]">{withData}</p>
        </div>
        <div className="rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-4">
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Total submissions</p>
          <p className="mt-1 font-mono text-2xl font-bold text-[var(--md-sys-color-on-surface)]">{formatNumber(totalSubmissions)}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search localities..."
            className="h-11 w-full rounded-[--radius-input] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] pl-9 pr-4 text-sm text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] outline-none focus:border-[var(--md-sys-color-primary)] focus:shadow-[0_0_0_2px_rgba(20,184,166,0.15)] transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]">
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {ZONES.map((z) => (
            <button
              key={z}
              onClick={() => setZone(z)}
              className={`rounded-[--radius-pill] px-3 py-1.5 text-xs font-medium transition-colors ${
                zone === z
                  ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                  : "border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
              }`}
            >
              {z}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-11 rounded-[--radius-input] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] px-3 text-sm text-[var(--md-sys-color-on-surface)] outline-none focus:border-[var(--md-sys-color-primary)] cursor-pointer"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {localities.length === 0 ? (
        <div className="rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-12 text-center">
          <Building2 className="mx-auto size-8 text-[var(--md-sys-color-on-surface-variant)]" />
          <h2 className="mt-3 text-lg font-semibold text-[var(--md-sys-color-on-surface)]">
            {search || zone !== "All" ? "No localities match your search" : "No localities loaded"}
          </h2>
          <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">
            {filteredOut > 0
              ? `${filteredOut} locality filtered out. Try adjusting the filters.`
              : "Localities will appear once the database is connected"}
          </p>
          {(search || zone !== "All") && (
            <button
              onClick={() => { setSearch(""); setZone("All"); }}
              className="mt-4 rounded-[--radius-pill] border border-[var(--md-sys-color-outline)] px-4 py-2 text-sm text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-all"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {localities.map((locality) => {
            const hasData = locality.submissionCount > 0;
            const trustLevel = locality.confidenceScore >= 70 ? "high" : locality.confidenceScore >= 50 ? "medium" : "low";
            const trustColor = trustLevel === "high" ? "var(--md-sys-color-primary)" : trustLevel === "medium" ? "var(--md-sys-color-tertiary)" : "var(--md-sys-color-error)";
            const trustBg = trustLevel === "high" ? "rgba(20,184,166,0.1)" : trustLevel === "medium" ? "rgba(245,158,11,0.1)" : "rgba(255,138,128,0.1)";

            return (
              <Link
                key={locality.slug}
                href={hasData ? `/hyderabad/${locality.slug}` : "/submit"}
                className="group block"
              >
                <div className="h-full rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-5 transition-all duration-300 hover:border-[var(--md-sys-color-primary)] hover:-translate-y-0.5 hover:shadow-elevated">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">{locality.name}</h2>
                      <span className="inline-block mt-0.5 rounded-[--radius-pill] bg-[var(--md-sys-color-surface-container-high)] px-2 py-0.5 text-[10px] font-medium text-[var(--md-sys-color-on-surface-variant)]">
                        {locality.zone}
                      </span>
                    </div>
                    {hasData && (
                      <span
                        className="shrink-0 rounded-[--radius-pill] px-2.5 py-1 text-xs font-medium"
                        style={{ background: trustBg, color: trustColor }}
                      >
                        {locality.confidenceScore}/100 · {trustLevel === "high" ? "High" : trustLevel === "medium" ? "Medium" : "Low"}
                      </span>
                    )}
                  </div>

                  {hasData ? (
                    <div className="mt-4 space-y-3">
                      {/* Trust bar */}
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--md-sys-color-surface-container)]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${locality.confidenceScore}%`, background: trustColor }}
                        />
                      </div>

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

                      {locality.bhkBreakdown.filter((b) => b.count > 0).length > 0 && (
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
