# Hone Session Report — COO Scaffolding

**Date:** 29 April 2026 (second session of the day)
**Duration:** ~2 hours
**Project:** Hone (cooking app)
**Repo:** https://github.com/patrickpatches/hone
**Role:** COO

---

## Summary

Stood up the COO operating system — the layer the project was missing where business runs as opposed to code. Six new docs in a new `docs/coo/` folder, four specialist briefs covering Product Designer, Photography Director, QA Test Lead, and Culinary & Cultural Verifier, FILE_MAP.md updated, and a recommendation to move the launch date from June 2026 to 24 July 2026 with the reasoning written down.

This session does not touch app code. It establishes the framework for every future specialist session.

---

## What was created

### COO operating system (six new files in `docs/coo/`)

| File | Purpose |
|---|---|
| `operating-rhythm.md` | Weekly cadence (Monday plan / Wednesday books / Sunday critical-path), per-session rituals, decision rights matrix |
| `handoffs.md` | Cross-chat baton-pass log with 7 open handoffs as of session end |
| `command-centre.md` | State-of-Hone snapshot — top risk, top blocker, this week's priorities, north-star metric, critical-path table |
| `launch-plan.md` | Calendar-driven plan with milestones from now to 24 July 2026 |
| `risk-register.md` | 10 active risks scored by likelihood and impact, with mitigations and triggers |
| `decision-log.md` | Business decisions log (distinct from technical ADRs); two open recommendations awaiting Patrick |

### Specialist briefs (four new files in `docs/coo/specialists/`)

| File | Role |
|---|---|
| `product-designer.md` | The unified UX/UI/interaction role. Writes mockups, owns visual coherence, microcopy, accessibility-from-the-start |
| `photography-director.md` | Owns shot lists, visual coherence across 60+ launch shots, post-processing standards, alt-text |
| `qa-test-lead.md` | Owns smoke-test checklist, performance budget, accessibility audit, bug triage, release sign-off |
| `culinary-verifier.md` | Owns Rule 1 attribution accuracy, Rule 5 substitution honesty, cultural sensitivity (no Israeli labels for Levantine, etc.) |

### Updated

- `docs/FILE_MAP.md` — registered the new `docs/coo/` folder, all six COO docs, all four specialist briefs, and the planned `docs/coo/photography/`, `docs/coo/qa/`, and `docs/coo/culinary-audit.md` files. Added naming conventions for specialist briefs, decision log entries, and risk register entries.

---

## Key recommendations made (awaiting Patrick)

1. **Push launch from June 2026 to 24 July 2026.** Reasoning: photography is 4–5 calendar weekends, Closed Testing requires 14 consecutive days with 12 testers, Play Console verification is 3–14 days at Google's pace, Play review is 3–7 days. AI accelerates code; it doesn't accelerate the gates. June would compress all four and ship a 3.7-star app instead of a 4.5-star one. (Logged as DECISION-001.)

2. **Defer Rule 3 (user-added recipes) from v1 to v1.1.** Reasoning: the kill feature is the seeded chef-inspired library with stage photos. Ship that perfectly. User-added recipes is 3–4 sessions of engineering plus a substantial test surface, and it's the kind of feature where rough edges hurt the perceived quality of the whole app. Add in v1.1 when real users are telling us what shape they want. (Logged as DECISION-002.)

3. **Rename bundle ID now**, before Closed Testing. Currently `com.patricknasr.simmerfresh`. Should become `com.patricknasr.hone`. Doing this now is clean (no real users yet). Doing it during Closed Testing risks resetting tester progress and the 14-day Google clock. (Logged as R-004 in risk register, OPEN handoff to Patrick.)

---

## Other rules reviewed (as Patrick asked)

The five Golden Rules from CLAUDE.md, reviewed for v1 fit:

- **Rule 1 (chef attribution)** — KEEP, tighten the wording so contested-origin or generic dishes credit cuisine + region rather than inventing a chef.
- **Rule 2 (smart scaling)** — KEEP, but be honest about its limits. Linear by default, fixed for eggs/leavening, "with care" tag for things that don't scale linearly. Honesty under Rule 5.
- **Rule 3 (user-added recipes)** — DEFER to v1.1. (See above.)
- **Rule 4 (stage-by-stage visuals)** — KEEP as the hill we die on. The differentiator. If a recipe doesn't have stage photos by launch, it doesn't ship at launch.
- **Rule 5 (honest about limitations)** — KEEP unconditionally. Cheap to enforce, defines the voice.

Plus polish-bar rules I'm proposing to add to CLAUDE.md (pending Patrick approval — separate handoff):
- Performance budget: cold start <2s, scroll 60fps, search <200ms
- Three-tap floor: app open → cooking in three taps maximum
- Recovery on every error: no dead-end states
- Zero third-party SDKs in v1: privacy story is "data never leaves your device"
- Accessibility floor: WCAG 2.1 AA, TalkBack labels, 200% text scale, 44dp touch targets

---

## Open handoffs at session end

7 open handoffs in `docs/coo/handoffs.md`:

1. → Patrick — confirm launch date (24 July recommended)
2. → Patrick — bundle ID rename now or later
3. → Senior Product Engineer — implement Substitution UI
4. → Product Designer — design the Substitution bottom-sheet
5. → Photography Director — build the launch shot list
6. → Culinary & Cultural Verifier — audit all 44 prototype recipes
7. → QA Test Lead — own and expand the smoke-test checklist

---

## What Patrick needs to do

1. **Read `docs/coo/command-centre.md`** — that's the 60-second view from now on
2. **Confirm launch date** — yes / amend to a different date / push back further
3. **Decide bundle ID rename timing** — recommended: now
4. **Pick the 10 launch recipes** — without this, photography can't start, and photography is the longest pole
5. **Block 5 photo weekends on the calendar** — 3–4 May, 10–11 May, 17–18 May, 24–25 May, 31 May–1 Jun
6. **Confirm Rule 3 defer to v1.1** — or push back

---

## Next session priorities

When Patrick has confirmed the above, the next code session is:
- Bundle ID rename
- Substitution UI design + implementation
- Sync `BUGS.md` with GitHub Issues
- Cook Mode polish kickoff

---

## ATO Development Log Entry

- **Date:** 29 April 2026
- **Description:** COO operating system stood up — six core docs (operating rhythm, handoffs, command centre, launch plan, risk register, decision log), four specialist briefs (product designer, photography director, QA test lead, culinary verifier), FILE_MAP updated. Launch date recommendation 24 July 2026 with reasoning. Rule review of CLAUDE.md golden rules with recommendations.
- **Category:** Operations / Project Management / Documentation
- **Hours:** 2
