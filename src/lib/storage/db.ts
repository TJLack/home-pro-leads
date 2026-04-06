import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

const dataDir = path.join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "app.db");

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    website_url TEXT NOT NULL,
    normalized_start_url TEXT NOT NULL,
    requested_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    result_json TEXT NOT NULL,
    scorecard_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    report_reference TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    business_name TEXT NOT NULL,
    city TEXT NOT NULL,
    monthly_marketing_budget INTEGER,
    submitted_url TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (report_reference) REFERENCES reports(id)
  );

  CREATE INDEX IF NOT EXISTS idx_leads_report_reference ON leads(report_reference);
  CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
`);
