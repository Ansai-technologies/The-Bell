# Review packet — TEMPLATE

Date: YYYY-MM-DD | Track: <track> | Branch: <branch> | PR: #<n>

## What was built
- Plain-language summary, 3-8 bullets.

## Files changed
- `path/to/file` — one-line purpose each.

## How to verify
- Exact steps Melchizedek runs (commands, URLs, screenshots) to confirm it
  works. If a step needs his credentials, a local database, or a browser, say so.

## Risks / open edges
- What could be wrong; what was deliberately deferred.

## Decision requested
- Merge, merge-with-changes, or abandon — plus any product decision he must make.

## Merge gate (hard rule — adopted 2026-09-23)
A PR merges only when every risk flagged in this packet is either:
- RESOLVED on the branch, or
- explicitly DEFERRED with a named owner and a next step.
A packet that discloses a risk the branch does not address does not merge.
Disclosing a risk is not the same as handling it.
