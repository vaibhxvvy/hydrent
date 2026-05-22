"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { CircleMarker, Popup, TileLayer, useMap } from "react-leaflet";
import { formatINR } from "@/lib/utils";

interface BHKBreakdownItem {
  bhk: string;
  count: number;
  minRent: number;
  maxRent: number;
  medianRent: number | null;
}

interface FurnishingBreakdownItem {
  furnishing: string;
  count: number;
}

interface LocalityMarker {
  id: string;
  name: string;
  slug: string;
  zone: string;
  lat: number;
  lng: number;
  submissionCount: number;
  confidenceScore: number;
  median2BHK: number | null;
  bhkBreakdown?: BHKBreakdownItem[];
  furnishingBreakdown?: FurnishingBreakdownItem[];
  avgTrustScore?: number;
  avgRent?: number;
  minRent?: number;
  maxRent?: number;
}

function getConfidenceColor(confidence: number, hasData: boolean): string {
  if (!hasData) return "#6b7280";
  if (confidence >= 70) return "#22c55e";
  if (confidence >= 40) return "#eab308";
  return "#ef4444";
}

function Markers({ localities }: { localities: LocalityMarker[] }) {
  const markers = useMemo(() => {
    return localities.map((loc) => {
      const hasData = loc.submissionCount > 0;
      const color = getConfidenceColor(loc.confidenceScore, hasData);
      return { loc, hasData, color };
    });
  }, [localities]);

  return (
    <>
      {markers.map(({ loc, hasData, color }) => (
        <CircleMarker
          key={loc.id}
          center={[loc.lat, loc.lng]}
          radius={hasData ? 10 : 6}
          pathOptions={{
            fillColor: color,
            color: "#ffffff",
            weight: 2,
            fillOpacity: hasData ? 0.8 : 0.3,
          }}
        >
          <Popup>
            <div className="min-w-[220px] space-y-2 font-sans">
              <div>
                <p className="font-bold text-base text-[var(--md-sys-color-on-surface)]">{loc.name}</p>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{loc.zone} · {loc.confidenceScore}/100 confidence</p>
              </div>
              {hasData ? (
                <>
                  {/* Key metrics */}
                  <div className="flex items-stretch gap-1.5">
                    {loc.median2BHK && (
                      <div className="flex-1 rounded-lg bg-[var(--md-sys-color-surface-container-high)] px-2.5 py-1.5">
                        <p className="text-[9px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">2BHK median</p>
                        <p className="font-mono text-sm font-bold text-[var(--md-sys-color-primary)]">{formatINR(loc.median2BHK)}</p>
                      </div>
                    )}
                    {loc.avgRent != null && (
                      <div className="flex-1 rounded-lg bg-[var(--md-sys-color-surface-container-high)] px-2.5 py-1.5">
                        <p className="text-[9px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">Avg rent</p>
                        <p className="font-mono text-sm font-bold text-[var(--md-sys-color-on-surface)]">{formatINR(loc.avgRent)}</p>
                      </div>
                    )}
                    <div className="flex-1 rounded-lg bg-[var(--md-sys-color-surface-container-high)] px-2.5 py-1.5">
                      <p className="text-[9px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">Signals</p>
                      <p className="font-mono text-sm font-bold text-[var(--md-sys-color-on-surface)]">{loc.submissionCount}</p>
                    </div>
                  </div>

                  {/* BHK breakdown */}
                  {loc.bhkBreakdown && loc.bhkBreakdown.length > 0 && (
                    <div className="rounded-lg bg-[var(--md-sys-color-surface-container-high)] p-2.5">
                      <p className="text-[9px] font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1.5">Rent by BHK</p>
                      <div className="space-y-1">
                        {loc.bhkBreakdown.filter((b) => b.count > 0).map((b) => (
                          <div key={b.bhk} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex size-5 items-center justify-center rounded bg-[var(--md-sys-color-background)] text-[10px] font-bold text-[var(--md-sys-color-primary)]">{b.bhk.replace("BHK","")}</span>
                              <span className="text-[var(--md-sys-color-on-surface-variant)]">({b.count})</span>
                            </div>
                            <span className="font-mono text-[var(--md-sys-color-on-surface)] font-medium">{formatINR(b.minRent)}–{formatINR(b.maxRent)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Furnishing chips */}
                  {loc.furnishingBreakdown && loc.furnishingBreakdown.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {loc.furnishingBreakdown.map((f) => (
                        <span key={f.furnishing} className="rounded-full bg-[var(--md-sys-color-surface-container-high)] px-2 py-0.5 text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                          {f.furnishing === "FULLY_FURNISHED" ? "Fully" : f.furnishing === "SEMI_FURNISHED" ? "Semi" : "Unfurnished"} ({f.count})
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Link
                      href={`/hyderabad/${loc.slug}`}
                      className="flex-1 rounded-[--radius-button] bg-[var(--md-sys-color-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--md-sys-color-on-primary)] text-center hover:brightness-110 transition-all"
                    >
                      View report
                    </Link>
                    <Link
                      href="/submit"
                      className="flex-1 rounded-[--radius-button] border border-[var(--md-sys-color-outline)] px-3 py-1.5 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] text-center hover:bg-[var(--md-sys-color-surface-container-high)] transition-all"
                    >
                      Submit rent
                    </Link>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">No data yet for {loc.name}</p>
                  <Link href="/submit" className="block rounded-[--radius-button] bg-[var(--md-sys-color-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--md-sys-color-on-primary)] text-center hover:brightness-110 transition-all">
                    Submit first rent →
                  </Link>
                </div>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}

function ZoomControl() {
  const map = useMap();
  return (
    <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-1">
      <button
        onClick={() => map.zoomIn()}
        className="flex size-9 items-center justify-center rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors shadow-lg"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="flex size-9 items-center justify-center rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors shadow-lg"
        aria-label="Zoom out"
      >
        −
      </button>
    </div>
  );
}

function MapInner({ localities }: { localities: LocalityMarker[] }) {
  const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });

  if (typeof window === "undefined") return null;

  return (
    <MapContainer
      center={[17.385, 78.4867]}
      zoom={11}
      scrollWheelZoom={true}
      className="h-[480px] w-full rounded-xl max-md:h-[300px]"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <Markers localities={localities} />
      <ZoomControl />
    </MapContainer>
  );
}

const DynamicMap = dynamic(() => Promise.resolve(MapInner), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] w-full items-center justify-center rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-background)] max-md:h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-[var(--md-sys-color-outline)] border-t-[var(--md-sys-color-primary)]" />
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Loading map...</p>
      </div>
    </div>
  ),
});

export function LocalityMap({ localities }: { localities: LocalityMarker[] }) {
  if (localities.length === 0) return null;
  return <DynamicMap localities={localities} />;
}
