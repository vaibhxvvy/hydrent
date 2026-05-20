"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { CircleMarker, Popup, TileLayer, useMap } from "react-leaflet";
import { formatINR } from "@/lib/utils";

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
          radius={hasData ? 8 : 6}
          pathOptions={{
            fillColor: color,
            color: "#ffffff",
            weight: 2,
            fillOpacity: hasData ? 0.7 : 0.3,
          }}
        >
          <Popup>
            <div className="min-w-[180px] space-y-2 font-sans">
              <div>
                <p className="font-semibold text-base text-[var(--md-sys-color-on-surface)]">{loc.name}</p>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{loc.zone}</p>
              </div>
              {hasData ? (
                <>
                  {loc.median2BHK && (
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">2BHK median:</span>
                      <span className="font-semibold text-[var(--md-sys-color-on-surface)]">{formatINR(loc.median2BHK)}/mo</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Confidence:</span>
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: color, color: color === "#eab308" ? "var(--md-sys-color-background)" : "#fff" }}>
                      {loc.confidenceScore}/100
                    </span>
                  </div>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{loc.submissionCount} signals</p>
                  <div className="flex gap-2 pt-1">
                    <Link href={`/hyderabad/${loc.slug}`} className="rounded bg-[var(--md-sys-color-primary)] px-3 py-1.5 text-xs font-medium text-[var(--md-sys-color-on-surface)] hover:brightness-110">
                      View report
                    </Link>
                    <Link href="/submit" className="rounded border border-[var(--md-sys-color-outline)] px-3 py-1.5 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]">
                      Submit rent
                    </Link>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">No data yet for {loc.name}</p>
                  <Link href="/submit" className="inline-block rounded bg-[var(--md-sys-color-primary)] px-3 py-1.5 text-xs font-medium text-[var(--md-sys-color-on-surface)] hover:brightness-110">
                    Submit →
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
