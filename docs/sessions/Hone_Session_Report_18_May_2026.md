# Hone Session Report — 18 May 2026

**Role this session:** Photography Director
**Author:** Claude (Photography Director chat)
**Build context:** #117 just shipped (Senior Engineer, cook-mode-v2). Photography work this session is independent of that build and rolls into the next data-only commit.

---

## What Patrick needs to know in 30 seconds

Two recipe cards on Patrick's phone are still showing the gradient-bands fallback instead of a real photo: **Falafel** and **Pavlova**. Cook already approved the actual images on 14 May. What broke was the URL format — the Unsplash *page short codes* (`pQnsKWk5ljQ`, `5nCTfEru3Do`) got pasted into `seed-recipes.ts` instead of the *CDN paths* (the long numeric IDs Unsplash actually serves the file from). Build #113 caught the 404s and stripped them.

The correct CDN URLs were recovered into the visual-assets ledger on 15 May, but never propagated to the seed file. Today I verified both URLs return HTTP 200 from Unsplash's imgix CDN — same response shape as the working Carbonara URL Patrick's already seeing in build #113. Wrote a fresh handoff to the engineer with the exact two-line patch needed. Next engineer-chat data commit puts both heroes back on Patrick's phone. **Nothing for Patrick to do.**

No build trigger this session — handoff is waiting for engineer pickup, not a fresh build.

---

## What I did this session

### 1. Read myself in
- `CLAUDE.md` (Parts 1–4, including the never-self-close rule and session-end checklist)
- `docs/coo/specialists/photography-director.md` (the brief Patrick pointed me to)
- `docs/coo/photography/preflight-checklist.md` (so I'm aligned with what Patrick uses on shoot weekends)
- `docs/coo/handoffs.md` — all open Photography-Director-tagged items
- `docs/coo/visual-assets-ledger.md` — full ledger state

### 2. Verified the FALAFEL + PAVLOVA URLs (the open work)

The 2026-05-16 handoff from the Senior Engineer flagged that two cook-approved Unsplash heroes were returning 404 on the CDN. The handoff sat OPEN waiting on Photography Director. The ledger on 15 May had already recorded "recovered CDN IDs" for both — they just hadn't been verified live.

I curled both:

| Recipe | URL | Response |
|---|---|---|
| FALAFEL | `https://images.unsplash.com/photo-1593001872095-7d5b3868fb1d?w=600&q=80` | HTTP 200, imgix CDN |
| PAVLOVA | `https://images.unsplash.com/photo-1634324040880-63dbf9a4e5ac?w=600&q=80` | HTTP 200, imgix CDN |
| CARBONARA (control) | `https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80` | HTTP 200, imgix CDN |

Same image-CDN shape across all three. These are the same photos Cook signed off on 14 May (Anton, jade-green-interior falafel; Eugene Krasnaok, white-meringue pavlova) — only the URL format changed. No fresh cook signoff required.

### 3. Updated the ledger

- Added an **🔧 ENGINEER — USE THIS EXACT URL** callout block above the FALAFEL and PAVLOVA rows in `visual-assets-ledger.md`. Spells out the full URL string and the attribution string the engineer needs to paste into the two recipe constants.
- Annotated the table rows that the CDN was verified HTTP 200 on 2026-05-18.
- Refreshed the "Last updated" footer at the bottom of the ledger.

### 4. Wrote a new handoff to the Senior Engineer

- Block at the top of `docs/coo/handoffs.md` with the two-line code patch (`hero_url` + `hero_attribution` for each recipe), an R-014 truncation-check reminder, and a note that no fresh cook signoff is needed.
- Marked the old 2026-05-16 engineer-originated handoff as **DONE on Photography Director side** (re-sourcing complete, ball back in engineer's court via the new handoff). Per the never-self-close rule, only the engineer-build + Patrick-validation loop remains.

### 5. Refreshed command-centre.md photography metric

The metrics block was still showing **0 hero shots completed**. That was true at the time it was written but doesn't reflect the DECISION-014 placeholder pass. Updated to:

> Hero shots completed (CC-licensed placeholders per DECISION-014) | 16 of 16 launch recipes APPROVED · 14 live in build #117 + 2 (FALAFEL, PAVLOVA) awaiting engineer re-integration after #113 stripped 404'd slug URLs — verified CDN URLs handed back 2026-05-18 | 16

Also added a new row tracking integrated **stage shots** (not heroes), currently at 2 (SMASH_BURGER mise + smash, both Gemini, both CANDIDATE awaiting cook signoff). This was missing from the old metric and is the bigger remaining lift before launch.

---

## What I did NOT do (and why)

- **Did not commit to git.** Photography Director outputs this session are docs-only (handoff + ledger + command-centre). Sensible to bundle these into the next routine doc commit rather than a one-doc-line commit, or to let the engineer pick them up when they next push the FALAFEL/PAVLOVA migration commit. Patrick can let me know if he wants a Photography-Director-only commit pushed now.
- **Did not trigger an EAS build.** Per memory rule — never auto-trigger builds. The engineer's data-only commit (once they pick up the handoff) is what will trigger #118 or fold into the next regular build.
- **Did not self-close the original 2026-05-16 handoff.** Marked it DONE on the Photography Director side only — the full close requires engineer migration + Patrick on-device validation per R-015.
- **Did not start stage-shot work for the 14 remaining recipes.** The handoff queue from the COO doesn't have new stage briefs tagged → Photography Director after the hero pass. Bigger lift; needs a separate session and a fresh prioritisation pass with the COO about which 1–2 recipes get stage shots first (carbonara + roast chicken already have image briefs; smash burger has 2 of 6 stages integrated).

---

## What's on the Photography Director's plate next session

1. **Watch for the engineer's #118 migration to land.** Once it does, run the same `tail -c 200` sanity check on `mobile/src/data/seed-recipes.ts` and confirm both `hero_url` lines are well-formed and the closing `];` is intact. R-014 has caught us four times — keep eyes on this.
2. **Patrick validates the two heroes on-device.** Two cards on Kitchen: Falafel + Pavlova. Both should render a real photo with the small "Photo: [name] / Unsplash" credit pill bottom-right of the hero. Once Patrick confirms, both rows in the visual-assets-ledger move from APPROVED → INTEGRATED.
3. **Start the stage-shot prioritisation conversation with the COO.** 14 launch recipes have hero only, no stage shots. The Golden-Rule-4 product premise (*stage-by-stage visuals are the product*) is the lift between "looks like every other recipe app" and "Hone." Worth thinking about whether we ship launch with hero-only on most recipes and queue stage shots as a fast-follow, OR delay launch a week to land 1 stage shot per recipe at minimum (~14 prompts, all Gemini/DALL-E, all cook-validated). That's a COO call, not a Photography Director call alone.

---

## Files touched

| Path | Change |
|---|---|
| `docs/coo/visual-assets-ledger.md` | Added engineer integration callouts to FALAFEL + PAVLOVA rows, refreshed "Last updated" footer |
| `docs/coo/handoffs.md` | New OPEN handoff → Senior Engineer at top of stack; old 2026-05-16 engineer-originated handoff marked DONE on Photography Director side with closeout block |
| `docs/coo/command-centre.md` | Refreshed hero-shots metric; added stage-shots-integrated metric row |
| `docs/sessions/Hone_Session_Report_18_May_2026.md` | This file |

No code files touched. No `mobile/` paths touched. No build dispatched.

---

## Session continuation — HUMMUS chocolate-sundae bug + AI image brief workflow

Patrick reported mid-session that the HUMMUS recipe card on his device shows a chocolate milkshake hero, not hummus. Root-caused, fixed in the ledger, and queued for engineer. New workflow established for AI-generated stage photography across the launch set.

### What Patrick needs to know in 30 seconds (round 2)

The HUMMUS recipe card is rendering a chocolate milkshake in a mason jar with a Twix bar because `seed-recipes.ts` line 924 has the wrong photo ID (`photo-1577805947697-89e18249d767` instead of the ledger-approved `photo-1637949385162-e416fb15b2ce`). The COO's 2026-05-15 hero-migration handoff specified the right URL but the engineer wrote a different one into the seed. Engineer's next data-only commit fixes this with the two-line patch in the handoff I just added — same commit can bundle the FALAFEL + PAVLOVA URL fixes.

The Ludovic Avice plain-hummus URL is the **interim**, not the final. Patrick wants traditional hummus wa rummaan (pomegranate arils on top). Stock libraries don't have a usable shot — I searched Unsplash and Pexels exhaustively. So I wrote the AI image brief at `docs/coo/photography/image-briefs/hummus.md` for Patrick to generate via DALL-E / Imagen / Gemini in his own time. Cook then validates, engineer migrates. Two-stage fix: interim ships now, proper AI hero replaces it post-validation.

### The chocolate-sundae bug — root cause

Patrick reported: "you have a chocolate sunday hero image" on HUMMUS. I curled the URL currently in `seed-recipes.ts` line 924 — confirmed JPEG of chocolate milkshake with whipped cream, drizzle, cocoa dust, and a Twix bar. The ledger ALWAYS said the hummus hero was `photo-1637949385162-e416fb15b2ce` (Ludovic Avice's beautiful traditional hummus). The engineer's 15 May migration just wrote the wrong photo ID into the seed for HUMMUS specifically. Six other recipes in that same migration landed correctly.

Why this slipped: visual review was per-row in the ledger (URL → cook judgement of the URL's content), not per-row in the seed file (cook didn't see what the engineer wrote into the actual app). The ledger says correct URL; the seed says wrong URL; no automated comparison existed to catch the mismatch. That's a process gap to flag for the COO — but not Photography Director scope to fix unilaterally.

### Stock libraries don't have hummus-with-pomegranate-on-top

Searched Unsplash directly (`unsplash.com/s/photos/hummus`) and Pexels (`pexels.com/search/hummus`). Every candidate I found had:
- Pomegranate scattered AROUND the bowl on the table (most common pattern — looks like styling props), or
- Orange/red roasted-red-pepper hummus instead of plain pale beige (wrong dish), or
- Greek-style with feta and microgreens (wrong region), or
- Pomegranate molasses drizzle (different colour, different dish)

The Shameel mukkath series on Pexels (14930604, 14930602, 14930609, 14930612) was the closest match — pale beige hummus with mint and olive oil, plus pomegranate arils visible in frame — but the arils are on the table around the bowl, not piled on top of the hummus in the traditional hummus wa rummaan plating. Asked Patrick to choose between accepting the compromise, generating AI, or leaving the gradient fallback. He picked AI generation.

### The AI image brief

Written to `docs/coo/photography/image-briefs/hummus.md`. Follows the carbonara.md / smash-burger.md template. Key contents:

- Full DALL-E 3 / Imagen / Gemini prompt for traditional hummus wa rummaan: pale beige base, deep swirl, olive oil pool in central well, pomegranate arils piled in mound in the centre, sparing parsley along the rim, paprika dust on the outer edge, matte black bowl on dark slate, soft side light, NYT Cooking aesthetic.
- Explicit rejection criteria: no whole pomegranate fruit, no molasses drizzle, no feta, no microgreens, no wedge-of-pita-tucked-under-bowl, no Instagram saturation, no obvious AI tells (waxy arils, melted bowl edges).
- Cook validation checklist with 15+ binary checks.
- A recipe-coherence flag for the Cook: pomegranate-and-parsley isn't currently in the recipe's authored garnish substitutions, but the cook already has two ("sumac + toasted pine nuts" and "smoked paprika + toasted sesame"). Recommended: add pomegranate-and-parsley as a third authored substitution so the hero composition matches the recipe data. Flagged to Cook.

### The R-014 incident — caught and recovered

My earlier ledger edits this session triggered a truncation. Working tree went from 264 lines (HEAD baseline) → 222 lines mid-session. Lost content: full Hummus section, Pad Thai section, Flour Tortillas section, Chicken Shawarma replacement rows, ledger statistics table, hero sourcing summary.

I tried recovering via `Write` — that ALSO truncated (10-13KB seems to be a ceiling on this file). Switched to `bash` heredoc to append the missing tail back. R-014 tail check on the final file: clean. Ends with `**\n` closing bold marker. Section header count 21. Hummus rows count 4 (original REJECTED, Ludovic Avice APPROVED interim, chocolate-sundae REJECTED, AI hero PENDING). File is 326 lines total.

The R-014 guardrail (`scripts/check-ts-truncation.sh`) is for `.ts/.tsx` files, not Markdown — so it wouldn't have caught this. Worth flagging to Engineer/COO: a similar guardrail for `docs/coo/visual-assets-ledger.md` would prevent silent truncations of the photography ledger going forward. Not Photography Director scope to write, but worth raising.

### Pipeline workflow established (Patrick's directive 2026-05-18)

For all 16 launch recipes going forward:
1. Photography Director writes the image brief (per-recipe `image-briefs/{slug}.md`)
2. Patrick generates from the prompt via DALL-E 3 / Imagen 3 / Gemini
3. Photography Director adds CANDIDATE rows to `visual-assets-ledger.md` with file paths
4. Cook validates accuracy per recipe — one session per recipe — marks APPROVED or REJECTED with reasons
5. Engineer migrates APPROVED batches into `step.photo_url` in seed-recipes.ts
6. Patrick validates on-device per R-015

Hummus is the first recipe through this workflow (and also the first with a clear bug to fix as a side effect). Carbonara and Smash Burger had partial briefs written previously but no stage-shot generation has happened yet — those + Bolognese + Butter Chicken + Roast Chicken are the priority queue per Patrick's directive.

### Files touched (continuation)

| Path | Change |
|---|---|
| `docs/coo/photography/image-briefs/hummus.md` | NEW — AI prompt + cook validation checklist + recipe-coherence flag for Cook |
| `docs/coo/visual-assets-ledger.md` | Hummus section: 4 rows now (original REJECTED, Ludovic Avice interim APPROVED, chocolate-sundae REJECTED, AI hero PENDING) + engineer integration callout + chocolate-sundae bug callout. Statistics + hero summary refreshed. Full-file recovery via bash heredoc after R-014 truncation. |
| `docs/coo/handoffs.md` | NEW handoff at top → Senior Engineer (HUMMUS chocolate-sundae fix, bundled with FALAFEL+PAVLOVA URL fixes) |
| `docs/sessions/Hone_Session_Report_18_May_2026.md` | This continuation section |

No code files touched. No `mobile/` paths touched. No build dispatched.

### What's on the Photography Director's plate next session

1. Watch for engineer's data-only commit landing — should fix HUMMUS chocolate-sundae + FALAFEL + PAVLOVA all in one. Three R-014 tail checks per file.
2. Patrick generates the AI hummus hero per `image-briefs/hummus.md`. I add the CANDIDATE row to the ledger with the file path.
3. Cook runs the validation checklist on whatever Patrick generates. APPROVED or REJECTED.
4. Per Patrick's 2026-05-18 workflow directive: start writing the next image briefs in priority order — Carbonara stage shots, Smash Burger stage shots (refresh), Bolognese, Butter Chicken, Roast Chicken. Style guide (`docs/coo/photography/style-guide.md`) is the Phase 1 deliverable before the per-recipe briefs.

---

*Photography Director chat — 18 May 2026.*
