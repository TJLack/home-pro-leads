import type { ScanResult } from "@/lib/types/domain";

export type ScoringSignal = {
  label: string;
  passed: boolean;
  impact: number;
  issue: string;
  fix: string;
};

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreFromSignals(signals: ScoringSignal[], base = 20): {
  score: number;
  issues: string[];
  recommendedFixes: string[];
} {
  let score = base;

  for (const signal of signals) {
    score += signal.passed ? signal.impact : -signal.impact;
  }

  const failed = signals.filter((signal) => !signal.passed);

  return {
    score: clampScore(score),
    issues: dedupe(failed.map((item) => item.issue)).slice(0, 5),
    recommendedFixes: dedupe(failed.map((item) => item.fix)).slice(0, 5),
  };
}

export function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function getPrimaryPage(scan: ScanResult) {
  return scan.pages.find((page) => page.enrichment.classification === "homepage") ?? scan.pages[0];
}

export function share(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return part / whole;
}
