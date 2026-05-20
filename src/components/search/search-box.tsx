"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Search } from "lucide-react";

interface SearchResult {
  type: "locality" | "building";
  title: string;
  subtitle: string;
  href: string;
  score: number;
}

export function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      setIsOpen(true);
      setSelectedIndex(-1);
    } catch {
      setResults([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && results[selectedIndex]) {
      router.push(results[selectedIndex].href);
      setIsOpen(false);
      setQuery("");
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" aria-hidden="true" />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Search Kondapur, Gachibowli, Madhapur..."
          className="h-12 w-full rounded-[--radius-input] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] pl-10 pr-4 text-base text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] outline-none transition-all focus:border-[var(--md-sys-color-primary)] focus:shadow-[0_0_0_3px_rgba(124,158,255,0.15)]"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="size-4 animate-spin rounded-full border-2 border-[var(--md-sys-color-outline)] border-t-[var(--md-sys-color-primary)]" />
          </div>
        )}
      </div>

      {isOpen && query.length > 1 && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-[--radius-md] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] shadow-level-2">
          {results.length > 0 ? (
            <div className="max-h-80 overflow-auto p-1">
              {results.map((result, idx) => (
                <button
                  key={`${result.type}-${result.href}`}
                  onMouseDown={() => {
                    router.push(result.href);
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className={`flex w-full items-center gap-3 rounded-[--radius-sm] px-3 py-3 text-sm text-left transition-colors ${
                    idx === selectedIndex
                      ? "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]"
                      : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                  }`}
                >
                  <span className="flex size-8 items-center justify-center rounded-[--radius-sm] bg-[var(--md-sys-color-surface-container-high)]">
                    {result.type === "building" ? (
                      <Building2 className="size-4 text-[var(--md-sys-color-on-surface-variant)]" />
                    ) : (
                      <MapPin className="size-4 text-[var(--md-sys-color-primary)]" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-[var(--md-sys-color-on-surface)]">{result.title}</span>
                    <span className="block truncate text-[var(--md-sys-color-on-surface-variant)]">{result.subtitle}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-5 text-sm text-[var(--md-sys-color-on-surface-variant)]">
              No indexed match yet. HydRent can still accept a rent submission for this place.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
