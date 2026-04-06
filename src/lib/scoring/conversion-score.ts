import type { ScoreCategoryResult, ScanResult } from "@/lib/types/domain";

import { getPrimaryPage, scoreFromSignals, share, type ScoringSignal } from "@/lib/scoring/score-utils";

export function scoreConversion(scan: ScanResult): ScoreCategoryResult {
  const pages = scan.pages;
  const homepage = getPrimaryPage(scan);

  const withCta = pages.filter((page) => page.ctaPhrases.length > 0 || page.buttons.length > 0).length;
  const withPhone = pages.filter((page) => page.phoneLinks.length > 0).length;
  const withForms = pages.filter((page) => page.forms.length > 0).length;
  const quoteSignals = pages.filter((page) => page.enrichment.bookingSignals.found).length;
  const trustSignals = pages.filter((page) => page.enrichment.trustSignals.found).length;
  const reviewSignals = pages.filter((page) => page.enrichment.reviewSignals.found).length;
  const serviceAreaSignals = pages.filter((page) => page.enrichment.serviceAreaSignals.found).length;

  const signals: ScoringSignal[] = [
    {
      label: "cta_presence",
      passed: share(withCta, pages.length) >= 0.6,
      impact: 14,
      issue: "Calls-to-action are inconsistent, which lowers conversion momentum.",
      fix: "Add clear primary CTA actions on homepage and core service pages.",
    },
    {
      label: "cta_placement",
      passed: Boolean(homepage && (homepage.buttons.length > 0 || homepage.ctaPhrases.length > 0)),
      impact: 10,
      issue: "Homepage does not clearly present a primary action.",
      fix: "Place a visible primary CTA near the top of the homepage.",
    },
    {
      label: "click_to_call",
      passed: withPhone >= 1,
      impact: 12,
      issue: "Click-to-call visibility is weak.",
      fix: "Add tap-to-call links in header, hero, and contact areas.",
    },
    {
      label: "form_availability",
      passed: withForms >= 1,
      impact: 10,
      issue: "No clear conversion form was detected.",
      fix: "Add a simple quote/contact form on key pages.",
    },
    {
      label: "quote_path",
      passed: quoteSignals >= 1,
      impact: 10,
      issue: "Quote-request pathway is unclear.",
      fix: "Use consistent “Request Quote” language across prominent buttons and forms.",
    },
    {
      label: "trust_proof",
      passed: trustSignals >= 1,
      impact: 10,
      issue: "Trust proof is limited at decision points.",
      fix: "Surface licensing, insurance, and credentials near CTA sections.",
    },
    {
      label: "review_visibility",
      passed: reviewSignals >= 1,
      impact: 8,
      issue: "Reviews/testimonials are not visible enough.",
      fix: "Show customer reviews on homepage and service pages near CTAs.",
    },
    {
      label: "service_area_clarity",
      passed: serviceAreaSignals >= 1,
      impact: 8,
      issue: "Service area clarity is limited, which can add buyer friction.",
      fix: "Clearly list cities/areas served on homepage and contact/service pages.",
    },
  ];

  const scored = scoreFromSignals(signals, 28);

  return {
    score: scored.score,
    explanation:
      "Conversion score reflects how easy it is for visitors to take action through visible CTAs, calls, forms, trust, and local clarity.",
    issues: scored.issues,
    recommendedFixes: scored.recommendedFixes,
  };
}
