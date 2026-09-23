# Review packet — The-Bell Vercel serverless adaptation (2026-09-23)

## What was built
Adapted The-Bell for all-serverless deployment on Vercel + Supabase (per the
platform design decision, 2026-09-23). The Express backend in `server.ts` is
ported to Vercel serverless functions; the Vite React frontend deploys as static
output on the same domain, so the frontend's relative `/api/...` fetch calls
work unchanged. API behavior is identical to the Express routes, including the
numeric notice search from PR #1.

## Files changed
- `api/_db.ts` (new) — shared DB helper for functions: lazy `pg` Pool (max 1
  connection per warm instance), reads `DATABASE_URL`, reuses the existing
  drizzle schema. Recommends Supabase's pooled connection string (port 6543).
- `api/health.ts` (new) — `GET /api/health` → `{ status: 'ok' }`.
- `api/notices.ts` (new) — `GET /api/notices`: pagination + search/filter ported
  1:1 from `server.ts` (text match over subject_line/raw_text/act_cited; exact
  numeric match on notice_number/notice_year for digit-only queries; same
  ordering; same `{ data, page, limit }` shape; same 400/500 handling).
- `api/notices/[id].ts` (new) — `GET /api/notices/:id`: single-notice lookup
  ported 1:1 (400 on bad id, 404 when missing).
- `vercel.json` (new) — build `vite build`, output `dist`, SPA rewrite
  `/((?!api/).*) → /index.html` (API routes take precedence).
- `.env.example` (updated) — documents `DATABASE_URL` (Supabase pooler string).
- `reviews/the-bell-schema.sql` (new) — full Postgres DDL derived from
  `drizzle/0000_colorful_triton.sql`, with `create extension if not exists
  vector;` prepended; ready to paste into Supabase's SQL editor.
- `server.ts` — UNCHANGED. Still the local-dev path (`npm run dev`).

## How to verify
1. `git checkout labs/the-bell-vercel && npm install`
2. Local function check: `npx vercel dev` (needs the Vercel CLI; serves `/api/*`
   functions and the Vite frontend together). With `DATABASE_URL` set to the
   Supabase project: `curl localhost:3000/api/health` → `{ status: 'ok' }`;
   `curl 'localhost:3000/api/notices?q=2026&limit=2'` → paginated notices.
3. Build check: `npx vercel build` — must complete with `dist/` output and
   functions bundled under `.vercel/output/functions/api`.
4. Type check: `npx tsc --noEmit` (functions use explicit `any` for req/res, so
   no new dependencies were added).
5. Deploy check (needs his Vercel + Supabase accounts): import the repo in
   Vercel, set `DATABASE_URL` (+ `GEMINI_API_KEY` for later), run
   `reviews/the-bell-schema.sql` in Supabase SQL editor, deploy, hit
   `/api/health` on the production URL.

## Risks
- **No live runtime verification here.** I have no Postgres and no Vercel
  account in this environment, so the functions are ported by careful reading,
  not executed. The logic is a line-for-line port, but a cold `vercel dev` run
  against Supabase is the real proof — that's step 2/5 above.
- **Supabase pooling vs Drizzle/pg.** Each serverless instance opens its own
  Pool (max 1). Fine on Supabase's pooler (port 6543); the direct connection
  string (port 5432) would exhaust connections under burst traffic. The
  `.env.example` and `_db.ts` comments steer toward the pooler, but nothing
  enforces it.
- **Cold starts.** First request after idle pays a Node cold start + one pool
  connect (~hundreds of ms). Acceptable for a notices app; not for latency-
  critical paths later.
- **pgvector.** The schema needs the `vector` extension — included in the SQL
  file; Supabase supports it, but the extension must exist before the tables.
- **GEMINI_API_KEY is currently unused in code** (`@google/genai` is a
  dependency and the key is in `.env.example`, but no route calls Gemini yet).
  Nothing breaks without it; the classification feature will need it later.
- **server.ts still exists** for local dev — two server paths to keep in sync
  until the team decides the Express server is retired.

## Decision requested
Approve + merge this PR? After merge, the remaining human steps are: create the
Supabase project, run `reviews/the-bell-schema.sql` in its SQL editor, import
the repo in Vercel, and set `DATABASE_URL` (and `GEMINI_API_KEY`) as env vars.
