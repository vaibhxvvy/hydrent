"use client";

import dynamic from "next/dynamic";
import type { Locality, RentSubmission } from "@/lib/types";

const LeafletRentMap = dynamic(() => import("@/components/maps/rent-heatmap-leaflet"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading map</div>,
});

export function RentHeatmap({
  locality,
  submissions,
}: {
  locality: Locality;
  submissions: RentSubmission[];
}) {
  return <LeafletRentMap locality={locality} submissions={submissions} />;
}
