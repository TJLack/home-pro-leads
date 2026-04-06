import { scoringConfig } from "@/lib/config/scoring.config";
import type { ScoreCard } from "@/lib/types/domain";

export function estimateRevenueOpportunity(overallScore: number): number {
  const lostRevenueScore = 100 - overallScore;
  const estimated =
    lostRevenueScore * scoringConfig.revenueOpportunity.scorePenaltyMultiplier;

  return Math.max(
    scoringConfig.revenueOpportunity.minimumMonthlyOpportunity,
    Math.round(estimated),
  );
}

export function buildRevenueRange(monthlyEstimate: number) {
  const low = Math.round(monthlyEstimate * 0.7);
  const high = Math.round(monthlyEstimate * 1.3);

  return {
    low,
    high,
    note: "Range estimate based on observed conversion gaps, not guaranteed revenue.",
  };
}

export function buildReportSummary(scorecard: ScoreCard) {
  const estimatedRevenueOpportunity = estimateRevenueOpportunity(scorecard.overallScore);

  return {
    overallScore: scorecard.overallScore,
    estimatedRevenueOpportunity,
    revenueRange: buildRevenueRange(estimatedRevenueOpportunity),
    topIssues: scorecard.summary.topIssues.slice(0, 3),
    recommendedFixes: scorecard.summary.recommendedFixes,
  };
}
