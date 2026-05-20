import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/db";
import { calculateTrustScore, calculateWeightedMedian } from "@/lib/analytics/trust-engine";
import { rateLimit } from "@/lib/rate-limit";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const supabase = getSupabaseServer();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { localitySlug, bhk, rentAmount, furnishing, leaseType, submitterType, proofUploaded, rentType } = body;

  if (!localitySlug || !bhk || !rentAmount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const limit = rateLimit(`rent-submission:${ip}`, { limit: 3, windowMs: DAY_MS });
  if (!limit.allowed) {
    return NextResponse.json({ status: "queued", verificationState: "PENDING_REVIEW", trustScore: 0, flagged: "rate_limited" }, { status: 202 });
  }

  const { data: city } = await supabase
    .from("City")
    .select("id")
    .eq("slug", "hyderabad")
    .limit(1)
    .maybeSingle();
  if (!city) {
    return NextResponse.json({ error: "City not found" }, { status: 500 });
  }

  const { data: locality } = await supabase
    .from("Locality")
    .select("id")
    .eq("cityId", city.id)
    .eq("slug", localitySlug)
    .limit(1)
    .maybeSingle();
  if (!locality) {
    return NextResponse.json({ error: "Locality not found" }, { status: 404 });
  }

  const { data: existingSubmissions } = await supabase
    .from("RentSubmission")
    .select("effectiveMonthlyCost, verificationState")
    .eq("localityId", locality.id)
    .neq("verificationState", "REJECTED");

  const localitySubmissionCount = (existingSubmissions || []).length;
  const costs = (existingSubmissions || []).map((s: Record<string, unknown>) => s.effectiveMonthlyCost as number);
  const localityMedian = costs.length > 0
    ? Math.round(costs.reduce((sum: number, v: number) => sum + v, 0) / costs.length)
    : null;

  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS).toISOString();
  const { data: duplicates } = await supabase
    .from("RentSubmission")
    .select("id")
    .eq("localityId", locality.id)
    .eq("bhk", bhk)
    .eq("rentAmount", parseInt(rentAmount))
    .gte("submittedAt", sevenDaysAgo)
    .limit(1);

  if (duplicates && duplicates.length > 0) {
    return NextResponse.json({ status: "queued", verificationState: "PENDING_REVIEW", trustScore: 0, flagged: "duplicate" }, { status: 202 });
  }

  const trustResult = calculateTrustScore(
    {
      rentType: (rentType || "CLOSED") as any,
      sourceType: (submitterType === "broker" ? "LISTING_ESTIMATE" : submitterType === "owner" ? "LEASE_RENEWAL" : "TENANT_SUBMITTED") as any,
      brokerInvolved: submitterType === "broker",
      proofUploaded: !!proofUploaded,
      submittedAt: new Date().toISOString(),
    },
    localityMedian,
    localitySubmissionCount,
  );

  let flagReason: string | null = null;
  let verificationState = "PENDING_REVIEW";

  if (localitySubmissionCount >= 5 && localityMedian) {
    const rent = parseInt(rentAmount);
    if (rent > 3 * localityMedian) {
      flagReason = "price_outlier_high";
      verificationState = "PENDING_REVIEW";
    } else if (rent < 0.3 * localityMedian) {
      flagReason = "price_outlier_low";
      verificationState = "PENDING_REVIEW";
    }
  }

  if (localitySubmissionCount < 5) {
    verificationState = "PENDING_REVIEW";
  }

  const { error: insertError } = await supabase
    .from("RentSubmission")
    .insert({
      localityId: locality.id,
      bhk,
      rentAmount: parseInt(rentAmount),
      effectiveMonthlyCost: parseInt(rentAmount),
      furnishing: (furnishing || "UNFURNISHED"),
      rentType: (rentType || "CLOSED"),
      sourceType: (submitterType === "broker" ? "LISTING_ESTIMATE" : submitterType === "owner" ? "LEASE_RENEWAL" : "TENANT_SUBMITTED"),
      brokerInvolved: submitterType === "broker",
      trustScore: trustResult.score,
      verificationState,
      anomalyScore: flagReason ? 80 : 20,
      freshnessScore: 100,
      communityAgreementScore: 50,
      maintenanceIncluded: false,
      maintenanceAmount: 0,
      securityDeposit: 0,
      moveInDate: new Date().toISOString(),
      gatedSociety: false,
      petFriendly: false,
      occupancyType: "ANY",
      parkingCount: 0,
      submittedAt: new Date().toISOString(),
    });

  if (insertError) {
    console.error("Insert error:", insertError);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  if (verificationState === "VERIFIED") {
    const { data: allVerified } = await supabase
      .from("RentSubmission")
      .select("effectiveMonthlyCost, trustScore")
      .eq("localityId", locality.id)
      .in("verificationState", ["VERIFIED", "COMMUNITY_REVIEW"]);

    if (allVerified && allVerified.length > 0) {
      const weighted = calculateWeightedMedian(
        (allVerified as Array<{ effectiveMonthlyCost: number; trustScore: number }>).map((s) => ({
          rentAmount: s.effectiveMonthlyCost,
          trustScore: Number(s.trustScore),
        })),
      );
    }
  }

  return NextResponse.json(
    {
      status: "queued",
      verificationState,
      trustScore: trustResult.score,
      flagged: flagReason,
      localityMedian,
      yourRent: parseInt(rentAmount),
    },
    { status: 202 },
  );
}
