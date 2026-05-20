import { PrismaClient, type RentSubmission as PrismaRentSubmission, type Locality as PrismaLocality } from "@prisma/client";
import { getPrisma } from "@/lib/db";

export type DbLocality = {
  id: string;
  name: string;
  slug: string;
  zone: string;
  city: string;
  lat: number;
  lng: number;
  aliases: string[];
  commuteAnchors: string[];
  summary: string;
  medianIncomeAssumption: number;
};

export type DbSubmission = {
  id: string;
  localitySlug: string;
  microLocality: string | null;
  buildingSlug: string | null;
  bhk: string;
  carpetAreaSqft: number | null;
  superBuiltUpAreaSqft: number | null;
  furnishing: string;
  parkingCount: number;
  maintenanceIncluded: boolean;
  maintenanceAmount: number;
  securityDeposit: number;
  moveInDate: Date;
  leaseDurationMonths: number | null;
  floorNumber: number | null;
  facing: string | null;
  buildingAgeYears: number | null;
  gatedSociety: boolean;
  petFriendly: boolean;
  occupancyType: string;
  metroDistanceKm: number | null;
  amenities: unknown;
  brokerInvolved: boolean;
  rentAmount: number;
  effectiveMonthlyCost: number;
  proofObjectKey: string | null;
  sourceType: string;
  rentType: string;
  roommateCount: number | null;
  trustScore: number;
  confidenceLevel: string;
  verificationState: string;
  anomalyScore: number;
  freshnessScore: number;
  communityAgreementScore: number;
  submittedAt: Date;
  ipHash: string | null;
};

function mapLocality(locality: PrismaLocality): DbLocality {
  return {
    id: locality.id,
    name: locality.name,
    slug: locality.slug,
    zone: locality.zoneId || "Hyderabad",
    city: "Hyderabad",
    lat: Number(locality.lat),
    lng: Number(locality.lng),
    aliases: locality.aliases as string[] || [],
    commuteAnchors: locality.commuteAnchors as string[] || [],
    summary: locality.summary || "",
    medianIncomeAssumption: locality.medianIncomeAssumed || 100000,
  };
}

function mapSubmission(sub: PrismaRentSubmission): DbSubmission {
  return {
    id: sub.id,
    localitySlug: (sub as unknown as Record<string, unknown>).localitySlug as string || "",
    microLocality: sub.microLocalityId || null,
    buildingSlug: null, // Not in current schema directly via this relation path
    bhk: sub.bhk,
    carpetAreaSqft: sub.carpetAreaSqft,
    superBuiltUpAreaSqft: sub.superBuiltUpAreaSqft,
    furnishing: sub.furnishing,
    parkingCount: sub.parkingCount,
    maintenanceIncluded: sub.maintenanceIncluded,
    maintenanceAmount: sub.maintenanceAmount,
    securityDeposit: sub.securityDeposit,
    moveInDate: sub.moveInDate,
    leaseDurationMonths: sub.leaseDurationMonths,
    floorNumber: sub.floorNumber,
    facing: sub.facing,
    buildingAgeYears: sub.buildingAgeYears,
    gatedSociety: sub.gatedSociety,
    petFriendly: sub.petFriendly,
    occupancyType: sub.occupancyType,
    metroDistanceKm: sub.metroDistanceKm ? Number(sub.metroDistanceKm) : null,
    amenities: sub.amenitiesSnapshot,
    brokerInvolved: sub.brokerInvolved,
    rentAmount: sub.rentAmount,
    effectiveMonthlyCost: sub.effectiveMonthlyCost,
    proofObjectKey: sub.proofObjectKey,
    sourceType: sub.sourceType,
    rentType: sub.rentType,
    roommateCount: sub.roommateCount,
    trustScore: Number(sub.trustScore),
    confidenceLevel: sub.confidenceLevel,
    verificationState: sub.verificationState,
    anomalyScore: Number(sub.anomalyScore),
    freshnessScore: Number(sub.freshnessScore),
    communityAgreementScore: Number(sub.communityAgreementScore),
    submittedAt: sub.submittedAt,
    ipHash: sub.deviceFingerprintId ? sub.deviceFingerprintId : null,
  };
}

export async function getAllLocalities(): Promise<DbLocality[]> {
  const prisma = getPrisma();
  const city = await prisma.city.findFirst({ where: { slug: "hyderabad" } });
  if (!city) return [];
  
  const localities = await prisma.locality.findMany({
    where: { cityId: city.id },
    include: { zone: true },
  });
  
  return localities.map((l) => ({
    id: l.id,
    name: l.name,
    slug: l.slug,
    zone: l.zone?.name || l.zoneId || "Hyderabad",
    city: city.name,
    lat: Number(l.lat),
    lng: Number(l.lng),
    aliases: l.aliases as string[] || [],
    commuteAnchors: l.commuteAnchors as string[] || [],
    summary: l.summary || "",
    medianIncomeAssumption: l.medianIncomeAssumed || 100000,
  }));
}

export async function getLocalityBySlug(slug: string): Promise<DbLocality | null> {
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
    zone: locality.zone?.name || locality.zoneId || "Hyderabad",
    city: city.name,
    lat: Number(locality.lat),
    lng: Number(locality.lng),
    aliases: locality.aliases as string[] || [],
    commuteAnchors: locality.commuteAnchors as string[] || [],
    summary: locality.summary || "",
    medianIncomeAssumption: locality.medianIncomeAssumed || 100000,
  };
}

export async function getSubmissionsForLocalitySlug(slug: string): Promise<DbSubmission[]> {
  const prisma = getPrisma();
  const city = await prisma.city.findFirst({ where: { slug: "hyderabad" } });
  if (!city) return [];
  
  const locality = await prisma.locality.findFirst({
    where: { cityId: city.id, slug },
  });
  
  if (!locality) return [];
  
  const submissions = await prisma.rentSubmission.findMany({
    where: { localityId: locality.id, verificationState: { not: "REJECTED" } },
    orderBy: { submittedAt: "desc" },
  });
  
  return submissions.map(mapSubmission);
}

export async function getAllSubmissions(): Promise<DbSubmission[]> {
  const prisma = getPrisma();
  const submissions = await prisma.rentSubmission.findMany({
    where: { verificationState: { not: "REJECTED" } },
    orderBy: { submittedAt: "desc" },
  });
  return submissions.map(mapSubmission);
}

export async function getLocalityStats() {
  const prisma = getPrisma();
  const city = await prisma.city.findFirst({ where: { slug: "hyderabad" } });
  if (!city) return { totalSubmissions: 0, totalLocalities: 0, closedRentPercentage: 0, lastUpdated: new Date() };
  
  const localities = await prisma.locality.findMany({ where: { cityId: city.id } });
  const submissions = await prisma.rentSubmission.findMany({
    where: { locality: { cityId: city.id } },
  });
  
  const closed = submissions.filter((s) => s.rentType === "CLOSED").length;
  const lastSubmitted = submissions.length > 0 ? new Date(Math.max(...submissions.map((s) => new Date(s.submittedAt).getTime()))) : new Date();
  
  return {
    totalSubmissions: submissions.length,
    totalLocalities: localities.length,
    closedRentPercentage: submissions.length > 0 ? Math.round((closed / submissions.length) * 100) : 0,
    lastUpdated: lastSubmitted,
  };
}

export async function getTrendSeriesForLocality(slug: string) {
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
