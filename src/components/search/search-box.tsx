"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchResult {
  type: "locality" | "building";
  title: string;
  subtitle: string;
  href: string;
  score: number;
}

export function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
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

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          autoFocus={autoFocus}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your locality... e.g. Kondapur, Gachibowli"
          className="h-12 ps-10 text-base"
        />
      </div>

      {query.length > 1 && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border bg-popover shadow-lg">
          {loading ? (
            <div className="px-4 py-5 text-sm text-muted-foreground">Searching...</div>
          ) : results.length > 0 ? (
            <div className="max-h-80 overflow-auto p-1">
              {results.map((result) => (
                <Link
                  key={`${result.type}-${result.href}`}
                  href={result.href}
                  className="flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-muted"
                >
                  <span className="flex size-8 items-center justify-center rounded-md bg-muted">
                    {result.type === "building" ? (
                      <Building2 className="size-4" aria-hidden="true" />
                    ) : (
                      <MapPin className="size-4" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{result.title}</span>
                    <span className="block truncate text-muted-foreground">{result.subtitle}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-5 text-sm text-muted-foreground">
              No indexed match yet. HydRent can still accept a rent submission for this place.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
