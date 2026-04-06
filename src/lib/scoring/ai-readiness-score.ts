import type { ScoreCategoryResult, ScanResult } from "@/lib/types/domain";

import { scoreFromSignals, share, type ScoringSignal } from "@/lib/scoring/score-utils";

export function scoreAiSearchReadiness(scan: ScanResult): ScoreCategoryResult {
  const pages = scan.pages;

  const withClearContent = pages.filter((page) => page.wordCount >= 220 && page.headings.h1.length > 0).length;
  const structuredServicePages = pages.filter((page) => page.enrichment.classification === "service").length;
  const structuredLocationPages = pages.filter((page) => page.enrichment.classification === "location").length;
  const withTrustSignals = pages.filter((page) => page.enrichment.trustSignals.found).length;
  const withFaqSignals = pages.filter((page) => page.enrichment.faqSignals.found).length;
  const withSchema = pages.filter((page) => page.enrichment.structuredData.found).length;
  const withTechnicalStructure = pages.filter(
    (page) => page.title.length > 0 && page.headings.h1.length > 0 && page.wordCount > 150,
  ).length;

  const signals: ScoringSignal[] = [
    {
      label: "content_clarity",
      passed: share(withClearContent, pages.length) >= 0.5,
      impact: 12,
      issue: "Content is not consistently clear or complete for answer engines.",
      fix: "Use direct, plain-language explanations of services, process, and outcomes.",
    },
    {
      label: "service_location_structure",
      passed: structuredServicePages + structuredLocationPages >= 1,
      impact: 10,
      issue: "Service/location structure is weak for AI retrieval contexts.",
      fix: "Publish clearly separated service and location pages with explicit headings.",
    },
    {
      label: "trust_authority",
      passed: withTrustSignals >= 1,
      impact: 10,
      issue: "Authority cues are limited.",
      fix: "Add certifications, years in business, and proof of legitimacy on major pages.",
    },
    {
      label: "faq_answers",
      passed: withFaqSignals >= 1,
      impact: 12,
      issue: "FAQ-style answer content is limited.",
      fix: "Add FAQ blocks with clear question/answer formatting.",
    },
    {
      label: "technical_structure",
      passed: share(withTechnicalStructure, pages.length) >= 0.6,
      impact: 12,
      issue: "Core technical page structure is inconsistent.",
      fix: "Ensure each key page has a unique title, clean headings, and crawlable body copy.",
    },
    {
      label: "schema_presence",
      passed: withSchema >= 1,
      impact: 10,
      issue: "Structured data is missing or very limited.",
      fix: "Add JSON-LD schema such as LocalBusiness, Service, and FAQPage where relevant.",
    },
  ];

  const scored = scoreFromSignals(signals, 30);

  return {
    score: scored.score,
    explanation:
      "AI Search Readiness measures how understandable and retrievable the site is for modern answer and discovery systems.",
    issues: scored.issues,
    recommendedFixes: scored.recommendedFixes,
  };
}
