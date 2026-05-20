"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
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

function getMarkerColor(confidence: number, hasData: boolean) {
  if (!hasData) return "#6b7280";
  if (confidence >= 70) return "#22c55e";
  if (confidence >= 40) return "#eab308";
  return "#ef4444";
}

function getMarkerRadius(submissionCount: number) {
  if (submissionCount === 0) return 6;
  if (submissionCount < 5) return 8;
  if (submissionCount < 15) return 10;
  return 12;
}

function LocalityMapInner({ localities }: { localities: LocalityMarker[] }) {
  const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
  const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
  const CircleMarker = dynamic(() => import("react-leaflet").then((m) => m.CircleMarker), { ssr: false });
  const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });
  const Tooltip = dynamic(() => import("react-leaflet").then((m) => m.Tooltip), { ssr: false });

  if (typeof window === "undefined") return null;

  const L = require("leaflet");

  return (
    <MapContainer
      center={[17.385, 78.4867]}
      zoom={11}
      scrollWheelZoom={true}
      className="h-[60vh] w-full rounded-lg md:h-[450px]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {localities.map((loc) => {
        const hasData = loc.submissionCount > 0;
        const color = getMarkerColor(loc.confidenceScore, hasData);
        const radius = getMarkerRadius(loc.submissionCount);

        return (
          <CircleMarker
            key={loc.id}
            center={[loc.lat, loc.lng]}
            radius={radius}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: hasData ? 0.6 : 0.3,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -radius]} opacity={0.9}>
              <span className="text-sm font-medium">{loc.name}</span>
            </Tooltip>
            <Popup>
              <div className="min-w-[200px] space-y-2">
                <div>
                  <p className="font-semibold text-base">{loc.name}</p>
                  <p className="text-xs text-muted-foreground">{loc.zone}</p>
                </div>
                {hasData ? (
                  <>
                    {loc.median2BHK && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-muted-foreground">2BHK median:</span>
                        <span className="font-semibold">{formatINR(loc.median2BHK)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Confidence:</span>
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: color }}
                      >
                        {loc.confidenceScore}/100
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {loc.submissionCount} submission{loc.submissionCount !== 1 ? "s" : ""}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Link
                        href={`/hyderabad/${loc.slug}`}
                        className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        View report
                      </Link>
                      <Link
                        href="/submit"
                        className="rounded border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        Submit rent
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      No data yet — submit yours
                    </p>
                    <Link
                      href="/submit"
                      className="inline-block rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Submit rent
                    </Link>
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

const DynamicMap = dynamic(() => Promise.resolve(LocalityMapInner), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] w-full items-center justify-center rounded-lg border bg-muted/30 md:h-[450px]">
      <p className="text-sm text-muted-foreground">Loading map...</p>
    </div>
  ),
});

export function LocalityMap({ localities }: { localities: LocalityMarker[] }) {
  if (localities.length === 0) return null;
  return <DynamicMap localities={localities} />;
}
