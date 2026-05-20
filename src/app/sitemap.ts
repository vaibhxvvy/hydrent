import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/how-data-works", "/submit"].map(
    (path) => ({
      url: absoluteUrl(path || "/"),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    }),
  );

  return staticRoutes;
}
