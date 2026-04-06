import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getStorageDir } from "@/lib/storage/storage-paths";
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

const reportsById = new Map<string, StoredReport>();

function getReportsFilePath() {
  return path.join(getStorageDir(), "reports.json");
}

async function readAllReportsFromDisk(): Promise<StoredReport[]> {
  const filePath = getReportsFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });

  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as StoredReport[];
  } catch {
    return [];
  }
}

async function writeAllReportsToDisk(records: StoredReport[]) {
  const filePath = getReportsFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(records, null, 2), "utf8");
}

export async function saveReport(params: {
  id: string;
  websiteUrl: string;
  normalizedStartUrl: string;
  requestedAt: string;
  result: ScanResult;
  scorecard: ScoreCard;
}) {
  const report: StoredReport = {
    id: params.id,
    websiteUrl: params.websiteUrl,
    normalizedStartUrl: params.normalizedStartUrl,
    requestedAt: params.requestedAt,
    createdAt: new Date().toISOString(),
    result: params.result,
    scorecard: params.scorecard,
  };

  reportsById.set(report.id, report);

  const all = await readAllReportsFromDisk();
  const next = [...all.filter((record) => record.id !== report.id), report];
  await writeAllReportsToDisk(next);
}

export async function getReportById(reportId: string): Promise<StoredReport | null> {
  const cached = reportsById.get(reportId);
  if (cached) {
    return cached;
  }

  const all = await readAllReportsFromDisk();
  const found = all.find((item) => item.id === reportId) ?? null;

  if (found) {
    reportsById.set(found.id, found);
  }

  return found;
}
