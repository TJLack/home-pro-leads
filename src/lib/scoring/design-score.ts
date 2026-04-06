import type { ScoreCategoryResult, ScanResult } from "@/lib/types/domain";

import { getPrimaryPage, scoreFromSignals, share, type ScoringSignal } from "@/lib/scoring/score-utils";

export function scoreDesign(scan: ScanResult): ScoreCategoryResult {
  const pages = scan.pages;
  const homepage = getPrimaryPage(scan);
  const pagesWithStructure = pages.filter((page) => page.headings.h1.length > 0 && page.headings.h2.length > 0).length;
  const pagesWithCtas = pages.filter((page) => page.ctaPhrases.length > 0 || page.buttons.length > 0).length;
  const thinPages = pages.filter((page) => page.wordCount < 180).length;
  const clutteredPages = pages.filter((page) => page.buttons.length > 14).length;
  const trustVisiblePages = pages.filter((page) => page.enrichment.trustSignals.found).length;

  const signals: ScoringSignal[] = [
    {
      label: "layout_structure",
      passed: share(pagesWithStructure, pages.length) >= 0.6,
      impact: 14,
      issue: "Several pages lack clear section structure with H1 and H2 headings.",
      fix: "Use one H1 and clear H2 sections on core pages to improve visual scannability.",
    },
    {
      label: "readability",
      passed: thinPages <= Math.max(1, Math.floor(pages.length * 0.35)),
      impact: 12,
      issue: "Too many pages are thin, which can feel low-confidence to visitors.",
      fix: "Expand thin pages with clearer service details, process steps, and customer-friendly copy.",
    },
    {
      label: "section_clarity",
      passed: pagesWithStructure >= 2,
      impact: 10,
      issue: "Section clarity is inconsistent across crawled pages.",
      fix: "Standardize page templates with clear intro, service details, proof, and CTA sections.",
    },
    {
      label: "mobile_indicator",
      passed: scan.screenshot.status === "captured",
      impact: 8,
      issue: "Mobile preview could not be captured, reducing confidence in mobile presentation.",
      fix: "Ensure homepage loads reliably and can be rendered in a mobile viewport.",
    },
    {
      label: "cta_visibility",
      passed: share(pagesWithCtas, pages.length) >= 0.6,
      impact: 12,
      issue: "Calls-to-action are not consistently visible across pages.",
      fix: "Add high-contrast CTA buttons near the top and bottom of key pages.",
    },
    {
      label: "trust_visibility",
      passed: trustVisiblePages >= 1 || Boolean(homepage?.enrichment.trustSignals.found),
      impact: 10,
      issue: "Trust-building content is hard to find.",
      fix: "Highlight licensing, insurance, certifications, and years in business above the fold.",
    },
    {
      label: "clutter_control",
      passed: clutteredPages === 0,
      impact: 8,
      issue: "Some pages appear cluttered with too many competing buttons.",
      fix: "Reduce competing button options and prioritize one primary action per section.",
    },
  ];

  const scored = scoreFromSignals(signals, 28);

  return {
    score: scored.score,
    explanation:
      "Design score reflects structure, readability, CTA clarity, trust visibility, and mobile presentation signals from crawled pages.",
    issues: scored.issues,
    recommendedFixes: scored.recommendedFixes,
  };
}
