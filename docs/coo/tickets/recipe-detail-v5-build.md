# TICKET — Recipe Detail v5 "The Pass" (browse-mode redesign)

| | |
|---|---|
| **Status** | ✅ READY TO BUILD — approved by Patrick 2026-05-25 |
| **Owner** | Senior Engineer |
| **File** | `mobile/app/recipe/[id].tsx` — **BROWSE MODE ONLY. Do not touch cook mode.** |
| **Design reference** | `docs/prototypes/recipe-detail-v5.html` (open in a browser); prior `recipe-detail-v4.html` |
| **Schema contract** | the v3 "data fields to preserve" handoff in `docs/coo/handoffs.md` — every listed field keeps a visible home; no schema change without flagging |

## Why this exists
The recipe page is the "decide whether to cook this" screen (cook mode is separate and already built). v5 keeps v3's good bones and fixes four weaknesses + adds three mobile best-practice patterns, all inside the locked tokens and the two fonts (Playfair Display + Inter). Patrick approved the direction; this is the work order.

## Before you write code
Post a short implementation plan to Patrick first: component breakdown, where the Animated collapsing header and the sticky bottom bar hook into the existing scroll view, and how you key the origin flag off `categories.cuisines[0]`. **No build is dispatched until Patrick says go.**

---

## Phase 1 — core build (NO schema changes; reads only existing fields)

**1. Hero**
- Photo via `hero_url` (expo-image, already wired) with the v5 gradient + title/chef-credit overlay; chef credit from `source.chef`, "Watch original ↗" from `source.video_url` (hide when null).
- **No-photo fallback (mandatory):** when `hero_url` is null, render a typographic title card — Playfair name + chef credit + italic tagline + thin gold rule + faint Playfair watermark — over the `hero_fallback` gradient bands.
- *AC:* a recipe with a photo and one without both look intentional; no empty/emoji block ever shows.

**2. Collapsing top app bar (Material 3)**
- Animated header tied to scroll offset; fades in (~250 dp) with back + recipe title + favourite.
- *AC:* title bar is hidden at top of scroll, fully visible once the hero is scrolled away; back works throughout.

**3. Sticky bottom Start-Cooking bar**
- Fades in once the inline CTA scrolls out of view; rust "Start Cooking" pill + an add-to-list icon button.
- *AC:* not visible while the inline CTA is on screen; visible and tappable for the rest of the page.

**4. "At a glance" trio = time · effort · origin (NO yield — the stepper sets quantity)**
- Each item is a value stacked **above** a small label (do not render label inline — that was the v5 bug Patrick caught).
- Time: one value, or `"X min active · Y total"` when `active_time_minutes` is materially below `total_time_minutes`.
- Origin keyed off `categories.cuisines[0]`: **SVG flag for COUNTRY cuisines** (American, Italian, Japanese, Thai, Mexican, French, Indian, Malaysian); **neutral globe glyph + countries named for REGIONAL cuisines** (Levantine → Lebanon/Syria/Jordan/Palestine; modern Australian). **Flags are SVG assets, never emoji.** Never fly a single flag for a region (also respects the no-Israeli-labelling rule).
- *AC:* origin never overflows the row; a regional cuisine shows the globe, not a flag.

**5. CTA hierarchy**
- One rust "Start Cooking". Ghost "Add to shopping list" + "Watch original" (hide "Watch original" when `source.video_url` is null).
- *AC:* exactly one primary (rust) action on the screen at a time.

**6. Scaling + leftover nudge**
- Stepper label from `output_unit` / `output_unit_plural` — **never hardcode "burgers"**. Long units wrap; the stepper holds its size.
- Leftover nudge under the stepper, rendered only when `leftover_mode !== 'none'`, using `extra_for_tomorrow_label`.
- *AC:* "loaves"/"cups"/"serves" all render correctly; nudge hidden on serve-now dishes, shown on leftover-friendly ones.

**7. Before you start**
- From `before_you_start[]`; default expanded; gold section header + chevron.

**8. Equipment**
- Collapsed by default; the collapsed summary names the essentials ("Needs: cast-iron pan, flat spatula · +2 more").
- ⚠ `equipment` is `string[]` today and **cannot carry the Essential/Optional badge + note** the design shows. For Phase 1, render names only (no badges) — OR do the equipment enrichment in Phase 2. **Do not fake badges off data that isn't there.**

**9. Ingredients**
- Existing rows + swap pills (`SubstitutionSheet` / `PILL_CONFIG`) unchanged. Emerald `#4FBF85` only when a swap is active.

**10. Method**
- Step preview carousel → full steps with the gold-flash jump.
- **Elevated why-note** (`why_note`): `inkSoft` text on `goldDim`, full-strength gold marker + solid gold left rule — verify WCAG AA. (v3 buried this in muted grey; that's the fix.)
- Timer chip from `timer_seconds`; step photo from `photo_url` with a graceful no-photo state.

---

## Phase 2 — schema follow-up (confirm scope with Patrick before starting)

- **Allergen / dietary strip** under the glance row: add NEW `allergens` + `dietary` fields to the Recipe type + SQLite migration + seed values for the 16 launch recipes. Neutral, honest chips ("Contains gluten, dairy, egg"; "Not vegetarian"). If deferred, Phase 1 ships without the strip and it drops in cleanly later.
- **Equipment enrichment** (enables item 8's badges): `equipment: z.array(z.string())` → `z.array(z.object({ name, note?, essential: boolean }))` + migration + reseed.

---

## Colour rules (each colour, one job)
- **rust** = "Start Cooking" only
- **gold** = section headers / stepper / why-marker / step numbers
- **emerald `#4FBF85`** = swapped ingredient only
- **bronze `#C2A15A`** = reserved for the pantry/category headers shipped in build #123 — **do not introduce it on this screen**
- **sage** = not on this page · **zero blue**

## Out of scope
Cook mode; recipe data/content; tab routing; the pantry and shop screens.

## Definition of Done
- All Phase 1 acceptance criteria met; the no-photo, no-equipment, long-output-unit, active≠total, and leftover-on cases all degrade gracefully.
- `npx tsc --noEmit` clean; **R-014** tail-check on every edited file; **build-log row added in the SAME tree as the code**.
- **R-015:** do NOT self-close — ship to `main`, then await Patrick's on-device validation.
- **Do NOT dispatch an EAS build — Patrick triggers it.**
