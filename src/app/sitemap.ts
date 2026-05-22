import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/localities`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/compare`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/submit`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/how-data-works`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/issues`, changeFrequency: "monthly", priority: 0.3 },
  ];

  let localitySlugs: string[] = [];
  try {
    const mod = await import("@/lib/data/db");
    const localities = await mod.getAllLocalitiesWithStats();
    localitySlugs = localities.map((l: { slug: string }) => l.slug).filter(Boolean);
  } catch {
    // DB unavailable
  }

  const localityPages: MetadataRoute.Sitemap = localitySlugs.flatMap((slug) => [
    { url: `${SITE_URL}/hyderabad/${slug}`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/hyderabad/${slug}/1bhk`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/hyderabad/${slug}/2bhk`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/hyderabad/${slug}/3bhk`, changeFrequency: "weekly", priority: 0.6 },
  ]);

  const comparePairs: MetadataRoute.Sitemap = [];
  for (let i = 0; i < localitySlugs.length; i++) {
    for (let j = i + 1; j < localitySlugs.length; j++) {
      comparePairs.push({
        url: `${SITE_URL}/compare/${localitySlugs[i]}-vs-${localitySlugs[j]}`,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  }

  return [...staticRoutes, ...localityPages, ...comparePairs];
}
