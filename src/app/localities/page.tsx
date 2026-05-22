import type { Metadata } from "next";
import { getAllLocalitiesWithStats } from "@/lib/data/db";
import { baseMetadata } from "@/lib/seo";
import { LocalitiesClient } from "./localities-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = baseMetadata({
  title: "All Hyderabad localities",
  description: "Browse rent intelligence for all 25+ Hyderabad localities. Trust-weighted medians, BHK breakdowns, verified submissions.",
  alternates: { canonical: "/localities" },
});

export default async function LocalitiesPage() {
  let localities: import("@/lib/data/db").LocalityWithStats[] = [];
  try {
    localities = await getAllLocalitiesWithStats();
  } catch {
    // DB unavailable
  }

  return <LocalitiesClient localities={localities} />;
}
