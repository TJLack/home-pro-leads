import { NextResponse } from "next/server";

import { buildLockedReportPreview } from "@/lib/report/report-preview";
import { crawlWebsite, InvalidWebsiteUrlError } from "@/lib/scanning/crawler.service";
import { calculateScore } from "@/lib/scoring/scoring.service";
import { saveReport } from "@/lib/storage/report.repository";
import { scanRequestSchema } from "@/lib/validation/report.schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = scanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  try {
    const result = await crawlWebsite({
      websiteUrl: parsed.data.websiteUrl,
      requestedAt: new Date().toISOString(),
    });

    const scorecard = calculateScore(result);

    saveReport({
      id: result.id,
      websiteUrl: result.requestedUrl,
      normalizedStartUrl: result.normalizedStartUrl,
      requestedAt: result.requestedAt,
      result,
      scorecard,
    });

    const preview = buildLockedReportPreview({
      reportReference: result.id,
      result,
      scorecard,
    });

    return NextResponse.json({ preview }, { status: 200 });
  } catch (error) {
    if (error instanceof InvalidWebsiteUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Scan failed. Please try again." }, { status: 500 });
  }
}
