import { getSupabaseServer } from "@/lib/db";

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

function db() {
  return getSupabaseServer();
}

export async function getAllLocalities(): Promise<DbLocality[]> {
  const supabase = db();
  const { data: city } = await supabase
    .from("City")
    .select("id, name")
    .eq("slug", "hyderabad")
    .limit(1)
    .maybeSingle()
    .throwOnError();
  if (!city) return [];

  const { data: zones } = await supabase
    .from("Zone")
    .select("id, name")
    .throwOnError();
  const zoneMap = new Map((zones || []).map((z: { id: string; name: string }) => [z.id, z.name]));

  const { data: localities } = await supabase
    .from("Locality")
    .select("*")
    .eq("cityId", city.id)
    .throwOnError();

  return ((localities || []) as Array<Record<string, unknown>>).map((l: Record<string, unknown>) => ({
    id: l.id as string,
    name: l.name as string,
    slug: l.slug as string,
    zone: (l.zoneId ? (zoneMap.get(l.zoneId as string) || "Hyderabad") : "Hyderabad") as string,
    city: city.name,
    lat: Number(l.lat),
    lng: Number(l.lng),
    aliases: (l.aliases as string[]) || [],
    commuteAnchors: (l.commuteAnchors as string[]) || [],
    summary: (l.summary as string) || "",
    medianIncomeAssumption: (l.medianIncomeAssumed as number) || 100000,
  }));
}

export async function getLocalityBySlug(slug: string): Promise<DbLocality | null> {
  const supabase = db();
  const { data: city } = await supabase
    .from("City")
    .select("id, name")
    .eq("slug", "hyderabad")
    .limit(1)
    .maybeSingle()
    .throwOnError();
  if (!city) return null;

  const { data: locality } = await supabase
    .from("Locality")
    .select("*, zone:Zone(name)")
    .eq("cityId", city.id)
    .eq("slug", slug)
    .limit(1)
    .maybeSingle()
    .throwOnError();

  if (!locality) return null;
  const l = locality as Record<string, unknown>;
  const zone = l.zone as { name: string } | null;
  return {
    id: l.id as string,
    name: l.name as string,
    slug: l.slug as string,
    zone: zone?.name || (l.zoneId as string) || "Hyderabad",
    city: city.name,
    lat: Number(l.lat),
    lng: Number(l.lng),
    aliases: (l.aliases as string[]) || [],
    commuteAnchors: (l.commuteAnchors as string[]) || [],
    summary: (l.summary as string) || "",
    medianIncomeAssumption: (l.medianIncomeAssumed as number) || 100000,
  };
}

export async function getSubmissionsForLocalitySlug(slug: string): Promise<DbSubmission[]> {
  const supabase = db();
  const { data: city } = await supabase
    .from("City")
    .select("id")
    .eq("slug", "hyderabad")
    .limit(1)
    .maybeSingle()
    .throwOnError();
  if (!city) return [];

  const { data: locality } = await supabase
    .from("Locality")
    .select("id")
    .eq("cityId", city.id)
    .eq("slug", slug)
    .limit(1)
    .maybeSingle()
    .throwOnError();
  if (!locality) return [];

  const { data: submissions } = await supabase
    .from("RentSubmission")
    .select("*")
    .eq("localityId", locality.id)
    .neq("verificationState", "REJECTED")
    .order("submittedAt", { ascending: false })
    .throwOnError();

  return ((submissions || []) as Array<Record<string, unknown>>).map(mapSubmission);
}

export async function getAllSubmissions(): Promise<DbSubmission[]> {
  const supabase = db();
  const { data: submissions } = await supabase
    .from("RentSubmission")
    .select("*")
    .neq("verificationState", "REJECTED")
    .order("submittedAt", { ascending: false })
    .throwOnError();

  return ((submissions || []) as Array<Record<string, unknown>>).map(mapSubmission);
}

export async function getLocalityStats() {
  const supabase = db();
  const { data: city } = await supabase
    .from("City")
    .select("id")
    .eq("slug", "hyderabad")
    .limit(1)
    .maybeSingle()
    .throwOnError();
  if (!city) return { totalSubmissions: 0, totalLocalities: 0, closedRentPercentage: 0, lastUpdated: new Date() };

  const { data: localities } = await supabase
    .from("Locality")
    .select("id")
    .eq("cityId", city.id)
    .throwOnError();

  const { data: submissions } = await supabase
    .from("RentSubmission")
    .select("rentType, submittedAt")
    .throwOnError();

  const rows = (submissions || []) as { rentType: string; submittedAt: string }[];
  const closed = rows.filter((s) => s.rentType === "CLOSED").length;
  const lastSubmitted = rows.length > 0
    ? new Date(Math.max(...rows.map((s) => new Date(s.submittedAt).getTime())))
    : new Date();

  return {
    totalSubmissions: rows.length,
    totalLocalities: (localities || []).length,
    closedRentPercentage: rows.length > 0 ? Math.round((closed / rows.length) * 100) : 0,
    lastUpdated: lastSubmitted,
  };
}

export async function getTrendSeriesForLocality(slug: string) {
  const supabase = db();
  const { data: city } = await supabase
    .from("City")
    .select("id")
    .eq("slug", "hyderabad")
    .limit(1)
    .maybeSingle()
    .throwOnError();
  if (!city) return [];

  const { data: locality } = await supabase
    .from("Locality")
    .select("id")
    .eq("cityId", city.id)
    .eq("slug", slug)
    .limit(1)
    .maybeSingle()
    .throwOnError();
  if (!locality) return [];

  const { data: snapshots } = await supabase
    .from("HistoricalRentSnapshot")
    .select("*")
    .eq("localityId", locality.id)
    .order("month", { ascending: true })
    .throwOnError();

  return ((snapshots || []) as Array<Record<string, unknown>>).map((s: Record<string, unknown>) => ({
    month: new Date(s.month as string).toISOString().slice(0, 7),
    medianRent: s.median as number,
    p25: s.p25 as number,
    p75: s.p75 as number,
    sampleSize: s.sampleSize as number,
    confidenceScore: Number(s.confidenceScore),
  }));
}

function mapSubmission(sub: Record<string, unknown>): DbSubmission {
  return {
    id: sub.id as string,
    localitySlug: (sub.localitySlug as string) || "",
    microLocality: (sub.microLocalityId as string) || null,
    buildingSlug: null,
    bhk: sub.bhk as string,
    carpetAreaSqft: sub.carpetAreaSqft as number | null,
    superBuiltUpAreaSqft: sub.superBuiltUpAreaSqft as number | null,
    furnishing: sub.furnishing as string,
    parkingCount: sub.parkingCount as number,
    maintenanceIncluded: sub.maintenanceIncluded as boolean,
    maintenanceAmount: sub.maintenanceAmount as number,
    securityDeposit: sub.securityDeposit as number,
    moveInDate: new Date(sub.moveInDate as string),
    leaseDurationMonths: sub.leaseDurationMonths as number | null,
    floorNumber: sub.floorNumber as number | null,
    facing: sub.facing as string | null,
    buildingAgeYears: sub.buildingAgeYears as number | null,
    gatedSociety: sub.gatedSociety as boolean,
    petFriendly: sub.petFriendly as boolean,
    occupancyType: sub.occupancyType as string,
    metroDistanceKm: sub.metroDistanceKm ? Number(sub.metroDistanceKm) : null,
    amenities: sub.amenitiesSnapshot,
    brokerInvolved: sub.brokerInvolved as boolean,
    rentAmount: sub.rentAmount as number,
    effectiveMonthlyCost: sub.effectiveMonthlyCost as number,
    proofObjectKey: sub.proofObjectKey as string | null,
    sourceType: sub.sourceType as string,
    rentType: sub.rentType as string,
    roommateCount: sub.roommateCount as number | null,
    trustScore: Number(sub.trustScore),
    confidenceLevel: sub.confidenceLevel as string,
    verificationState: sub.verificationState as string,
    anomalyScore: Number(sub.anomalyScore),
    freshnessScore: Number(sub.freshnessScore),
    communityAgreementScore: Number(sub.communityAgreementScore),
    submittedAt: new Date(sub.submittedAt as string),
    ipHash: (sub.deviceFingerprintId as string) || null,
  };
}
