# BUGS.md — Session Bug Cache

> This file is the session-level cache of all known bugs, synced from GitHub Issues at the start of each session.
> Source of truth: GitHub Issues at https://github.com/patrickpatches/hone/issues
> Status flow: OPEN → FIX ATTEMPTED → VALIDATED ✅ (by Patrick) or REJECTED 🔴 (reopened)
> Rule: never self-close. Status only moves to VALIDATED when Patrick confirms on-device.

---

## Active tickets

| ID | Title | Status | Notes |
|---|---|---|---|
| REGN-001 | Recipe cards misalign after first scroll | FIX ATTEMPTED | Commit `1fca0aaa3d3d` — awaiting Patrick on-device validation |
| REGN-006 | Equipment + Prep sections missing on most recipes | FIX ATTEMPTED | UI rendering restored 7 May 2026 — awaiting on-device validation |
| REGN-007 | Pantry STILL NEED chip state broken (undo, X-removal, ✓-toggle) | FIX ATTEMPTED | Refactored to derive state from shopping list — awaiting on-device validation |
| HONE-007 | Add missing to shopping list fails (or only adds some items) | FIX ATTEMPTED | Build #134. Root cause: items were tagged as "from a meal plan" (`kind:'meal'`). The Shop tab auto-deletes meal-tagged items if the recipe isn't in your plan — so they vanished immediately. Fix: tag them as `kind:'manual'` instead. Now they stick like anything you add yourself. |
| HONE-008 | Top of recipe screen is cluttered — duplicate Start cooking, duplicate 0/9, duplicate Watch | FIX ATTEMPTED | Build #134. Three duplicates removed: (1) inline Start Cooking pill deleted — sticky bottom pill is the only one now; (2) "Watch the chef" removed from ghost row — "Watch the original ↗" in the chef credit line above is enough; (3) N/M ingredient count pill removed from the "In your pantry" eyebrow — the same number was already shown large inside the card body. |
| HONE-009 | What to know before you start is a wall of text — violates anticipation-not-reaction | OPEN | P2 · FLAGGED BACK — needs per-recipe data work, not a code move. Each note needs to be mapped to the specific step or ingredient it applies to. That's authoring work (cook's lane), not an engineering fix. No code change in #134. See handoff note. |
| HONE-010 | Plate time always shows 3 min on every recipe — each plating is unique | FIX ATTEMPTED | Build #134. Was hardcoded `3`. Now derived from recipe data: if the recipe has a finishing/tasting note (meaning active plating work — seasoning, sauce, garnish) → 5 min; if not → 3 min. Different recipes will now show different times. A `plating_time_minutes` field per recipe would be the complete fix but needs schema + data authoring work. |
| HONE-011 | What to know callout uses blue left rail — v7 palette violation | FIX ATTEMPTED | Build #134. Was `#5B8FD4` (blue — not in the v7 palette). Changed rail, background, dot, and label to gold. Simple colour swap, no layout change. |
| HONE-012 | 'intermediate' should be 'Intermediate' on the meta line | FIX ATTEMPTED | Build #134. The code was passing the raw database value (`recipe.difficulty`) which is stored lowercase. Changed to use `difficultyLabel` which already capitalises the first letter. One-line fix. |

**REGN-006 root cause (diagnosed 7 May 2026):**
- Patrick reported Equipment + Mise en place sections missing across most recipes (not just SMASH_BURGER).
- True root cause: regression in `mobile/app/recipe/[id].tsx`. Working tree had 1097 lines vs HEAD's 1540 — a previous edit dropped the entire DECISION-008 UI block (At a glance, What to know, Equipment, Prep/Mise, Finishing & tasting, Leftovers & storage). The data was in the schema, in seed-recipes.ts (for the 6 Batch 1 recipes), and in SQLite — but the UI had no `recipe.equipment.map(...)` block to render it. So the bug was 100% UI-side.
- Fix: restored HEAD's full DECISION-008 rendering. Re-applied Pressable+View split on header buttons (back, plan toggle, heart), title-card pill, Watch link, expand-more chip, and MiseItem itself per the session-4 Report-4 lesson — Android silently drops layout/visual props from `style={({ pressed }) => ({…})}`. UI label changed "Mise en place" → "Prep" per Patrick 7 May; schema field stays `mise_en_place`.

**REGN-006 audit table — populated state of every recipe:**

The DECISION-008 fields are: `equipment[]`, `before_you_start[]`, `mise_en_place[]`, `finishing_note`, `leftovers_note`, `total_time_minutes`, `active_time_minutes`.

| Status | Count | Recipes |
|---|---|---|
| ✅ Populated (Batch 1, 2, 3, 4) | 44 | every seed recipe except sourdough-maintenance |
| 🟡 Research file ready, awaiting migration | 0 | — all caught up |
| ⚪ No research, intentional placeholder | 1 | sourdough-maintenance — feeder-starter guide, doesn't fit DECISION-008 schema; renders the "Equipment and prep notes are coming" placeholder |

**Migration status (updated 2026-05-08):** All 38 outstanding recipe migrations completed in commits `5ac153b` (Batch 2, 11 recipes) + `e649f0f` (Batch 3+4, 27 recipes). UI correctly renders all 5 DECISION-008 sections for 44 of 45 recipes. The lone empty recipe (sourdough-maintenance) now renders a sage-tinted placeholder line — "Equipment and prep notes are coming" — instead of empty space. Awaiting Patrick's on-device validation.

**REGN-007 root cause (diagnosed 7 May 2026):**
- Three symptoms reported by Patrick: (1) Undo on chip-add toast doesn't work, (2) Hitting X in Shop tab doesn't revert pantry chip, (3) Clicking already-added ✓ chip doesn't remove from shopping list.
- Single architectural root cause: the chip's `added` state was held in a local `Set<string>` inside `RecipeMatchCard`, NOT derived from shopping-list membership. Every state mutation was one-way (chip → shopping list). The chip had no way to learn that the shopping list had changed underneath it.
- Fix: chip visual state is now DERIVED from `shoppingItems.some(it => sameNorm(it.name, ing.name))`. Pantry tab loads shopping items on mount and on focus (useFocusEffect), so it reflects Shop-tab edits when the user comes back. All mutations route through pantry's `addToShoppingList` / `removeFromShoppingList` helpers, both of which update local state synchronously and persist to SQLite. Undo button calls `removeFromShoppingList(name)` — same pathway as the ✓-toggle. Toast holds the ingredient *name* (not the chip's local state), so undo survives chip re-renders.

---

**REGN-001 root cause (diagnosed 6 May 2026):**
- Previous fix addressed pantry carousel snap (REGN-001 original). The persistent card misalignment on the Kitchen screen is a separate but related issue.
- Root cause: FlatList windowing. RecipeCard heights vary (1–2 line title/tagline = ~315–358px). On Android, items outside the render window unmount; re-entry uses estimated positions → visible shift on scroll back.
- Fix: disabled windowing via `initialNumToRender={20}`, `maxToRenderPerBatch={20}`, `windowSize={99}`, `removeClippedSubviews={false}`. 17 active items (~340px each) = trivial memory cost.

---

## Closed / Validated tickets

| ID | Title | Status | Closed |
|---|---|---|---|
| REGN-004 | Pantry search flashes / requires multiple taps | VALIDATED ✅ | 5 May 2026 — Patrick confirmed on-device |
| REGN-001 (carousel) | Pantry recipe card carousel partial-snap | VALIDATED ✅ | 5 May 2026 — Patrick confirmed on-device |
| REGN-002 | OneDrive null-byte corruption | VALIDATED ✅ | 28 Apr 2026 — process fix; write via GitHub API only |
| REGN-003 | pantry.tsx file-write truncation | VALIDATED ✅ | 3 May 2026 — full-file rebuild + Python assert validation before push |

---

## Session log — 6 May 2026 (Report 5)

### Build dispatched
| Build | Commit | Summary |
|---|---|---|
| #84 | `a8da5341` | ChipAdd redesign: Pressable+View split, rust outline→fill pill states, drop hint text |

### Changes this session
- **pantry.tsx** — ChipAdd fully redesigned: Pressable+View split fixes Android layout drop bug; 2px rust outline for "need" state; rust fill + white text for "added" state; removed "Tap to add to shopping list" hint text
- **RecipeMatchCard** — outer Pressable converted to static style + `android_ripple` (same Android layout bug fix)
- Root cause documented: Android silently drops layout/visual properties (borderRadius, backgroundColor, borderColor) from function-style Pressable `style` props

---

## Session log — 6 May 2026 (Report 4)

### Build dispatched
| Build | Commit | Summary |
|---|---|---|
| #83 | `078e616e` (SHA at time) | MiseItem Pressable+View split: borderWidth 1.5→2, fix layout stacking on Android |

### Changes this session
- **recipe/[id].tsx** — MiseItem component: Pressable bare touch target + inner View with all layout/visual styles static. Non-integer `borderWidth: 1.5` → `borderWidth: 2` (Android non-integer border rendering fix)
- **RecipeCard.tsx** — Difficulty pill text `color: tokens.ink` → `color: '#FFFFFF'` (dark text on dark scrim was unreadable)
- **seed-recipes.ts** — A previously-required Zod refine had been silently blocking `refreshSeedRecipeFields` for SMASH_BURGER. The originating field was retired entirely on 2026-05-07 — see types.ts header for the retirement rationale.
- **types.ts** — The Zod `.refine()` that triggered
