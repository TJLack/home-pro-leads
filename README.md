# Website Revenue Leak Detector

Production-focused local app for Key City Digital's lead magnet flow:
scan -> locked preview -> lead capture -> full report unlock.

## Local Requirements

- Node.js 20+
- npm

## Setup

1. Install dependencies
   ```bash
   npm install
   ```
2. Install Playwright Chromium
   ```bash
   npx playwright install chromium
   ```
3. Create environment file
   ```bash
   cp .env.example .env.local
   ```
4. Start development server
   ```bash
   npm run dev
   ```
5. Open app
   - `http://localhost:3000`

## End-to-End Local Test Process

1. Enter a website URL and click **Scan My Website Free**.
2. Confirm progress message appears.
3. Confirm locked report preview appears with score snapshot.
4. Fill unlock form and submit.
5. Confirm full report appears without re-running scan.
6. Confirm persistence in SQLite:
   - database file: `data/app.db`
   - report stored in `reports`
   - lead stored in `leads`

Example SQLite check:

```bash
sqlite3 data/app.db "SELECT COUNT(*) FROM reports;"
sqlite3 data/app.db "SELECT COUNT(*) FROM leads;"
```

## Persistence Schema

### reports
- id (TEXT primary key)
- website_url (TEXT)
- normalized_start_url (TEXT)
- requested_at (TEXT)
- created_at (TEXT)
- result_json (TEXT)
- scorecard_json (TEXT)

### leads
- id (TEXT primary key)
- report_reference (TEXT, FK reports.id)
- name (TEXT)
- email (TEXT)
- phone (TEXT)
- business_name (TEXT)
- city (TEXT)
- monthly_marketing_budget (INTEGER nullable)
- submitted_url (TEXT)
- created_at (TEXT)
