# Website Revenue Leak Detector

Vercel-compatible deployment path for Key City Digital's lead magnet flow:
scan -> locked preview -> lead capture -> full report unlock.

## Runtime Notes

- No external APIs are required.
- Storage uses local JSON files.
  - Local development: `./data/reports.json`, `./data/leads.json`
  - Vercel: `/tmp/home-pro-leads/*.json` (ephemeral between cold starts/deploys)
- Screenshot capture is disabled automatically on Vercel runtime.

## Setup

1. Install dependencies
   ```bash
   npm install
   ```
2. (Optional local screenshots) install Playwright Chromium
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

## End-to-End Test Process

1. Enter a website URL and click **Scan My Website Free**.
2. Confirm locked preview appears.
3. Submit unlock form.
4. Confirm full report appears without re-running scan.
5. Verify local persistence files:
   - `data/reports.json`
   - `data/leads.json`

## Deploying to Vercel

- Preset: **Next.js**
- Keep default build/output settings
- Expect screenshot capture to be disabled in cloud runtime
- Persistence in `/tmp` is temporary (not permanent long-term storage)
