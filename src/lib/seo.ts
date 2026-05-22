import type { Metadata } from "next";
import type { Locality } from "@/lib/types";
import { aggregateRent } from "@/lib/analytics/statistics";
import { getSubmissionsForLocality, localities } from "@/lib/data/hyderabad";
import { formatINR } from "@/lib/utils";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site-config";

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function baseMetadata(overrides: Metadata = {}): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${SITE_NAME} - Real Hyderabad rent intelligence`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    authors: [{ name: "HydRent contributors" }],
    creator: "HydRent contributors",
    publisher: SITE_NAME,
    alternates: {
      canonical: absoluteUrl("/"),
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${SITE_NAME} - Real Hyderabad rent intelligence`,
      description: SITE_DESCRIPTION,
      url: absoluteUrl("/"),
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} - Real Hyderabad rent intelligence`,
      description: SITE_DESCRIPTION,
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
      siteName: SITE_NAME,
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
      name: SITE_NAME,
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

  const median = aggregate.median;
  const p25 = aggregate.p25;
  const p75 = aggregate.p75;

  if (!median || median === 0) {
    return {
      summary: null,
      affordability: null,
      nearby: alternatives.length > 0
        ? `Nearby comparison markets worth checking: ${alternatives.join(", ")}.`
        : "Nearby comparison markets will appear as the dataset grows.",
    };
  }

  return {
    summary: `${locality.name} currently shows a trust-weighted median effective monthly cost of ${formatINR(median)}. The central range sits between ${formatINR(p25)} and ${formatINR(p75)}, with ${aggregate.verifiedRatio}% of the local sample verified or community-reviewed.`,
    affordability: `Using a conservative household income assumption of ${formatINR(locality.medianIncomeAssumption)}, the median rent-to-income pressure is ${Math.round((median / locality.medianIncomeAssumption) * 100)}%.`,
    nearby: alternatives.length > 0
      ? `Nearby comparison markets worth checking: ${alternatives.join(", ")}.`
      : "Nearby comparison markets will appear as the dataset grows.",
  };
}
