# BUGS.md — Session Bug Cache

> This file is the session-level cache of all known bugs, synced from GitHub Issues at the start of each session.
> Source of truth: GitHub Issues at https://github.com/patrickpatches/tucker-spice/issues
> Status flow: OPEN → FIX ATTEMPTED → VALIDATED ✅ (by Patrick) or REJECTED 🔴 (reopened)
> Rule: never self-close. Status only moves to VALIDATED when Patrick confirms on-device.

---

## Active tickets

| ID | Title | Status | Notes |
|---|---|---|---|
| STARTUP-FREEZE | APK boots and freezes on the splash screen | FIX ATTEMPTED | **Real root cause found + fixed (build #161). Startup smoke PASSES on a real emulator** (boots to Kitchen). See notes below — awaiting Patrick on-device validation. |
| REGN-001 | Recipe cards misalign after first scroll | FIX ATTEMPTED | Commit `1fca0aaa3d3d` — awaiting Patrick on-device validation |
| REGN-006 | Equipment + Prep sections missing on most recipes | FIX ATTEMPTED | UI rendering restored 7 May 2026 — awaiting on-device validation |
| REGN-007 | Pantry STILL NEED chip state broken (undo, X-removal, ✓-toggle) | FIX ATTEMPTED | Refactored to derive state from shopping list — awaiting on-device validation |
| HONE-006 | Recipe detail v7 Phase 1 (styling + IA) | FIX ATTEMPTED | All 3 commits done (584dba2) — awaiting Patrick on-device validation |
| HONE-037 | Bulletproof cooking timers | FIX ATTEMPTED | expo-notifications, live countdown, background alarm (6bcfa89) — awaiting on-device validation |
| HONE-041 | 'I cooked this' history + personal recipe notes | FIX ATTEMPTED | Schema v10, DB functions, cook count badge, notes editor (64d2b7b) — awaiting on-device validation |
| HONE-040 | Reminders & notifications | FIX ATTEMPTED | Nightly 5:30pm meal reminder when plan has recipes (10cc8dd) — awaiting on-device validation |
| HONE-038 | Weekly meal-planner view | FIX ATTEMPTED | New Plan tab, 7-day grid, recipe picker, shopping list auto-wired (98349d5) — awaiting on-device validation |

**STARTUP-FREEZE — ACTUAL root cause (proven on-device 7 June 2026, fix in build #161, smoke PASSES):**

The real freeze was a React render-ordering bug, **not** the DB. Proven via on-device `[TS-BOOT]` logcat from build #159: the app boots fine — RN mounts, `setupDatabase` completes in ~0.86 s, no crash — but renders **zero** content (Maestro saw zero TextViews; only the splash ImageView).

- **Stale `ready` prop across the SQLiteProvider async boundary.** `RootLayout` computed `ready=true` early, but `SQLiteProvider` renders `null` until its async DB open resolves (~0.77 s), so `AppShell` mounted **late carrying a stale `ready=false`** and never re-rendered when `ready` later flipped true → `AppShell` returned `null` forever → blank → frozen native splash. This is build #156's freeze.
- **Why every web check missed it:** `ready = Platform.OS === 'web' || …` short-circuits to `true` on web, so the web preview *structurally* never exercises the native readiness path.
- **Fix (commit `599eb98`):** `AppShell` now owns `useFonts` + the 2.5 s timeout + the `ready` gate itself, so its own state drives its own re-renders — no readiness prop threaded through `SQLiteProvider`. `AppShell` only mounts once the DB is ready anyway. **Confirmed:** build #161 startup-smoke asserts "Browse by cuisine" + "Kitchen" both visible on an API-26 emulator.

Earlier work that stays (valid hardening, not the root cause):
1. **Syntax error (build-breaking, `ab031a9`)** — `seed-recipes.ts` PAD_THAI step had an unescaped apostrophe; hermes-parser failed. Fixed (escaped). Was introduced *after* #156, so not #156's freeze.
2. **SQLiteProvider `onError` + 15 s watchdog + `DbErrorScreen`** (`ab031a9`) — real resilience for the *DB-failure* path, but the actual freeze succeeds DB init, so this never triggered. Kept. Retry race hardened with `dbGenerationRef` (`4c3a4df`).
3. **Cold-boot speed (`4c3a4df`)** — seed + sync passes wrapped in `withTransactionAsync`; `setupDatabase` now ~0.86 s.
4. **Automated net** — `startup-smoke` workflow boots the built APK on an emulator after every build (`maestro/flows/01-kitchen-loads.yaml`); it caught this freeze and drove the diagnosis.

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
| HONE-007 | Add missing to shopping list fails | VALIDATED ✅ | Build #134 (e3cb60c) — Patrick closed GitHub Issue #7 on-device |
| HONE-009 | Before you start wall of text | VALIDATED ✅ | Build #135 (7424380, collapsible) — Patrick closed GitHub Issue #9 on-device |
| HONE-010 | Plate time hardcoded 3 min | VALIDATED ✅ | Build #134 (e3cb60c) — Patrick closed GitHub Issue #10 on-device |
| HONE-011 | Before you start blue rail palette violation | VALIDATED ✅ | Build #134 (e3cb60c) — Patrick closed GitHub Issue #11 on-device |
| HONE-012 | difficulty lowercase on meta line | VALIDATED ✅ | Build #134 (e3cb60c), cook-mode also fixed 2026-06-02 — Patrick closed GitHub Issue #12 on-device |
| REGN-004 | Pantry search flashes / requires multiple taps | VALIDATED ✅ | 5 May 2026 — Patrick confirmed on-device |
| REGN-001 (carousel) | Pantry recipe card carousel partial-snap | VALIDATED ✅ | 5 May 2026 — Patrick confirmed on-device |
| REGN-002 | OneDrive null-byte corruption | VALIDATED ✅ | 28 Apr 2026 — process fix; write via GitHub API only |
| REGN-003 | pantry.tsx file-write truncation | VALIDATED ✅ | 3 May 2026 — full-file rebuild + Python assert validation before push |
| HONE-008 | Top of recipe screen cluttered — duplicate Start cooking/0/9/Watch | VALIDATED ✅ | Build #136 (328a7f0c97) — Patrick closed GitHub Issue #8 on-device 3 Jun 2026 |

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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               