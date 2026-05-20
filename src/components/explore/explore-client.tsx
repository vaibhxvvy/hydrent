"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import { InteractiveMap } from "@/components/maps/interactive-map";

interface FurnishingBreakdownItem {
  furnishing: string;
  count: number;
}

interface LocalityData {
  id: string;
  name: string;
  slug: string;
  zone: string;
  lat: number;
  lng: number;
  submissionCount: number;
  confidenceScore: number;
  median2BHK: number | null;
  bhkBreakdown: Array<{ bhk: string; count: number; minRent: number; maxRent: number; medianRent: number | null }>;
  furnishingBreakdown: FurnishingBreakdownItem[];
  avgTrustScore: number;
  avgRent: number;
  minRent: number;
  maxRent: number;
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

  // Map furnishing display names to enums
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
    <div className="fixed inset-0 z-50 bg-[#0a0f0a]">
      <InteractiveMap localities={filteredLocalities} standalone={true} />

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="fixed left-4 top-4 z-[1001] flex size-11 items-center justify-center rounded-full border border-[#2d3f2d] bg-[#111811]/80 text-[#86efac] shadow-level-3 backdrop-blur-md hover:bg-[#1a221a] hover:text-[#f0fdf4] transition-all active:scale-90"
        aria-label="Go back"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Floating filter panel — bottom-center */}
      <div className="fixed bottom-4 left-1/2 z-[1001] -translate-x-1/2 w-full max-w-lg px-4">
        {/* Active filters row (compact) */}
        <div className="flex items-center gap-2 rounded-2xl border border-[#2d3f2d] bg-[#111811]/90 px-3 py-2 shadow-level-3 backdrop-blur-xl">
          {/* BHK pills */}
          <div className="flex gap-1">
            {BHK_OPTIONS.map((bhk) => (
              <button
                key={bhk}
                onClick={() => setBhkFilter(bhk)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                  bhkFilter === bhk
                    ? "bg-[#22c55e] text-[#0a0f0a] font-bold"
                    : "text-[#86efac] hover:bg-[#1a221a]"
                }`}
              >
                {bhk === "All" ? "All" : bhk.replace("BHK", "")}
              </button>
            ))}
          </div>

          <div className="h-5 w-px shrink-0 bg-[#2d3f2d]" />

          {/* Furnishing pills */}
          <div className="hidden sm:flex gap-1">
            {FURNISHING_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setFurnishingFilter(f)}
                className={`rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all whitespace-nowrap ${
                  furnishingFilter === f
                    ? "bg-[#22c55e] text-[#0a0f0a] font-bold"
                    : "text-[#86efac] hover:bg-[#1a221a]"
                }`}
              >
                {f === "Fully Furnished" ? "Fully" : f === "Semi Furnished" ? "Semi" : f === "Unfurnished" ? "Unfurn." : f}
              </button>
            ))}
          </div>

          {/* Mobile furnishing dropdown */}
          <div className="sm:hidden relative">
            <select
              value={furnishingFilter}
              onChange={(e) => setFurnishingFilter(e.target.value)}
              className="appearance-none rounded-lg border border-[#2d3f2d] bg-[#0a0f0a] px-2 py-1.5 text-[11px] font-medium text-[#86efac] outline-none focus:border-[#22c55e] cursor-pointer"
            >
              {FURNISHING_OPTIONS.map((f) => (
                <option key={f} value={f}>{f === "Fully Furnished" ? "Fully" : f === "Semi Furnished" ? "Semi" : f === "Unfurnished" ? "Unfurn." : f}</option>
              ))}
            </select>
          </div>

          <div className="h-5 w-px shrink-0 bg-[#2d3f2d]" />

          {/* Sort + More filters toggle */}
          <div className="flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none rounded-lg border border-[#2d3f2d] bg-[#0a0f0a] px-2 py-1.5 text-[11px] font-medium text-[#86efac] outline-none focus:border-[#22c55e] cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative rounded-lg p-1.5 transition-all ${
                showFilters || activeFilterCount > 0
                  ? "bg-[#22c55e]/20 text-[#22c55e]"
                  : "text-[#86efac] hover:bg-[#1a221a]"
              }`}
              aria-label="Toggle filter panel"
            >
              <SlidersHorizontal size={14} />
              {activeFilterCount > 0 && !showFilters && (
                <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-[#22c55e] text-[8px] font-bold text-[#0a0f0a]">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expanded filter panel */}
        {showFilters && (
          <div className="mt-2 animate-slide-down rounded-2xl border border-[#2d3f2d] bg-[#111811]/95 p-4 shadow-level-4 backdrop-blur-xl">
            {/* Active filter summary */}
            {activeFilterCount > 0 && (
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-[#4b7a4b]">
                  {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                </span>
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 rounded-lg bg-[#1a221a] px-2.5 py-1 text-xs text-[#86efac] hover:bg-[#222d22] transition-all"
                >
                  <X size={12} />
                  Clear all
                </button>
              </div>
            )}

            {/* Furnishing (visible on desktop too as pills) */}
            <div className="sm:hidden mb-3">
              <p className="mb-1.5 text-xs font-medium text-[#4b7a4b]">Furnishing</p>
              <div className="flex flex-wrap gap-1.5">
                {FURNISHING_OPTIONS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFurnishingFilter(f)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      furnishingFilter === f
                        ? "bg-[#22c55e] text-[#0a0f0a]"
                        : "text-[#86efac] hover:bg-[#1a221a]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Locality filter */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-[#4b7a4b]">Locality</p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                <button
                  onClick={() => { setFilteredLocality(null); }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    !filteredLocality ? "bg-[#22c55e] text-[#0a0f0a]" : "text-[#86efac] hover:bg-[#1a221a]"
                  }`}
                >
                  All
                </button>
                {localities.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => { setFilteredLocality(loc.slug); setShowFilters(false); }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      filteredLocality === loc.slug ? "bg-[#22c55e] text-[#0a0f0a]" : "text-[#86efac] hover:bg-[#1a221a]"
                    }`}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            <div className="mt-3 pt-3 border-t border-[#2d3f2d] flex items-center justify-between text-xs">
              <span className="text-[#4b7a4b]">
                <span className="font-mono text-[#f0fdf4]">{filteredLocalities.length}</span> of {localities.length} localities shown
              </span>
              <span className="text-[#4b7a4b]">
                <span className="font-mono text-[#22c55e]">
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
