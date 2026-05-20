"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
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

function getConfidenceColor(confidence: number, hasData: boolean): string {
  if (!hasData) return "#6b7280";
  if (confidence >= 70) return "#22c55e";
  if (confidence >= 40) return "#eab308";
  return "#ef4444";
}

interface PinState {
  lat: number;
  lng: number;
}

function LocalityMarkers({ localities, onLocalityClick }: {
  localities: LocalityData[];
  onLocalityClick: (loc: LocalityData) => void;
}) {
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
          radius={hasData ? 12 : 7}
          pathOptions={{
            fillColor: color,
            color: "#ffffff",
            weight: 2.5,
            fillOpacity: hasData ? 0.8 : 0.3,
          }}
          eventHandlers={{ click: () => onLocalityClick(loc) }}
        >
          {hasData && loc.confidenceScore >= 70 && (
            <CircleMarker
              center={[loc.lat, loc.lng]}
              radius={18}
              pathOptions={{
                color: color,
                weight: 1,
                opacity: 0.2,
                fillOpacity: 0.08,
                fillColor: color,
              }}
              interactive={false}
            />
          )}
          {hasData && (
            <Popup>
              <div className="min-w-[200px] font-sans text-[#0a0f0a]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-base">{loc.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium text-white ${
                    loc.confidenceScore >= 70 ? "bg-[#22c55e]" :
                    loc.confidenceScore >= 40 ? "bg-[#eab308] text-[#0a0f0a]" :
                    "bg-[#ef4444]"
                  }`}>
                    {loc.confidenceScore}
                  </span>
                </div>
                {loc.bhkBreakdown.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {loc.bhkBreakdown.map((b) => (
                      <div key={b.bhk} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#1a221a]">{b.bhk}</span>
                        <span className="text-[#4b7a4b]">
                          {formatINR(b.minRent)} – {formatINR(b.maxRent)}
                        </span>
                        <span className="text-[#6b7280] ml-2">({b.count})</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-[#2d3f2d] pt-1.5 text-xs text-[#4b7a4b] space-y-0.5">
                  {loc.avgTrustScore > 0 && (
                    <div className="flex justify-between">
                      <span>Trust score</span>
                      <span className="font-medium text-[#0a0f0a]">{loc.avgTrustScore}/100</span>
                    </div>
                  )}
                  {loc.furnishingBreakdown.length > 0 && (
                    <div className="flex justify-between">
                      <span>Furnishing</span>
                      <span className="font-medium text-[#0a0f0a]">
                        {loc.furnishingBreakdown.map((f) =>
                          `${f.furnishing === "FULLY_FURNISHED" ? "Fully" : f.furnishing === "SEMI_FURNISHED" ? "Semi" : "Unfurnished"}`
                        ).join(", ")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Submissions</span>
                    <span className="font-medium text-[#0a0f0a]">{loc.submissionCount}</span>
                  </div>
                </div>
              </div>
            </Popup>
          )}
        </CircleMarker>
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
      <button onClick={() => map.zoomIn()} className="flex size-10 items-center justify-center rounded-xl border border-[#2d3f2d] bg-[#111811] text-[#86efac] hover:bg-[#1a221a] transition-all shadow-level-2 active:scale-95" aria-label="Zoom in">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button onClick={() => map.zoomOut()} className="flex size-10 items-center justify-center rounded-xl border border-[#2d3f2d] bg-[#111811] text-[#86efac] hover:bg-[#1a221a] transition-all shadow-level-2 active:scale-95" aria-label="Zoom out">
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
        <div className="text-center text-sm font-medium text-[#0a0f0a]">📍 Your pin</div>
      </Popup>
    </CircleMarker>
  );
}

export type { PinState, LocalityData };

function MapContent({ localities, onClose, standalone }: {
  localities: LocalityData[];
  onClose?: () => void;
  standalone?: boolean;
}) {
  const router = useRouter();
  const [selectedLocality, setSelectedLocality] = useState<LocalityData | null>(null);
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

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPin({ lat, lng });
    setSelectedLocality(null);
    setShowSubmit(true);
    setSubmitStep(0);
    setSubmitted(false);
    // Try to find nearest locality
    const nearest = localities.reduce((best, loc) => {
      const dist = Math.sqrt((loc.lat - lat) ** 2 + (loc.lng - lng) ** 2);
      return dist < best.dist ? { loc, dist } : best;
    }, { loc: localities[0], dist: Infinity });
    setMapCenter([lat, lng]);
    setMapZoom(14);
  }, [localities]);

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

  return (
    <div className="relative w-full">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        className={`w-full ${standalone ? "h-screen" : "h-[520px]"} rounded-2xl max-md:h-[400px]`}
        zoomControl={false}
        maxBounds={[[17.0, 78.0], [17.8, 78.9]] as [[number, number], [number, number]]}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ClickHandler onMapClick={handleMapClick} />
        <MapController center={mapCenter} zoom={mapZoom} />
        <LocalityMarkers localities={localities} onLocalityClick={(loc) => {
          setSelectedLocality(loc);
          setShowSubmit(false);
          setPin(null);
          setMapCenter([loc.lat, loc.lng]);
          setMapZoom(15);
        }} />
        {pin && <UserPin position={pin} />}
        <ZoomControls />
      </MapContainer>

      {/* FAB - Reset to Hyderabad view */}
      <button
        onClick={() => {
          setMapCenter([17.385, 78.4867]);
          setMapZoom(12);
        }}
        className="absolute bottom-4 left-4 z-[1000] flex size-12 items-center justify-center rounded-2xl bg-[#1a221a] border border-[#2d3f2d] text-[#22c55e] shadow-level-3 hover:bg-[#222d22] transition-all active:scale-90"
        aria-label="Reset view"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4m10-10h-4M6 12H2"/></svg>
      </button>

      {/* Selected locality popup */}
      {selectedLocality && !showSubmit && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] mx-auto max-w-md animate-slide-up">
          <div className="rounded-2xl border border-[#1f2b1f] bg-[#111811]/95 p-5 shadow-level-3 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${selectedLocality.submissionCount > 0 ? "bg-[#22c55e]" : "bg-[#6b7280]"}`} />
                  <h3 className="font-bold text-[#f0fdf4] text-lg">{selectedLocality.name}</h3>
                </div>
                <p className="text-sm text-[#4b7a4b] mt-0.5">{selectedLocality.zone}</p>
              </div>
              <button onClick={() => setSelectedLocality(null)} className="text-[#4b7a4b] hover:text-[#f0fdf4] size-8 flex items-center justify-center rounded-full hover:bg-[#1a221a] transition-colors" aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {selectedLocality.submissionCount > 0 ? (
              <div className="mt-4">
                {/* Key metrics row */}
                <div className="flex items-center gap-3 text-sm mb-3">
                  {selectedLocality.median2BHK && (
                    <div className="bg-[#1a221a] rounded-xl px-4 py-2.5 flex-1">
                      <p className="text-[#4b7a4b] text-xs">2BHK median</p>
                      <p className="font-mono text-lg font-bold text-[#22c55e] mt-0.5">{formatINR(selectedLocality.median2BHK)}</p>
                    </div>
                  )}
                  <div className="bg-[#1a221a] rounded-xl px-4 py-2.5 flex-1">
                    <p className="text-[#4b7a4b] text-xs">Confidence</p>
                    <p className="font-mono text-lg font-bold text-[#f0fdf4] mt-0.5">{selectedLocality.confidenceScore}/100</p>
                  </div>
                  {selectedLocality.avgTrustScore > 0 && (
                    <div className="bg-[#1a221a] rounded-xl px-4 py-2.5 flex-1">
                      <p className="text-[#4b7a4b] text-xs">Trust</p>
                      <p className="font-mono text-lg font-bold text-[#22c55e] mt-0.5">{selectedLocality.avgTrustScore}</p>
                    </div>
                  )}
                </div>

                {/* BHK breakdown */}
                {selectedLocality.bhkBreakdown.length > 0 && (
                  <div className="bg-[#1a221a] rounded-xl p-3 mb-3">
                    <p className="text-[#4b7a4b] text-xs mb-2">Rent by BHK</p>
                    <div className="space-y-1.5">
                      {selectedLocality.bhkBreakdown.map((b) => (
                        <div key={b.bhk} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center size-6 rounded-md bg-[#0a0f0a] text-xs font-bold text-[#22c55e]">{b.bhk.replace("BHK","")}</span>
                            <span className="text-[#4b7a4b] text-xs">({b.count})</span>
                          </div>
                          <span className="font-mono text-[#f0fdf4] font-medium">
                            ₹{b.minRent.toLocaleString()} – ₹{b.maxRent.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Furnishing + trust summary */}
                {selectedLocality.furnishingBreakdown.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-[#4b7a4b] mb-1">
                    {selectedLocality.furnishingBreakdown.map((f) => (
                      <span key={f.furnishing} className="bg-[#1a221a] rounded-lg px-2.5 py-1">
                        {f.furnishing === "FULLY_FURNISHED" ? "Fully" : f.furnishing === "SEMI_FURNISHED" ? "Semi" : "Unfurnished"} ({f.count})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#4b7a4b]">No data yet. Be the first to submit.</p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => router.push(`/hyderabad/${selectedLocality.slug}`)}
                className="flex-1 rounded-xl bg-[#22c55e] py-2.5 text-sm font-semibold text-[#0a0f0a] hover:bg-[#16a34a] transition-all active:scale-[0.97]"
              >
                View full report
              </button>
              <button
                onClick={() => {
                  setShowSubmit(true);
                  setPin({ lat: selectedLocality.lat, lng: selectedLocality.lng });
                  setSubmitStep(0);
                }}
                className="flex-1 rounded-xl border border-[#2d3f2d] py-2.5 text-sm font-medium text-[#86efac] hover:bg-[#1a221a] transition-all active:scale-[0.97]"
              >
                Submit rent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick submit bottom sheet */}
      {showSubmit && pin && !submitted && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] animate-slide-up">
          <div className="rounded-t-3xl border-t border-[#1f2b1f] bg-[#111811]/95 p-5 pb-8 shadow-level-5 backdrop-blur-xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#2d3f2d]" />

            {submitStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#f0fdf4]">📍 Drop a pin, tell us the rent</h3>
                <p className="text-sm text-[#4b7a4b]">Near: {nearestLocality?.name || "Unknown locality"}</p>

                <div>
                  <p className="text-sm font-medium text-[#86efac] mb-2">BHK</p>
                  <div className="flex gap-2">
                    {BHK_OPTIONS.map((opt) => (
                      <button key={opt} onClick={() => setBhk(opt)}
                        className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all active:scale-95 ${
                          bhk === opt ? "bg-[#22c55e] text-[#0a0f0a]" : "border border-[#2d3f2d] text-[#86efac] hover:bg-[#1a221a]"
                        }`}
                      >{opt}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-[#86efac] mb-2">Monthly rent (₹)</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22c55e] font-mono font-bold text-lg">₹</span>
                    <input
                      type="number" value={rentAmount}
                      onChange={(e) => setRentAmount(Number(e.target.value))}
                      className="w-full h-13 rounded-xl border border-[#2d3f2d] bg-[#0a0f0a] pl-10 pr-4 font-mono text-xl font-bold text-[#f0fdf4] outline-none focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.15)] transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setSubmitStep(1)}
                  disabled={!bhk || rentAmount < 1000}
                  className="w-full rounded-xl bg-[#22c55e] py-3.5 text-sm font-bold text-[#0a0f0a] hover:bg-[#16a34a] transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            )}

            {submitStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#f0fdf4]">Almost done!</h3>

                <div>
                  <p className="text-sm font-medium text-[#86efac] mb-2">Furnishing</p>
                  <div className="flex gap-2">
                    {["FULLY_FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"].map((opt) => (
                      <button key={opt} onClick={() => setFurnishing(opt)}
                        className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all active:scale-95 ${
                          furnishing === opt ? "bg-[#22c55e] text-[#0a0f0a]" : "border border-[#2d3f2d] text-[#86efac] hover:bg-[#1a221a]"
                        }`}
                      >{opt === "FULLY_FURNISHED" ? "Furnished" : opt === "SEMI_FURNISHED" ? "Semi" : "Unfurnished"}</button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-[#1a221a] p-4">
                  <p className="text-xs text-[#4b7a4b]">Summary</p>
                  <div className="mt-2 space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-[#4b7a4b]">Location</span><span className="text-[#f0fdf4]">{nearestLocality?.name || "Dropped pin"}</span></div>
                    <div className="flex justify-between"><span className="text-[#4b7a4b]">BHK</span><span className="text-[#f0fdf4]">{bhk}</span></div>
                    <div className="flex justify-between"><span className="text-[#4b7a4b]">Rent</span><span className="font-mono text-[#22c55e] font-bold">{formatINR(rentAmount)}</span></div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setSubmitStep(0)} className="flex-1 rounded-xl border border-[#2d3f2d] py-3.5 text-sm font-medium text-[#86efac] hover:bg-[#1a221a] transition-all active:scale-[0.97]">
                    Back
                  </button>
                  <button
                    onClick={handleSubmitRent}
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-[#22c55e] py-3.5 text-sm font-bold text-[#0a0f0a] hover:bg-[#16a34a] transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
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
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#22c55e]/20">
              <svg className="size-10 text-[#22c55e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline className="animate-checkmark" points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="mt-4 text-lg font-bold text-[#f0fdf4]">Rent submitted!</p>
            <p className="text-sm text-[#86efac]">Thank you for contributing</p>
          </div>
        </div>
      )}

      {/* Close button for standalone mode */}
      {standalone && onClose && (
        <button onClick={onClose} className="absolute left-4 top-4 z-[1000] flex size-10 items-center justify-center rounded-xl bg-[#111811] border border-[#2d3f2d] text-[#86efac] hover:bg-[#1a221a] transition-all shadow-level-3" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      )}
    </div>
  );
}

const DynamicMap = dynamic(() => Promise.resolve(MapContent), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] w-full items-center justify-center rounded-2xl border border-[#1f2b1f] bg-[#0a0f0a] max-md:h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-2 border-[#2d3f2d] border-t-[#22c55e]" />
        <p className="text-sm text-[#4b7a4b] animate-breathe">Loading map...</p>
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
