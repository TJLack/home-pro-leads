import { load, type CheerioAPI } from "cheerio";

import type {
  CtaPhrase,
  PageClassification,
  PageEnrichment,
  PageScanResult,
} from "@/lib/types/domain";

const CTA_PATTERNS = [
  "call now",
  "book now",
  "schedule",
  "get quote",
  "request estimate",
  "contact us",
  "free consultation",
  "learn more",
  "start now",
];

const TRUST_PATTERNS = [
  "licensed",
  "insured",
  "bonded",
  "years in business",
  "family owned",
  "locally owned",
  "certified",
  "accredited",
];

const SERVICE_KEYWORDS = [
  "hvac",
  "plumbing",
  "electrical",
  "roofing",
  "remodeling",
  "landscaping",
  "painting",
  "flooring",
  "installation",
  "repair",
  "maintenance",
  "drain cleaning",
  "water heater",
  "ac repair",
  "heating",
];

const LOCATION_KEYWORDS = [
  "texas",
  "tx",
  "abilene",
  "dallas",
  "fort worth",
  "austin",
  "houston",
  "san antonio",
  "odessa",
  "midland",
  "lubbock",
  "neighborhood",
  "county",
  "city",
];

const CHAT_PROVIDERS = [
  "intercom",
  "drift",
  "zendesk",
  "livechat",
  "tawk",
  "crisp",
  "hubspot",
  "chatwoot",
];

const BOOKING_PATTERNS = [
  "book now",
  "schedule service",
  "request quote",
  "free estimate",
  "get estimate",
  "get quote",
  "book online",
  "schedule appointment",
];

const SERVICE_AREA_PATTERNS = [
  "service area",
  "areas we serve",
  "proudly serving",
  "serving",
  "near you",
];

const CLASSIFICATION_RULES: { label: PageClassification; patterns: RegExp[] }[] = [
  { label: "faq", patterns: [/\/faq/i, /frequently asked/i] },
  { label: "contact", patterns: [/\/contact/i, /contact us/i] },
  { label: "about", patterns: [/\/about/i, /about us/i, /our story/i] },
  {
    label: "review_or_testimonial",
    patterns: [/\/reviews?/i, /\/testimonials?/i, /testimonial/i, /customer reviews?/i],
  },
  {
    label: "gallery_or_project",
    patterns: [/\/gallery/i, /\/projects?/i, /before\s*and\s*after/i, /portfolio/i],
  },
  {
    label: "location",
    patterns: [/\/locations?/i, /areas we serve/i, /service area/i],
  },
  {
    label: "service",
    patterns: [/\/services?/i, /our services/i, /installation/i, /repair/i],
  },
];

function normalizeText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function findCtas(textBlocks: string[]): CtaPhrase[] {
  const corpus = textBlocks.join(" ").toLowerCase();

  return CTA_PATTERNS.map((phrase) => ({
    phrase,
    matches: corpus.split(phrase).length - 1,
  })).filter((result) => result.matches > 0);
}

function getKeywordHits(text: string, dictionary: string[]): string[] {
  const corpus = text.toLowerCase();
  return dictionary.filter((word) => corpus.includes(word));
}

function extractStructuredDataTypes($: CheerioAPI): { types: string[]; rawJsonLdCount: number } {
  const scripts = $("script[type='application/ld+json']")
    .map((_, el) => normalizeText($(el).html() ?? ""))
    .get()
    .filter(Boolean);

  const typeSet = new Set<string>();

  for (const raw of scripts) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown> | Array<Record<string, unknown>>;
      const entries = Array.isArray(parsed) ? parsed : [parsed];

      for (const entry of entries) {
        const value = entry["@type"];
        if (Array.isArray(value)) {
          value.forEach((part) => {
            if (typeof part === "string") typeSet.add(part);
          });
        } else if (typeof value === "string") {
          typeSet.add(value);
        }
      }
    } catch {
      // Ignore malformed JSON-LD
    }
  }

  return {
    types: [...typeSet],
    rawJsonLdCount: scripts.length,
  };
}

function detectReviewSignals($: CheerioAPI, visibleText: string): PageEnrichment["reviewSignals"] {
  const snippets = $("blockquote, .testimonial, .review")
    .map((_, el) => normalizeText($(el).text()))
    .get()
    .filter(Boolean)
    .slice(0, 5);

  const textHits = ["testimonial", "review", "what our customers say", "5-star"]
    .filter((token) => visibleText.toLowerCase().includes(token))
    .map((token) => `contains:${token}`);

  const merged = [...snippets, ...textHits];

  return {
    found: merged.length > 0,
    snippets: merged,
    count: merged.length,
  };
}

function detectFaqSignals($: CheerioAPI, visibleText: string): PageEnrichment["faqSignals"] {
  const headingQuestions = $("h1, h2, h3, h4, dt")
    .map((_, el) => normalizeText($(el).text()))
    .get()
    .filter((text) => text.endsWith("?"))
    .slice(0, 12);

  const hasFaqCopy = /frequently asked questions|faq/i.test(visibleText);

  return {
    found: headingQuestions.length > 0 || hasFaqCopy,
    questions: headingQuestions,
    count: headingQuestions.length,
  };
}

function detectChatSignals($: CheerioAPI, html: string): PageEnrichment["chatSignals"] {
  const scriptSources = $("script[src]")
    .map((_, el) => ($(el).attr("src") ?? "").toLowerCase())
    .get();

  const providers = CHAT_PROVIDERS.filter((provider) => {
    return scriptSources.some((src) => src.includes(provider)) || html.toLowerCase().includes(provider);
  });

  return {
    found: providers.length > 0,
    providers,
  };
}

function detectBookingSignals(textBlocks: string[]): PageEnrichment["bookingSignals"] {
  const corpus = textBlocks.join(" ").toLowerCase();
  const matched = BOOKING_PATTERNS.filter((token) => corpus.includes(token));

  return {
    found: matched.length > 0,
    matched,
  };
}

function detectServiceAreaSignals(visibleText: string): PageEnrichment["serviceAreaSignals"] {
  const normalized = visibleText.toLowerCase();
  const snippets = SERVICE_AREA_PATTERNS.filter((token) => normalized.includes(token));

  return {
    found: snippets.length > 0,
    snippets,
  };
}

function classifyPage(params: {
  url: URL;
  title: string;
  h1: string[];
  visibleText: string;
  reviewSignals: PageEnrichment["reviewSignals"];
  faqSignals: PageEnrichment["faqSignals"];
}): PageClassification {
  if (params.url.pathname === "/") {
    return "homepage";
  }

  const corpus = `${params.url.pathname} ${params.title} ${params.h1.join(" ")} ${params.visibleText}`;

  for (const rule of CLASSIFICATION_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(corpus))) {
      return rule.label;
    }
  }

  if (params.faqSignals.found) return "faq";
  if (params.reviewSignals.found) return "review_or_testimonial";

  return "other";
}

export function extractLinks(html: string): string[] {
  const $ = load(html);

  return $("a[href]")
    .map((_, el) => ($(el).attr("href") ?? "").trim())
    .get()
    .filter(Boolean);
}

export function extractPageSignals(pageUrl: URL, html: string): Omit<PageScanResult, "internalLinks"> {
  const $ = load(html);

  $("script, style, noscript, svg, iframe").remove();

  const title = normalizeText($("title").first().text());
  const metaDescription = normalizeText(
    $("meta[name='description']").first().attr("content") ?? "",
  );

  const h1 = $("h1")
    .map((_, el) => normalizeText($(el).text()))
    .get()
    .filter(Boolean);

  const h2 = $("h2")
    .map((_, el) => normalizeText($(el).text()))
    .get()
    .filter(Boolean);

  const h3 = $("h3")
    .map((_, el) => normalizeText($(el).text()))
    .get()
    .filter(Boolean);

  const visibleText = normalizeText($("body").text());
  const wordCount = visibleText ? visibleText.split(/\s+/).length : 0;

  const phoneLinks = $("a[href^='tel:']")
    .map((_, el) => ($(el).attr("href") ?? "").trim())
    .get()
    .filter(Boolean);

  const forms = $("form")
    .map((_, el) => ({
      action: normalizeText($(el).attr("action") ?? ""),
      method: normalizeText($(el).attr("method") ?? "get").toLowerCase(),
      inputCount: $(el).find("input, textarea, select").length,
    }))
    .get();

  const buttons = $("button, a[role='button'], input[type='submit']")
    .map((_, el) =>
      normalizeText($(el).text() || $(el).attr("value") || $(el).attr("aria-label") || ""),
    )
    .get()
    .filter(Boolean);

  const ctaPhrases = findCtas([title, metaDescription, ...h1, ...h2, ...buttons, visibleText]);

  const reviewSignals = detectReviewSignals($, visibleText);
  const faqSignals = detectFaqSignals($, visibleText);
  const trustMatches = getKeywordHits(visibleText, TRUST_PATTERNS);
  const serviceKeywords = getKeywordHits(visibleText, SERVICE_KEYWORDS);
  const locationKeywords = getKeywordHits(visibleText, LOCATION_KEYWORDS);
  const chatSignals = detectChatSignals($, html);
  const bookingSignals = detectBookingSignals([title, metaDescription, ...buttons, ...h1, ...h2, visibleText]);
  const serviceAreaSignals = detectServiceAreaSignals(visibleText);
  const structuredData = extractStructuredDataTypes(load(html));

  const enrichment: PageEnrichment = {
    classification: classifyPage({
      url: pageUrl,
      title,
      h1,
      visibleText,
      reviewSignals,
      faqSignals,
    }),
    reviewSignals,
    faqSignals,
    trustSignals: {
      found: trustMatches.length > 0,
      matched: trustMatches,
    },
    serviceKeywords,
    locationKeywords,
    chatSignals,
    bookingSignals,
    serviceAreaSignals,
    structuredData: {
      found: structuredData.rawJsonLdCount > 0,
      types: structuredData.types,
      rawJsonLdCount: structuredData.rawJsonLdCount,
    },
  };

  return {
    url: pageUrl.toString(),
    title,
    metaDescription,
    headings: { h1, h2, h3 },
    visibleText,
    wordCount,
    phoneLinks,
    forms,
    buttons,
    ctaPhrases,
    enrichment,
  };
}
