import type { ScoreCategoryResult, ScanResult } from "@/lib/types/domain";

import { scoreFromSignals, share, type ScoringSignal } from "@/lib/scoring/score-utils";

export function scoreSeo(scan: ScanResult): ScoreCategoryResult {
  const pages = scan.pages;
  const withTitle = pages.filter((page) => page.title.length > 0).length;
  const withMeta = pages.filter((page) => page.metaDescription.length > 0).length;
  const withHeadingHierarchy = pages.filter((page) => page.headings.h1.length > 0 && page.headings.h2.length > 0).length;
  const contentRich = pages.filter((page) => page.wordCount >= 300).length;
  const internalLinkRich = pages.filter((page) => page.internalLinks.length >= 2).length;
  const serviceStructured = pages.filter((page) => page.enrichment.classification === "service").length;
  const locationStructured = pages.filter((page) => page.enrichment.classification === "location").length;
  const withServiceKeywords = pages.filter((page) => page.enrichment.serviceKeywords.length > 0).length;
  const withLocationKeywords = pages.filter((page) => page.enrichment.locationKeywords.length > 0).length;

  const signals: ScoringSignal[] = [
    {
      label: "title_presence",
      passed: withTitle === pages.length,
      impact: 12,
      issue: "Some pages are missing title tags.",
      fix: "Add unique, keyword-specific title tags to every important page.",
    },
    {
      label: "meta_presence",
      passed: share(withMeta, pages.length) >= 0.75,
      impact: 10,
      issue: "Meta descriptions are missing on several pages.",
      fix: "Write concise meta descriptions that include service and location intent.",
    },
    {
      label: "heading_structure",
      passed: share(withHeadingHierarchy, pages.length) >= 0.6,
      impact: 12,
      issue: "Heading hierarchy is weak on multiple pages.",
      fix: "Use one H1 and logical H2 sections to improve crawlability and topical clarity.",
    },
    {
      label: "service_keywords",
      passed: share(withServiceKeywords, pages.length) >= 0.5,
      impact: 10,
      issue: "Service intent is not clear enough across pages.",
      fix: "Strengthen service-specific phrasing in titles, headings, and body copy.",
    },
    {
      label: "location_relevance",
      passed: share(withLocationKeywords, pages.length) >= 0.4,
      impact: 10,
      issue: "Local relevance signals are limited.",
      fix: "Add city/area references naturally in headings, service areas, and page copy.",
    },
    {
      label: "content_depth",
      passed: share(contentRich, pages.length) >= 0.5,
      impact: 10,
      issue: "Content depth is thin on too many pages.",
      fix: "Expand core pages with FAQs, process details, and proof points.",
    },
    {
      label: "internal_linking",
      passed: share(internalLinkRich, pages.length) >= 0.5,
      impact: 8,
      issue: "Internal link structure is too shallow.",
      fix: "Link related services, locations, and conversion pages together.",
    },
    {
      label: "service_location_structure",
      passed: serviceStructured + locationStructured >= 1,
      impact: 8,
      issue: "Service/location page architecture is unclear.",
      fix: "Create dedicated service and location pages with focused local intent.",
    },
  ];

  const scored = scoreFromSignals(signals, 30);

  return {
    score: scored.score,
    explanation:
      "SEO score measures technical on-page basics, service/location relevance, content depth, and internal linking quality.",
    issues: scored.issues,
    recommendedFixes: scored.recommendedFixes,
  };
}
