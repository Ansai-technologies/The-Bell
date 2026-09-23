# Review packet — The-Bell: numeric notice search

Date: 2026-09-23 | Track: The-Bell (Gazette Watch) | Branch: labs/the-bell-notice-search

## What was built
- `GET /api/notices?q=` now treats a numeric query as an exact match on
  `notice_number` OR `notice_year`, in addition to the existing text search over
  subject line, raw text, and cited act. E.g. `q=4521` finds Gazette Notice
  No. 4521; `q=2026` lists all 2026 notices.
- `q` is now runtime-validated: repeated/structured query shapes (for example
  `?q=2026&q=2025`) are rejected with HTTP 400 instead of reaching search logic.
- Seeded `reviews/TEMPLATE.md` — the review-packet template every future
  The-Bell change will follow (schema per platform design, section 3).

## Files changed
- `server.ts` — search condition extended: if `q` is all digits, add
  `eq(noticeNumber)` / `eq(noticeYear)` to the OR. (`eq` was already imported.)
- `reviews/TEMPLATE.md` — review-packet template for the track.
- `reviews/2026-09-23-the-bell-notice-search.md` — this packet.

## How to verify
1. Read the diff: PR "Files changed" tab — confirm logic changes are scoped to
   `q` handling in `/api/notices` (runtime type validation and numeric branch).
2. Optional, needs a local Postgres: set `DATABASE_URL`, `npm install`,
   `npm run dev`, then `curl "localhost:3000/api/notices?q=2026"` — notices from
   2026 must appear even when "2026" occurs in no text field. (No database is
   connected in this environment, so this step was not run — flagging honestly.)

## Risks / open edges
- Exact-equality only: `q=4521` won't match notice "4521-A", and combined
  `number/year` queries like `q=4521/2026` are not parsed — deliberately deferred.
- The repo has no endpoint integration test suite; static validation was run with
  `npm run lint`, but no live DB-backed request test was executed here.
- Pre-existing pattern kept: search terms are interpolated into `ilike` as bound
  parameters (drizzle handles escaping); numeric path uses `Number` with
  safe-integer + int32 bounds checks, so no injection surface was added.
- Branch protection could NOT be enabled (see decision requested): GitHub
  requires Pro/Team or a public repo for private-repo branch protection. The
  loop's "no direct push" rule is convention-only until resolved.

## Decision requested
- Merge, merge-with-changes, or abandon.
- Product call: is exact numeric match the right behavior, or should a year
  query (e.g. `q=2026`) rank/fuzzy-match instead of filtering?
- Branch protection: (a) upgrade the org to GitHub Team, (b) make The-Bell
  public, or (c) accept convention-based enforcement for now.
