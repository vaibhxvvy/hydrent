"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ElevatedCard } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";

export interface LocalityOption {
  slug: string;
  name: string;
  zone: string;
  median2BHK: number | null;
  confidenceScore: number;
  submissionCount: number;
}

export function CompareClient({ initialLocalities }: { initialLocalities: LocalityOption[] }) {
  const router = useRouter();
  const [leftSearch, setLeftSearch] = useState("");
  const [rightSearch, setRightSearch] = useState("");
  const [leftSelected, setLeftSelected] = useState<LocalityOption | null>(null);
  const [rightSelected, setRightSelected] = useState<LocalityOption | null>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const leftFiltered = useMemo(() =>
    initialLocalities.filter((l) => l.name.toLowerCase().includes(leftSearch.toLowerCase()) && l.slug !== rightSelected?.slug),
    [leftSearch, rightSelected, initialLocalities]
  );

  const rightFiltered = useMemo(() =>
    initialLocalities.filter((l) => l.name.toLowerCase().includes(rightSearch.toLowerCase()) && l.slug !== leftSelected?.slug),
    [rightSearch, leftSelected, initialLocalities]
  );

  const suggested = useMemo(() => {
    if (leftSelected) {
      return initialLocalities.filter((l) => l.slug !== leftSelected.slug && l.submissionCount > 20)
        .sort((a, b) => Math.abs((a.median2BHK ?? 0) - (leftSelected.median2BHK ?? 0)) - Math.abs((b.median2BHK ?? 0) - (leftSelected.median2BHK ?? 0)))
        .slice(0, 4);
    }
    return initialLocalities.filter((l) => l.submissionCount > 30).sort((a, b) => b.submissionCount - a.submissionCount).slice(0, 4);
  }, [leftSelected, initialLocalities]);

  const handleCompare = () => {
    if (leftSelected && rightSelected) {
      router.push(`/compare/${leftSelected.slug}-vs-${rightSelected.slug}`);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3 mb-2">
        <ArrowLeftRight className="size-5 text-[var(--md-sys-color-primary)]" />
        <h1 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] sm:text-3xl">Compare Localities</h1>
      </div>
      <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-8">
        Select two localities to compare rent intelligence side by side
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Left selector */}
        <div>
          <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-2">Locality A</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
            <input
              value={leftSearch}
              onChange={(e) => { setLeftSearch(e.target.value); setShowLeft(true); }}
              onFocus={() => setShowLeft(true)}
              onBlur={() => setTimeout(() => setShowLeft(false), 200)}
              placeholder="Search localities..."
              className="w-full h-11 rounded-[--radius-input] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] pl-10 pr-4 text-sm text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] outline-none focus:border-[var(--md-sys-color-primary)]"
            />
            {showLeft && leftSearch.length > 0 && (
              <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-[--radius-md] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-3)] shadow-level-2">
                {leftFiltered.map((l) => (
                  <button
                    key={l.slug}
                    onMouseDown={() => { setLeftSelected(l); setLeftSearch(l.name); setShowLeft(false); }}
                    className="w-full text-left px-3 py-2.5 text-sm text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
                  >
                    <span className="font-medium">{l.name}</span>
                    <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] ml-2">{l.zone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {leftSelected && (
            <ElevatedCard className="mt-2">
              <div className="p-3 text-sm">
                <p className="font-semibold text-[var(--md-sys-color-on-surface)]">{leftSelected.name}</p>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{leftSelected.zone}</p>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="font-mono text-[var(--md-sys-color-primary)]">{leftSelected.median2BHK ? formatINR(leftSelected.median2BHK) : "—"}</span>
                  <span>{leftSelected.confidenceScore}/100</span>
                  <span>{leftSelected.submissionCount} signals</span>
                </div>
              </div>
            </ElevatedCard>
          )}
        </div>

        {/* Right selector */}
        <div>
          <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-2">Locality B</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
            <input
              value={rightSearch}
              onChange={(e) => { setRightSearch(e.target.value); setShowRight(true); }}
              onFocus={() => setShowRight(true)}
              onBlur={() => setTimeout(() => setShowRight(false), 200)}
              placeholder="Search localities..."
              className="w-full h-11 rounded-[--radius-input] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] pl-10 pr-4 text-sm text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] outline-none focus:border-[var(--md-sys-color-primary)]"
            />
            {showRight && rightSearch.length > 0 && (
              <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-[--radius-md] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-3)] shadow-level-2">
                {rightFiltered.map((l) => (
                  <button
                    key={l.slug}
                    onMouseDown={() => { setRightSelected(l); setRightSearch(l.name); setShowRight(false); }}
                    className="w-full text-left px-3 py-2.5 text-sm text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
                  >
                    <span className="font-medium">{l.name}</span>
                    <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] ml-2">{l.zone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {rightSelected && (
            <ElevatedCard className="mt-2">
              <div className="p-3 text-sm">
                <p className="font-semibold text-[var(--md-sys-color-on-surface)]">{rightSelected.name}</p>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{rightSelected.zone}</p>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="font-mono text-[var(--md-sys-color-primary)]">{rightSelected.median2BHK ? formatINR(rightSelected.median2BHK) : "—"}</span>
                  <span>{rightSelected.confidenceScore}/100</span>
                  <span>{rightSelected.submissionCount} signals</span>
                </div>
              </div>
            </ElevatedCard>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          onClick={handleCompare}
          disabled={!leftSelected || !rightSelected}
          size="lg"
          className="gap-2 px-8"
        >
          <ArrowLeftRight className="size-4" />
          Compare
        </Button>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-3">Suggested comparisons</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {suggested.map((loc) => {
            const other = leftSelected && loc.slug !== leftSelected.slug ? loc : null;
            if (!other) return null;
            return (
              <button
                key={other.slug}
                onClick={() => {
                  if (leftSelected) {
                    setRightSelected(other);
                    setRightSearch(other.name);
                  }
                }}
                className="text-left rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-4 hover:border-[var(--md-sys-color-primary)] transition-all"
              >
                <p className="font-medium text-[var(--md-sys-color-on-surface)]">{other.name}</p>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{other.zone}</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="font-mono text-[var(--md-sys-color-primary)]">{other.median2BHK ? formatINR(other.median2BHK) : "—"}</span>
                  <span>· {other.confidenceScore}/100</span>
                </div>
              </button>
            );
          })}
          {!leftSelected && suggested.map((loc) => (
            <button
              key={loc.slug}
              onClick={() => { setLeftSelected(loc); setLeftSearch(loc.name); }}
              className="text-left rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-4 hover:border-[var(--md-sys-color-primary)] transition-all"
            >
              <p className="font-medium text-[var(--md-sys-color-on-surface)]">{loc.name}</p>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{loc.zone}</p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="font-mono text-[var(--md-sys-color-primary)]">{loc.median2BHK ? formatINR(loc.median2BHK) : "—"}</span>
                <span>· {loc.confidenceScore}/100</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
