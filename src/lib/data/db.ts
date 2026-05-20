import { getPrisma } from "@/lib/db";
import type {
  Building,
  Locality,
  RentSubmission,
  TrendPoint,
  FurnishingType,
  OccupancyType,
  SourceType,
  RentType,
  VerificationState,
  Amenity,
} from "@/lib/types";

export type LocalityWithStats = Locality & {
  submissionCount: number;
  confidenceScore: number;
  median2BHK: number | null;
};

export type DbLocalityStats = {
  weightedMedian: number | null;
  p25: number | null;
  p75: number | null;
  submissionCount: number;
  confidenceScore: number;
  lastUpdated: Date | null;
};

export async function getAllLocalitiesWithStats(): Promise<LocalityWithStats[]> {
  const prisma = getPrisma();
  const city = await prisma.city.findFirst({ where: { slug: "hyderabad" } });
  if (!city) return [];

  const localities = await prisma.locality.findMany({
    where: { cityId: city.id },
    include: { zone: true },
    orderBy: { name: "asc" },
  });

  const allSubmissions = await prisma.rentSubmission.findMany({
    where: {
      locality: { cityId: city.id },
      verificationState: { in: ["VERIFIED", "COMMUNITY_REVIEW"] },
    },
  });

  const submissionsByLocality = new Map<string, typeof allSubmissions>();
  for (const sub of allSubmissions) {
    const locId = sub.localityId;
    if (!submissionsByLocality.has(locId)) {
      submissionsByLocality.set(locId, []);
    }
    submissionsByLocality.get(locId)!.push(sub);
  }

  return localities.map((l) => {
    const locSubmissions = submissionsByLocality.get(l.id) || [];
    const bhk2 = locSubmissions.filter((s) => s.bhk === "2BHK");
    const median2BHK = bhk2.length > 0
      ? Math.round(bhk2.reduce((sum, s) => sum + s.effectiveMonthlyCost, 0) / bhk2.length)
      : null;
    const verifiedCount = locSubmissions.filter((s) => s.verificationState === "VERIFIED").length;
    const confidenceScore = locSubmissions.length > 0
      ? Math.min(100, Math.round(
          (Math.log10(locSubmissions.length + 1) / Math.log10(60)) * 100 * 0.4 +
          (verifiedCount / locSubmissions.length) * 100 * 0.6,
        ))
      : 0;

    return {
      id: l.id,
      name: l.name,
      slug: l.slug,
      zone: l.zone?.name || "Hyderabad",
      city: city.name,
      coordinates: { lat: Number(l.lat), lng: Number(l.lng) },
      aliases: (l.aliases as string[]) || [],
      commuteAnchors: (l.commuteAnchors as string[]) || [],
      summary: l.summary || "",
      medianIncomeAssumption: l.medianIncomeAssumed || 100000,
      submissionCount: locSubmissions.length,
      confidenceScore,
      median2BHK,
    };
  });
}

export async function getAllLocalities(): Promise<Locality[]> {
  const withStats = await getAllLocalitiesWithStats();
  return withStats.map(({ submissionCount, confidenceScore, median2BHK, ...loc }) => loc);
}

export async function getLocalityBySlug(slug: string): Promise<Locality | null> {
  const prisma = getPrisma();
  const city = await prisma.city.findFirst({ where: { slug: "hyderabad" } });
  if (!city) return null;

  const locality = await prisma.locality.findFirst({
    where: { cityId: city.id, slug },
    include: { zone: true },
  });

  if (!locality) return null;
  return {
    id: locality.id,
    name: locality.name,
    slug: locality.slug,
    zone: locality.zone?.name || "Hyderabad",
    city: city.name,
    coordinates: { lat: Number(locality.lat), lng: Number(locality.lng) },
    aliases: (locality.aliases as string[]) || [],
    commuteAnchors: (locality.commuteAnchors as string[]) || [],
    summary: locality.summary || "",
    medianIncomeAssumption: locality.medianIncomeAssumed || 100000,
  };
}

export async function getAllBuildings(): Promise<Building[]> {
  const prisma = getPrisma();
  const buildings = await prisma.building.findMany({
    include: { locality: { include: { city: true } } },
    orderBy: { name: "asc" },
  });

  return buildings.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    localitySlug: b.locality.slug,
    microLocality: "",
    coordinates: { lat: Number(b.lat ?? 0), lng: Number(b.lng ?? 0) },
    aliases: [] as string[],
    amenities: [] as Amenity[],
    ageYears: b.ageYears ?? 0,
    gated: b.gated,
    ...(b.totalUnits != null ? { totalUnits: b.totalUnits } : {}),
  }));
}

export async function getBuildingBySlug(slug: string): Promise<Building | null> {
  const prisma = getPrisma();
  const building = await prisma.building.findUnique({
    where: { slug },
    include: { locality: { include: { city: true } } },
  });

  if (!building) return null;
  return {
    id: building.id,
    name: building.name,
    slug: building.slug,
    localitySlug: building.locality.slug,
    microLocality: "",
    coordinates: { lat: Number(building.lat ?? 0), lng: Number(building.lng ?? 0) },
    aliases: [] as string[],
    amenities: [] as Amenity[],
    ageYears: building.ageYears ?? 0,
    gated: building.gated,
    ...(building.totalUnits != null ? { totalUnits: building.totalUnits } : {}),
  };
}

export async function getSubmissionsForLocality(slug: string): Promise<RentSubmission[]> {
  const prisma = getPrisma();
  const city = await prisma.city.findFirst({ where: { slug: "hyderabad" } });
  if (!city) return [];

  const locality = await prisma.locality.findFirst({
    where: { cityId: city.id, slug },
  });
  if (!locality) return [];

  const submissions = await prisma.rentSubmission.findMany({
    where: {
      localityId: locality.id,
      verificationState: { not: "REJECTED" },
    },
    orderBy: { submittedAt: "desc" },
  });

  return submissions.map(mapSubmission);
}

export async function getSubmissionsForBuilding(slug: string): Promise<RentSubmission[]> {
  const prisma = getPrisma();
  const building = await prisma.building.findUnique({ where: { slug } });
  if (!building) return [];

  const submissions = await prisma.rentSubmission.findMany({
    where: {
      buildingId: building.id,
      verificationState: { not: "REJECTED" },
    },
    orderBy: { submittedAt: "desc" },
  });

  return submissions.map(mapSubmission);
}

export async function getAllSubmissions(): Promise<RentSubmission[]> {
  const prisma = getPrisma();
  const submissions = await prisma.rentSubmission.findMany({
    where: { verificationState: { not: "REJECTED" } },
    orderBy: { submittedAt: "desc" },
  });
  return submissions.map(mapSubmission);
}

export async function getLocalityStats(slug: string): Promise<DbLocalityStats> {
  const prisma = getPrisma();
  const city = await prisma.city.findFirst({ where: { slug: "hyderabad" } });
  if (!city) return emptyStats();

  const locality = await prisma.locality.findFirst({
    where: { cityId: city.id, slug },
  });
  if (!locality) return emptyStats();

  const submissions = await prisma.rentSubmission.findMany({
    where: {
      localityId: locality.id,
      verificationState: { in: ["VERIFIED", "COMMUNITY_REVIEW"] },
    },
  });

  if (submissions.length === 0) return emptyStats();

  const rents = submissions.map((s) => s.effectiveMonthlyCost);
  const weights = submissions.map((s) => {
    const trust = Math.max(0, Math.min(100, Number(s.trustScore))) / 100;
    return Math.max(0.05, trust);
  });

  const sorted = rents
    .map((v, i) => ({ value: v, weight: weights[i] ?? 0 }))
    .sort((a, b) => a.value - b.value);
  const totalWeight = sorted.reduce((sum, p) => sum + p.weight, 0);

  function weightedPercentile(pct: number) {
    if (totalWeight === 0) return 0;
    const threshold = totalWeight * pct;
    let cumulative = 0;
    for (const pair of sorted) {
      cumulative += pair.weight;
      if (cumulative >= threshold) return pair.value;
    }
    return sorted[sorted.length - 1]?.value ?? 0;
  }

  const lastSubmitted = new Date(
    Math.max(...submissions.map((s) => new Date(s.submittedAt).getTime())),
  );

  const verifiedCount = submissions.filter((s) => s.verificationState === "VERIFIED").length;
  const confidenceScore = Math.round(
    Math.min(100, (Math.log10(submissions.length + 1) / Math.log10(60)) * 100 * 0.4 +
      (verifiedCount / submissions.length) * 100 * 0.6),
  );

  return {
    weightedMedian: Math.round(weightedPercentile(0.5)),
    p25: Math.round(weightedPercentile(0.25)),
    p75: Math.round(weightedPercentile(0.75)),
    submissionCount: submissions.length,
    confidenceScore,
    lastUpdated: lastSubmitted,
  };
}

export async function getCityStats() {
  const prisma = getPrisma();
  const city = await prisma.city.findFirst({ where: { slug: "hyderabad" } });
  if (!city) return { totalSubmissions: 0, localitiesWithData: 0, closedRentPercentage: 0, lastUpdated: new Date() };

  const localities = await prisma.locality.findMany({ where: { cityId: city.id } });
  const submissions = await prisma.rentSubmission.findMany({
    where: { locality: { cityId: city.id }, verificationState: { not: "REJECTED" } },
  });

  const localitiesWithData = new Set(submissions.map((s) => s.localityId)).size;
  const closed = submissions.filter((s) => s.rentType === "CLOSED").length;
  const lastUpdated = submissions.length > 0
    ? new Date(Math.max(...submissions.map((s) => new Date(s.submittedAt).getTime())))
    : new Date();

  return {
    totalSubmissions: submissions.length,
    localitiesWithData,
    closedRentPercentage: submissions.length > 0 ? Math.round((closed / submissions.length) * 100) : 0,
    lastUpdated,
  };
}

export async function getTrendSeriesForLocality(slug: string): Promise<TrendPoint[]> {
  const prisma = getPrisma();
  const city = await prisma.city.findFirst({ where: { slug: "hyderabad" } });
  if (!city) return [];

  const locality = await prisma.locality.findFirst({
    where: { cityId: city.id, slug },
  });
  if (!locality) return [];

  const snapshots = await prisma.historicalRentSnapshot.findMany({
    where: { localityId: locality.id },
    orderBy: { month: "asc" },
  });

  return snapshots.map((s) => ({
    month: s.month.toISOString().slice(0, 7),
    medianRent: s.median,
    p25: s.p25,
    p75: s.p75,
    sampleSize: s.sampleSize,
    confidenceScore: Number(s.confidenceScore),
  }));
}

function emptyStats(): DbLocalityStats {
  return {
    weightedMedian: null,
    p25: null,
    p75: null,
    submissionCount: 0,
    confidenceScore: 0,
    lastUpdated: null,
  };
}

function mapSubmission(sub: import("@prisma/client").RentSubmission): RentSubmission {
  const base = {
    id: sub.id,
    localitySlug: "",
    microLocality: "",
    bhk: sub.bhk as RentSubmission["bhk"],
    carpetAreaSqft: sub.carpetAreaSqft ?? undefined,
    superBuiltUpAreaSqft: sub.superBuiltUpAreaSqft ?? undefined,
    furnishing: sub.furnishing as FurnishingType,
    parkingCount: sub.parkingCount,
    maintenanceIncluded: sub.maintenanceIncluded,
    maintenanceAmount: sub.maintenanceAmount,
    securityDeposit: sub.securityDeposit,
    moveInDate: sub.moveInDate.toISOString().slice(0, 10),
    leaseDurationMonths: sub.leaseDurationMonths ?? 11,
    floorNumber: sub.floorNumber ?? undefined,
    facing: sub.facing as RentSubmission["facing"],
    buildingAgeYears: sub.buildingAgeYears ?? undefined,
    gatedSociety: sub.gatedSociety,
    petFriendly: sub.petFriendly,
    occupancyType: sub.occupancyType as OccupancyType,
    metroDistanceKm: sub.metroDistanceKm ? Number(sub.metroDistanceKm) : undefined,
    amenities: (sub.amenitiesSnapshot as Amenity[]) || [],
    brokerInvolved: sub.brokerInvolved,
    rentAmount: sub.rentAmount,
    effectiveMonthlyCost: sub.effectiveMonthlyCost,
    rentType: sub.rentType as RentType,
    sourceType: sub.sourceType as SourceType,
    roommateCount: sub.roommateCount ?? undefined,
    proofUploaded: !!sub.proofObjectKey,
    otpVerified: false,
    accountAgeDays: 0,
    historicalReliability: 40,
    submissionConsistency: 50,
    communityAgreementScore: Number(sub.communityAgreementScore),
    anomalyScore: Number(sub.anomalyScore),
    trustScore: Number(sub.trustScore),
    freshnessScore: Number(sub.freshnessScore),
    verificationState: sub.verificationState as VerificationState,
    submittedAt: sub.submittedAt.toISOString(),
  };

  return {
    ...base,
    ...(sub.buildingId ? { buildingSlug: sub.buildingId } : {}),
  } as RentSubmission;
}
