# Image Brief — Hummus from Scratch (`hummus`)

> Status: Hero prompt written — AI generation pending Patrick. Stage prompts deferred to a follow-up brief pass.
> Cook's photography notes: `docs/coo/culinary-research/hummus.md` § Photography Notes
> Recipe data: `mobile/src/data/seed-recipes.ts` → `HUMMUS` (line 908)
> Attribution: Reem Kassis, *The Palestinian Table* (Phaidon, 2017)
> Ledger: `docs/coo/visual-assets-ledger.md` → Hummus section

---

## Why this brief exists (and the bug it's fixing)

**The current shipping state — 2026-05-18:** `seed-recipes.ts` line 924 ships `hero_url: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=600&q=80'`. That URL serves a chocolate milkshake in a mason jar with whipped cream and a Twix bar. Patrick caught it on-device. Confirmed by direct CDN fetch + visual inspection 2026-05-18.

**Two-stage fix:**

1. **Immediate (engineer handoff this session):** swap the chocolate-sundae URL for the already-ledger-approved `photo-1637949385162-e416fb15b2ce` (Ludovic Avice, Unsplash). That's a beautiful traditional plain-hummus shot — top-down, swirl pattern, chickpeas, parsley, paprika dust, olive oil pool on a dark slate surface. Verified HTTP 200 today. **No pomegranate.** Closes the bug today.
2. **Upgrade (this brief):** AI-generate a proper hummus wa rummaan / pomegranate-topped hero per Patrick's vision. Replace the interim once cook signs off.

---

## Patrick's brief — verbatim from 2026-05-18 message

> "you have a chocolate sunday hero image and i want beautiful hummus with pomegranate on top the traditional way"

Three asks compressed: kill the chocolate sundae, replace with hummus, the pomegranate version traditionally plated.

---

## Recipe-coherence question for the Culinary Verifier

The cook's authored garnish for HUMMUS in seed-recipes.ts is **paprika + whole chickpeas + olive oil pool**. Pomegranate does not appear in the recipe's mise, steps, or default garnish. It DOES appear in the cook's `culinary-research/hummus.md` substitutions table as one of two authored garnish variants:

- Sumac + toasted pine nuts 🟡 ("a genuine upgrade")
- Smoked paprika + toasted sesame 🟡 ("beautiful, adds depth")

Patrick's hero photo request introduces a third variant — **pomegranate arils + parsley** — which fits the same pattern. Two options the cook chooses between:

**Option A** — Add pomegranate-arils-and-parsley as a third authored garnish substitution in the recipe data. The hero shows that variant. Recipe still defaults to paprika+chickpeas; user sees the pomegranate version as the hero card and the recipe text steps describe the default plating with a substitution swap available. This is product-coherent.

**Option B** — Hero diverges from recipe. Hero shows pomegranate plating; recipe steps describe the default paprika+chickpeas plating. Less coherent but fewer schema touches.

**Recommended:** Option A. Cook authors a one-line substitution in the recipe; product-coherence preserved; honest about what the photo shows. Flagged → Cook.

---

## Research summary

### Hummus wa rummaan (hummus with pomegranate)

A traditional Levantine variant — particularly common in Lebanese and Syrian preparations, also found in Palestinian kitchens. The composition:

- Pale-beige plain hummus base, smooth and silky
- Deep central well created with the back of a spoon
- Olive oil pooled in the well
- Pomegranate arils piled in the centre — generous mound, fresh and glossy
- Often a sprinkling of finely chopped flat-leaf parsley
- Often a paprika or sumac dust along the rim of the well

The pomegranate provides three things: visual drama (red on pale beige is the highest-contrast colour pairing in Levantine cuisine), a textural pop (the arils crunch), and a sweet-tart counterpoint to the tahini and garlic. It is NOT a fusion or modern invention — it predates the diaspora and appears in mezze spreads across the region.

### What the photo must NOT show

The bar is high here because Patrick specifically asked for "the traditional way." Reject the AI generation immediately if any of these appear:

- **Whole pomegranate fruit** — only the arils (seeds) belong on the hummus; the whole fruit is for the kitchen, not the bowl
- **Pomegranate molasses drizzle** — that's a different dish (and a different colour profile; molasses is dark brown not red)
- **Feta cheese** — Greek-influenced version; this is Levantine, no dairy on top
- **Microgreens** — Western restaurant styling; not traditional
- **Edible flowers** — same problem
- **Tortilla chips, crackers, or veggie sticks** as plating accompaniment — that's a Western party-platter context
- **Tagine or copper bowl** — wrong region (North African vs Levantine)
- **A salad bowl-style stack** of hummus with toppings layered high — this is hummus, not a poke bowl

### What the photo SHOULD show

- Shallow bowl, traditional Levantine plating (NOT a deep ramekin; you can't see the swirl in a deep bowl)
- Bowl colour: matte black, charcoal, off-white stoneware, or a traditional terracotta. Anything that isn't bright white porcelain or shiny metal.
- Surface: dark slate, dark timber, or charcoal linen — per the Hone visual direction (DECISION-006 dark dramatic)
- Soft directional natural light from the side — the olive oil pool needs to catch the light and gleam; the arils need to look juicy not flat
- Top-down angle (90° overhead) — this is the only angle that shows the swirl, the well, the oil pool, and the arils in one frame
- Generous negative space around the bowl; the bowl is not centred — slight offset is more editorial
- NYT Cooking aesthetic — honest, well-lit, technically accurate. Not Pinterest-glossy, not Instagram-saturated, not stock-library-generic

### Lighting and surface for hummus specifically

Unlike a smash burger (cooking happens in dark register), hummus is pale-toned. On true matte black the bowl edge can swallow itself. Two acceptable surface choices:

**Preferred:** Matte black slate with the bowl in a softer charcoal/grey stoneware (separation by tone, not by colour clash).
**Acceptable:** Dark aged timber, warm-toned. Wood grain adds visual texture that complements the smooth hummus surface.

Avoid pure white surfaces — they kill the app's dark dramatic palette.

---

## Image required — 1 hero (stage shots in a follow-up brief)

| Ref | Stage ID | Subject | Priority |
|---|---|---|---|
| A | `hero` | Plated hummus wa rummaan, pomegranate arils piled on top | MUST HAVE |

Stage shots (i1-i8) — soaked chickpeas, simmering pot, tahini seizure, blended hummus, plated final — will get their own brief pass after this hero lands. Per the new workflow Patrick set out 2026-05-18: heroes first across the launch set, stage shots in a sustained workstream.

---

## AI Generation Prompts (DALL-E 3 / Imagen 3 / Gemini)

> Generate via your tool of choice (the SMASH_BURGER mise + smash steps were Gemini). Save as `hummus_hero_v1.jpg` in `mobile/assets/recipes/`. Iterate on rejected variants — append v2, v3, etc.

---

### Image A — Hero (`hummus_hero_v1.jpg`)

**Doneness cue this photo establishes:** "This is what hummus wa rummaan looks like when you serve it the way it was served in Beirut, Damascus, and East Jerusalem before it was served everywhere else."

```
Food photography, overhead 90-degree top-down shot. A shallow matte black stoneware bowl, approximately 18cm diameter, sits slightly off-centre on a dark matte slate surface. The bowl contains hummus wa rummaan — traditional Levantine hummus with pomegranate. The hummus base is pale beige and visibly creamy-smooth, with a clear swirl pattern circling the bowl from the centre outward (created by the back of a spoon). A central well in the hummus holds a small pool of extra virgin olive oil — golden-green, glossy, catching the light. Piled in the centre of the oil pool: a generous mound of fresh pomegranate arils — vivid ruby red, glossy, distinctly individual seeds (not crushed, not a paste). Approximately 2-3 tablespoons of arils, forming a small jewel-toned heap. A light scattering of finely chopped flat-leaf parsley is sprinkled around the rim of the well, between the swirl ridges. A delicate dusting of paprika rings the outer edge of the swirl, picking up the red of the pomegranate. Soft directional natural light from the left side creates highlights on the oil pool and a glossy sheen on the pomegranate arils — gentle, not harsh, no studio bounce. The slate surface is uncluttered: maybe a single sprig of flat-leaf parsley to the upper-right corner for compositional balance, nothing else. The bowl is not centred in the frame — positioned slightly upper-left, with generous dark negative space below and to the right. 3:2 landscape format. NYT Cooking aesthetic — honest, technically accurate, restrained. The mood is calm and confident, not styled. No whole pomegranate fruit visible. No bread, no crackers, no vegetables. No feta, no microgreens, no edible flowers. The colours: deep beige hummus, ruby-red arils, golden-green oil, dark slate ground.
```

**What to reject and regenerate:**

- Whole pomegranate halves sitting next to the bowl → reject (only arils belong, only on the hummus)
- Arils scattered across the table around the bowl → reject (this was the Pexels stock failure pattern — the arils must be ON the hummus, in the well, not on the surface)
- Pomegranate molasses drizzle (dark brown lines) → reject (different dish)
- Crushed pomegranate seeds → reject (must be whole individual arils)
- Hummus that's orange or rust-coloured → reject (that's roasted red pepper hummus or beetroot hummus, wrong dish)
- White porcelain dinner plate → reject (breaks dark visual language)
- Bread/crackers/veggies in frame → reject (this is a hummus hero, not a mezze platter)
- Feta crumbles, parsley piled high, edible flowers → reject (not traditional Levantine plating)
- Multiple bowls or a platter setup → reject (single bowl, hero of the dish itself)
- Tagine or shiny metal bowl → reject (wrong region)
- Hands in frame, scooping → reject (action shots are stage-shot territory; hero is the dish alone)
- Pita bread tucked under the bowl edge → reject (no accompaniment in the hero frame)
- Overly saturated reds / Instagram filter look → reject (NYT Cooking, not Pinterest)
- Pomegranate arils that look 3D-rendered or waxy → reject (this is the cheap-AI tell; iterate the prompt)

---

## Cook validation checklist

Cook (Culinary & Cultural Verifier) runs this before APPROVED status is granted.

### Hero (Image A)

- [ ] Hummus colour is **pale beige** (not orange, not rust, not green, not white)
- [ ] Swirl pattern visible on the hummus surface — concentric ridges from a spoon
- [ ] Central well holds olive oil — visible pool, not just a drizzle
- [ ] Pomegranate arils are piled IN the centre, ON the hummus — not scattered around the bowl
- [ ] Arils are individual whole seeds — not crushed, not molasses
- [ ] Parsley (if visible) is flat-leaf, finely chopped, used sparingly along the rim
- [ ] Paprika dust visible along the outer edge of the swirl
- [ ] Bowl is matte black / charcoal / dark stoneware / off-white stoneware — NOT bright white porcelain
- [ ] Surface is dark slate or dark timber — NOT a bright kitchen counter
- [ ] No whole pomegranate fruit in frame
- [ ] No molasses drizzle, no feta, no microgreens, no edible flowers
- [ ] No bread, crackers, veggies, or other plate accompaniment in frame
- [ ] Lighting reads as natural side light — not studio bounce, not harsh flash, not flat shadowless render
- [ ] Top-down 90° angle (not 30° angle — that's a different brief)
- [ ] The image does not look obviously AI-generated (waxy textures, impossible aril counts, melted-edges on the bowl) — if it does, iterate

### Cook's recipe-coherence check

- [ ] Recipe data updated to include pomegranate+parsley garnish as a substitution variant (cook to author) OR explicit acceptance that the hero diverges from the default recipe garnish (cook decides which approach)

---

## Generation workflow

1. Open ChatGPT (DALL-E 3) OR Gemini OR Imagen — Patrick's tool of choice
2. Paste the prompt above. Generate 3-4 variants on the first pass.
3. Inspect each against the rejection criteria. Mark the best 1-2.
4. If all fail in the same way (e.g. arils scattered, not piled), append the failure as an explicit negative: *"The pomegranate arils MUST be piled in a mound in the centre of the hummus, NOT scattered across the table around the bowl."* Regenerate.
5. Save the chosen file as `mobile/assets/recipes/hummus_hero_v1.jpg`. Increment `v2`, `v3` for iteration rounds.
6. Send to Cook with this brief for accuracy validation.
7. Photography Director updates the ledger: PENDING → CANDIDATE → APPROVED/REJECTED.
8. Engineer migrates to `seed-recipes.ts` line 924 `hero_url` once APPROVED. Replace the interim Unsplash URL.

---

## Interim until AI hero lands

While Patrick generates the AI hero (no rush — quality over speed per his 2026-05-18 directive), the engineer swaps the chocolate-sundae URL for the already-approved Unsplash hummus shot from the ledger:

```ts
// HUMMUS constant — line 924
hero_url: 'https://images.unsplash.com/photo-1637949385162-e416fb15b2ce?w=1200&q=80',
hero_attribution: 'Photo: Ludovic Avice / Unsplash',
```

That ships TODAY (next data commit) and removes the chocolate-sundae bug. The AI hero replaces it once cook signs off.

---

## Status tracker

| Image | Prompt written | Generated | Cook reviewed | Outcome | Ledger updated |
|---|---|---|---|---|---|
| hero (pomegranate-on-top) | ✅ | ⏳ | ⏳ | — | ⏳ |
| hero (interim — Ludovic Avice no-pomegranate) | n/a (Unsplash) | n/a | ✅ APPROVED 2026-05-14 COO | APPROVED | ⏳ engineer migration |

---

*Brief written by Photography Director · 2026-05-18.*
*Revision history: v1.0 initial draft following Patrick's 2026-05-18 chocolate-sundae bug report + pomegranate-on-top request.*
