# Risk Register

> The list of things that could derail Hone's launch, scored by likelihood and impact. COO updates weekly. Specialists add new risks when they discover them.

## Scoring

- **Likelihood:** Low / Medium / High
- **Impact:** Low (minor delay) / Medium (1–2 week slip) / High (launch blocked or quality compromised)
- **Status:** 🟢 Watching · 🟡 Active · 🔴 Triggered (mitigation needed now)

## Format

Each risk has: ID, title, likelihood, impact, status, owner, mitigation, trigger condition.

---

## Active risks

### R-001 · Photography schedule slippage
- **Likelihood:** High
- **Impact:** High
- **Status:** 🟡 Active
- **Owner:** Photography Director + Patrick
- **Why this matters:** Stage-by-stage photos are Golden Rule 4 and the launch differentiator. 60 shots minimum across 10 recipes, requiring 4–5 cooking weekends. Each weekend skipped pushes launch by one week.
- **Mitigation:** Photography Director publishes shot list before 3 May. Patrick blocks weekends 3–4 May, 10–11 May, 17–18 May, 24–25 May, 31 May–1 Jun on the calendar before any other commitment. If a weekend is missed for any reason, the launch date moves accordingly — this is a non-negotiable input.
- **Trigger:** Two consecutive weekends missed. Promote to 🔴.

### R-002 · Play Console identity verification stalls
- **Likelihood:** —
- **Impact:** —
- **Status:** ✅ CLOSED 2026-04-29
- **Owner:** Patrick
- **Resolution:** Confirmation email from Google Play Console dated 25 April 2026 (07:33) — "All of your Google Play apps have been successfully registered to meet Android developer verification requirements." Account is verified and registered.
- **Follow-on note:** Per the same email, Google requires all package names installable on certified Android devices to be registered by **September 2026**. The current bundle ID `com.patricknasr.simmerfresh` is registered. When we rename to `com.patricknasr.hone`, the new package name must be registered in Play Console — this happens automatically when the first AAB with the new bundle ID is uploaded, but earlier registration via the Android developer verification page is also possible. See R-004.

### R-003 · 12-tester rule for Closed Testing
- **Likelihood:** Medium
- **Impact:** High
- **Status:** 🟡 Active
- **Owner:** Patrick
- **Why this matters:** Google requires 12 testers active for 14 consecutive days for personal accounts opened after Nov 2023 before Production track opens. If fewer than 12 testers stay active, the 14-day clock resets.
- **Mitigation:** Recruit 18–20 testers (50% buffer) by 1 June. Send reminder messages every 3 days during the 14-day window. Track activity in a spreadsheet.
- **Trigger:** Fewer than 14 testers confirmed by 1 June 2026. Promote to 🔴.

### R-004 · Bundle ID rename breaks installed app + September 2026 registration deadline
- **Likelihood:** Medium (will happen if not handled correctly)
- **Impact:** Medium-High
- **Status:** 🟡 Active
- **Owner:** Senior Engineer (code change) + Patrick (Play Console)
- **Why this matters:** Current bundle ID is `com.patricknasr.simmerfresh`. Changing it makes Android treat the new APK as a different app. If renamed during Closed Testing, all tester data and progress resets and Google's 14-day clock may restart. Compounding factor: Google's email of 25 April 2026 confirms all package names must be registered by September 2026 to remain installable on certified Android devices. The new package name `com.patricknasr.hone` must be registered before that deadline.
- **Mitigation:** Rename in next engineer session (early May), before any tester is invited. After rename, upload first AAB to Play Console under the new bundle ID — this auto-registers the new package name. Validate APK installs cleanly. Document in ADR.
- **Trigger:** Rename attempted during or after Closed Testing kickoff, OR new bundle ID still unregistered by 1 August 2026.

### R-005 · Recipe attribution misses or breaks
- **Likelihood:** Medium
- **Impact:** Medium (legal exposure low, brand exposure higher)
- **Status:** 🟡 Active
- **Owner:** Culinary & Cultural Verifier
- **Why this matters:** Golden Rule 1 says credit the source chef and verify every link. If a chef link is broken, attributed wrongly, or names a chef who didn't actually publish that recipe, it violates our own rules and looks worse than not attributing at all.
- **Mitigation:** Culinary Verifier audits every shipping recipe before launch. Per-recipe pass/fail. Broken or unverifiable attributions either get fixed or the recipe is reframed as a regional dish (not chef-attributed).
- **Trigger:** Any shipping recipe with unresolved attribution by 7 June 2026.

### R-006 · Cultural mislabelling of Levantine recipes
- **Likelihood:** Low
- **Impact:** High
- **Status:** 🟢 Watching
- **Owner:** Culinary & Cultural Verifier
- **Why this matters:** CLAUDE.md is explicit: "No Israeli-labelled recipes." This is a values rule. Mislabelling a dish like musakhan, hummus, or kafta as Israeli — or failing to credit Levantine origin — is a culturally serious error and one that critics will catch.
- **Mitigation:** Verifier explicitly checks every recipe in the Levantine category and any dish with contested origin. Defaults to crediting cuisine + region, not nation-state.
- **Trigger:** Any cultural mislabel discovered post-launch. Pull recipe immediately, issue fix in next OTA update.

### R-007 · OneDrive file corruption during builds
- **Likelihood:** Medium (already happened once)
- **Impact:** Medium
- **Status:** 🟡 Active
- **Owner:** Senior Engineer
- **Why this matters:** Session 29 April found 1,000+ null bytes appended to `plan.tsx` from OneDrive sync. Caused build failure. Could happen again silently.
- **Mitigation:** Pre-commit hook that strips null bytes and rejects commits with corruption. Document in `docs/RELEASING.md`.
- **Trigger:** Any future build failure traced to file corruption.

### R-008 · Solo founder + AI team — Patrick is single point of failure
- **Likelihood:** Low (per session) / High (across project)
- **Impact:** High
- **Status:** 🟢 Watching
- **Owner:** Patrick
- **Why this matters:** Patrick is the only on-device validator, the only photographer, the only person who can answer Play Console challenges. If he's unavailable for any reason (illness, travel, life), the project pauses fully.
- **Mitigation:** Document everything in this repo (already happening). Keep secrets and keys out of his head and into a password manager. For launch readiness specifically, identify one trusted second person who could install the APK and validate basic flows in a pinch.
- **Trigger:** Any extended Patrick absence during the 14-day Closed Testing window.

### R-009 · Performance degradation as recipe library grows
- **Likelihood:** Medium
- **Impact:** Medium
- **Status:** 🟢 Watching
- **Owner:** Senior Engineer + QA Test Lead
- **Why this matters:** Search and pantry-match scoring run client-side. With 10 recipes today, performance is fine. At 100+ recipes (post-launch growth), naive implementations will start to feel slow on low-end Android devices.
- **Mitigation:** Performance budget written into CLAUDE.md (cold start <2s, scroll 60fps, search <200ms). QA measures these on every release. Add indexing and result memoisation before they become a problem.
- **Trigger:** Any performance metric breached on a mid-range device test.

### R-010 · Substitution truthfulness lapses
- **Likelihood:** Medium
- **Impact:** Medium
- **Status:** 🟢 Watching
- **Owner:** Culinary & Cultural Verifier
- **Why this matters:** Golden Rule 5 demands honesty about limitations. Telling a user that vegan ricotta is a fine swap in carbonara violates the rule because it produces a fundamentally different dish. Bad substitutions undermine the entire app's credibility.
- **Mitigation:** Every substitution audited for truthfulness, with the "what changes" note required to be specific (flavour, texture, appearance). "Compromise" tag used liberally — never hide a tradeoff.
- **Trigger:** Any review feedback flagging a misleading substitution.

---

## Risks closed

_(Empty — first version of register.)_
