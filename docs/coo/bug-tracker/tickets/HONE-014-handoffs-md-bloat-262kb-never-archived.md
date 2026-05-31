# HONE-014 — handoffs.md is 262 KB — closed handoffs and the full build log never archived

```
TYPE:            Task
SEVERITY:        P3
CATEGORY:        Data
SCREEN:          Other
RECIPE:          
ASSIGNEE:        File Organiser
EPIC:            (none)
FOUND IN BUILD:  n/a (docs file on main)
FIX ATTEMPTED:   (blank)
TARGET BUILD:    (backlog — docs, not an APK)
REPRODUCIBLE:    Always
DEVICE:          n/a (repo)
GOLDEN RULE:     none
ROOT CAUSE:      Closed handoffs and every historical build-log row (#95 onward) have never been archived. The 7-day archive rule (CLAUDE.md Part 1 / COO file-hygiene directive) has not been enforced on this file, so it has grown to ~262 KB.
```

**GitHub Issue:** — · **Filed:** 2026-05-31 · **Reporter:** COO

---

## Repro

1. On `main`: `wc -c docs/coo/handoffs.md` → ~262,000 bytes.
2. Read the file: the Build log holds every row from #95 to #129 inline; the Open-handoffs section carries handoffs closed weeks ago.

## Expected

`handoffs.md` holds OPEN coordination plus the last ~7 days of closed items only. Older build-log rows and closed handoffs live in `docs/archive/handoffs-YYYY-MM.md`. The file stays small enough that large writes don't risk R-014 truncation.

## Actual

262 KB single file. Nothing has been archived. This is the direct enabler of [[HONE-013]] — a file this large is exactly where large-write truncation happens.

## Hypothesis

Archive everything closed > 7 days into `docs/archive/handoffs-2026-05.md`; split the historical build log out into its own archived ledger (or `build-history.csv`, which already exists). Keep the live file lean.

## Linked tickets

[[HONE-013]] — recover the truncated tail in the same pass before trimming.

---

## COO TRIAGE — 2026-05-31

_Added by COO._

- **Severity:** P3. Pure hygiene — no functional impact. But it's the root enabler of the P2 truncation, so it's not "ignore."
- **Sequencing:** File Organiser pass, paired with [[HONE-013]] recovery. Recover first, then archive.
- **Blocks:** nothing.
