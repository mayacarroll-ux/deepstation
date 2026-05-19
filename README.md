# Deepstation

Deepstation is a time tracking app that replaces an Excel workbook workflow with
budget-key mappings, persistent time entries, and weekly billing summaries.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

3. Configure `DATABASE_URL`. `OPENAI_API_KEY` is only needed for the AI chat
   endpoint. `AUTH_SECRET` and `APP_PASSWORD` are required for production
   deployments.

4. Run database migrations after editing the schema:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

## Import workbook data

Import a workbook into the local development fallback data file, and into
PostgreSQL when `DATABASE_URL` is configured:

```bash
npm run import:workbook -- /path/to/workbook.xlsx
```

The importer intentionally requires an explicit workbook path.

## Authentication

Local development can run against the JSON workbook fallback with the fixed
owner id, `single-user`. Production uses Auth.js Credentials with one deployment
password stored in `APP_PASSWORD`; data remains scoped to `single-user`.

## Vercel + Neon deployment

1. Create a Neon PostgreSQL database.
2. Add `DATABASE_URL`, `AUTH_SECRET`, and `APP_PASSWORD` to Vercel project
   environment variables.
3. Optional: add `OPENAI_API_KEY` only if using `/api/chat`.
4. Run migrations against Neon:

   ```bash
   DATABASE_URL="postgres://..." npm run db:migrate
   ```

5. Import the workbook into Neon:

   ```bash
   DATABASE_URL="postgres://..." npm run import:workbook -- /path/to/workbook.xlsx
   ```

6. Deploy to Vercel with `npm run build`.

In production, `DATABASE_URL` is required and the local JSON workbook fallback is
disabled. Missing production auth or database variables fail closed at request
entry points.
