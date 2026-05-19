"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { Locality, RentSubmission } from "@/lib/types";
import { buildings } from "@/lib/data/hyderabad";
import { formatINR } from "@/lib/utils";

export default function LeafletRentMap({
  locality,
  submissions,
}: {
  locality: Locality;
  submissions: RentSubmission[];
}) {
  const points = submissions.map((submission, index) => {
    const building = buildings.find((item) => item.slug === submission.buildingSlug);
    const offset = index * 0.002;
    return {
      submission,
      lat: building?.coordinates.lat ?? locality.coordinates.lat + offset,
      lng: building?.coordinates.lng ?? locality.coordinates.lng - offset,
    };
  });

  return (
    <MapContainer
      center={[locality.coordinates.lat, locality.coordinates.lng]}
      zoom={13}
      scrollWheelZoom={false}
      className="h-full min-h-80 w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png"}
      />
      {points.map(({ submission, lat, lng }) => (
        <CircleMarker
          key={submission.id}
          center={[lat, lng]}
          radius={Math.max(8, Math.min(22, submission.effectiveMonthlyCost / 4200))}
          pathOptions={{
            color: submission.anomalyScore > 60 ? "#b45309" : "#2f7d69",
            fillColor: submission.anomalyScore > 60 ? "#f59e0b" : "#3f8f79",
            fillOpacity: 0.32,
            weight: 1,
          }}
        >
          <Popup>
            <div className="grid gap-1 text-sm">
              <strong>{submission.bhk}</strong>
              <span>{formatINR(submission.effectiveMonthlyCost)} effective monthly cost</span>
              <span>{submission.verificationState.replaceAll("_", " ").toLowerCase()}</span>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
