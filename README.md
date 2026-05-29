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
   endpoint. `RESEND_API_KEY` is required for weekly summary email sending.
   Set `EMAIL_FROM` or `RESEND_FROM_EMAIL` to a verified Resend sender address
   for the weekly summary email feature. `CRON_SECRET` is required before you
   turn on scheduled weekly summary sending. `AUTH_SECRET` and `APP_PASSWORD`
   are required for production deployments. Keep
   `WEEKLY_SUMMARY_AUTOMATION_ENABLED=false` until you intentionally add
   scheduled email sending.

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
3. Add `RESEND_API_KEY` and `EMAIL_FROM` or `RESEND_FROM_EMAIL` if you want
   weekly summary email sending in production. The sender address must be
   verified in Resend.
4. Add `CRON_SECRET` before enabling scheduled weekly summary sending.
5. Keep `WEEKLY_SUMMARY_AUTOMATION_ENABLED=false` until you intentionally add
   scheduled email sending.
6. Optional: add `OPENAI_API_KEY` only if using `/api/chat`.
7. Run migrations against Neon:

   ```bash
   DATABASE_URL="postgres://..." npm run db:migrate
   ```

8. Import the workbook into Neon:

   ```bash
   DATABASE_URL="postgres://..." npm run import:workbook -- /path/to/workbook.xlsx
   ```

9. Add the Vercel cron schedule in `vercel.json`. The cron route runs on a
   regular schedule and checks the saved weekly summary email schedule in
   Postgres before sending. The app defaults to Friday at 5:00 PM Eastern when
   automation is enabled, and the schedule can be edited from the Weekly
   Summary email view.
10. Deploy to Vercel with `npm run build`.

In production, `DATABASE_URL` is required and the local JSON workbook fallback is
disabled. Missing production auth or database variables fail closed at request
entry points.
