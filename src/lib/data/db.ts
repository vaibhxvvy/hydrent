import { getSupabaseServer } from "@/lib/db";
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

function db() {
  return getSupabaseServer();
}

type SupabaseRow<T = Record<string, unknown>> = T;
type CityRow = { id: string; name: string; slug: string };
type ZoneRow = { id: string; name: string; slug: string; cityId: string };
type LocalityRow = {
  id: string; cityId: string; zoneId: string | null; name: string; slug: string;
  summary: string | null; lat: number; lng: number; aliases: string[];
  commuteAnchors: string[]; medianIncomeAssumed: number | null;
};
type SubmissionRow = {
  id: string; localityId: string; bhk: string;
  furnishing: string; rentAmount: number; effectiveMonthlyCost: number;
  securityDeposit: number; moveInDate: string; maintenanceIncluded: boolean;
  maintenanceAmount: number; parkingCount: number; leaseDurationMonths: number | null;
  floorNumber: number | null; facing: string | null; buildingAgeYears: number | null;
  gatedSociety: boolean; petFriendly: boolean; occupancyType: string;
  metroDistanceKm: number | null; amenitiesSnapshot: unknown;
  brokerInvolved: boolean; rentType: string; sourceType: string;
  roommateCount: number | null; proofObjectKey: string | null;
  trustScore: number; freshnessScore: number; anomalyScore: number;
  communityAgreementScore: number; verificationState: string;
  submittedAt: string; buildingId: string | null;
  microLocalityId: string | null; userId: string | null;
};

export async function getAllLocalitiesWithStats(): Promise<LocalityWithStats[]> {
  const supabase = db();
  const { data: city } = await supabase
    .from("City")
    .select("id, name, slug")
    .eq("slug", "hyderabad")
    .limit(1)
    .maybeSingle()
    .throwOnError();
  if (!city) return [];

  const { data: zones } = await supabase
    .from("Zone")
    .select("id, name, slug")
    .throwOnError();
  const zoneMap = new Map((zones || []).map((z: ZoneRow) => [z.id, z.name]));

  const { data: localities } = await supabase
    .from("Locality")
    .select("*")
    .eq("cityId", city.id)
    .order("name", { ascending: true })
    .throwOnError();

  const { data: allSubmissions } = await supabase
    .from("RentSubmission")
    .select("*")
    .in("verificationState", ["VERIFIED", "COMMUNITY_REVIEW"])
    .throwOnError();

  const submissionsByLocality = new Map<string, SubmissionRow[]>();
  for (const sub of (allSubmissions || []) as SubmissionRow[]) {
    const locId = sub.localityId;
    if (!submissionsByLocality.has(locId)) {
      submissionsByLocality.set(locId, []);
    }
    submissionsByLocality.get(locId)!.push(sub);
  }

  return ((localities || []) as LocalityRow[]).map((l) => {
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
      zone: (l.zoneId ? (zoneMap.get(l.zoneId) || "Hyderabad") : "Hyderabad") as string,
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
  const supabase = db();
  const { data: city } = await supabase
    .from("City")
    .select("id, name, slug")
    .eq("slug", "hyderabad")
    .limit(1)
    .maybeSingle()
    .throwOnError();
  if (!city) return null;

  const { data: locality } = await supabase
    .from("Locality")
    .select("*, zone:Zone(id, name, slug)")
    .eq("cityId", city.id)
    .eq("slug", slug)
    .limit(1)
    .maybeSingle()
    .throwOnError();

  if (!locality) return null;
  const l = locality as LocalityRow & { zone: ZoneRow | null };
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
  };
}

export async function getAllBuildings(): Promise<Building[]> {
  const supabase = db();
  const { data: buildings } = await supabase
    .from("Building")
    .select("*, locality:Locality(slug, name, city:City(name))")
    .order("name", { ascending: true })
    .throwOnError();

  return ((buildings || []) as Array<Record<string, unknown>>).map((b: Record<string, unknown>) => {
    const loc = b.locality as Record<string, unknown> | null;
    const city = loc?.city as Record<string, unknown> | null;
    return {
      id: b.id as string,
      name: b.name as string,
      slug: b.slug as string,
      localitySlug: (loc?.slug as string) || "",
      microLocality: "",
      coordinates: { lat: Number(b.lat ?? 0), lng: Number(b.lng ?? 0) },
      aliases: [] as string[],
      amenities: [] as Amenity[],
      ageYears: (b.ageYears as number) ?? 0,
      gated: b.gated as boolean,
      ...(b.totalUnits != null ? { totalUnits: b.totalUnits as number } : {}),
    };
  });
}

export async function getBuildingBySlug(slug: string): Promise<Building | null> {
  const supabase = db();
  const { data: building } = await supabase
    .from("Building")
    .select("*, locality:Locality(slug, name, city:City(name))")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle()
    .throwOnError();

  if (!building) return null;
  const b = building as Record<string, unknown>;
  const loc = b.locality as Record<string, unknown> | null;
  return {
    id: b.id as string,
    name: b.name as string,
    slug: b.slug as string,
    localitySlug: (loc?.slug as string) || "",
    microLocality: "",
    coordinates: { lat: Number(b.lat ?? 0), lng: Number(b.lng ?? 0) },
    aliases: [] as string[],
    amenities: [] as Amenity[],
    ageYears: (b.ageYears as number) ?? 0,
    gated: b.gated as boolean,
    ...(b.totalUnits != null ? { totalUnits: b.totalUnits as number } : {}),
  };
}

export async function getSubmissionsForLocality(slug: string): Promise<RentSubmission[]> {
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

  return ((submissions || []) as SubmissionRow[]).map(mapSubmission);
}

export async function getSubmissionsForBuilding(slug: string): Promise<RentSubmission[]> {
  const supabase = db();
  const { data: building } = await supabase
    .from("Building")
    .select("id")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle()
    .throwOnError();
  if (!building) return [];

  const { data: submissions } = await supabase
    .from("RentSubmission")
    .select("*")
    .eq("buildingId", building.id)
    .neq("verificationState", "REJECTED")
    .order("submittedAt", { ascending: false })
    .throwOnError();

  return ((submissions || []) as SubmissionRow[]).map(mapSubmission);
}

export async function getAllSubmissions(): Promise<RentSubmission[]> {
  const supabase = db();
  const { data: submissions } = await supabase
    .from("RentSubmission")
    .select("*")
    .neq("verificationState", "REJECTED")
    .order("submittedAt", { ascending: false })
    .throwOnError();

  return ((submissions || []) as SubmissionRow[]).map(mapSubmission);
}

export async function getLocalityStats(slug: string): Promise<DbLocalityStats> {
  const supabase = db();
  const { data: city } = await supabase
    .from("City")
    .select("id")
    .eq("slug", "hyderabad")
    .limit(1)
    .maybeSingle()
    .throwOnError();
  if (!city) return emptyStats();

  const { data: locality } = await supabase
    .from("Locality")
    .select("id")
    .eq("cityId", city.id)
    .eq("slug", slug)
    .limit(1)
    .maybeSingle()
    .throwOnError();
  if (!locality) return emptyStats();

  const { data: submissions } = await supabase
    .from("RentSubmission")
    .select("*")
    .eq("localityId", locality.id)
    .in("verificationState", ["VERIFIED", "COMMUNITY_REVIEW"])
    .throwOnError();

  const rows = (submissions || []) as SubmissionRow[];
  if (rows.length === 0) return emptyStats();

  const rents = rows.map((s) => s.effectiveMonthlyCost);
  const weights = rows.map((s) => {
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
    Math.max(...rows.map((s) => new Date(s.submittedAt).getTime())),
  );

  const verifiedCount = rows.filter((s) => s.verificationState === "VERIFIED").length;
  const confidenceScore = Math.round(
    Math.min(100, (Math.log10(rows.length + 1) / Math.log10(60)) * 100 * 0.4 +
      (verifiedCount / rows.length) * 100 * 0.6),
  );

  return {
    weightedMedian: Math.round(weightedPercentile(0.5)),
    p25: Math.round(weightedPercentile(0.25)),
    p75: Math.round(weightedPercentile(0.75)),
    submissionCount: rows.length,
    confidenceScore,
    lastUpdated: lastSubmitted,
  };
}

export async function getCityStats() {
  const supabase = db();
  const { data: city } = await supabase
    .from("City")
    .select("id")
    .eq("slug", "hyderabad")
    .limit(1)
    .maybeSingle()
    .throwOnError();
  if (!city) return { totalSubmissions: 0, localitiesWithData: 0, closedRentPercentage: 0, lastUpdated: new Date() };

  const { data: localities } = await supabase
    .from("Locality")
    .select("id")
    .eq("cityId", city.id)
    .throwOnError();

  const { data: submissions } = await supabase
    .from("RentSubmission")
    .select("localityId, rentType, submittedAt")
    .neq("verificationState", "REJECTED")
    .throwOnError();

  const rows = (submissions || []) as Pick<SubmissionRow, "localityId" | "rentType" | "submittedAt">[];
  const localitiesWithData = new Set(rows.map((s) => s.localityId)).size;
  const closed = rows.filter((s) => s.rentType === "CLOSED").length;
  const lastUpdated = rows.length > 0
    ? new Date(Math.max(...rows.map((s) => new Date(s.submittedAt).getTime())))
    : new Date();

  return {
    totalSubmissions: rows.length,
    localitiesWithData,
    closedRentPercentage: rows.length > 0 ? Math.round((closed / rows.length) * 100) : 0,
    lastUpdated,
  };
}

export async function getTrendSeriesForLocality(slug: string): Promise<TrendPoint[]> {
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

  return ((snapshots || []) as Array<{ month: string; median: number; p25: number; p75: number; sampleSize: number; confidenceScore: number }>).map((s) => ({
    month: new Date(s.month).toISOString().slice(0, 7),
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

function mapSubmission(sub: SubmissionRow): RentSubmission {
  const base = {
    id: sub.id,
    localitySlug: "",
    microLocality: "",
    bhk: sub.bhk as RentSubmission["bhk"],
    carpetAreaSqft: undefined as number | undefined,
    superBuiltUpAreaSqft: undefined as number | undefined,
    furnishing: sub.furnishing as FurnishingType,
    parkingCount: sub.parkingCount,
    maintenanceIncluded: sub.maintenanceIncluded,
    maintenanceAmount: sub.maintenanceAmount,
    securityDeposit: sub.securityDeposit,
    moveInDate: new Date(sub.moveInDate).toISOString().slice(0, 10),
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
    submittedAt: sub.submittedAt,
  };

  return {
    ...base,
    ...(sub.buildingId ? { buildingSlug: sub.buildingId } : {}),
  } as RentSubmission;
}
