import { db } from "@/lib/storage/db";
import type { ScoreCard, ScanResult } from "@/lib/types/domain";

export type StoredReport = {
  id: string;
  websiteUrl: string;
  normalizedStartUrl: string;
  requestedAt: string;
  createdAt: string;
  result: ScanResult;
  scorecard: ScoreCard;
};

export function saveReport(params: {
  id: string;
  websiteUrl: string;
  normalizedStartUrl: string;
  requestedAt: string;
  result: ScanResult;
  scorecard: ScoreCard;
}) {
  const now = new Date().toISOString();

  db.prepare(
    `
    INSERT OR REPLACE INTO reports (
      id, website_url, normalized_start_url, requested_at, created_at, result_json, scorecard_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    params.id,
    params.websiteUrl,
    params.normalizedStartUrl,
    params.requestedAt,
    now,
    JSON.stringify(params.result),
    JSON.stringify(params.scorecard),
  );
}

export function getReportById(reportId: string): StoredReport | null {
  const row = db
    .prepare(
      `
    SELECT id, website_url, normalized_start_url, requested_at, created_at, result_json, scorecard_json
    FROM reports
    WHERE id = ?
  `,
    )
    .get(reportId) as
    | {
        id: string;
        website_url: string;
        normalized_start_url: string;
        requested_at: string;
        created_at: string;
        result_json: string;
        scorecard_json: string;
      }
    | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    websiteUrl: row.website_url,
    normalizedStartUrl: row.normalized_start_url,
    requestedAt: row.requested_at,
    createdAt: row.created_at,
    result: JSON.parse(row.result_json) as ScanResult,
    scorecard: JSON.parse(row.scorecard_json) as ScoreCard,
  };
}
