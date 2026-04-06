"use client";

import { type ChangeEvent, useMemo, useState } from "react";

import { productConfig } from "@/lib/config/product.config";

type ReportSummary = {
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

type LockedPreview = {
  reportReference: string;
  websiteUrl: string;
  screenshotPath?: string;
  pagesScanned: number;
  reportSummary: ReportSummary;
  isLocked: true;
};

type UnlockPayload = {
  reportReference: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  city: string;
  monthlyMarketingBudget?: number;
};

type UnlockedReport = {
  reportReference: string;
  reportSummary: ReportSummary;
  scorecard: {
    design: { score: number };
    seo: { score: number };
    conversion: { score: number };
    aiSearchReadiness: { score: number };
  };
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}


function parseApiResponse<T>(raw: string): T & { error?: string } {
  try {
    return JSON.parse(raw) as T & { error?: string };
  } catch {
    return { error: raw.slice(0, 240) || "Unexpected non-JSON response from server." } as T & { error?: string };
  }
}

export default function Home() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [preview, setPreview] = useState<LockedPreview | null>(null);
  const [unlocked, setUnlocked] = useState<UnlockedReport | null>(null);
  const [form, setForm] = useState<UnlockPayload>({
    reportReference: "",
    name: "",
    email: "",
    phone: "",
    businessName: "",
    city: "",
  });
  const [isScanning, setIsScanning] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locked = useMemo(() => Boolean(preview && !unlocked), [preview, unlocked]);

  const canUnlock =
    form.reportReference.trim().length > 0 &&
    form.name.trim().length > 1 &&
    form.email.trim().length > 4 &&
    form.phone.trim().length > 6 &&
    form.businessName.trim().length > 1 &&
    form.city.trim().length > 1;

  const progressLabel = isScanning
    ? "Scanning your website and building your report..."
    : isUnlocking
      ? "Saving your details and unlocking your report..."
      : preview && !unlocked
        ? "Your report preview is ready. Unlock to view full recommendations."
        : unlocked
          ? "Your full report is ready."
          : "Ready to scan your website.";

  async function runScan() {
    if (!websiteUrl.trim()) {
      setError("Please enter a website URL.");
      return;
    }

    setError(null);
    setUnlocked(null);
    setPreview(null);
    setIsScanning(true);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ websiteUrl: websiteUrl.trim() }),
      });

      const raw = await response.text();
      const data = parseApiResponse<{ preview?: LockedPreview }>(raw);

      if (!response.ok || !data.preview) {
        throw new Error(data.error ?? "Scan failed.");
      }

      const scannedPreview = data.preview;
      setPreview(scannedPreview);
      setForm((existing: UnlockPayload) => ({
        ...existing,
        reportReference: scannedPreview.reportReference,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed.");
    } finally {
      setIsScanning(false);
    }
  }

  async function unlockReport() {
    if (!canUnlock) {
      setError("Please complete all required fields to unlock your report.");
      return;
    }

    setError(null);
    setIsUnlocking(true);

    try {
      const response = await fetch("/api/report/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });

      const raw = await response.text();
      const data = parseApiResponse<UnlockedReport>(raw);

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to unlock report.");
      }

      setUnlocked(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to unlock report.");
    } finally {
      setIsUnlocking(false);
    }
  }

  return (
    <main className="page-wrap">
      <section className="hero card">
        <p className="eyebrow">
          {productConfig.brand.companyName} · {productConfig.brand.tagline}
        </p>
        <h1>{productConfig.landing.headline}</h1>
        <p className="subheadline">{productConfig.landing.subheadline}</p>

        <div className="scan-bar">
          <input
            value={websiteUrl}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setWebsiteUrl(event.target.value)}
            placeholder="Enter your website URL"
            className="field"
          />
          <button onClick={runScan} disabled={isScanning} className="button primary">
            {isScanning ? "Scanning..." : productConfig.landing.primaryCta}
          </button>
        </div>

        <p className="progress">{progressLabel}</p>

        <div className="trust-strip">
          {productConfig.landing.trustItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>The Real Problem Isn’t Traffic. It’s Conversion.</h2>
        <p className="muted">
          Most home service businesses don’t need more clicks. They need a website that
          turns visitors into booked jobs.
        </p>
      </section>

      <section className="card value-grid">
        <article>
          <h3>Website Score</h3>
          <p className="metric">{preview ? preview.reportSummary.overallScore : "--"}</p>
        </article>
        <article>
          <h3>Revenue Opportunity</h3>
          <p className="metric">
            {preview ? formatCurrency(preview.reportSummary.estimatedRevenueOpportunity) : "--"}
          </p>
          {preview ? (
            <p className="muted small">
              Typical range: {formatCurrency(preview.reportSummary.revenueRange.low)} to{" "}
              {formatCurrency(preview.reportSummary.revenueRange.high)} / month
            </p>
          ) : null}
        </article>
        <article>
          <h3>What’s Broken + What to Fix</h3>
          <p className="muted">Clear business-focused insights with practical next steps.</p>
        </article>
      </section>

      {(isScanning || preview) && (
        <section className="card" style={{ position: "relative" }}>
          <h2>{isScanning ? "Scan in Progress" : "Report Preview"}</h2>
          {!preview && isScanning ? (
            <p className="muted">Checking pages, structure, and conversion signals...</p>
          ) : null}

          {preview?.screenshotPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.screenshotPath} alt="Homepage screenshot preview" className="preview-image" />
          ) : null}

          {preview ? (
            <div className={locked ? "blurred" : ""}>
              <h3>Overall Score</h3>
              <p className="metric">{preview.reportSummary.overallScore}</p>
              <h3>Estimated Revenue Opportunity</h3>
              <p className="metric">{formatCurrency(preview.reportSummary.estimatedRevenueOpportunity)}</p>
              <p className="muted small">{preview.reportSummary.revenueRange.note}</p>
              <h3>Top 3 Issues</h3>
              <ul>
                {(preview.reportSummary.topIssues.length > 0
                  ? preview.reportSummary.topIssues
                  : ["No major issues detected in this short crawl."]
                ).map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {locked && <div className="lock-banner">Unlock to view your full report and fixes.</div>}

          <a href={productConfig.bookingUrl} target="_blank" rel="noreferrer" className="button booking subtle">
            Book My Free Strategy Call
          </a>
        </section>
      )}

      {preview && !unlocked && (
        <section className="card">
          <h2>Unlock Full Report</h2>
          <p className="muted">Submit your details to unlock your full report instantly.</p>
          <div className="unlock-grid">
            <input className="field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input
              className="field"
              placeholder="Business Name"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            />
            <input className="field" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input
              className="field"
              placeholder="Monthly Marketing Budget (Optional)"
              onChange={(e) => {
                const value = e.target.value.trim();
                setForm({
                  ...form,
                  monthlyMarketingBudget: value ? Number(value) : undefined,
                });
              }}
            />
          </div>
          <button className="button primary" disabled={isUnlocking || !canUnlock} onClick={unlockReport}>
            {isUnlocking ? "Unlocking..." : "Unlock My Full Report"}
          </button>
        </section>
      )}

      {unlocked && (
        <section className="card full-report">
          <h2>Full Website Revenue Leak Report</h2>

          <h3>Overall Score</h3>
          <p className="metric">{unlocked.reportSummary.overallScore}</p>

          <h3>Estimated Revenue Opportunity</h3>
          <p className="metric">{formatCurrency(unlocked.reportSummary.estimatedRevenueOpportunity)}</p>
          <p className="muted small">
            Typical range: {formatCurrency(unlocked.reportSummary.revenueRange.low)} to{" "}
            {formatCurrency(unlocked.reportSummary.revenueRange.high)} / month
          </p>

          <h3>Top 3 Issues</h3>
          <ul>
            {(unlocked.reportSummary.topIssues.length > 0
              ? unlocked.reportSummary.topIssues
              : ["No major issues detected in this short crawl."]
            ).map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>

          <h3>Design Score</h3>
          <p>{unlocked.scorecard.design.score}</p>

          <h3>SEO Score</h3>
          <p>{unlocked.scorecard.seo.score}</p>

          <h3>Conversion Score</h3>
          <p>{unlocked.scorecard.conversion.score}</p>

          <h3>AI Search Readiness Score</h3>
          <p>{unlocked.scorecard.aiSearchReadiness.score}</p>

          <h3>Recommended Fixes</h3>
          <ul>
            {(unlocked.reportSummary.recommendedFixes.length > 0
              ? unlocked.reportSummary.recommendedFixes
              : ["Keep strengthening service pages, trust proof, and clear CTAs."]
            ).map((fix) => (
              <li key={fix}>{fix}</li>
            ))}
          </ul>

          <a href={productConfig.bookingUrl} target="_blank" rel="noreferrer" className="button booking">
            Book My Free Strategy Call
          </a>
        </section>
      )}

      {error && <p className="error">{error}</p>}
    </main>
  );
}
