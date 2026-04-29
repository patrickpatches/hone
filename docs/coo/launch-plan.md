# Launch Plan — Hone v1.0

> Recommended target: **24 July 2026.** Pending Patrick confirmation. Supersedes the June 2026 target in earlier docs.

This is the calendar version of the critical path. The roadmap (`docs/roadmap.md`) is feature-driven; this plan is calendar-driven.

---

## Why 24 July, not June

The June date assumed we could parallelise everything. We can't, because three of the four critical-path items are calendar-time:

1. **Photography** — 4–5 weekends minimum. AI doesn't shoot food.
2. ~~Google Play Console verification — 3–14 days~~ ✅ Already done (25 April 2026). Removed from critical path.
3. **Closed Testing** — 14 consecutive days, 12 active testers minimum (Google rule for personal accounts post-Nov 2023). Cannot be compressed.
4. **Play review** — 3–7 days, sometimes longer for first submission.

Only software development is AI-accelerated. The other items are unmoved by team velocity.

If we pushed to June anyway, what gets cut: re-shoots, beta-feedback polish cycle, accessibility audit time, performance tuning. All four are differentiators. Cutting them gets us a 3.7★ app instead of a 4.5★ app.

The 24 July target preserves quality without inviting scope creep. If everything goes perfectly we ship earlier; if a milestone slips a week we still ship before September.

---

## The schedule

### Phase A — Foundation polish (29 April – 22 May, 4 weeks)

**Goal:** Code complete enough to upload to Internal Alpha track. Photography in flight.

**Week of 29 April:**
- COO operating system stood up (done 29 Apr)
- Play Console verification ✅ already done (confirmed 25 Apr)
- Patrick: confirm launch date, choose 10 launch recipes, decide what happens to recipes 11–28
- Senior Engineer: bundle ID rename → `com.patricknasr.hone`
- Photography Director: shot list published
- Patrick: first photo weekend (3–4 May) — 2 recipes shot

**Week of 6 May:**
- Senior Engineer: Substitution UI shipped (Phase 5 from roadmap)
- Patrick: photo weekend 2 (10–11 May) — 2 more recipes
- Culinary Verifier: audit pass on the 10 launch recipes
- QA: smoke-test checklist v1 owned and expanded

**Week of 13 May:**
- Senior Engineer: Cook Mode polish (wake lock, OLED dark mode, haptics) shipped
- Patrick: photo weekend 3 (17–18 May) — 2 more recipes
- Senior Engineer: performance pass — measure cold start, scroll, search latency

**Week of 20 May:**
- All v1 features behind a single tested build
- Patrick: photo weekend 4 (24–25 May) — 2 more recipes
- QA: full smoke test pass on a real device

**Milestone — 22 May 2026: Internal Alpha track live.** First AAB uploaded. Patrick verifies install from Play Console internal track, not just sideload.

---

### Phase B — Closed Testing (22 May – 19 June, 4 weeks)

**Goal:** 12+ testers active for 14 consecutive days. Real feedback collected and triaged.

**Week of 27 May:**
- Patrick: photo weekend 5 (31 May – 1 Jun) — final 2 recipes
- Patrick: identify and invite 18–20 testers (50% buffer to ensure 12 active)
- Sales & Marketing: write the tester onboarding note (one paragraph, low-friction)

**Milestone — 5 June 2026: Closed Testing track open.** Testers receive their invites. The 14-day clock starts when the first tester opts in.

**Weeks of 3 June and 10 June:**
- Photography Director: deliver final processed photos for all 10 recipes
- QA: triage tester feedback, sequence by impact
- Senior Engineer: ships fixes via EAS Updates (JS-only, no reinstall needed)
- COO: weekly status to Patrick on tester retention numbers

**Milestone — 19 June 2026: Closed Testing graduation eligible.** Google's 14-day clock complete with 12+ active testers. Ready to move toward Production track.

---

### Phase C — Polish + Production submission (19 June – 17 July, 4 weeks)

**Goal:** Apply all beta feedback that's worth applying. Build production AAB. Submit to Play.

**Week of 24 June:**
- COO + Patrick: triage all beta feedback into "ship in v1" / "v1.1 backlog" / "won't fix"
- Senior Engineer: implement v1 fixes
- Designer: final visual pass — anything testers found visually confusing

**Week of 1 July:**
- QA: full regression on the polished build
- Sales & Marketing: write Play Store listing copy, draft screenshots
- Patrick: write/host Privacy Policy at a stable URL (GitHub Pages works)
- Patrick: complete Play Console Data Safety form

**Week of 8 July:**
- Final production AAB built, signed, uploaded
- Listing assets uploaded: icon (512×512), feature graphic (1024×500), 4–8 phone screenshots (real device, not mockups)
- Submission to Play review

**Milestone — 10 July 2026: Production submission live.**

---

### Phase D — Play review + launch (17 July – 24 July, 1 week)

**Goal:** Pass Play review. Go live.

- Play review window (3–7 days typical, can be longer)
- If Play flags issues: address, resubmit. This is the buffer week.
- Patrick: prepare a quiet launch — no big push. The first 100 organic installs and reviews matter more than 10,000 from a marketing burst.

**Milestone — 24 July 2026: v1.0 public.**

---

## Slack and rebound rules

- **One milestone slip = one week to launch date.** No catch-up. Two consecutive slips = re-plan.
- **Quality floor before date floor.** If a P0 bug is open or any Golden Rule is being violated, we don't ship. Ever.
- **No scope additions inside a phase.** If a great new idea surfaces during Phase B, it goes to v1.1 backlog. New scope only at phase boundaries.

---

## What's NOT in this plan (deliberately deferred to v1.1)

- User-added recipes (Rule 3) — see `decision-log.md` DECISION-002
- The Pantry → Claude API kill feature stage 2 (`docs/pantry-to-recipe.md`)
- iOS build (per ADR 002)
- Analytics / telemetry (per CLAUDE.md, per `docs/patrick-action-list.md`)
- Any social / sharing features

---

## What this plan depends on

**Patrick:**
- Confirms launch date 24 July 2026 (or amends)
- Picks 10 launch recipes (this weekend)
- Decides what happens to recipes 11–28 already in app (see latest session report)
- Books all 5 photo weekends on the calendar before any other commitment
- ~~Play Console identity verification~~ ✅ Done 25 Apr 2026
- Recruits 18–20 testers by 1 June
- Writes Privacy Policy, hosts at stable URL
- Builds Play Store listing assets

**Specialists:**
- All briefs in `docs/coo/specialists/` adopted at session start
- Handoffs file updated every session
- COO sweeps Mondays and Sundays

**Google:**
- Identity verification within 14 days
- Play review within 7 days

If any single Patrick item slips by a week, the launch date slips by the same. The COO writes a one-paragraph status to Patrick every Sunday so slippage is visible immediately.
