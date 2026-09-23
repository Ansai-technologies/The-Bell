#!/usr/bin/env python3
"""
The-Bell real Gazette ingestion — KenyaLaw AKN PDFs -> Supabase.

Laps-track v1. Polite scraper: honors robots.txt, modest rate, clear user-agent.
Usage:
    python ingest_gazette.py [--year YYYY] [--limit N] [--force] [--dry-run]

    --year YYYY   Gazette year to scan (default: current year).
    --limit N     Only process the N most recent issues (default: 8).
                  Use 0 for every issue found on the listing page.
    --force       Re-process issues already marked processed.
    --dry-run     Parse and print; do not touch Supabase.

Env (required unless --dry-run):
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

Source: https://new.kenyalaw.org/gazettes/{year}  (KenyaLaw, National Council
for Law Reporting — the official publisher of the Government Printer's PDFs).
Issue PDFs: /akn/ke/officialGazette/{YYYY-MM-DD}/{issue}/eng@{date}/source.pdf
"""

import argparse
import datetime as dt
import os
import re
import sys
import tempfile
import time
import urllib.robotparser as robotparser
from urllib.parse import urljoin

import requests

try:
    from pypdf import PdfReader
except ImportError:
    sys.exit("pypdf is required: pip install pypdf requests")

BASE = "https://new.kenyalaw.org"
UA = ("The-Bell-Gazette-Ingest/0.1 (Ansai Technologies; "
      "contact hello@ansaitechnologies.co.ke)")
LISTING_RE = re.compile(
    r"/akn/ke/officialGazette/(\d{4}-\d{2}-\d{2})/(\d+)/eng@(\d{4}-\d{2}-\d{2})")
HEADING_RE = re.compile(r"(?m)^\s*GAZETTE\s+NOTICE\s+NO\.?\s*(\d+)\s*$")
DATED_RE = re.compile(r"Dated the ([^.]{4,60}?)\.", re.IGNORECASE)
ACT_RE = re.compile(r"^\s*THE\s+.+\s+ACT\s*$", re.IGNORECASE)
PAREN_RE = re.compile(r"^\s*\((Cap|LN|L\.N\.|Legal Notice)[^)]*\)\s*$",
                      re.IGNORECASE)
MONTHS = {m: i + 1 for i, m in enumerate(
    "january february march april may june july august september october "
    "november december".split())}


def session():
    s = requests.Session()
    s.headers.update({"User-Agent": UA})
    return s


def robots_ok(sess):
    """Abort if KenyaLaw disallows our gazette paths."""
    rp = robotparser.RobotFileParser()
    rp.set_url(urljoin(BASE, "/robots.txt"))
    try:
        rp.read()
    except Exception as e:
        print(f"WARN: could not fetch robots.txt ({e}); proceeding with "
              f"polite defaults", file=sys.stderr)
        return True
    for agent in (UA.split()[0], "*"):
        for path in ("/gazettes/", "/akn/ke/officialGazette/"):
            if not rp.can_fetch(agent, urljoin(BASE, path)):
                print(f"STOP: robots.txt disallows {path} for {agent}",
                      file=sys.stderr)
                return False
    print("robots.txt: gazette paths allowed for our crawler")
    return True


def list_issues(sess, year):
    url = f"{BASE}/gazettes/{year}"
    r = sess.get(url, timeout=30)
    r.raise_for_status()
    seen, out = set(), []
    for date_s, issue_s, expr_s in LISTING_RE.findall(r.text):
        key = (expr_s, int(issue_s))
        if key in seen:
            continue
        seen.add(key)
        out.append({"date": expr_s, "issue": int(issue_s),
                    "url": f"{BASE}/akn/ke/officialGazette/"
                           f"{date_s}/{issue_s}/eng@{expr_s}/source.pdf"})
    out.sort(key=lambda x: (x["date"], x["issue"]))
    return out


def parse_date(s):
    """'18th September, 2026' -> '2026-09-18'."""
    s = re.sub(r"(\d+)(st|nd|rd|th)", r"\1", s.strip(), flags=re.IGNORECASE)
    m = re.match(r"(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})", s)
    if not m:
        return None
    day, mon, year = m.groups()
    mi = MONTHS.get(mon.lower())
    if not mi:
        return None
    return f"{int(year):04d}-{mi:02d}-{int(day):02d}"


def split_notices(text, issue_year, fallback_date):
    notices = []
    heads = list(HEADING_RE.finditer(text))
    for i, h in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(text)
        body = text[h.start():end].strip()
        lines = [ln.strip() for ln in body.splitlines()]
        lines = [ln for ln in lines if ln]
        if len(lines) < 2:
            continue
        # Header block: lines until the body prose starts.
        header, j = [], 1
        while j < len(lines) and j <= 8:
            ln = lines[j]
            if re.match(r"(?i)^(IN EXERCISE|IN PURSUANCE|NOTICE IS|TAKE "
                        r"NOTICE|WHEREAS|PURSUANT|BY VIRTUE)", ln):
                break
            header.append(ln)
            j += 1
        act_cited = next((ln for ln in header if ACT_RE.match(ln)), None)
        subject_bits = [ln for ln in header
                        if not PAREN_RE.match(ln) and ln != act_cited]
        subject_line = " — ".join(subject_bits)[:500] or None
        dated_m = DATED_RE.search(body)
        notice_date, dated_by = fallback_date, None
        if dated_m:
            notice_date = parse_date(dated_m.group(1)) or fallback_date
            tail = body[dated_m.end():].splitlines()
            sig = [ln.strip() for ln in tail if ln.strip()][:3]
            dated_by = " ".join(sig)[:300] or None
        notices.append({
            "notice_number": int(h.group(1)),
            "notice_year": issue_year,
            "subject_line": subject_line,
            "act_cited": act_cited,
            "raw_text": body,
            "notice_date": notice_date,
            "dated_by": dated_by,
            "primary_category": "uncategorized",
            "classification_tier": "rule-based",
        })
    return notices


class Store:
    def __init__(self, url, key, dry_run):
        self.url = url.rstrip("/")
        self.key = key
        self.dry_run = dry_run
        self.sess = session() if not dry_run else None

    def _req(self, method, path, **kw):
        h = {"apikey": self.key, "Authorization": f"Bearer {self.key}",
             "Content-Type": "application/json"}
        h.update(kw.pop("headers", {}))
        r = self.sess.request(method, self.url + path, headers=h,
                              timeout=60, **kw)
        if r.status_code not in (200, 201, 204):
            raise RuntimeError(f"Supabase {method} {path}: "
                               f"{r.status_code} {r.text[:300]}")
        return r

    def edition_id(self, issue):
        if self.dry_run:
            return -1, False
        r = self._req("GET", "/rest/v1/gazette_editions",
                      params={"source_url": f"eq.{issue['url']}",
                              "select": "id,processed_at"})
        rows = r.json()
        if rows:
            return rows[0]["id"], bool(rows[0]["processed_at"])
        r = self._req("POST", "/rest/v1/gazette_editions",
                      headers={"Prefer": "return=representation"},
                      json={"publish_date": issue["date"],
                            "edition_number": issue["issue"],
                            "source_url": issue["url"],
                            "pdf_downloaded": True})
        return r.json()[0]["id"], False

    def mark_processed(self, eid):
        if self.dry_run:
            return
        self._req("PATCH", "/rest/v1/gazette_editions",
                  params={"id": f"eq.{eid}"},
                  json={"processed_at": dt.datetime.now(
                      dt.timezone.utc).isoformat()})

    def upsert_notices(self, eid, notices):
        # The Government Printer occasionally reuses a notice number within
        # one issue (observed: 14724 twice in issue 165/2026, Kitale + Maseno
        # probate lists). The table's UNIQUE(notice_number, notice_year) would
        # silently drop one, so merge colliding bodies before upserting.
        merged = {}
        for n in notices:
            key = (n["notice_number"], n["notice_year"])
            if key in merged:
                prev = merged[key]
                prev["raw_text"] += ("\n\n--- ALSO PUBLISHED UNDER THIS "
                                     "NUMBER ---\n\n" + n["raw_text"])
                if n["subject_line"] and n["subject_line"] not in (
                        prev["subject_line"] or ""):
                    prev["subject_line"] = (
                        (prev["subject_line"] or "")
                        + " / " + n["subject_line"])[:500]
            else:
                merged[key] = dict(n)
        if self.dry_run:
            print(f"  [dry-run] would upsert {len(merged)} notices "
                  f"({len(notices) - len(merged)} number-collisions merged) "
                  f"(edition {eid})")
            return len(merged)
        rows = []
        for n in merged.values():
            rows.append({**n, "edition_id": eid})
        self._req("POST",
                  "/rest/v1/notices?on_conflict=notice_number,notice_year",
                  headers={"Prefer": "resolution=merge-duplicates,"
                                     "return=minimal"},
                  json=rows)
        return len(rows)


def process_issue(sess, store, issue, tmpdir, force):
    eid, done = store.edition_id(issue)
    if done and not force:
        print(f"  skip {issue['date']} no.{issue['issue']} (already processed)")
        return 0, True
    pdf_path = os.path.join(tmpdir, f"issue-{issue['issue']}.pdf")
    with sess.get(issue["url"], stream=True, timeout=120) as r:
        r.raise_for_status()
        with open(pdf_path, "wb") as f:
            for chunk in r.iter_content(1 << 20):
                f.write(chunk)
    reader = PdfReader(pdf_path)
    text = "\n".join((p.extract_text() or "") for p in reader.pages)
    notices = split_notices(text, int(issue["date"][:4]), issue["date"])
    n = store.upsert_notices(eid, notices)
    store.mark_processed(eid)
    print(f"  {issue['date']} no.{issue['issue']}: "
          f"{len(reader.pages)} pages -> {n} notices")
    return n, False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--year", type=int,
                    default=dt.date.today().year)
    ap.add_argument("--limit", type=int, default=8,
                    help="most recent N issues; 0 = all")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    sess = session()
    if not robots_ok(sess):
        sys.exit(2)

    issues = list_issues(sess, args.year)
    print(f"found {len(issues)} issues for {args.year}")
    if args.limit:
        issues = issues[-args.limit:]

    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not args.dry_run and not (url and key):
        sys.exit("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required "
                 "(or use --dry-run)")
    store = Store(url, key, args.dry_run)

    total, skipped = 0, 0
    with tempfile.TemporaryDirectory() as tmpdir:
        for issue in issues:
            try:
                n, was_skipped = process_issue(sess, store, issue,
                                               tmpdir, args.force)
                total += n
                skipped += was_skipped
            except Exception as e:
                print(f"  ERROR {issue['date']} no.{issue['issue']}: {e}",
                      file=sys.stderr)
            time.sleep(2)  # polite rate
    print(f"done: {total} notices upserted, {skipped} issues skipped")


if __name__ == "__main__":
    main()
