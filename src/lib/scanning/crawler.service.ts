import { extractLinks, extractPageSignals } from "@/lib/scanning/content-extractor";
import { captureHomepageScreenshot } from "@/lib/scanning/screenshot.service";
import {
  InvalidWebsiteUrlError,
  isSameDomain,
  normalizeDiscoveredUrl,
  normalizeSubmittedUrl,
  shouldSkipHref,
  shouldSkipPath,
} from "@/lib/scanning/url-utils";
import type { CrawlRequest, PageScanResult, ScanResult } from "@/lib/types/domain";

const MAX_PAGES = 8;
const MAX_DEPTH = 2;
const FETCH_TIMEOUT_MS = 10_000;

type QueueItem = {
  url: URL;
  depth: number;
};

export async function crawlWebsite(request: CrawlRequest): Promise<ScanResult> {
  const normalizedStart = normalizeSubmittedUrl(request.websiteUrl);
  const rootDomain = normalizedStart.hostname;
  const scanId = crypto.randomUUID();

  const queue: QueueItem[] = [{ url: normalizedStart, depth: 0 }];
  const visited = new Set<string>();
  const skippedUrls = new Set<string>();
  const pages: PageScanResult[] = [];

  const startedAt = new Date().toISOString();

  const screenshot = await captureHomepageScreenshot({
    url: normalizedStart.toString(),
    scanId,
  });

  while (queue.length > 0 && pages.length < MAX_PAGES) {
    const current = queue.shift();
    if (!current) break;

    const currentKey = current.url.toString();
    if (visited.has(currentKey)) continue;
    visited.add(currentKey);

    if (current.depth > MAX_DEPTH || shouldSkipPath(current.url.pathname)) {
      skippedUrls.add(currentKey);
      continue;
    }

    let response: Response;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      response = await fetch(current.url.toString(), {
        method: "GET",
        redirect: "follow",
        headers: {
          "user-agent": "KeyCityDigitalScanner/0.1",
          accept: "text/html,application/xhtml+xml",
        },
        cache: "no-store",
        signal: controller.signal,
      });
    } catch {
      skippedUrls.add(currentKey);
      continue;
    } finally {
      clearTimeout(timeout);
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!response.ok || !contentType.includes("text/html")) {
      skippedUrls.add(currentKey);
      continue;
    }

    const finalUrl = normalizeDiscoveredUrl(response.url, normalizedStart);
    if (!finalUrl || !isSameDomain(finalUrl, rootDomain) || shouldSkipPath(finalUrl.pathname)) {
      skippedUrls.add(currentKey);
      continue;
    }

    const html = await response.text();
    const pageBase = finalUrl;
    const pageSignals = extractPageSignals(pageBase, html);

    const internalLinks = new Set<string>();

    for (const href of extractLinks(html)) {
      if (shouldSkipHref(href)) {
        continue;
      }

      const normalized = normalizeDiscoveredUrl(href, pageBase);
      if (!normalized) continue;
      if (!isSameDomain(normalized, rootDomain)) continue;
      if (shouldSkipPath(normalized.pathname)) continue;

      const linkValue = normalized.toString();
      internalLinks.add(linkValue);

      if (!visited.has(linkValue) && current.depth + 1 <= MAX_DEPTH) {
        queue.push({ url: normalized, depth: current.depth + 1 });
      }
    }

    pages.push({
      ...pageSignals,
      url: pageBase.toString(),
      internalLinks: [...internalLinks],
    });
  }

  return {
    id: scanId,
    requestedUrl: request.websiteUrl,
    normalizedStartUrl: normalizedStart.toString(),
    domain: rootDomain,
    requestedAt: request.requestedAt,
    startedAt,
    completedAt: new Date().toISOString(),
    limits: {
      maxPages: MAX_PAGES,
      maxDepth: MAX_DEPTH,
    },
    screenshot,
    crawledPages: pages.length,
    pages,
    skippedUrls: [...skippedUrls],
  };
}

export { InvalidWebsiteUrlError };
