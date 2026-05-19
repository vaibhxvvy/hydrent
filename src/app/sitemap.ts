import type { MetadataRoute } from "next";
import { buildings, localities } from "@/lib/data/hyderabad";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/how-data-works", "/submit", "/compare/gachibowli-vs-kondapur"].map(
    (path) => ({
      url: absoluteUrl(path || "/"),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    }),
  );

  const localityRoutes = localities.flatMap((locality) => [
    {
      url: absoluteUrl(`/hyderabad/${locality.slug}`),
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: absoluteUrl(`/hyderabad/${locality.slug}/2bhk`),
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.82,
    },
    {
      url: absoluteUrl(`/locality/${locality.slug}/furnished`),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.72,
    },
  ]);

  const buildingRoutes = buildings.map((building) => ({
    url: absoluteUrl(`/building/${building.slug}`),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.78,
  }));

  return [...staticRoutes, ...localityRoutes, ...buildingRoutes];
}
