import type { ConfidenceLevel, RentSubmission } from "@/lib/types";
import { clamp } from "@/lib/utils";

export type TrustInput = Pick<
  RentSubmission,
  | "otpVerified"
  | "accountAgeDays"
  | "submissionConsistency"
  | "proofUploaded"
  | "communityAgreementScore"
  | "historicalReliability"
  | "anomalyScore"
  | "rentType"
>;

export function calculateFreshnessScore(submittedAt: string, now = new Date()) {
  const ageDays = Math.max(0, (now.getTime() - new Date(submittedAt).getTime()) / 86_400_000);
  if (ageDays <= 30) return 100;
  if (ageDays <= 90) return Math.round(82 - ((ageDays - 30) / 60) * 18);
  if (ageDays <= 180) return Math.round(58 - ((ageDays - 90) / 90) * 20);
  if (ageDays <= 365) return Math.round(34 - ((ageDays - 180) / 185) * 16);
  return 12;
}

export function calculateTrustScore(input: TrustInput) {
  const otp = input.otpVerified ? 100 : 35;
  const accountAge = clamp((Math.log10(input.accountAgeDays + 1) / Math.log10(730)) * 100);
  const proof = input.proofUploaded ? 100 : input.rentType === "ASKING" ? 25 : 58;
  const rentType = input.rentType === "CLOSED" ? 100 : input.rentType === "RENEWED" ? 84 : 42;
  const anomalyResistance = 100 - clamp(input.anomalyScore);

  return Math.round(
    otp * 0.14 +
      accountAge * 0.12 +
      input.submissionConsistency * 0.17 +
      proof * 0.14 +
      input.communityAgreementScore * 0.16 +
      input.historicalReliability * 0.17 +
      anomalyResistance * 0.06 +
      rentType * 0.04,
  );
}

export function confidenceFromTrust(score: number): ConfidenceLevel {
  if (score >= 88) return "VERY_HIGH";
  if (score >= 74) return "HIGH";
  if (score >= 56) return "MEDIUM";
  return "LOW";
}

export function explainTrust(submission: RentSubmission) {
  return [
    submission.otpVerified ? "OTP verified account" : "Account identity not yet OTP verified",
    submission.proofUploaded ? "Private proof uploaded" : "No private proof attached",
    `${submission.communityAgreementScore}% community agreement with nearby rents`,
    `${submission.anomalyScore}% anomaly pressure after statistical checks`,
    submission.rentType === "CLOSED"
      ? "Closed rent receives highest evidentiary weight"
      : submission.rentType === "RENEWED"
        ? "Renewal rent receives medium-high evidentiary weight"
        : "Asking rent is discounted until validated",
  ];
}

export function publicationDelayHours(submission: RentSubmission) {
  if (submission.trustScore >= 80 && submission.anomalyScore < 25) return 0;
  if (submission.trustScore >= 60 && submission.anomalyScore < 45) return 12;
  if (submission.anomalyScore >= 75) return 72;
  return 24;
}
