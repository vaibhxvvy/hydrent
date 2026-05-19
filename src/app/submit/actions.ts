"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calculateTrustScore } from "@/lib/analytics/trust";
import { logger } from "@/lib/logger";
import { rentSubmissionSchema } from "@/lib/validations/rent-submission";

export async function submitRentAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = rentSubmissionSchema.safeParse(raw);

  if (!parsed.success) {
    logger.warn("rent_submission_validation_failed", {
      issues: parsed.error.issues.length,
    });
    redirect("/submit?status=invalid");
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

  logger.info("rent_submission_received", {
    localitySlug: payload.localitySlug,
    rentType: payload.rentType,
    trustScore,
  });

  revalidatePath("/");
  redirect("/submit?status=queued");
}
