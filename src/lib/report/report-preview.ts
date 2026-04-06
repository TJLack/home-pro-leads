import { buildReportSummary } from "@/lib/report/report-summary";
import type { ScoreCard, ScanResult } from "@/lib/types/domain";

export type LockedReportPreview = {
  reportReference: string;
  websiteUrl: string;
  screenshotPath?: string;
  pagesScanned: number;
  reportSummary: ReturnType<typeof buildReportSummary>;
  isLocked: true;
};

export function buildLockedReportPreview(params: {
  reportReference: string;
  result: ScanResult;
  scorecard: ScoreCard;
}): LockedReportPreview {
  return {
    reportReference: params.reportReference,
    websiteUrl: params.result.requestedUrl,
    screenshotPath:
      params.result.screenshot.status === "captured" ? params.result.screenshot.path : undefined,
    pagesScanned: params.result.crawledPages,
    reportSummary: buildReportSummary(params.scorecard),
    isLocked: true,
  };
}
