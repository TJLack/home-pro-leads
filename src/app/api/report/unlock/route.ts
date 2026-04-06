import { NextResponse } from "next/server";

import { buildReportSummary } from "@/lib/report/report-summary";
import { createLead } from "@/lib/storage/lead.repository";
import { getReportById } from "@/lib/storage/report.repository";
import { unlockRequestSchema } from "@/lib/validation/report.schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = unlockRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid form input." }, { status: 400 });
  }

  const report = getReportById(parsed.data.reportReference);

  if (!report) {
    return NextResponse.json({ error: "Report not found. Please run a new scan." }, { status: 404 });
  }

  const lead = createLead({
    reportReference: parsed.data.reportReference,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    businessName: parsed.data.businessName,
    city: parsed.data.city,
    monthlyMarketingBudget: parsed.data.monthlyMarketingBudget,
    submittedUrl: report.websiteUrl,
  });

  return NextResponse.json(
    {
      reportReference: report.id,
      lead,
      reportSummary: buildReportSummary(report.scorecard),
      result: report.result,
      scorecard: report.scorecard,
      unlockedAt: new Date().toISOString(),
    },
    { status: 200 },
  );
}
