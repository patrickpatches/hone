# Tucker & Spice usability rubric

The tester judges every screen against these heuristics. Generic usability theory
(Nielsen) is the floor; the kitchen-specific and product-promise heuristics are
where Tucker & Spice wins or loses against Supercook and Yummly.

## Severity scale

| Severity | Meaning |
|---|---|
| **blocker** | Task cannot be completed, or the app crashes / hangs / loses data |
| **major** | Task completes but with real pain — wrong result, backtracking, >3 wasted taps, confusing dead end |
| **minor** | Noticeable friction — hesitation, unclear label, small surprise, extra tap |
| **polish** | Works fine but falls short of "calm, intuitive head chef" — tone, spacing, animation, copy |

## A. Core usability (the floor)

1. **Visibility of status** — after every tap, does something visibly respond within ~1s? Spinners over silence; never a dead tap.
2. **Match to the kitchen world** — words a home cook uses, not app jargon. Australian English: capsicum, coriander, grill, colour, metric units, °C.
3. **Control and escape** — back always works, destructive actions are confirmable/undoable, search is clearable.
4. **Consistency** — same gesture does the same thing on every screen; tab bar never changes meaning.
5. **Error prevention over error messages** — warn *before* something goes wrong, with a recovery path.
6. **Recognition over recall** — never make the user remember an ingredient amount or step from a previous screen.
7. **Efficiency** — count taps. The pitch is *fewer taps than Supercook/Yummly*. Finding a recipe and starting to cook should take ≤4 taps from the Kitchen screen.
8. **Minimalist screens** — one job per screen (shop → prep → cook → plate). Flag anything that smells like a discovery maze or endless feed.
9. **Recoverable errors** — error states say what happened and what to do next, in plain language.
10. **No manual needed** — a first-time user must succeed with zero onboarding.

## B. Kitchen context (where generic apps fail)

11. **Glanceability at arm's length** — in cook mode, can the current step, timer, and doneness cue be read from ~1 metre? Big type, high contrast, OLED true black in dark cook mode.
12. **Messy-hands operation** — in cook mode, targets must be huge and forgiving; no precise gestures, no tiny ×'s. One-handed reach for primary actions.
13. **Doneness cues over timers** — steps should say what to look/listen/smell for, not just minutes. Flag bare timers.
14. **Interruption survival** — leaving the app mid-recipe and coming back must restore exactly where you were. A recipe in progress must never fail offline.
15. **Tempo-matched voice** — calm in prep, urgent in a sauté. Second person, present tense. Never "simply" or "just" for things that aren't.

## C. Product promises (the 3 Golden Rules)

16. **Chef credit visible** — every chef-inspired recipe shows its source attribution. Missing credit on a recipe detail is a **major**.
17. **Honest scaling** — changing servings updates amounts sensibly; fixed-scale items (e.g. a loaf of bread) don't multiply absurdly.
18. **Honest substitutions** — each substitution says what changes (flavour/texture/look) and whether it's a good swap or a compromise. A bare "use X instead" is a finding.
19. **Australian availability** — hard-to-find ingredients are flagged with a local equivalent.

## D. Accessibility

20. **Labels** — every interactive element has an accessibility label (visible in the UI tree). Icon-only buttons without labels are findings.
21. **Text scaling** — layouts must survive 200% text without truncation or overlap (test when the persona calls for it).
22. **Contrast** — body text readable in both themes; gold-on-dark accents must not carry essential meaning alone.

## What is NOT a finding

- Personal taste about colours/branding that doesn't impede a task.
- Features that are known-not-built (recipe Add form is a placeholder; "invent me something" AI mode is not built).
- Seed-data gaps (a missing recipe is content, not usability — note it separately if it blocked the task).
