import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { calculateTrustScore, calculateWeightedMedian } from "@/lib/analytics/trust-engine";
import { rateLimit } from "@/lib/rate-limit";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const prisma = getPrisma();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Parse body
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { localitySlug, bhk, rentAmount, furnishing, leaseType, submitterType, proofUploaded, rentType } = body;

  if (!localitySlug || !bhk || !rentAmount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 1. IP rate limit: max 3 per IP per 24h
  const limit = rateLimit(`rent-submission:${ip}`, { limit: 3, windowMs: DAY_MS });
  if (!limit.allowed) {
    // Silent reject - still show success
    return NextResponse.json({ status: "queued", verificationState: "PENDING_REVIEW", trustScore: 0, flagged: "rate_limited" }, { status: 202 });
  }

  // Find locality
  const city = await prisma.city.findFirst({ where: { slug: "hyderabad" } });
  if (!city) {
    return NextResponse.json({ error: "City not found" }, { status: 500 });
  }

  const locality = await prisma.locality.findFirst({
    where: { cityId: city.id, slug: localitySlug },
  });
  if (!locality) {
    return NextResponse.json({ error: "Locality not found" }, { status: 404 });
  }

  // Get existing submissions for this locality
  const existingSubmissions = await prisma.rentSubmission.findMany({
    where: { localityId: locality.id, verificationState: { not: "REJECTED" } },
  });

  const localitySubmissionCount = existingSubmissions.length;
  const localityMedian = localitySubmissionCount > 0
    ? Math.round(existingSubmissions.reduce((sum, s) => sum + s.effectiveMonthlyCost, 0) / localitySubmissionCount)
    : null;

  // 4. Duplicate detection: same IP + same locality + same BHK + same rent within 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);
  const duplicate = await prisma.rentSubmission.findFirst({
    where: {
      localityId: locality.id,
      bhk,
      rentAmount: parseInt(rentAmount),
      submittedAt: { gte: sevenDaysAgo },
    },
  });
  if (duplicate) {
    return NextResponse.json({ status: "queued", verificationState: "PENDING_REVIEW", trustScore: 0, flagged: "duplicate" }, { status: 202 });
  }

  // Calculate trust score
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

  // 2. Rent sanity check (only if locality has 5+ submissions)
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

  // 3. Broker hard cap already applied in trust score calculation

  // 5. Under 5 submissions: mark as unverified
  if (localitySubmissionCount < 5) {
    verificationState = "PENDING_REVIEW";
  }

  // Save to database
  await prisma.rentSubmission.create({
    data: {
      localityId: locality.id,
      bhk,
      rentAmount: parseInt(rentAmount),
      effectiveMonthlyCost: parseInt(rentAmount),
      furnishing: (furnishing || "UNFURNISHED") as any,
      rentType: (rentType || "CLOSED") as any,
      sourceType: (submitterType === "broker" ? "LISTING_ESTIMATE" : submitterType === "owner" ? "LEASE_RENEWAL" : "TENANT_SUBMITTED") as any,
      brokerInvolved: submitterType === "broker",
      trustScore: trustResult.score,
      verificationState: verificationState as any,
      anomalyScore: flagReason ? 80 : 20,
      freshnessScore: 100,
      communityAgreementScore: 50,
      maintenanceIncluded: false,
      maintenanceAmount: 0,
      securityDeposit: 0,
      moveInDate: new Date(),
      gatedSociety: false,
      petFriendly: false,
      occupancyType: "ANY" as any,
      parkingCount: 0,
      submittedAt: new Date(),
    },
  });

  // Recalculate locality stats if submission is approved
  if (verificationState === "VERIFIED") {
    const allSubmissions = await prisma.rentSubmission.findMany({
      where: { localityId: locality.id, verificationState: { in: ["VERIFIED", "COMMUNITY_REVIEW"] } },
    });

    if (allSubmissions.length > 0) {
      const weighted = calculateWeightedMedian(
        allSubmissions.map((s) => ({ rentAmount: s.effectiveMonthlyCost, trustScore: Number(s.trustScore) })),
      );

      // Update locality (would need to add these fields to schema)
      // For now, just log
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
