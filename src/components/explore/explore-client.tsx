"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { ArrowLeft, SlidersHorizontal, Filter, ArrowUpDown } from "lucide-react";
import { InteractiveMap } from "@/components/maps/interactive-map";

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
}

const BHK_FILTERS = ["All", "1BHK", "2BHK", "3BHK", "4BHK"];

export function ExploreClient({ localities }: { localities: LocalityData[] }) {
  const router = useRouter();
  const [bhkFilter, setBhkFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"confidence" | "rent" | "name">("confidence");
  const [filteredLocality, setFilteredLocality] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const sortedLocalities = useMemo(() => {
    let list = [...localities];
    if (filteredLocality) {
      list = list.filter((l) => l.slug === filteredLocality);
    }
    list.sort((a, b) => {
      if (sortBy === "confidence") return b.confidenceScore - a.confidenceScore;
      if (sortBy === "rent") return (b.median2BHK ?? 0) - (a.median2BHK ?? 0);
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [localities, sortBy, filteredLocality]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0f0a]">
      {/* Full-screen map */}
      <InteractiveMap localities={localities} standalone={true} />

      {/* Back button — top-left corner */}
      <button
        onClick={() => router.back()}
        className="fixed left-4 top-4 z-[1001] flex size-11 items-center justify-center rounded-full border border-[#2d3f2d] bg-[#111811]/80 text-[#86efac] shadow-level-3 backdrop-blur-md hover:bg-[#1a221a] hover:text-[#f0fdf4] transition-all active:scale-90"
        aria-label="Go back"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Notification island — top-center */}
      <div className="fixed left-1/2 top-4 z-[1001] -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-2xl border border-[#2d3f2d] bg-[#111811]/85 px-3 py-2 shadow-level-3 backdrop-blur-xl max-md:px-2 max-md:py-1.5">
          {/* BHK quick filters */}
          <div className="flex gap-1">
            {BHK_FILTERS.map((bhk) => (
              <button
                key={bhk}
                onClick={() => setBhkFilter(bhk)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                  bhkFilter === bhk
                    ? "bg-[#22c55e] text-[#0a0f0a]"
                    : "text-[#86efac] hover:bg-[#1a221a]"
                }`}
              >
                {bhk}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-[#2d3f2d]" />

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none rounded-lg border border-[#2d3f2d] bg-[#0a0f0a] px-3 py-1.5 pr-7 text-xs font-medium text-[#86efac] outline-none focus:border-[#22c55e] cursor-pointer"
            >
              <option value="confidence">By confidence</option>
              <option value="rent">By rent</option>
              <option value="name">By name</option>
            </select>
            <ArrowUpDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#4b7a4b]" />
          </div>

          {/* Locality filter */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-lg p-1.5 transition-all ${
              showFilters || filteredLocality ? "bg-[#22c55e]/20 text-[#22c55e]" : "text-[#86efac] hover:bg-[#1a221a]"
            }`}
            aria-label="Filter by locality"
          >
            <Filter size={16} />
          </button>
        </div>

        {/* Expanded filter panel */}
        {showFilters && (
          <div className="mt-2 animate-slide-down rounded-2xl border border-[#2d3f2d] bg-[#111811]/90 p-3 shadow-level-4 backdrop-blur-xl">
            <p className="mb-2 text-xs font-medium text-[#4b7a4b]">Filter by locality</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => { setFilteredLocality(null); setShowFilters(false); }}
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
        )}
      </div>

      {/* Stats bar at bottom */}
      <div className="fixed bottom-4 left-1/2 z-[1001] -translate-x-1/2">
        <div className="flex items-center gap-4 rounded-2xl border border-[#2d3f2d] bg-[#111811]/80 px-5 py-2.5 shadow-level-3 backdrop-blur-xl text-xs max-md:px-3 max-md:gap-2">
          <span className="text-[#4b7a4b]">
            <span className="font-mono text-[#22c55e]">{localities.length}</span> localities
          </span>
          <span className="h-4 w-px bg-[#2d3f2d]" />
          <span className="text-[#4b7a4b]">
            <span className="font-mono text-[#f0fdf4]">
              {localities.filter((l) => l.submissionCount > 0).length}
            </span> with data
          </span>
          <span className="h-4 w-px bg-[#2d3f2d]" />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 rounded-lg bg-[#1a221a] px-3 py-1 text-[#86efac] hover:bg-[#222d22] transition-all"
          >
            <SlidersHorizontal size={12} />
            Filters
          </button>
        </div>
      </div>
    </div>
  );
}
