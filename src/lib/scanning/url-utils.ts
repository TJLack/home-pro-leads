const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
]);

const BLOCKED_PATH_SEGMENTS = ["/login", "/admin", "/cart", "/checkout", "/wp-admin"];

export class InvalidWebsiteUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidWebsiteUrlError";
  }
}

export function normalizeSubmittedUrl(rawInput: string): URL {
  const trimmed = rawInput.trim();

  if (!trimmed) {
    throw new InvalidWebsiteUrlError("Website URL is required.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new InvalidWebsiteUrlError("Invalid website URL format.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new InvalidWebsiteUrlError("Only HTTP(S) website URLs are allowed.");
  }

  if (parsed.protocol === "http:") {
    parsed.protocol = "https:";
  }

  parsed.hostname = canonicalHost(parsed.hostname);
  parsed.hash = "";
  parsed.search = "";

  if (!parsed.pathname || parsed.pathname === "") {
    parsed.pathname = "/";
  }

  return parsed;
}

export function canonicalHost(hostname: string): string {
  return hostname.replace(/^www\./i, "").toLowerCase();
}

export function normalizeDiscoveredUrl(rawHref: string, baseUrl: URL): URL | null {
  try {
    const parsed = new URL(rawHref, baseUrl);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    if (parsed.protocol === "http:") {
      parsed.protocol = "https:";
    }

    parsed.hostname = canonicalHost(parsed.hostname);
    parsed.hash = "";

    [...parsed.searchParams.keys()].forEach((key) => {
      const normalizedKey = key.toLowerCase();
      if (TRACKING_PARAMS.has(normalizedKey) || normalizedKey.startsWith("utm_")) {
        parsed.searchParams.delete(key);
      }
    });

    parsed.search = parsed.searchParams.toString() ? `?${parsed.searchParams.toString()}` : "";

    if (parsed.pathname.endsWith("/") && parsed.pathname !== "/") {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    return parsed;
  } catch {
    return null;
  }
}

export function shouldSkipHref(href: string): boolean {
  const value = href.trim().toLowerCase();
  if (!value) return true;

  return (
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("#") ||
    value.endsWith(".pdf")
  );
}

export function shouldSkipPath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return BLOCKED_PATH_SEGMENTS.some((segment) => path.includes(segment));
}

export function isSameDomain(candidate: URL, rootDomain: string): boolean {
  return canonicalHost(candidate.hostname) === canonicalHost(rootDomain);
}
