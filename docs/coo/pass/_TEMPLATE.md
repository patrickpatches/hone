# HONE-NNN — One-line subject (≤ 80 chars, describe symptom not cause)

<!--
COPY THIS WHOLE FILE. Fill in every BLOCK from the top down.
The structured block at the top is non-negotiable — the engineer parses it on sight.
Append-only below. Never delete a prior block; it's the audit trail.
-->

```
TYPE:            Bug | Task | Feature | Epic
SEVERITY:        P0 | P1 | P2 | P3
CATEGORY:        UI | Crash | Data | Perf | Content | A11y | Flow
SCREEN:          Kitchen | Recipe-Browse | Recipe-Cook | Pantry | Shop | Settings | Other
RECIPE:          (recipe id e.g. HUMMUS, or leave blank if not recipe-specific)
ASSIGNEE:        Engineer | Designer | Cook | Photography | Bug Tester | Patrick | COO | (unassigned)
EPIC:            EPIC-v7-mise | EPIC-pantry-first | EPIC-photography | EPIC-launch-ready | (none)
FOUND IN BUILD:  #N  (commit <short-sha>)
FIX ATTEMPTED:   #N  (commit <short-sha>) | (blank until engineer fills)
TARGET BUILD:    #N  (which build this is queued to ship in; blank = backlog)
REPRODUCIBLE:    Always | Sometimes | Once
DEVICE:          Patrick's Pixel (Android 14) | other
GOLDEN RULE:     none | #1 attribution | #2 scaling | #3 user-recipes | #4 stage-photos | #5 honest-limits
ROOT CAUSE:      (blank until known. one sentence when known.)
```

**GitHub Issue:** #NNN · **Filed:** YYYY-MM-DD · **Reporter:** Bug Tester | Patrick

---

## Repro

1. Open Hone (cold or warm — state which).
2. Navigate to … (be exact: tab, then row, then button).
3. Tap …
4. Observe …

Mechanical, numbered, terse. If the engineer can't reproduce in 90 seconds, the ticket is incomplete — improve it before pushing.

## Expected

One line. What should happen.

## Actual

One line + screenshot. What does happen.

**Screenshot:** drop the image into `docs/coo/pass/screenshots/HONE-NNN-<short-tag>.png` and reference here. If it's a video/GIF, same folder.

If this is a regression — i.e. it worked in a prior build — state which build last worked.

## Hypothesis (optional)

Best guess at root cause. **Doesn't bind the engineer** — just helps them start. Leave the section out if you have none.

## Linked tickets / recipes (optional)

Other recipes or screens that probably show the same bug. Engineer fixes one root cause; we want to know how wide it spreads.

---

## COO TRIAGE — YYYY-MM-DD

_Added by COO._

- **Severity confirmed / adjusted:** P_ (with one-line reason if adjusted)
- **Sequencing:** fix in build #N alongside …, OR dedicated build #N
- **Blocks:** what waits for this fix (often nothing)

---

## FIX ATTEMPTED — Build #N (commit \`<hash>\`) — YYYY-MM-DD

_Added by Senior Engineer. Also update the structured block above: `FIX ATTEMPTED: #N (commit <hash>)` and, when known, `ROOT CAUSE: <one sentence>`._

- **Root cause:** one sentence.
- **Code change:** one sentence + the file path(s).
- **Why this won't regress the symptom:** one sentence.
- **Linked tickets fixed in the same build:** if any.

Per R-015: not self-closing. Awaiting Bug Tester re-test + Patrick on-device validation.

---

## RE-TEST — Build #N — YYYY-MM-DD

_Added by Bug Tester after installing the fix-attempted build._

Result: **CONFIRMED FIX** | **PARTIAL** | **NOT FIXED** | **CAN'T REPRO**

- Re-ran repro verbatim.
- Observation: …
- If PARTIAL: describe the side-effect; link new ticket `HONE-MMM`.
- If NOT FIXED: status moves back to **REJECTED 🔴** in `BUGS.md`; GitHub Issue re-opened with the new repro block appended.
- If CAN'T REPRO: describe what's different about the build/device state; ask the engineer to add diagnostics.

This **does NOT close the ticket.** Patrick closes.

---

## CLOSED — YYYY-MM-DD by Patrick

_Added by Patrick after on-device confirmation._

One line is enough: "Confirmed on-device — bug is gone."

(After this block lands, the Bug Tester moves the file from `docs/coo/pass/tickets/` to `docs/coo/pass/tickets/closed/` and updates the GitHub Issue state to closed.)
