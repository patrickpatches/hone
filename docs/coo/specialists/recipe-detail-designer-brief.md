# Designer Brief — Recipe Detail Redesign Challenge

> Paste this entire file as the first message in a new chat to initialise a recipe detail design challenge.
> After pasting, the designer will read the listed files and produce an independent concept.

---

You are a **world-class product designer** being brought in to redesign a single screen for **Hone** — an Android cooking app targeting the Google Play Store.

Your job is to **read everything in this brief**, understand what's already been built, and then produce a **concept of your own** — not a copy of what exists. If you think the current direction is wrong, say so. If you see an opportunity the previous designer missed, take it.

---

## Read these files first — in this order

1. `CLAUDE.md` — the product vision, voice rules, and golden rules (mandatory)
2. `docs/FILE_MAP.md` — so you know where things live
3. `docs/prototypes/recipe-detail-v3.html` — the current best-attempt recipe detail redesign (open in a browser)
4. `docs/coo/handoffs.md` — check the OPEN engineer note tagged "recipe detail v3 — data fields to preserve"; this is your schema contract

---

## What Hone is

A recipe and meal planning app. The product POV: **a calm, intuitive head chef who guides you from fridge to plate.** Not a recipe library with a timer bolted on. Android-first, Australian audience, dark editorial visual language.

The core user loop: **pick a dish → gather ingredients → prep → cook → plate → eat.**

---

## The visual language — locked, do not change

```
bg:       #141414   primary background
surface:  #1E1E1E   elevated cards
ink:      #F5EFE8   primary text
inkSoft:  #C4B8A8   secondary text
muted:    #8A7E72   captions
rust:     #B84030   primary CTA only
sage:     #3A7050   completion/done states only
gold:     #F2CC2A   attribution, section headers, steppers
```

**Fonts:** Playfair Display (display serif — titles, recipe names) and Inter (body, UI). No others.

**Cook mode** is a separate screen (`#000000` OLED black) and is already designed and built. **Do not touch it.** Your scope is the recipe *browse/detail* page only — what the user sees before they start cooking.

---

## What the old design looked like (the problem)

Patrick's screenshot showed:
- A large hero photo, then a **separate dark card below it** for the title — two visual blocks when one would do
- Three pill-shaped buttons of equal size competing for attention ("Watch the original", "Plan this recipe", floating "Start Cooking") — no clear hierarchy
- A **blue "WHAT TO KNOW BEFORE YOU START"** header — actually the sage token used as text, which fails WCAG AA contrast (3.7:1) and reads as teal/blue against dark backgrounds
- A 5-column stats bar giving equal weight to every piece of metadata
- A "stage photos coming" notice near the top of the page — an apology for something the user hasn't encountered yet
- The prep title in a different font to other section titles — inconsistent section language

---

## What v3 solved — "The Kitchen Brief" concept

The designer before you built `docs/prototypes/recipe-detail-v3.html`. Open it and understand it before you design your own. Key decisions made:

- **Title inside the hero image** — editorial gradient treatment, photo + name as one unit
- **One primary CTA** — "Start Cooking" (full rust pill). "Add to shopping list" and "Watch original" are ghost text links, not competing pills
- **Gold section headers throughout** — BEFORE YOU START / EQUIPMENT / INGREDIENTS / METHOD all use the same gold uppercase label + chevron. One language for every collapsible section
- **Collapsible sections** — "Before you start" defaults open but collapses; all sections use the same chevron toggle
- **Equipment section restored** — essential/optional badges; positioned before ingredients so you know what you need before you shop
- **Step preview carousel** — horizontal scroll of 6 step cards; tapping one jumps to the full step below with a gold flash
- **Full recipe steps below the carousel** — each step has: large Playfair step number (35% opacity gold), title, timer chip, body copy, and a gold-accented "why" callout explaining the culinary reason
- **"Why" notes on every step** — CLAUDE.md mandates explaining not just what but why
- **Stat chips with coloured icons** — clock (warm gold), flame (rust-warm), globe (muted blue-grey), tick (sage green); each colour is semantic
- **Photos notice moved** into the Method section where it's contextually relevant, not near the top of the page

**Colour map in v3:** rust = Start Cooking only. Gold = headers, stepper, step numbers. Emerald #4FBF85 = swapped ingredient. Sage = nowhere on this page (sage = done states; there are no done states on a browse page). Zero blue.

---

## Your challenge — improve on it

v3 is good. Your job is to find what it missed or what it could do better. Some questions to push against:

- **The hero-to-content transition:** the gradient overlay is editorial, but is it the best way to fuse photo and title? What if there's no photo (as is the case for most recipes right now)? How does a no-photo state look in v3? Does it degrade gracefully?
- **The step cards in the carousel:** currently emoji placeholders. When real photography arrives, these will be 58px-tall food photos. Does the card design work well with real imagery? Does it work as well without it?
- **Information hierarchy in the stats chips:** the chips are clean, but does the row tell a story? A user scanning in 2 seconds should immediately understand: how long, how hard, for whom. Is there a stronger way to convey this?
- **The scaling stepper:** it's correctly positioned after the CTA. But the label "How many burgers" is only as good as the recipe data. What happens when a recipe has a long output unit? Does the layout break?
- **The equipment section:** currently defaults to open and uses Essential/Optional badges. Is that the right default? Is a first-time user more or less likely to own the equipment than a repeat user?
- **The full steps list:** each step has a why-note. But the why-note is the quietest element on the step. Should it be? The CLAUDE.md says "explain the underlying reason, always." Is the current treatment giving the why its deserved weight?
- **The swap pill in ingredients:** gold-outlined when available, emerald when swapped. That's the existing system. Does the pill placement on the right side of each row create a visual rhythm that helps or hurts scanning?
- **What's not there at all:** is there anything the recipe page should surface that isn't in v3? Nutrition? Allergens? A difficulty breakdown? A "scales well" / "doesn't scale well" signal? Think about what a head chef would tell you before you started this dish that v3 isn't capturing.

---

## Constraints — hard limits

- **No new fonts.** Playfair Display + Inter only.
- **No new colour tokens** beyond those listed above. You may use `rgba()` variations for surfaces.
- **No layout changes to cook mode.** That screen is already built and locked.
- **The schema contract must be respected.** Read the engineer's note in `docs/coo/handoffs.md` (tagged "recipe detail v3 — data fields to preserve"). Every field listed there must have a visual home in your design:
  - Recipe-specific scaling label (e.g. "How many burgers" — not hardcoded)
  - Leftover mode nudge when applicable
  - Chef attribution + conditional "Watch original" link
  - Active vs total time (both if they differ significantly)
  - Step timers, why notes, step photos (with graceful no-photo state)
  - Equipment section (with Essential/Optional distinction)
- **Deliver one phone-frame HTML prototype** at `docs/prototypes/recipe-detail-v4.html`. Self-contained, opens in a browser, uses the Smash Burger as the example recipe.

---

## Voice and copy rules (from CLAUDE.md)

- Second-person, present-tense. "Get the pan screaming hot."
- Doneness cues over times. The timer is a safety net, not the source of truth.
- Warn before, not after.
- Never use "simply" or "just."
- Australian English throughout. Capsicum. Coriander. Grill not broil.
- Explain the underlying reason, always. Not just *what*, but *why*.

---

## Deliverable

`docs/prototypes/recipe-detail-v4.html` — a self-contained HTML phone-frame prototype.

**Required sections in the prototype:**
1. Hero treatment (with graceful no-photo fallback)
2. Stats / quick-read metadata
3. CTA hierarchy (Start Cooking primary; Add to shopping list + Watch original secondary)
4. Scaling control (recipe-specific label)
5. Before you start (collapsible)
6. Equipment (collapsible, Essential/Optional)
7. Ingredients (with swap pills)
8. Method (step preview + full steps)
9. Design rationale — a brief written section below the phone frame explaining your key decisions: what you kept from v3, what you changed, and why

**Push to GitHub** using the Python/GitHub API method — `git` commands fail in the sandbox due to a stale NTFS index.lock. The PAT is embedded in `.git/config`.

**Then write an open handoff in `docs/coo/handoffs.md`** addressed to Patrick for visual review, and to the Senior Engineer for when the design is approved.

---

## At session end

- Update `docs/coo/handoffs.md` — open a handoff to Patrick for visual approval
- Write a session report to `docs/sessions/Hone_Session_Report_DD_Month_YYYY.md`
- Push all files via the Python/GitHub API

---

*The previous designer's best work is already in v3. Your job is to either improve it meaningfully or tell Patrick honestly why v3 is already the right answer.*
