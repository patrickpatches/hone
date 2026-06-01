# Hone Bug Tracker — Communication Protocol

> The rules for how the **Bug Tester**, the **Senior Engineer**, and **Patrick** talk about bugs.
> If you're new to this system, read this whole file before filing or fixing anything.

---

## What this system replaces

Before this protocol, bugs were tracked in three half-systems that didn't agree with each other: GitHub Issues (Patrick's phone), `BUGS.md` (the session cache), and informal mentions in handoffs.md. Status was set five different ways. Engineers self-closed. The dashboard didn't exist.

This is the single system. Everyone follows it.

---

## The four places a bug lives

A bug has exactly **one source of truth** and three derived views:

| Place | Role | Authority |
|---|---|---|
| **GitHub Issue** at `patrickpatches/hone/issues/N` | Source of truth | Whatever the GitHub Issue says, IS the bug's state |
| `docs/coo/bug-tracker/tickets/HONE-NNN-kebab-slug.md` | Mirror file | Re-generated from the Issue. Adds full repro + diagnostic history. Read locally; never editable as the truth |
| `BUGS.md` | Session roster | Quick-glance index. Regenerated from the mirrors each session |
| Cowork artifact `hone-bug-tracker` | Patrick's desktop dashboard | Reads from `BUGS.md` + `build-history.csv` (baked into HTML). Persists; status overrides + drafts persist to localStorage |
| GitHub Pages dashboard at `/hone/bug-tracker/` | Patrick's mobile dashboard | Static deploy of the same HTML. Bookmark on phone home screen. Auto-rebuilds on every push to main |

**The dashboard NEVER reads from a stale source.** The Bug Tester syncs everything at session start.

---

## The five statuses (the only ones allowed)

```
OPEN  →  FIX ATTEMPTED  →  VALIDATED ✅       (the happy path)
                       └→  REJECTED 🔴  →  back to OPEN
                       └→  PATRICK CLOSED ✅  (if Patrick directly confirms with no re-test)
```

| Status | Who sets it | What it means |
|---|---|---|
| **OPEN** | Bug Tester (or Patrick, from phone) | Bug filed, needs engineer attention |
| **FIX ATTEMPTED** | Senior Engineer | Code shipped to main; needs build + on-device test |
| **CONFIRMED FIX (Tester)** | Bug Tester | Re-test passed in build. **Does not close the ticket.** Adds confidence; Patrick still has final word |
| **REJECTED 🔴** | Bug Tester or Patrick | Re-test failed; bug still present; goes back to OPEN with a new repro block appended |
| **VALIDATED ✅** | **Patrick only** | Patrick confirmed on his device. Issue closes |

**The cardinal rule (CLAUDE.md Part 3, R-015):** the Senior Engineer NEVER closes a ticket. The Bug Tester NEVER closes a ticket. Only Patrick closes. "I shipped the fix" ≠ fixed. "I re-tested and it works" ≠ closed.

---

## How a bug flows, beginning to end

### Step 1 — Filing (Bug Tester or Patrick)

**Tester finds a bug during a per-build pass:**

1. Open `docs/coo/bug-tracker/_TEMPLATE.md`. Copy the body.
2. File a GitHub Issue: title = the one-line subject from the template; body = the full template, filled in.
3. After GitHub returns the issue number `N`, save the mirror at `docs/coo/bug-tracker/tickets/HONE-N-<slug>.md` with the same body plus a header line `**GitHub:** #N · **Filed:** YYYY-MM-DD · **Reporter:** Bug Tester`.
4. Add a row to `BUGS.md`'s "Active tickets" table.
5. Commit + push.

**Patrick filing from his phone:** Patrick opens the repo on his phone and uses the "Bug Report" template (`.github/ISSUE_TEMPLATE/bug-report.yml`). The form asks him only the essential questions. The next time the Bug Tester syncs, the mirror file is created and `BUGS.md` updated automatically.

### Step 2 — Triage (COO)

The COO reads new tickets daily, confirms severity, sequences which build will carry the fix, and adds a one-line plan to the ticket's mirror file under a `## COO TRIAGE` block. Severity can be adjusted with a stated reason.

### Step 3 — Fix (Senior Engineer)

Engineer ships the fix, then in the SAME tree:

1. Pushes the code to `main`.
2. Adds a `## FIX ATTEMPTED — Build #N (commit <hash>)` block to the mirror file. Names the root cause, the code change, and one line about why this fix won't regress the symptom.
3. Comments on the GitHub Issue: `FIX ATTEMPTED in build #N (commit <hash>). Awaiting on-device validation. Per R-015, not self-closing.`
4. Updates the row in `BUGS.md`: status `FIX ATTEMPTED`, notes the build #.
5. **Does NOT call the GitHub Issues close endpoint.**

If the fix is bundled with several other bugs in one build, the engineer adds the same block to each ticket's mirror file.

### Step 4 — Re-test (Bug Tester)

When a build is dispatched (by any specialist) and the APK is live, the Bug Tester:

1. Installs the build.
2. Runs the exact repro from the original ticket.
3. Adds a `## RE-TEST — Build #N · YYYY-MM-DD` block to the mirror file with one of:
   - **CONFIRMED FIX** — clean.
   - **PARTIAL** — original gone, side-effect present (describe + link new ticket).
   - **NOT FIXED** — repro still triggers; status moves to **REJECTED 🔴**, ticket re-opens (in GitHub: reopen the issue and comment with the repro).
   - **CAN'T REPRO** — state doesn't recur; flag for engineer to add diagnostics.
4. Updates `BUGS.md` and `build-history.csv`.

### Step 5 — Close (Patrick only)

When Patrick confirms on his phone, he closes the GitHub Issue. The mirror file is moved from `docs/coo/bug-tracker/tickets/` to `docs/coo/bug-tracker/tickets/closed/` with a `## CLOSED — YYYY-MM-DD by Patrick` block appended. The dashboard auto-updates on next refresh.

---

## Severity rules — every ticket needs a P

| P | Meaning | Examples |
|---|---|---|
| **P0** | Launch blocker | Crash on open, data loss, golden-rule violation (Israeli label, US-English ingredient names on the launch recipes, missing chef attribution), pantry/shopping data wiped, can't enter cook mode, accessibility broken for a whole user group |
| **P1** | Visible to most users | Wrong photo on a launch recipe, wrong scaled quantity, swap pill the wrong colour, navigation deadend, recipe step that can't be advanced past |
| **P2** | Edge case or degraded | Bug only triggers on a specific recipe / specific device state / unusual flow; cosmetic regression on a non-launch recipe |
| **P3** | Polish | Spacing, alignment, a single colour value slightly off, a label that could read better |

**No "P-unknown".** If you can't decide, default to P1 and let the COO downgrade with a stated reason.

---

## Ticket ID convention

`HONE-NNN` — the `NNN` is the GitHub Issue number, padded to at least 3 digits, padded to 4 once we cross 1000.

Slugs are kebab-case, all lowercase, no recipe-IDs (they go inside the body):

- ✅ `HONE-042-recipe-method-step-number-invisible-on-cream-circle.md`
- ❌ `HONE-042-step-number-bug.md` (too vague)
- ❌ `HONE-042-HUMMUS_step_number.md` (uppercase + recipe id in slug)

---

## What does NOT go in this tracker

- **Feature requests** → `docs/coo/beta/feature-requests.md` (managed by Beta Tester Coordinator)
- **Design preference notes** without an objective failure → route to Product Designer with a screenshot, not a ticket
- **Engineer technical debt** → `docs/coo/tech-debt.md` (create if missing)
- **Build-log discipline misses** → handoffs.md build-log table (the existing convention)
- **Decisions about architecture** → `docs/coo/decision-log.md` as an ADR/DECISION

---

## What does NOT count as a re-test

- "I read the diff and it looks correct" → not a re-test
- "The CI is green" → not a re-test
- "I haven't seen the bug today" → not a re-test (have you tried to trigger it?)

A re-test is: install the build that contains `FIX ATTEMPTED`, run the original repro verbatim, observe the result.

---

## Discipline rules — non-negotiable

1. **No self-close.** Engineer and Tester both forbidden. Patrick only.
2. **Mirror files are append-only history.** Edit only to add new blocks (`## FIX ATTEMPTED`, `## RE-TEST`, `## COO TRIAGE`). Never delete a prior block — that's the audit trail.
3. **One source of truth per fact.** GitHub Issue status is the truth. If the mirror says one thing and the Issue says another, fix the mirror.
4. **The dashboard is read-only.** Anyone updating the dashboard data updates `BUGS.md` and `build-history.csv`; the dashboard reads from those files.
5. **Build-log row + bug-status change land in the SAME tree.** Same rule the engineer follows for build commits. Don't push a fix without updating the ticket in the same push.

---

## Quick reference — file layout

```
docs/coo/bug-tracker/
├── PROTOCOL.md                        — this file
├── _TEMPLATE.md                       — the canonical ticket template
├── build-history.csv                  — per-build metrics (the dashboard's source)
└── tickets/
    ├── HONE-001-<slug>.md             — active ticket mirrors
    ├── HONE-002-<slug>.md
    └── closed/
        ├── HONE-003-<slug>.md         — closed ticket mirrors (auditable)
        └── HONE-004-<slug>.md

.github/ISSUE_TEMPLATE/
└── bug-report.yml                     — the form Patric