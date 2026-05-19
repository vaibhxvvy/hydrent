"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchHydRent } from "@/lib/search";

export function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchHydRent(query), [query]);

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
          placeholder="Search locality, micro-market, society, or nickname"
          className="h-12 ps-10 text-base"
        />
      </div>

      {query.length > 1 ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border bg-popover shadow-lg">
          {results.length > 0 ? (
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
      ) : null}
    </div>
  );
}
