export type CrawlRequest = {
  websiteUrl: string;
  requestedAt: string;
};

export type CtaPhrase = {
  phrase: string;
  matches: number;
};

export type PageClassification =
  | "homepage"
  | "service"
  | "location"
  | "about"
  | "contact"
  | "faq"
  | "review_or_testimonial"
  | "gallery_or_project"
  | "other";

export type ScreenshotAsset = {
  status: "captured" | "failed";
  path?: string;
  error?: string;
  capturedAt: string;
};

export type PageEnrichment = {
  classification: PageClassification;
  reviewSignals: {
    found: boolean;
    snippets: string[];
    count: number;
  };
  faqSignals: {
    found: boolean;
    questions: string[];
    count: number;
  };
  trustSignals: {
    found: boolean;
    matched: string[];
  };
  serviceKeywords: string[];
  locationKeywords: string[];
  chatSignals: {
    found: boolean;
    providers: string[];
  };
  bookingSignals: {
    found: boolean;
    matched: string[];
  };
  serviceAreaSignals: {
    found: boolean;
    snippets: string[];
  };
  structuredData: {
    found: boolean;
    types: string[];
    rawJsonLdCount: number;
  };
};

export type PageScanResult = {
  url: string;
  title: string;
  metaDescription: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  visibleText: string;
  wordCount: number;
  internalLinks: string[];
  phoneLinks: string[];
  forms: {
    action: string;
    method: string;
    inputCount: number;
  }[];
  buttons: string[];
  ctaPhrases: CtaPhrase[];
  enrichment: PageEnrichment;
};

export type ScoreCategoryResult = {
  score: number;
  explanation: string;
  issues: string[];
  recommendedFixes: string[];
};

export type ScoreCard = {
  design: ScoreCategoryResult;
  seo: ScoreCategoryResult;
  conversion: ScoreCategoryResult;
  aiSearchReadiness: ScoreCategoryResult;
  overallScore: number;
  summary: {
    explanation: string;
    topIssues: string[];
    recommendedFixes: string[];
  };
};

export type ReportSummary = {
  overallScore: number;
  estimatedRevenueOpportunity: number;
  revenueRange: {
    low: number;
    high: number;
    note: string;
  };
  topIssues: string[];
  recommendedFixes: string[];
};

export type ScanResult = {
  id: string;
  requestedUrl: string;
  normalizedStartUrl: string;
  domain: string;
  requestedAt: string;
  startedAt: string;
  completedAt: string;
  limits: {
    maxPages: number;
    maxDepth: number;
  };
  screenshot: ScreenshotAsset;
  crawledPages: number;
  pages: PageScanResult[];
  skippedUrls: string[];
};

export type LeadRecord = {
  id: string;
  reportReference: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  city: string;
  monthlyMarketingBudget: number | null;
  submittedUrl: string;
  createdAt: string;
};
