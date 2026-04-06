import { mkdir } from "node:fs/promises";
import path from "node:path";

import type { ScreenshotAsset } from "@/lib/types/domain";

const SCREENSHOT_TIMEOUT_MS = 15_000;

export async function captureHomepageScreenshot(params: {
  url: string;
  scanId: string;
}): Promise<ScreenshotAsset> {
  const screenshotEnabled = !process.env.VERCEL && process.env.ENABLE_SCREENSHOT_CAPTURE !== "false";

  if (!screenshotEnabled) {
    return {
      status: "failed",
      error: "Screenshot capture disabled for this runtime.",
      capturedAt: new Date().toISOString(),
    };
  }

  const { chromium } = await import("playwright");

  const outputDir = path.join(process.cwd(), "public", "screenshots");
  await mkdir(outputDir, { recursive: true });

  const fileName = `${params.scanId}-homepage.png`;
  const outputPath = path.join(outputDir, fileName);
  const publicPath = `/screenshots/${fileName}`;

  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    const page = await context.newPage();

    await withTimeout(
      page.goto(params.url, {
        waitUntil: "domcontentloaded",
        timeout: 12_000,
      }),
      SCREENSHOT_TIMEOUT_MS,
      "Screenshot navigation timed out.",
    );

    await withTimeout(
      page.screenshot({
        path: outputPath,
        fullPage: true,
      }),
      SCREENSHOT_TIMEOUT_MS,
      "Screenshot capture timed out.",
    );

    await context.close();

    return {
      status: "captured",
      path: publicPath,
      capturedAt: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown screenshot error.";

    return {
      status: "failed",
      error: message,
      capturedAt: new Date().toISOString(),
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}
