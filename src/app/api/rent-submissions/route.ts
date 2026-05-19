import { NextResponse } from "next/server";
import { calculateTrustScore } from "@/lib/analytics/trust";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { rentSubmissionSchema } from "@/lib/validations/rent-submission";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const limit = rateLimit(`rent-submission:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", resetAt: limit.resetAt },
      { status: 429 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = rentSubmissionSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const payload = parsed.data;
  const trustScore = calculateTrustScore({
    otpVerified: false,
    accountAgeDays: 0,
    submissionConsistency: 50,
    proofUploaded: false,
    communityAgreementScore: 50,
    historicalReliability: 40,
    anomalyScore: payload.rentType === "ASKING" ? 45 : 22,
    rentType: payload.rentType,
  });

  logger.info("api_rent_submission_accepted", {
    localitySlug: payload.localitySlug,
    trustScore,
  });

  return NextResponse.json(
    {
      status: "queued",
      verificationState: "PENDING_REVIEW",
      trustScore,
      publication: trustScore >= 70 ? "eligible_after_review" : "delayed_for_validation",
    },
    { status: 202 },
  );
}
