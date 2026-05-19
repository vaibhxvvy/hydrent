import type { AggregatedRent, ConfidenceLevel, RentSubmission } from "@/lib/types";
import { clamp } from "@/lib/utils";

const DAY = 24 * 60 * 60 * 1000;

export function monthsSince(date: string, now = new Date()) {
  return Math.max(0, (now.getTime() - new Date(date).getTime()) / (30 * DAY));
}

export function timeDecayWeight(date: string, now = new Date()) {
  const months = monthsSince(date, now);

  if (months < 1) return 1;
  if (months < 3) return 0.82;
  if (months < 6) return 0.58;
  if (months < 12) return 0.35;
  return 0.18;
}

export function rentTypeWeight(type: RentSubmission["rentType"]) {
  if (type === "CLOSED") return 1;
  if (type === "RENEWED") return 0.82;
  return 0.38;
}

export function submissionWeight(submission: RentSubmission, now = new Date()) {
  const trust = clamp(submission.trustScore) / 100;
  const freshness = timeDecayWeight(submission.submittedAt, now);
  const typeWeight = rentTypeWeight(submission.rentType);
  const anomalyResistance = 1 - clamp(submission.anomalyScore) / 130;

  return Math.max(0.05, trust * freshness * typeWeight * anomalyResistance);
}

export function weightedPercentile(values: number[], weights: number[], percentile: number) {
  if (!values.length || values.length !== weights.length) return 0;

  const pairs = values
    .map((value, index) => ({ value, weight: Math.max(0, weights[index] ?? 0) }))
    .sort((a, b) => a.value - b.value);

  const totalWeight = pairs.reduce((sum, pair) => sum + pair.weight, 0);
  if (totalWeight <= 0) return pairs[Math.floor(pairs.length / 2)]?.value ?? 0;

  const threshold = totalWeight * percentile;
  let cumulative = 0;

  for (const pair of pairs) {
    cumulative += pair.weight;
    if (cumulative >= threshold) return pair.value;
  }

  return pairs[pairs.length - 1]?.value ?? 0;
}

export function weightedMedian(values: number[], weights: number[]) {
  return weightedPercentile(values, weights, 0.5);
}

export function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = mean(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

export function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
  }
  return sorted[middle] ?? 0;
}

export function medianAbsoluteDeviation(values: number[]) {
  const med = median(values);
  return median(values.map((value) => Math.abs(value - med)));
}

export function iqr(values: number[]) {
  if (!values.length) return { q1: 0, q3: 0, spread: 0 };
  const weights = values.map(() => 1);
  const q1 = weightedPercentile(values, weights, 0.25);
  const q3 = weightedPercentile(values, weights, 0.75);
  return { q1, q3, spread: q3 - q1 };
}

export function calculateConfidenceScore(submissions: RentSubmission[], weights: number[]) {
  if (!submissions.length) return 0;

  const sampleScore = clamp((Math.log10(submissions.length + 1) / Math.log10(60)) * 100);
  const verifiedRatio =
    submissions.filter((submission) => submission.verificationState === "VERIFIED").length /
    submissions.length;
  const averageFreshness = mean(submissions.map((submission) => submission.freshnessScore));
  const rents = submissions.map((submission) => submission.effectiveMonthlyCost);
  const spread = standardDeviation(rents) / Math.max(1, mean(rents));
  const varianceScore = clamp(100 - spread * 130);
  const weightHealth = clamp(mean(weights) * 100);

  return Math.round(
    sampleScore * 0.25 +
      verifiedRatio * 100 * 0.25 +
      averageFreshness * 0.2 +
      varianceScore * 0.2 +
      weightHealth * 0.1,
  );
}

export function confidenceLevel(score: number): ConfidenceLevel {
  if (score >= 85) return "VERY_HIGH";
  if (score >= 70) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

export function aggregateRent(
  submissions: RentSubmission[],
  options: { label: string; now?: Date } = { label: "All homes" },
): AggregatedRent {
  const relevant = submissions.filter((submission) => submission.verificationState !== "REJECTED");
  const weights = relevant.map((submission) => submissionWeight(submission, options.now));
  const rents = relevant.map((submission) => submission.effectiveMonthlyCost);
  const rentPerSqft = relevant.map((submission) => {
    const area = submission.superBuiltUpAreaSqft ?? submission.carpetAreaSqft ?? 1;
    return submission.effectiveMonthlyCost / area;
  });
  const confidenceScore = calculateConfidenceScore(relevant, weights);

  return {
    label: options.label,
    sampleSize: relevant.length,
    median: Math.round(weightedMedian(rents, weights)),
    p10: Math.round(weightedPercentile(rents, weights, 0.1)),
    p25: Math.round(weightedPercentile(rents, weights, 0.25)),
    p75: Math.round(weightedPercentile(rents, weights, 0.75)),
    p90: Math.round(weightedPercentile(rents, weights, 0.9)),
    confidenceScore,
    confidenceLevel: confidenceLevel(confidenceScore),
    verifiedRatio: relevant.length
      ? Math.round(
          (relevant.filter((submission) => submission.verificationState === "VERIFIED").length /
            relevant.length) *
            100,
        )
      : 0,
    freshness: Math.round(mean(relevant.map((submission) => submission.freshnessScore))),
    density: Math.min(100, Math.round(relevant.length * 7.5)),
    rentPerSqftMedian: Math.round(weightedMedian(rentPerSqft, weights)),
  };
}

export function detectStatisticalAnomaly(
  submission: Pick<RentSubmission, "effectiveMonthlyCost">,
  peerSubmissions: RentSubmission[],
) {
  const peers = peerSubmissions.map((peer) => peer.effectiveMonthlyCost);
  if (peers.length < 4) {
    return { score: 18, signals: ["low_sample_context"], zScore: 0, iqrOutlier: false, madOutlier: false };
  }

  const avg = mean(peers);
  const sd = standardDeviation(peers);
  const zScore = sd === 0 ? 0 : Math.abs((submission.effectiveMonthlyCost - avg) / sd);
  const quartiles = iqr(peers);
  const lowerFence = quartiles.q1 - 1.5 * quartiles.spread;
  const upperFence = quartiles.q3 + 1.5 * quartiles.spread;
  const iqrOutlier =
    submission.effectiveMonthlyCost < lowerFence || submission.effectiveMonthlyCost > upperFence;
  const mad = medianAbsoluteDeviation(peers);
  const robustZ =
    mad === 0 ? 0 : Math.abs((0.6745 * (submission.effectiveMonthlyCost - median(peers))) / mad);
  const madOutlier = robustZ > 3.5;
  const score = clamp(zScore * 18 + (iqrOutlier ? 28 : 0) + (madOutlier ? 34 : 0), 0, 100);
  const signals = [
    zScore > 2.4 ? "z_score_high" : null,
    iqrOutlier ? "outside_iqr_fence" : null,
    madOutlier ? "mad_outlier" : null,
  ].filter((signal): signal is string => Boolean(signal));

  return { score: Math.round(score), signals, zScore, iqrOutlier, madOutlier };
}
