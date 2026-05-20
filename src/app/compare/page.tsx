import { getAllLocalitiesWithStats } from "@/lib/data/db";
import { baseMetadata } from "@/lib/seo";
import { CompareClient, type LocalityOption } from "./compare-client";

export const dynamic = "force-dynamic";

export const metadata = baseMetadata({
  title: "Compare Localities",
  description: "Compare rent intelligence across Hyderabad localities side by side.",
  alternates: { canonical: "/compare" },
});

export default async function ComparePage() {
  let all: LocalityOption[] = [];
  try {
    const raw = await getAllLocalitiesWithStats();
    all = raw.map((l) => ({
      slug: l.slug,
      name: l.name,
      zone: l.zone,
      median2BHK: l.median2BHK,
      confidenceScore: l.confidenceScore,
      submissionCount: l.submissionCount,
    }));
  } catch {
    // DB unavailable
  }

  return <CompareClient initialLocalities={all} />;
}
