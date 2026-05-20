"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useRef, useEffect } from "react";
import { ArrowLeft, ChevronDown, X } from "lucide-react";
import { InteractiveMap } from "@/components/maps/interactive-map";

interface LocalityData {
  id: string; name: string; slug: string; zone: string;
  lat: number; lng: number; submissionCount: number; confidenceScore: number; median2BHK: number | null;
  bhkBreakdown: Array<{ bhk: string; count: number; minRent: number; maxRent: number; medianRent: number | null }>;
  furnishingBreakdown: Array<{ furnishing: string; count: number }>;
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
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded]);

  const furnishingToEnum: Record<string, string | null> = {
    "All": null,
    "Fully Furnished": "FULLY_FURNISHED",
    "Semi Furnished": "SEMI_FURNISHED",
    "Unfurnished": "UNFURNISHED",
  };

  const filteredLocalities = useMemo(() => {
    let list = [...localities];
    if (bhkFilter !== "All") list = list.filter((l) => l.bhkBreakdown.some((b) => b.bhk === bhkFilter && b.count > 0));
    const furnEnum = furnishingToEnum[furnishingFilter];
    if (furnEnum) list = list.filter((l) => l.furnishingBreakdown.some((f) => f.furnishing === furnEnum && f.count > 0));
    if (filteredLocality) list = list.filter((l) => l.slug === filteredLocality);
    list.sort((a, b) => {
      if (sortBy === "confidence") return b.confidenceScore - a.confidenceScore;
      if (sortBy === "rent") return (b.median2BHK ?? 0) - (a.median2BHK ?? 0);
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [localities, bhkFilter, furnishingFilter, sortBy, filteredLocality]);

  const activeFilterCount = (bhkFilter !== "All" ? 1 : 0) + (furnishingFilter !== "All" ? 1 : 0) + (filteredLocality !== null ? 1 : 0);

  const clearAllFilters = () => {
    setBhkFilter("All"); setFurnishingFilter("All"); setFilteredLocality(null); setSortBy("confidence");
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--md-sys-color-background)]">
      <InteractiveMap localities={filteredLocalities} standalone />

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="fixed left-3 sm:left-4 top-3 sm:top-4 z-[1001] flex size-10 items-center justify-center rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-3)]/80 text-[var(--md-sys-color-on-surface)] backdrop-blur-md hover:bg-[var(--md-sys-color-surface-container-high)] transition-all active:scale-90"
        aria-label="Go back"
      >
        <ArrowLeft size={18} />
      </button>

      {/* Notification Island Filter — top-center */}
      <div ref={panelRef} className="fixed top-2 sm:top-3 left-1/2 z-[1001] -translate-x-1/2 w-auto max-w-[94vw] sm:max-w-2xl px-1 sm:px-2">
        {/* Pill (collapsed state) */}
        <div
          onClick={() => !expanded && setExpanded(true)}
          className={`cursor-pointer flex items-center gap-1 sm:gap-2 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-3)]/90 px-2 sm:px-4 py-1.5 sm:py-2 shadow-level-2 backdrop-blur-xl transition-all duration-300 ${
            expanded ? "rounded-[--radius-card]" : "rounded-full hover:bg-[var(--elevation-level-4)]/90"
          }`}
        >
          {/* BHK pills (always visible) */}
          <div className="flex gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar">
            {BHK_OPTIONS.map((bhk) => (
              <button
                key={bhk}
                onClick={(e) => { e.stopPropagation(); setBhkFilter(bhk); }}
                className={`rounded-full px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap ${
                  bhkFilter === bhk
                    ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                    : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                }`}
              >
                {bhk === "All" ? "All" : bhk.replace("BHK", "")}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-[var(--md-sys-color-outline)] flex-shrink-0" />

          {/* Active filter badge */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {activeFilterCount > 0 && (
              <span className="flex size-4 sm:size-5 items-center justify-center rounded-full bg-[var(--md-sys-color-primary)] text-[8px] sm:text-[10px] font-bold text-[var(--md-sys-color-on-primary)]">
                {activeFilterCount}
              </span>
            )}
            <span className="text-[10px] sm:text-xs text-[var(--md-sys-color-on-surface-variant)] hidden sm:inline">
              {filteredLocalities.length} of {localities.length}
            </span>
          </div>

          {/* Expand toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="rounded-full p-0.5 sm:p-1 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-all"
          >
            <ChevronDown className={`size-3 sm:size-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Expanded panel */}
        {expanded && (
          <div className="mt-2 animate-slide-down rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-3)]/95 p-3 sm:p-4 shadow-level-3 backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs text-[var(--md-sys-color-on-surface-variant)]">
                <span className="font-mono text-[var(--md-sys-color-on-surface)]">{filteredLocalities.length}</span> of {localities.length} localities
                <span className="ml-1 sm:ml-2 text-[var(--md-sys-color-primary)]">
                  {filteredLocalities.filter((l) => l.submissionCount > 0).length} with data
                </span>
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters} className="flex items-center gap-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs text-[var(--md-sys-color-on-surface)] hover:brightness-110 transition-all">
                    <X size={10} />
                    Clear
                  </button>
                )}
                <button onClick={() => setExpanded(false)} className="rounded-full p-1 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]">
                  <ChevronDown className="size-3 sm:size-3.5 rotate-180" />
                </button>
              </div>
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Furnishing */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] sm:text-[10px] font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">Furnishing</span>
                <div className="flex gap-0.5 sm:gap-1">
                  {FURNISHING_OPTIONS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFurnishingFilter(f)}
                      className={`rounded-full px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium transition-all ${
                        furnishingFilter === f
                          ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                          : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                      }`}
                    >
                      {f === "Fully Furnished" ? "Fully" : f === "Semi Furnished" ? "Semi" : f === "Unfurnished" ? "Unfurn." : f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-3 sm:h-4 w-px bg-[var(--md-sys-color-outline)]" />

              {/* Sort */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] sm:text-[10px] font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none rounded-full border border-[var(--md-sys-color-outline)] bg-transparent px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs text-[var(--md-sys-color-on-surface)] outline-none focus:border-[var(--md-sys-color-primary)] cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Locality filter */}
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[var(--md-sys-color-outline)]">
              <div className="flex flex-wrap gap-1 sm:gap-1.5 max-h-24 sm:max-h-28 overflow-y-auto">
                <button
                  onClick={() => setFilteredLocality(null)}
                  className={`rounded-full px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium transition-all ${
                    !filteredLocality ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]" : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                  }`}
                >All</button>
                {localities.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => { setFilteredLocality(loc.slug); setExpanded(false); }}
                    className={`rounded-full px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium transition-all ${
                      filteredLocality === loc.slug ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]" : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                    }`}
                  >{loc.name}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
