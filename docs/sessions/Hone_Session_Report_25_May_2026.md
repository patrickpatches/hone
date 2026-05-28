# Hone Session Report — 25 May 2026

**Role:** Product Designer
**Focus:** Recipe-detail redesign challenge — produce an independent concept (v4) that either improves meaningfully on v3 or argues honestly why v3 is already right. Outcome: built v4 "The Pass" — keeps v3's strong bones, fixes four real weaknesses, recipe-generic for all food types now and future. Then, on Patrick's feedback, built **v5** (two requested changes + three best-practice patterns).

---

## Update — v5 (after Patrick approved the v4 direction)

Patrick: "ok i like it, but remove the Makes 2 burgers at the top because we are inputting how many burgers below anyway. Put the flag origin instead. If you have access to the best design resources… how would you improve this? make v5."

Built `docs/prototypes/recipe-detail-v5.html`:

- **Removed the top "Makes N" yield** (redundant with the stepper; it pre-asserted a number before the user chose). Glance row is now a clean trio: **time · effort · origin**.
- **Origin shown as a flag** — **SVG, not emoji** (Android emoji-flag support is unreliable). Honesty rule: country cuisine → flag; **regional cuisine (Levantine) → neutral globe + countries named**, never a single flag (sidesteps the no-Israeli-labelling rule).
- **Sticky bottom "Start Cooking" bar** — fades in once the inline CTA scrolls off (NYT Cooking / Airbnb / checkout pattern).
- **Collapsing Material-3 top app bar** — back + recipe title fade in as the hero scrolls away.
- All v4 wins carried over. Demos show the flag path (Japanese) and the honest globe path (Levantine).

**Glance-row fix + approved for build:** Patrick's screenshot showed value/label inline ('20 min start to plate' on one line, pushing 'American' off-screen). Fixed — value now stacks above its label. Patrick then said "get the engineer to build it", so the handoff is flipped to ✅ APPROVED · BUILD for the Senior Engineer (full spec in `docs/coo/handoffs.md`). Recommended scope: no-schema changes now, allergens + richer equipment schema as a follow-up. Engineer ships to main; Patrick triggers the EAS build + validates on-device (R-015). No build dispatched by Designer.

---

## What I did

Read the brief, `CLAUDE.md`, `docs/FILE_MAP.md`, `docs/prototypes/recipe-detail-v3.html` (the current best attempt), the v3 schema-contract handoff, and the real `mobile/src/data/types.ts` to ground every field claim. Then designed and built **`docs/prototypes/recipe-detail-v4.html`** — a self-contained phone-frame prototype (Smash Burger example) plus a written rationale and three "works for every recipe" demos below the frame.

**My honest verdict:** v3 is a good skeleton but not the right answer as-is. I kept its bones and fixed four places where it was quiet, incomplete, or only worked because the example happened to be a burger.

## The five changes (vs v3)

1. **Why-note elevated.** v3 set the per-step "why" in muted grey — the lowest-contrast text on the page — which quietly contradicts CLAUDE.md's core rule ("explain the underlying reason, *always*"). v4 lifts it to ink-soft on a gold-dim panel with a full-strength gold marker. Calm, but no longer a footnote. CSS only.
2. **"At a glance" tells a story.** Leads with the two decision-drivers (time + effort, weighted/labelled), demotes yield + cuisine, and renders **active vs total time** when they diverge (the real planning fact for slow dishes). Reads existing time fields.
3. **Allergen / dietary strip** — the head-chef "before you commit" signal Patrick chose. Neutral, honest, no alarm colours. The one genuinely new data need; flagged to engineering, not faked.
4. **Equipment defaults collapsed but names the blockers in the closed summary** ("Needs: cast-iron pan, flat spatula · +2 more"). Serves first-timers (blocker visible) and repeat cooks (out of the way) at once.
5. **Leftover nudge** under the stepper, rendered only when `leftover_mode !== 'none'` — v3 dropped this field entirely.

Kept from v3: single rust "Start Cooking" CTA + ghost secondary actions, one gold section-header language, equipment-before-ingredients, the carousel→full-method jump, a why-note on every step.

## Recipe-generic (Patrick: "all recipes now and future, all food types not just burgers")

The page is built from recipe fields, never burger assumptions — stepper label is `output_unit`/`output_unit_plural`, hero pulls `hero_url` with a designed typographic fallback when null, the glance row reads `total/active_time_minutes`, and every section has a graceful empty state. Proven in three demos below the frame: a **no-photo future recipe** (typographic title card), a **slow braise** (active≠total, leftover nudge on), and **bread** (count unit "loaves", no-equipment behaviour).

## Schema flags raised to engineering (no schema change without flagging)

- **`allergens` / `dietary` don't exist** on the Recipe type yet — needed for change #3. Either add the fields + migration + seed values, or ship the layout first and add allergens as a follow-up (the strip drops out cleanly).
- **`equipment` is `string[]`**, too thin to carry the Essential/Optional badge + note that both v3 and v4 render. Enrich the field or drop the badges — don't render badges off data that isn't there.

## Status

- `recipe-detail-v4.html` — **DELIVERED**, awaiting Patrick's visual approval + a steer on build scope (all five changes incl. allergen schema, vs. four no-schema changes now). No engineer build dispatched (Designer recommends, Patrick approves).
- Handoff written in `docs/coo/handoffs.md` (→ Patrick + Senior Engineer, newest at top).

## Files touched

- `docs/prototypes/recipe-detail-v4.html` — NEW.
- `docs/coo/handoffs.md` — new OPEN handoff at top of Open handoffs.
- `docs/sessions/Hone_Session_Report_25_May_2026.md` — this report.

## Housekeeping flag (still outstanding, outside my lane)

`docs/FILE_MAP.md` — **✅ FIXED 2026-05-25.** On `main` the file was truncated mid-line (a prior conflict resolution kept a broken HEAD fragment and silently dropped the repo-hygiene rules + the entire "What does NOT belong in this repo" section). Restored the lost content, refreshed the date, and added the current prototype index. (My local checkout still showed the older unresolved markers — another symptom of the stale-local problem.)

## Acting-lead housekeeping pass (2026-05-25)

Patrick flagged that my read of the build state was stale and told me to take ownership and organise things. Root cause found and fixed:

- **The build log in `handoffs.md` had silently lost rows #118–#123.** The builds shipped (commits exist) but the table stopped at #117, so the repo's own ledger sat six builds behind Patrick's phone. **Backfilled all six** from real commit history: #118 `808970d` (10 hero URLs wired) · #119 `2326d6f` (hummus chocolate-sundae fix) · #120 `9edbdff` (UI polish bundle) · #121 `adc4522` (kitchen hero slideshow) · #122 `bd3c7ee` (approved pantry-haves redesign + icon library) · #123 `0781040` (pantry bronze headers).
- **Added a build-log integrity rule** at the top of the build-log section: top row must equal Patrick's installed build; reconcile against `git log`/`main` before trusting it; never edit from a stale local checkout.
- **Restored the truncated `FILE_MAP.md`** (see above).

**Two systemic causes, named for the record:** (1) the recurring R-014 truncation gremlin has now eaten content from at least three files (seed-recipes, this session's report, FILE_MAP, and the build-log rows) — the CI guard from build #112 only covers `.ts`/`.tsx`, not markdown; widening it to docs is worth a ticket. (2) The local working tree at `C:\Users\patri\hone` runs behind `main`, so reading local files gives a stale picture — repo/build state must be reconciled against GitHub `main`, which is what surfaced this whole issue.

**Current truth (reconciled):** build #123 on Patrick's phone = the pantry redesign + bronze category headers. Recipe-detail v4/v5 = prototype + APPROVED build spec, **not yet implemented in the app** — that's the engineer's next build.

---

## v5 crashed on-device → aesthetic-only v6 (2026-05-28)

v5 was built by the engineer (#124) and **force-closed on opening any recipe**. Root cause (from git history + the engineer's #126 closeout): a **Fabric native-driver scroll animation** in the collapsing top app bar / sticky CTA bar — the exact scroll-driven chrome I'd specced. The #125 hotfix (native→JS driver) didn't hold; #126 reverted to the pre-v5 screen. **That's on me** — those patterns are crash-prone under Fabric and I should have flagged the risk in the v5 spec.

Patrick asked for an **aesthetic-only** redesign instead. Built `docs/prototypes/recipe-detail-v6.html`: a pure visual restyle of the working build-#126 browse screen using the real `tokens.ts` dark palette — tactile thumb-sized buttons, one-job-per-colour palette (unifying #126's stray `#5B8FD4` blue onto the sky token), calmer hierarchy. **Every content block kept; no new data; no animated/sticky/scroll behaviour** — so it cannot reproduce the crash. Awaiting Patrick's visual review.

Housekeeping: build log already carried #124/#125/#126 (engineer logged them); I flipped the v5 build handoff to 🛑 SUPERSEDED, opened the v6 handoff, and closed Issue #5 as the crashed approach.

## v7 — vision concept (2026-05-28 PM)

After the v5 crash + v6 safe-restyle, Patrick asked the bigger question: "if you were building the best-designed, most ergonomic recipe app, what's your honest critique and what would you do?" Gave him the teardown (the recipe page is built as a document to read, not a tool to cook with) and then drafted a full vision concept at `docs/prototypes/recipe-detail-v7.html`.

**v7 "Mise"** — two paired surfaces: browse moves to a warm-paper editorial page (food photography leads); cook stays true-OLED, single full-screen step with the doneness photo as the hero and a knuckle-sized "Next" tap zone for arm's-length use. **Display font: Fraunces** (variable serif, real opsz axis, ports clean to Android — replacing Playfair Display whose hairlines die on Android anti-aliasing at small sizes). **Inter stays.** Pantry signal ("you have 7 of 9 ingredients · 2 missing") becomes the new top of the recipe page — the kill feature surfaced at decide-time. Honest-swap trade-offs (golden rule 5) surfaced inline. Allergen chips kept honest.

**Safe to build, by design:** no animated headers, no native-driver scroll, no sticky-via-Animated bars — the v5 crash class is structurally impossible. StyleSheet + simple state only.

Handoff opened as a DIRECTION CALL (not a build order). Three options offered to Patrick: pursue v7 phased, take parts of it, or stick with v6.
