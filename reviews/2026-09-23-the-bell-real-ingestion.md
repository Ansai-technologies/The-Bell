# Review packet — The-Bell real Gazette ingestion

Date: 2026-09-23 | Track: Labs / The-Bell | Branch: labs/the-bell-real-ingestion

## What was built
- `scripts/ingest_gazette.py` — polite KenyaLaw scraper → Supabase upserter. Checks
  robots.txt at runtime (aborts if the gazette paths are disallowed), enumerates issues
  from `new.kenyalaw.org/gazettes/{year}`, downloads the AKN `source.pdf` per issue,
  splits on standalone `GAZETTE NOTICE NO. NNNN` headings, and extracts
  notice_number, notice_year, subject_line, act_cited, raw_text, notice_date, dated_by.
  Upserts into `notices` on the existing `UNIQUE(notice_number, notice_year)`; issues are
  tracked in `gazette_editions` so runs are idempotent (skip already-processed).
- Numbering collisions are merged, not dropped: the Government Printer reused No. 14724
  twice in issue 165/2026 (Kitale + Maseno probate lists); colliding bodies are appended
  into one row rather than silently lost.
- `.github/workflows/ingest-gazette.yml` — daily 07:00 EAT run (most recent 8 issues) plus
  manual `workflow_dispatch` for backfills (`--year` / `--limit` / `--force` inputs).
  Reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from repo secrets.
- No schema migration was needed: `notices` already carries subject_line (title),
  act_cited, raw_text (body), notice_date, dated_by (signatory), and the
  (notice_number, notice_year) unique constraint. `reviews/the-bell-schema.sql` untouched.

## Parser verification (3 real issues, 2026-09-23)
- robots.txt: gazette paths **allowed** for our crawler (verified at runtime).
- Issue 166 (2026-09-18): 132 pages → 266 notices, numbers sequential 14998–15263, 0 dupes.
- Issue 165 (2026-09-14): 97 pages → 344 parsed → 343 rows (1 numbering collision merged).
- Issue 164 (2026-09-14, special): 2 pages → 2 notices, perfect split.
- Fields: 38/266 dates parsed from notice bodies in issue 166 (rest fall back to issue
  date); signatories extracted where notices carry a "Dated the …" block.
- Full pipeline dry-run (`--year 2026 --limit 2 --dry-run`): listing → download → parse →
  simulated upsert, exit 0, 609 notices.

## Files changed
- `scripts/ingest_gazette.py` — new: the ingestor.
- `scripts/requirements-ingest.txt` — new: pypdf, requests.
- `.github/workflows/ingest-gazette.yml` — new: daily + manual runs.
- `reviews/2026-09-23-the-bell-real-ingestion.md` — this packet.

## How to verify
1. Read the script + workflow in the PR Files tab (script is ~300 lines, documented).
2. Re-run the parser locally: `pip install pypdf requests && python scripts/ingest_gazette.py --year 2026 --limit 2 --dry-run`.
3. After the human step below: Actions → "Gazette ingest" → Run workflow (year 2026,
   limit 0) → then `GET /api/notices?q=14999` returns the real LAPSSET appointment notice.

## Risks / open edges
- No Supabase project for The-Bell exists yet — the workflow fails cleanly until the
  human step is done. Nothing runs against production until secrets exist.
- KenyaLaw's listing HTML could change; the script raises loudly rather than
  half-ingesting.
- `subject_line` / `act_cited` use header heuristics; `primary_category` stays
  `'uncategorized'` and `classification_tier` `'rule-based'` until the notice-classifier
  Labs step.
- Polite by design: 2s between requests, clear UA with contact address, runtime
  robots.txt check every run. ~2–3 issues/week in practice; a full-year backfill is ~163 PDFs.

## Decision requested
- Review and merge on your return (do NOT run the workflow before the human step).
- **One human step:** create the Supabase project → run `reviews/the-bell-schema.sql` in
  the SQL editor → add repo secrets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` →
  then run the workflow manually with `limit: 0` for the full 2026 backfill.
