"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import { InteractiveMap } from "@/components/maps/interactive-map";
import { FilterChip } from "@/components/ui/filter-chip";
import { MapLegendCard } from "@/components/ui/map-legend-card";

interface FurnishingBreakdownItem {
  furnishing: string;
  count: number;
}

interface LocalityData {
  id: string; name: string; slug: string; zone: string;
  lat: number; lng: number; submissionCount: number; confidenceScore: number; median2BHK: number | null;
  bhkBreakdown: Array<{ bhk: string; count: number; minRent: number; maxRent: number; medianRent: number | null }>;
  furnishingBreakdown: FurnishingBreakdownItem[];
  avgTrustScore: number; avgRent: number; minRent: number; maxRent: number;
}

const BHK_OPTIONS = ["All", "1BHK", "2BHK", "3BHK", "4BHK"] as const;
const FURNISHING_OPTIONS = ["All", "Fully Furnished", "Semi Furnished", "Unfurnished"] as const;
const SORT_OPTIONS = [
  { value: "confidence", label: "Confidence" },
  { value: "rent", label: "Median rent" },
  { value: "name", label: "Name" },
] as const;

export function ExploreClient({ localities }: { localities: LocalityData[] }) {
  const router = useRouter();
  const [bhkFilter, setBhkFilter] = useState("All");
  const [furnishingFilter, setFurnishingFilter] = useState("All");
  const [sortBy, setSortBy] = useState("confidence");
  const [filteredLocality, setFilteredLocality] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const furnishingToEnum: Record<string, string | null> = {
    "All": null,
    "Fully Furnished": "FULLY_FURNISHED",
    "Semi Furnished": "SEMI_FURNISHED",
    "Unfurnished": "UNFURNISHED",
  };

  const filteredLocalities = useMemo(() => {
    let list = [...localities];

    if (bhkFilter !== "All") {
      list = list.filter((l) =>
        l.bhkBreakdown.some((b) => b.bhk === bhkFilter && b.count > 0)
      );
    }

    const furnEnum = furnishingToEnum[furnishingFilter];
    if (furnEnum) {
      list = list.filter((l) =>
        l.furnishingBreakdown.some((f) => f.furnishing === furnEnum && f.count > 0)
      );
    }

    if (filteredLocality) {
      list = list.filter((l) => l.slug === filteredLocality);
    }

    list.sort((a, b) => {
      if (sortBy === "confidence") return b.confidenceScore - a.confidenceScore;
      if (sortBy === "rent") return (b.median2BHK ?? 0) - (a.median2BHK ?? 0);
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [localities, bhkFilter, furnishingFilter, sortBy, filteredLocality]);

  const activeFilterCount =
    (bhkFilter !== "All" ? 1 : 0) +
    (furnishingFilter !== "All" ? 1 : 0) +
    (filteredLocality !== null ? 1 : 0);

  const clearAllFilters = () => {
    setBhkFilter("All");
    setFurnishingFilter("All");
    setFilteredLocality(null);
    setSortBy("confidence");
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--md-sys-color-background)]">
      <InteractiveMap localities={filteredLocalities} standalone />

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="fixed left-4 top-4 z-[1001] flex size-10 items-center justify-center rounded-[--radius-md] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-3)]/80 text-[var(--md-sys-color-on-surface)] backdrop-blur-md hover:bg-[var(--md-sys-color-surface-container-high)] transition-all active:scale-90"
        aria-label="Go back"
      >
        <ArrowLeft size={18} />
      </button>

      {/* Legend (top-right) */}
      <div className="fixed right-4 top-4 z-[1001] hidden sm:block">
        <MapLegendCard />
      </div>

      {/* Floating filter panel — bottom-center */}
      <div className="fixed bottom-4 left-1/2 z-[1001] -translate-x-1/2 w-full max-w-2xl px-4">
        <div className="flex items-center gap-2 rounded-[--radius-xl] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-3)]/90 px-3 py-2 shadow-level-2 backdrop-blur-xl">
          {/* BHK filter chips */}
          <div className="flex gap-1">
            {BHK_OPTIONS.map((bhk) => (
              <FilterChip
                key={bhk}
                label={bhk === "All" ? "All" : bhk.replace("BHK", "")}
                active={bhkFilter === bhk}
                onClick={() => setBhkFilter(bhk)}
                size="sm"
              />
            ))}
          </div>

          <div className="h-5 w-px shrink-0 bg-[var(--md-sys-color-outline)]" />

          {/* Furnishing chips (desktop) */}
          <div className="hidden sm:flex gap-1">
            {FURNISHING_OPTIONS.map((f) => (
              <FilterChip
                key={f}
                label={f === "Fully Furnished" ? "Fully" : f === "Semi Furnished" ? "Semi" : f === "Unfurnished" ? "Unfurn." : f}
                active={furnishingFilter === f}
                onClick={() => setFurnishingFilter(f)}
                size="sm"
              />
            ))}
          </div>

          {/* Mobile furnishing select */}
          <div className="sm:hidden relative">
            <select
              value={furnishingFilter}
              onChange={(e) => setFurnishingFilter(e.target.value)}
              className="appearance-none rounded-[--radius-md] border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-dim)] px-2.5 py-1.5 text-xs font-medium text-[var(--md-sys-color-on-surface)] outline-none focus:border-[var(--md-sys-color-primary)] cursor-pointer"
            >
              {FURNISHING_OPTIONS.map((f) => (
                <option key={f} value={f}>{f === "Fully Furnished" ? "Fully" : f === "Semi Furnished" ? "Semi" : f === "Unfurnished" ? "Unfurn." : f}</option>
              ))}
            </select>
          </div>

          <div className="h-5 w-px shrink-0 bg-[var(--md-sys-color-outline)]" />

          {/* Sort + More filters */}
          <div className="flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none rounded-[--radius-md] border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-dim)] px-2.5 py-1.5 text-xs font-medium text-[var(--md-sys-color-on-surface)] outline-none focus:border-[var(--md-sys-color-primary)] cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative rounded-[--radius-md] p-1.5 transition-all ${
                showFilters || activeFilterCount > 0
                  ? "bg-[var(--md-sys-color-primary)]/20 text-[var(--md-sys-color-primary)]"
                  : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
              }`}
              aria-label="Toggle filter panel"
            >
              <SlidersHorizontal size={14} />
              {activeFilterCount > 0 && !showFilters && (
                <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-[var(--md-sys-color-primary)] text-[8px] font-bold text-[var(--md-sys-color-on-primary)]">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expanded filter panel */}
        {showFilters && (
          <div className="mt-2 animate-slide-down rounded-[--radius-xl] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-3)]/95 p-4 shadow-level-3 backdrop-blur-xl">
            {activeFilterCount > 0 && (
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                </span>
                <button onClick={clearAllFilters} className="flex items-center gap-1 rounded-[--radius-md] bg-[var(--md-sys-color-surface-container-high)] px-2.5 py-1 text-xs text-[var(--md-sys-color-on-surface)] hover:brightness-110 transition-all">
                  <X size={12} />
                  Clear all
                </button>
              </div>
            )}

            {/* Furnishing (mobile) */}
            <div className="sm:hidden mb-3">
              <p className="mb-1.5 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">Furnishing</p>
              <div className="flex flex-wrap gap-1.5">
                {FURNISHING_OPTIONS.map((f) => (
                  <FilterChip key={f} label={f} active={furnishingFilter === f} onClick={() => setFurnishingFilter(f)} size="sm" />
                ))}
              </div>
            </div>

            {/* Locality filter */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">Locality</p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                <FilterChip label="All" active={!filteredLocality} onClick={() => setFilteredLocality(null)} size="sm" />
                {localities.map((loc) => (
                  <FilterChip key={loc.id} label={loc.name} active={filteredLocality === loc.slug} onClick={() => { setFilteredLocality(loc.slug); setShowFilters(false); }} size="sm" />
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[var(--md-sys-color-outline)] flex items-center justify-between text-xs">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">
                <span className="font-mono text-[var(--md-sys-color-on-surface)]">{filteredLocalities.length}</span> of {localities.length} localities
              </span>
              <span className="text-[var(--md-sys-color-on-surface-variant)]">
                <span className="font-mono text-[var(--md-sys-color-primary)]">
                  {filteredLocalities.filter((l) => l.submissionCount > 0).length}
                </span> with data
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
