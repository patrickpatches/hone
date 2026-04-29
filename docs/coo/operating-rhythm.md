# Operating Rhythm

> Last updated: 2026-04-29 by COO. Read this at session start, alongside CLAUDE.md and FILE_MAP.md, in any specialist chat.

This is how Hone runs week to week. The cadence is anchored to the Wednesday accounting day so the books and the work stay in lock-step.

---

## Why a rhythm exists

Every Claude chat starts with a fresh context window. The only memory that crosses chats is the files in this repo. Without a fixed cadence and shared artefacts, three things go wrong: specialists do duplicate work, baton passes get dropped, and the critical path drifts because no one is tracking it. The rhythm below is the smallest set of rituals that prevents those failure modes.

---

## The weekly cycle

### Monday — Plan the week (COO)

The COO chat reads:
1. `BUGS.md` (synced from GitHub Issues)
2. `docs/coo/handoffs.md` (open baton passes from last week)
3. `docs/coo/command-centre.md` (state going into the week)
4. `docs/coo/risk-register.md` (anything red?)

Then writes:
- The week's priorities into `command-centre.md` under "This week"
- New handoffs into `handoffs.md` if any need to be queued
- Any new risks into `risk-register.md`

Output: a clear answer to "what are we shipping this week and what's blocked."

### Wednesday — Books and KPIs (Accountant + COO)

Per CLAUDE.md Part 3, every Wednesday the accountant chat:
1. Reads new session reports in `docs/sessions/`
2. Updates `docs/Hone_Development_Log_FY2025-26.xlsx`
3. Updates the expense tracker if Patrick supplied receipts

Same day, the COO chat updates the command centre with this week's KPIs (build count, recipes ready, photos shot, testers active when relevant).

### Sunday — Critical-path check (COO)

The COO chat reads `docs/coo/launch-plan.md` and `docs/coo/risk-register.md`, then:
- Confirms each milestone is still on track
- Promotes any risk that crossed a threshold to red
- Updates the command centre with "weeks to launch" and "biggest threat to that date"
- Writes a one-paragraph status note Patrick can read on his phone

---

## Per-session rituals (every chat, every session)

### At session start

1. Read `CLAUDE.md` — the rulebook
2. Read `docs/FILE_MAP.md` — know where things are
3. Read `BUGS.md` — what's broken
4. Read `docs/coo/handoffs.md` — anything tagged for your role
5. Read your specialist brief in `docs/coo/specialists/<your-role>.md` if you have one

### During the session

- If you need work from another specialist, write a handoff entry. Don't try to solve it in your lane.
- If you make a business decision (not technical), log it in `decision-log.md`.
- If you discover a new risk, add it to `risk-register.md`.

### At session end

1. Close any handoffs you completed (mark them DONE with a date)
2. Open new handoffs if you finished something that another specialist needs to pick up
3. Write a session report to `docs/sessions/Hone_Session_Report_DD_Month_YYYY.md` (or append to today's if one exists)
4. Commit and push with a meaningful message

---

## Decision rights — who calls what

| Decision type | Who decides |
|---|---|
| Product vision, golden rules, recipe inclusion | Patrick |
| Launch date and scope cuts | COO recommends, Patrick approves |
| Technical architecture | Senior Engineer recommends, written as ADR |
| Visual design and interaction patterns | Product Designer recommends, Patrick approves visually |
| Photography style and shot selection | Photography Director |
| What ships in the build, when | COO |
| Bug severity and triage order | QA Test Lead recommends, COO sequences |
| Cultural / culinary verification | Culinary Verifier has veto power on Rule 1 + cultural sensitivity |
| Money out the door | Patrick (always) |
| Money categorisation, ATO compliance | Accountant |

The principle: experts decide in their lane. Patrick has final authority on anything user-facing or money-related. The COO sequences the work and unblocks the experts.

---

## Communication idioms

When writing a handoff, decision log entry, or risk, use these prefixes so they're skimmable:

- **HANDOFF →** start of every handoff entry, name the receiving specialist
- **DECISION:** start of every decision log entry
- **RISK:** start of every risk register entry
- **BLOCKED:** anywhere a specialist is stuck waiting on someone

Patrick is referred to by name. Specialists are referred to by their role title (Product Designer, Photography Director, etc.) — never by chat instance ID, because chat instances are disposable but the role is not.

---

## What this rhythm does NOT replace

- It does not replace CLAUDE.md (the rulebook)
- It does not replace ADRs (technical decisions)
- It does not replace session reports (the diary)
- It does not replace BUGS.md (the bug surface)

It sits alongside them as the layer where business actually runs.
