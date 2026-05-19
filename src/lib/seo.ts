import type { Metadata } from "next";
import type { Locality } from "@/lib/types";
import { aggregateRent } from "@/lib/analytics/statistics";
import { getSubmissionsForLocality, localities } from "@/lib/data/hyderabad";
import { formatINR } from "@/lib/utils";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function absoluteUrl(path = "/") {
  return new URL(path, appUrl).toString();
}

export function baseMetadata(overrides: Metadata = {}): Metadata {
  return {
    metadataBase: new URL(appUrl),
    title: {
      default: "HydRent - Real Hyderabad rent intelligence",
      template: "%s | HydRent",
    },
    description:
      "Community-verified Hyderabad rent intelligence based on real rents people pay, not inflated listing prices.",
    applicationName: "HydRent",
    authors: [{ name: "HydRent contributors" }],
    creator: "HydRent contributors",
    publisher: "HydRent",
    alternates: {
      canonical: absoluteUrl("/"),
    },
    openGraph: {
      type: "website",
      siteName: "HydRent",
      title: "HydRent - Real Hyderabad rent intelligence",
      description:
        "Trust-weighted rent analytics for Hyderabad localities, micro-markets, and societies.",
      url: absoluteUrl("/"),
    },
    twitter: {
      card: "summary_large_image",
      title: "HydRent - Real Hyderabad rent intelligence",
      description:
        "Understand real rent ranges in Hyderabad using community-verified data and transparent statistics.",
    },
    ...overrides,
  };
}

export function localityMetadata(locality: Locality, path: string): Metadata {
  const aggregate = aggregateRent(getSubmissionsForLocality(locality.slug), {
    label: locality.name,
  });
  const title = `${locality.name} rent report`;
  const description = `${locality.name} rents in Hyderabad: median effective cost ${formatINR(
    aggregate.median,
  )}, verified ratio ${aggregate.verifiedRatio}%, confidence ${aggregate.confidenceScore}/100.`;

  return baseMetadata({
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      type: "article",
      siteName: "HydRent",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  });
}

export function generateLocalityJsonLd(locality: Locality) {
  const aggregate = aggregateRent(getSubmissionsForLocality(locality.slug), {
    label: locality.name,
  });

  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${locality.name} rent intelligence`,
    description: locality.summary,
    spatialCoverage: {
      "@type": "Place",
      name: `${locality.name}, Hyderabad`,
      geo: {
        "@type": "GeoCoordinates",
        latitude: locality.coordinates.lat,
        longitude: locality.coordinates.lng,
      },
    },
    measurementTechnique: "Weighted median aggregation with time decay and anomaly resistance",
    variableMeasured: [
      {
        "@type": "PropertyValue",
        name: "Median effective monthly rent",
        value: aggregate.median,
        unitText: "INR",
      },
      {
        "@type": "PropertyValue",
        name: "Confidence score",
        value: aggregate.confidenceScore,
      },
    ],
    creator: {
      "@type": "Organization",
      name: "HydRent",
      url: absoluteUrl("/"),
    },
  };
}

export function generatedLocalityCopy(locality: Locality) {
  const aggregate = aggregateRent(getSubmissionsForLocality(locality.slug), {
    label: locality.name,
  });
  const alternatives = localities
    .filter((candidate) => candidate.slug !== locality.slug && candidate.zone === locality.zone)
    .slice(0, 3)
    .map((candidate) => candidate.name);

  return {
    summary: `${locality.name} currently shows a trust-weighted median effective monthly cost of ${formatINR(
      aggregate.median,
    )}. The central range sits between ${formatINR(aggregate.p25)} and ${formatINR(
      aggregate.p75,
    )}, with ${aggregate.verifiedRatio}% of the local sample verified or community-reviewed.`,
    affordability: `Using a conservative household income assumption of ${formatINR(
      locality.medianIncomeAssumption,
    )}, the median rent-to-income pressure is ${Math.round(
      (aggregate.median / locality.medianIncomeAssumption) * 100,
    )}%.`,
    nearby:
      alternatives.length > 0
        ? `Nearby comparison markets worth checking: ${alternatives.join(", ")}.`
        : "Nearby comparison markets will appear as the dataset grows.",
  };
}
