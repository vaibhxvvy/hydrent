"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
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
  bhkBreakdown: BHKBreakdownItem[];
  furnishingBreakdown: FurnishingBreakdownItem[];
  avgTrustScore: number;
  avgRent: number;
  minRent: number;
  maxRent: number;
}

const BHK_OPTIONS = ["1BHK", "2BHK", "3BHK", "4BHK"];

interface PinState {
  lat: number;
  lng: number;
}

function createRentIcon(avgRent: number, confidence: number, hasData: boolean): L.DivIcon {
  const isHigh = hasData && confidence >= 70;
  const isMid = hasData && confidence >= 40;
  const bg = isHigh ? "#22C55E" : isMid ? "#F59E0B" : hasData ? "#FF8A80" : "#6b7280";
  const textColor = isHigh ? "#0A0F0A" : isMid ? "#0A0F0A" : "#FFFFFF";
  const label = hasData && avgRent > 0 ? `₹${(avgRent / 1000).toFixed(0)}k` : "—";
  return L.divIcon({
    className: "rent-pin",
    html: `<div style="background:${bg};color:${textColor};padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;font-family:system-ui;white-space:nowrap;border:2px solid rgba(255,255,255,0.7);box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;gap:2px;cursor:pointer"><span>${label}</span></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function LocalityMarkers({ localities, onLocalityClick, hidden }: {
  localities: LocalityData[];
  onLocalityClick: (loc: LocalityData) => void;
  hidden: boolean;
}) {
  const markers = useMemo(() => {
    return localities.map((loc) => {
      const hasData = loc.submissionCount > 0;
      return { loc, hasData };
    });
  }, [localities]);

  if (hidden) return null;

  return (
    <>
      {markers.map(({ loc, hasData }) => (
        <Marker
          key={loc.id}
          position={[loc.lat, loc.lng]}
          icon={createRentIcon(loc.avgRent, loc.confidenceScore, hasData)}
          eventHandlers={{ click: () => onLocalityClick(loc) }}
        />
      ))}
    </>
  );
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onMapClick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-1.5">
      <button onClick={() => map.zoomIn()} className="flex size-10 items-center justify-center rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-all shadow-level-2 active:scale-95" aria-label="Zoom in">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button onClick={() => map.zoomOut()} className="flex size-10 items-center justify-center rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-all shadow-level-2 active:scale-95" aria-label="Zoom out">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
  );
}

function UserPin({ position }: { position: PinState }) {
  return (
    <CircleMarker
      center={[position.lat, position.lng]}
      radius={12}
      pathOptions={{
        fillColor: "#22c55e",
        color: "#ffffff",
        weight: 3,
        fillOpacity: 0.9,
      }}
    >
      <Popup>
        <div className="text-center text-sm font-medium text-[var(--md-sys-color-on-surface)]">📍 Your pin</div>
      </Popup>
    </CircleMarker>
  );
}

export type { PinState, LocalityData };

const LAYER_OPTIONS = [
  { id: "satellite", label: "Satellite" },
  { id: "greencover", label: "Green cover" },
  { id: "metro", label: "Metro line" },
  { id: "areastats", label: "Area stats" },
] as const;

type LayerId = typeof LAYER_OPTIONS[number]["id"];

function MapContent({ localities, onClose, standalone }: {
  localities: LocalityData[];
  onClose?: () => void;
  standalone?: boolean;
}) {
  const router = useRouter();
  const [selectedLocality, setSelectedLocality] = useState<LocalityData | null>(null);
  const [exitingLocality, setExitingLocality] = useState(false);
  const [cachedLocality, setCachedLocality] = useState<LocalityData | null>(null);
  const [pin, setPin] = useState<PinState | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitStep, setSubmitStep] = useState(0);
  const [bhk, setBhk] = useState("");
  const [rentAmount, setRentAmount] = useState(25000);
  const [furnishing, setFurnishing] = useState("SEMI_FURNISHED");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([17.385, 78.4867]);
  const [mapZoom, setMapZoom] = useState(11);
  const [layerPanel, setLayerPanel] = useState(false);
  const [layers, setLayers] = useState<Record<LayerId, boolean>>({
    satellite: false,
    greencover: false,
    metro: false,
    areastats: false,
  });
  const [hidePins, setHidePins] = useState(false);
  const layerPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!layerPanel) return;
    const handler = (e: MouseEvent) => {
      if (layerPanelRef.current && !layerPanelRef.current.contains(e.target as Node)) {
        setLayerPanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [layerPanel]);

  const animateOutLocality = useCallback((cb?: () => void) => {
    if (selectedLocality) {
      setCachedLocality(selectedLocality);
      setExitingLocality(true);
      setTimeout(() => {
        setSelectedLocality(null);
        setCachedLocality(null);
        setExitingLocality(false);
        cb?.();
      }, 350);
    } else {
      cb?.();
    }
  }, [selectedLocality]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPin({ lat, lng });
    if (selectedLocality) {
      animateOutLocality();
    } else {
      setSelectedLocality(null);
    }
    setShowSubmit(true);
    setSubmitStep(0);
    setSubmitted(false);
    setMapCenter([lat, lng]);
    setMapZoom(14);
  }, [selectedLocality, animateOutLocality]);

  const handleSubmitRent = async () => {
    setSubmitting(true);
    try {
      const nearestLoc = localities.length > 0 ? localities.reduce((best, loc) => {
        const dist = Math.sqrt((loc.lat - (pin?.lat ?? 0)) ** 2 + (loc.lng - (pin?.lng ?? 0)) ** 2);
        return dist < best.dist ? { loc, dist } : best;
      }, { loc: localities[0]!, dist: Infinity }).loc : null;
      const localitySlug = selectedLocality?.slug || nearestLoc?.slug || "gachibowli";

      const payload = {
        localitySlug,
        microLocality: `Near ${selectedLocality?.name || "dropped pin"}`,
        bhk,
        rentType: "CLOSED",
        furnishing,
        rentAmount,
        maintenanceAmount: Math.round(rentAmount * 0.08),
        maintenanceIncluded: false,
        securityDeposit: rentAmount * 3,
        moveInDate: new Date().toISOString().split("T")[0],
        occupancyType: "FAMILY",
        parkingCount: 1,
        brokerInvolved: false,
        gatedSociety: false,
        petFriendly: false,
      };

      const res = await fetch("/api/rent-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setShowSubmit(false);
          setPin(null);
          setSubmitted(false);
          setSubmitStep(0);
          router.refresh();
        }, 2000);
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const nearestLocality = useMemo(() => {
    if (!pin) return null;
    return localities.reduce((best, loc) => {
      const dist = Math.sqrt((loc.lat - pin.lat) ** 2 + (loc.lng - pin.lng) ** 2);
      return dist < best.dist ? { loc, dist } : best;
    }, { loc: localities[0], dist: Infinity }).loc;
  }, [pin, localities]);

  const activeLayerCount = Object.values(layers).filter(Boolean).length;

  const loc = selectedLocality || cachedLocality;

  return (
    <div className="relative w-full">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        className={`w-full ${standalone ? "h-screen" : "h-[520px]"} rounded-[--radius-card] max-md:h-screen`}
        zoomControl={false}
        maxBounds={[[17.0, 78.0], [17.8, 78.9]] as [[number, number], [number, number]]}
        maxBoundsViscosity={1.0}
      >
        {layers.satellite ? (
          <TileLayer
            attribution="&copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        )}
        <ClickHandler onMapClick={handleMapClick} />
        <MapController center={mapCenter} zoom={mapZoom} />
        <LocalityMarkers localities={localities} onLocalityClick={(loc) => {
          setSelectedLocality(loc);
          setShowSubmit(false);
          setPin(null);
          setMapCenter([loc.lat, loc.lng]);
          setMapZoom(15);
        }} hidden={hidePins} />
        {pin && <UserPin position={pin} />}
        <ZoomControls />
      </MapContainer>

      {/* Right side panel toggle */}
      <div className="absolute right-3 top-16 z-[1000] flex flex-col gap-1.5">
        <button
          onClick={() => setLayerPanel(!layerPanel)}
          className={`flex size-10 items-center justify-center rounded-[--radius-card] border border-[var(--md-sys-color-outline)] transition-all shadow-level-2 active:scale-95 ${
            layerPanel || activeLayerCount > 0
              ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
              : "bg-[var(--elevation-level-1)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
          }`}
          aria-label="Map layers"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 12 15 2 8.5"/><line x1="2" y1="15.5" x2="22" y2="15.5"/><line x1="2" y1="20.5" x2="22" y2="20.5"/></svg>
        </button>
      </div>

      {/* Layer panel */}
      {layerPanel && (
        <div ref={layerPanelRef} className="absolute right-3 top-[5.5rem] z-[1000] min-w-[180px] animate-slide-down rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-3)]/95 p-3 shadow-level-3 backdrop-blur-xl">
          <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-2 uppercase tracking-wider">Map Layers</p>
          <div className="space-y-1">
            {LAYER_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer rounded-[--radius-sm] px-2 py-1.5 hover:bg-[var(--md-sys-color-surface-container)] transition-colors">
                <input
                  type="checkbox"
                  checked={layers[opt.id]}
                  onChange={() => setLayers((prev) => ({ ...prev, [opt.id]: !prev[opt.id] }))}
                  className="size-4 accent-[var(--md-sys-color-primary)] rounded-[--radius-sm]"
                />
                <span className="text-sm text-[var(--md-sys-color-on-surface)]">{opt.label}</span>
              </label>
            ))}
            <div className="border-t border-[var(--md-sys-color-outline)] my-1.5" />
            <label className="flex items-center gap-2.5 cursor-pointer rounded-[--radius-sm] px-2 py-1.5 hover:bg-[var(--md-sys-color-surface-container)] transition-colors">
              <input
                type="checkbox"
                checked={hidePins}
                onChange={() => setHidePins(!hidePins)}
                className="size-4 accent-[var(--md-sys-color-primary)] rounded-[--radius-sm]"
              />
              <span className="text-sm text-[var(--md-sys-color-on-surface)]">Hide pins</span>
            </label>
          </div>
        </div>
      )}

      {/* Area stats overlay */}
      {layers.areastats && (
        <div className="absolute left-3 top-20 z-[1000] animate-slide-down rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-3)]/90 p-3 shadow-level-2 backdrop-blur-xl min-w-[160px]">
          <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5 uppercase tracking-wider">Area Stats</p>
          <div className="space-y-1 text-xs text-[var(--md-sys-color-on-surface)]">
            <div className="flex justify-between"><span>Localities</span><span className="font-semibold">{localities.length}</span></div>
            <div className="flex justify-between"><span>With data</span><span className="font-semibold">{localities.filter((l) => l.submissionCount > 0).length}</span></div>
            <div className="flex justify-between"><span>Total signals</span><span className="font-semibold">{localities.reduce((s, l) => s + l.submissionCount, 0)}</span></div>
            <div className="flex justify-between"><span>Avg confidence</span><span className="font-semibold">{Math.round(localities.reduce((s, l) => s + l.confidenceScore, 0) / Math.max(localities.length, 1))}/100</span></div>
          </div>
        </div>
      )}

      {/* FAB - Reset to Hyderabad view */}
      <button
        onClick={() => {
          setMapCenter([17.385, 78.4867]);
          setMapZoom(12);
        }}
        className="absolute bottom-4 left-4 z-[1000] flex size-12 items-center justify-center rounded-[--radius-card] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)] shadow-level-3 hover:bg-[var(--md-sys-color-surface-container-highest)] transition-all active:scale-90"
        aria-label="Reset view"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4m10-10h-4M6 12H2"/></svg>
      </button>

      {/* Selected locality popup - single full popup */}
      {loc && !showSubmit && (
        <div className={`absolute left-0 right-0 z-[1000] mx-auto px-3 sm:px-4 ${exitingLocality ? "animate-slide-to-top" : "animate-slide-up"} max-w-lg`}
          style={{ bottom: "max(12px, env(safe-area-inset-bottom))" }}
        >
          <div className="rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)]/95 p-5 shadow-level-3 backdrop-blur-xl">
            {/* Header with back button */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => animateOutLocality()}
                className="flex size-8 items-center justify-center rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
                aria-label="Back"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div className="flex-1">
                <h3 className="font-bold text-[var(--md-sys-color-on-surface)] text-lg leading-tight">{loc.name}</h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{loc.zone}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${
                loc.confidenceScore >= 70 ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]" :
                loc.confidenceScore >= 40 ? "bg-[#F59E0B] text-[#0A0F0A]" :
                "bg-[#FF8A80] text-[#690005]"
              }`}>
                {loc.confidenceScore}
              </span>
            </div>

            {loc.submissionCount > 0 ? (
              <>
                {/* Key metrics row */}
                <div className="flex items-stretch gap-2 text-sm mb-3">
                  {loc.median2BHK && (
                    <div className="bg-[var(--md-sys-color-surface-container-high)] rounded-[--radius-md] px-3 py-2 flex-1 min-w-0">
                      <p className="text-[var(--md-sys-color-on-surface-variant)] text-[10px] uppercase tracking-wider">2BHK median</p>
                      <p className="font-mono text-base font-bold text-[var(--md-sys-color-primary)] mt-0.5 truncate">{formatINR(loc.median2BHK)}</p>
                    </div>
                  )}
                  <div className="bg-[var(--md-sys-color-surface-container-high)] rounded-[--radius-md] px-3 py-2 flex-1 min-w-0">
                    <p className="text-[var(--md-sys-color-on-surface-variant)] text-[10px] uppercase tracking-wider">Avg rent</p>
                    <p className="font-mono text-base font-bold text-[var(--md-sys-color-on-surface)] mt-0.5 truncate">{formatINR(loc.avgRent)}</p>
                  </div>
                  <div className="bg-[var(--md-sys-color-surface-container-high)] rounded-[--radius-md] px-3 py-2 flex-1 min-w-0">
                    <p className="text-[var(--md-sys-color-on-surface-variant)] text-[10px] uppercase tracking-wider">Trust</p>
                    <p className="font-mono text-base font-bold text-[var(--md-sys-color-primary)] mt-0.5">{loc.avgTrustScore}</p>
                  </div>
                </div>

                {/* BHK breakdown - full ranges */}
                {loc.bhkBreakdown.length > 0 && (
                  <div className="bg-[var(--md-sys-color-surface-container-high)] rounded-[--radius-md] p-3 mb-2">
                    <p className="text-[var(--md-sys-color-on-surface-variant)] text-[10px] uppercase tracking-wider mb-2">Rent by BHK</p>
                    <div className="space-y-1.5">
                      {loc.bhkBreakdown.filter((b) => b.count > 0).map((b) => (
                        <div key={b.bhk} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="inline-flex items-center justify-center size-7 rounded-[--radius-sm] bg-[var(--md-sys-color-background)] text-xs font-bold text-[var(--md-sys-color-primary)] flex-shrink-0">{b.bhk.replace("BHK","")}</span>
                            <span className="text-[var(--md-sys-color-on-surface-variant)] text-xs whitespace-nowrap">({b.count})</span>
                          </div>
                          <span className="font-mono text-[var(--md-sys-color-on-surface)] font-medium text-xs truncate ml-2">
                            {formatINR(b.minRent)} – {formatINR(b.maxRent)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Furnishing chips */}
                {loc.furnishingBreakdown.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)] mb-3">
                    {loc.furnishingBreakdown.map((f) => (
                      <span key={f.furnishing} className="bg-[var(--md-sys-color-surface-container-high)] rounded-full px-2.5 py-1">
                        {f.furnishing === "FULLY_FURNISHED" ? "Fully" : f.furnishing === "SEMI_FURNISHED" ? "Semi" : "Unfurnished"} ({f.count})
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => animateOutLocality(() => router.push(`/hyderabad/${loc.slug}`))}
                    className="flex-1 rounded-[--radius-button] bg-[var(--md-sys-color-primary)] py-2.5 text-sm font-semibold text-[var(--md-sys-color-on-primary)] hover:brightness-110 transition-all active:scale-[0.97]"
                  >
                    View full report
                  </button>
                  <button
                    onClick={() => {
                      animateOutLocality(() => {
                        setPin({ lat: loc.lat, lng: loc.lng });
                        setShowSubmit(true);
                        setSubmitStep(0);
                      });
                    }}
                    className="flex-1 rounded-[--radius-button] border border-[var(--md-sys-color-outline)] py-2.5 text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-all active:scale-[0.97]"
                  >
                    Submit rent
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] my-3">No data yet. Be the first to submit.</p>
                <button
                  onClick={() => {
                    setPin({ lat: loc.lat, lng: loc.lng });
                    setShowSubmit(true);
                    setSubmitStep(0);
                    animateOutLocality();
                  }}
                  className="w-full rounded-[--radius-button] bg-[var(--md-sys-color-primary)] py-2.5 text-sm font-semibold text-[var(--md-sys-color-on-primary)] hover:brightness-110 transition-all active:scale-[0.97]"
                >
                  Submit first rent
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quick submit bottom sheet */}
      {showSubmit && pin && !submitted && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] animate-slide-up">
          <div className="rounded-t-3xl border-t border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)]/95 p-5 pb-8 shadow-level-5 backdrop-blur-xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--md-sys-color-outline)]" />

            {submitStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">📍 Drop a pin, tell us the rent</h3>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Near: {nearestLocality?.name || "Unknown locality"}</p>

                <div>
                  <p className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] mb-2">BHK</p>
                  <div className="flex gap-2">
                    {BHK_OPTIONS.map((opt) => (
                      <button key={opt} onClick={() => setBhk(opt)}
                        className={`flex-1 rounded-[--radius-button] py-3 text-sm font-medium transition-all active:scale-95 ${
                          bhk === opt ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]" : "border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                        }`}
                      >{opt}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] mb-2">Monthly rent (₹)</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-primary)] font-mono font-bold text-lg">₹</span>
                    <input
                      type="number" value={rentAmount}
                      onChange={(e) => setRentAmount(Number(e.target.value))}
                      className="w-full h-13 rounded-[--radius-input] border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-background)] pl-10 pr-4 font-mono text-xl font-bold text-[var(--md-sys-color-on-surface)] outline-none focus:border-[var(--md-sys-color-primary)] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.15)] transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setSubmitStep(1)}
                  disabled={!bhk || rentAmount < 1000}
                  className="w-full rounded-[--radius-button] bg-[var(--md-sys-color-primary)] py-3.5 text-sm font-bold text-[var(--md-sys-color-on-primary)] hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            )}

            {submitStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">Almost done!</h3>

                <div>
                  <p className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] mb-2">Furnishing</p>
                  <div className="flex gap-2">
                    {["FULLY_FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"].map((opt) => (
                      <button key={opt} onClick={() => setFurnishing(opt)}
                        className={`flex-1 rounded-[--radius-button] py-3 text-sm font-medium transition-all active:scale-95 ${
                          furnishing === opt ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]" : "border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                        }`}
                      >{opt === "FULLY_FURNISHED" ? "Furnished" : opt === "SEMI_FURNISHED" ? "Semi" : "Unfurnished"}</button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[--radius-card] bg-[var(--md-sys-color-surface-container-high)] p-4">
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Summary</p>
                  <div className="mt-2 space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-[var(--md-sys-color-on-surface-variant)]">Location</span><span className="text-[var(--md-sys-color-on-surface)]">{nearestLocality?.name || "Dropped pin"}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--md-sys-color-on-surface-variant)]">BHK</span><span className="text-[var(--md-sys-color-on-surface)]">{bhk}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--md-sys-color-on-surface-variant)]">Rent</span><span className="font-mono text-[var(--md-sys-color-primary)] font-bold">{formatINR(rentAmount)}</span></div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setSubmitStep(0)} className="flex-1 rounded-[--radius-button] border border-[var(--md-sys-color-outline)] py-3.5 text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-all active:scale-[0.97]">
                    Back
                  </button>
                  <button
                    onClick={handleSubmitRent}
                    disabled={submitting}
                    className="flex-1 rounded-[--radius-button] bg-[var(--md-sys-color-primary)] py-3.5 text-sm font-bold text-[var(--md-sys-color-on-primary)] hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting..." : "Submit rent ✓"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success state */}
      {submitted && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="animate-fade-in-scale text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[var(--md-sys-color-primary)]/20">
              <svg className="size-10 text-[var(--md-sys-color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline className="animate-checkmark" points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="mt-4 text-lg font-bold text-[var(--md-sys-color-on-surface)]">Rent submitted!</p>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Thank you for contributing</p>
          </div>
        </div>
      )}

      {/* Close button for standalone mode */}
      {standalone && onClose && (
        <button onClick={onClose} className="absolute left-4 top-4 z-[1000] flex size-10 items-center justify-center rounded-[--radius-card] bg-[var(--elevation-level-1)] border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-all shadow-level-3" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      )}
    </div>
  );
}

const DynamicMap = dynamic(() => Promise.resolve(MapContent), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] w-full items-center justify-center rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-background)] max-md:h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-2 border-[var(--md-sys-color-outline)] border-t-[var(--md-sys-color-primary)]" />
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] animate-breathe">Loading map...</p>
      </div>
    </div>
  ),
});

export function InteractiveMap({ localities, onClose, standalone }: {
  localities: LocalityData[];
  onClose?: () => void;
  standalone?: boolean;
}) {
  if (localities.length === 0) return null;
  return <DynamicMap localities={localities} {...{ ...(standalone ? { standalone: true } : {}), ...(onClose ? { onClose } : {}) }} />;
}
