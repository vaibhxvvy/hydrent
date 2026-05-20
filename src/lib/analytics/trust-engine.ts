import type { RentSubmission } from "@/lib/types";
import { clamp } from "@/lib/utils";

export interface TrustScoreResult {
  score: number;
  breakdown: {
    leaseType: number;
    proof: number;
    submitterType: number;
    nearbyConsensus: number;
    recency: number;
  };
}

export function calculateTrustScore(
  submission: Pick<RentSubmission, "rentType" | "sourceType" | "brokerInvolved"> & {
    proofUploaded?: boolean;
    submittedAt?: string;
  },
  localityMedian: number | null,
  localitySubmissionCount: number,
): TrustScoreResult {
  let score = 0;
  const breakdown = {
    leaseType: 0,
    proof: 0,
    submitterType: 0,
    nearbyConsensus: 0,
    recency: 0,
  };

  // Lease type scoring
  if (submission.rentType === "CLOSED") breakdown.leaseType = 40;
  else if (submission.rentType === "RENEWED") breakdown.leaseType = 30;
  else breakdown.leaseType = 20;
  score += breakdown.leaseType;

  // Proof attached
  if (submission.proofUploaded) {
    breakdown.proof = 20;
    score += breakdown.proof;
  }

  // Submitter type
  if (submission.sourceType === "TENANT_SUBMITTED") {
    breakdown.submitterType = 15;
  } else if (submission.sourceType === "LEASE_RENEWAL") {
    breakdown.submitterType = 10;
  } else {
    breakdown.submitterType = 0;
  }

  // Broker hard cap: max 30 total
  if (submission.brokerInvolved || submission.sourceType === "LISTING_ESTIMATE") {
    breakdown.submitterType = 0;
    // Will cap at end
  } else {
    score += breakdown.submitterType;
  }

  // Nearby consensus (within 15% of locality median)
  if (localityMedian && localitySubmissionCount >= 5 && submission.rentType) {
    const rentAmount = 0; // Would need actual rent amount here
    const diff = Math.abs(rentAmount - localityMedian) / localityMedian;
    if (diff <= 0.15) {
      breakdown.nearbyConsensus = 15;
      score += breakdown.nearbyConsensus;
    }
  }

  // Recency scoring
  if (submission.submittedAt) {
    const now = new Date();
    const submitted = new Date(submission.submittedAt);
    const daysAgo = Math.max(0, Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24)));

    if (daysAgo === 0) breakdown.recency = 10;
    else if (daysAgo <= 30) breakdown.recency = 5;
    else if (daysAgo <= 90) breakdown.recency = 0;
    else {
      const extraMonths = Math.floor((daysAgo - 90) / 30);
      breakdown.recency = Math.max(0, -2 * extraMonths);
    }
    score += breakdown.recency;
  }

  // Broker hard cap
  if (submission.brokerInvolved || submission.sourceType === "LISTING_ESTIMATE") {
    score = Math.min(score, 30);
  }

  // Clamp
  score = clamp(score, 0, 100);

  return { score, breakdown };
}

export function calculateWeightedMedian(
  submissions: { rentAmount: number; trustScore: number }[],
): { median: number; p25: number; p75: number } {
  if (submissions.length === 0) return { median: 0, p25: 0, p75: 0 };

  const weighted = submissions
    .map((s) => ({
      value: s.rentAmount,
      weight: Math.max(0.05, clamp(s.trustScore) / 100),
    }))
    .sort((a, b) => a.value - b.value);

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);

  function percentile(pct: number) {
    if (totalWeight === 0) return 0;
    const threshold = totalWeight * pct;
    let cumulative = 0;
    for (const w of weighted) {
      cumulative += w.weight;
      if (cumulative >= threshold) return w.value;
    }
    return weighted[weighted.length - 1]?.value ?? 0;
  }

  return {
    median: Math.round(percentile(0.5)),
    p25: Math.round(percentile(0.25)),
    p75: Math.round(percentile(0.75)),
  };
}
