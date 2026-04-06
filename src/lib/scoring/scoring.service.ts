import type { ScoreCard, ScoreCategoryResult, ScanResult } from "@/lib/types/domain";

import { scoreAiSearchReadiness } from "@/lib/scoring/ai-readiness-score";
import { scoreConversion } from "@/lib/scoring/conversion-score";
import { scoreDesign } from "@/lib/scoring/design-score";
import { scoreSeo } from "@/lib/scoring/seo-score";
import { clampScore, dedupe } from "@/lib/scoring/score-utils";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return clampScore(values.reduce((total, value) => total + value, 0) / values.length);
}

function topItems(categories: ScoreCategoryResult[], field: "issues" | "recommendedFixes") {
  return dedupe(categories.flatMap((category) => category[field])).slice(0, 5);
}

export function calculateScore(scanResult: ScanResult): ScoreCard {
  const design = scoreDesign(scanResult);
  const seo = scoreSeo(scanResult);
  const conversion = scoreConversion(scanResult);
  const aiSearchReadiness = scoreAiSearchReadiness(scanResult);

  const categories = [design, seo, conversion, aiSearchReadiness];

  return {
    design,
    seo,
    conversion,
    aiSearchReadiness,
    overallScore: average(categories.map((category) => category.score)),
    summary: {
      explanation:
        "Overall score blends design quality, SEO fundamentals, conversion readiness, and AI search readiness using the same extracted crawl data.",
      topIssues: topItems(categories, "issues"),
      recommendedFixes: topItems(categories, "recommendedFixes"),
    },
  };
}
