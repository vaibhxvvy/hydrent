import { getAllLocalitiesWithStats } from "@/lib/data/db";
import { ExploreClient } from "@/components/explore/explore-client";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  let localitiesWithStats: import("@/lib/data/db").LocalityWithStats[] = [];

  try {
    localitiesWithStats = await getAllLocalitiesWithStats();
  } catch {
    // DB unavailable
  }

  const mapLocalities = localitiesWithStats.map((loc) => ({
    id: loc.id,
    name: loc.name,
    slug: loc.slug,
    zone: loc.zone,
    lat: loc.coordinates.lat,
    lng: loc.coordinates.lng,
    submissionCount: loc.submissionCount,
    confidenceScore: loc.confidenceScore,
    median2BHK: loc.median2BHK,
  }));

  return <ExploreClient localities={mapLocalities} />;
}
