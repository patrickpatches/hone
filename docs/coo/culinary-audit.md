# Culinary & Cultural Audit — Hone Seed Recipe Library

> Maintained by: Culinary & Cultural Verifier
> Format: one row per recipe, updated each audit pass.
> Critical path: audit must be complete before 13 May 2026 (photography start).

---

## Daily culinary review — rotation log

> Hone Cook daily verifier. 2 recipes/run, rotating oldest-first across the 16 launch recipes (`SEED_RECIPES`). One line per review: date · recipe · verdict.

- 2026-06-05 · Smash Burger · Solid — fix: patty target 1 cm → ~5 mm (Andy Cooks). Issue #32.
- 2026-06-05 · Pasta Carbonara · Needs work — wrong chef credit (Gordon Ramsay's carbonara uses crème fraîche/bacon/parmesan, contradicts the no-cream Roman recipe); re-credit. Issue #33.
- 2026-06-06 · Perfect Roast Chicken · Solid — method is professional-grade. Prior timing/fan fix (#27/#28) confirmed in code (15min@230°C → 65–80min@190°C ≈ 90min total, correct for 1.8kg per Waitrose/Food52). New: roast step leads with "juices run clear" — should lead with internal temp (breast 72–74°C, thigh 82°C; temps already in equipment list). Issue #34.
- 2026-06-06 · Hummus from Scratch · Solid — tahini fix from #29 confirmed in code (now 200ml/250g dried, in professional Palestinian range per Ottolenghi *Jerusalem*). Technique (blend tahini+lemon first, hot chickpeas, 4–5min blend, ice water) is restaurant-grade. AU English clean (bicarb soda, tinned). No new issues; time_min vs total_time_minutes mismatch falls under #30.
- 2026-06-07 · Thai Green Curry · Needs work — sauce liquid ~half the credited Andy Cooks recipe (400ml coconut milk vs his 400g coconut cream + 300ml chicken stock); lime in finishing_note but missing from ingredients[]; video_url is a YouTube Short, not the full recipe; kaffir → makrut terminology. Technique (fry paste, crack cream, basil off-heat) is professional-grade. Issue #51.
- 2026-06-07 · Pad Thai · Needs work — no garlic/shallot anywhere in the recipe (Andy Cooks fries garlic/spring-onion whites/shrimp paste; Hot Thai Kitchen uses garlic+shallot+dried shrimp+preserved radish); palm sugar 1 tbsp vs Pailin's ~3 tbsp caramelised — will eat sour. Attribution PASS (correct full Andy Cooks video). Timings realistic. Issue #52.
- 2026-06-08 · The Weekday Bolognese · Needs work — wrong chef credit: milk-FIRST signature step is Marcella Hazan (*Essentials*, 1992), not Andy Cooks, whose published ragù adds milk in the last 10 min, uses pancetta + beef only, passata, no garlic/stock, 2–4 h simmer; source notes admit no video verified. Re-credit. Cooking itself professional. Issue #53.
- 2026-06-08 · Home Oven Chicken Shawarma · Solid — fix: thigh target "74 °C" → 80–85 °C (74 °C is the safety floor; thighs need collagen breakdown, per ThermoWorks/America's Test Kitchen), lead stage_note with temp not "juices run clear" (same class as #34); drop "broil" for AU English. Marinade ratios, salt curve, attribution all professional. Issue #54.
- 2026-06-09 · Butter Chicken from Scratch · Needs work — no kasuri methi (dried fenugreek) anywhere; it's the ingredient that defines murgh makhani and the credited chef (Joshua Weissman) uses it in both marinade and sauce (per Swasthi's Recipes + Weissman's own recipe). Add 1 tbsp, crushed, at the final cream simmer. Also s3 references "remaining garam masala" that doesn't exist (2 tsp listed once, used in marinade). Attribution PASS (specific Weissman video). Issue #55.
- 2026-06-09 · Australian Pavlova · Solid — cornflour 2 tsp vs Donna Hay's 1 tbsp and vinegar 1 tsp vs her 1½ tsp (both structure ingredients run a third lean of the credited source; sugar 50 g/white is fine). Method adds sugar at soft peaks vs Donna Hay's stiff peaks — legitimate either way. Attribution PASS (specific Donna Hay video). Issue #56.

---

## Audit summary

| | Count |
|---|---|
| Total seed recipes | 45 |
| Attribution PASS | 19 |
| Attribution FAIL | 16 |
| Attribution N/A (Hone Kitchen / tradition) | 10 |
| Cultural origin issues flagged | 1 |
| Second-pass items outstanding (subs / voice / AU English) | 45 |

**Attribution failures require engineer action before any recipe ships.** See `handoffs.md` → Senior Engineer → ATTR-FAIL block.

---

## Pass 1 — Attribution & cultural origin (complete, 2026-05-08)

### Attribution classification key

| Code | Meaning |
|---|---|
| `SPECIFIC_VIDEO` | YouTube `watch?v=` URL pointing to the exact recipe video. PASS. |
| `SPECIFIC_NON_YT` | Non-YouTube URL pointing to a specific recipe page. PASS. |
| `CHANNEL_PAGE` | YouTube `@handle` or `/c/channel` URL — channel homepage only. FAIL. |
| `SITE_ROOT` | Domain root URL (e.g. `https://www.reemkassis.com/`). FAIL. |
| `CHEF_PAGE` | Author or chef listing page, not a specific recipe. FAIL. |
| `ABOUT_PAGE` | About or bio page. FAIL. |
| `MISMATCH` | URL points to a different recipe than the one being attributed. Needs review. |
| `NO_URL` | No link. Acceptable when chef is "Hone Kitchen" or a tradition attribution. |

---

## SMASH_BURGER · Smash Burger · american / burgers

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Andy Cooks. `SPECIFIC_VIDEO`. `https://www.youtube.com/watch?v=oa2g6gB_1BU`. Link verified as a direct recipe video.
**Cultural origin:** PASS — `american`. Correct.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clear, but requires second pass on subs / voice / AU English before final sign-off.

---

## CHICKEN_ADOBO · Chicken Adobo · filipino / chicken

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** FAIL — `CHANNEL_PAGE`. Chef listed as "Anthony Bourdain / No Reservations" but `video_url` points to `https://www.youtube.com/@AnthonyBourdainPartsUnknown` — the *Parts Unknown* channel homepage, not a specific recipe video. Two issues: (1) the channel linked is Parts Unknown, not No Reservations (different show); (2) a channel page never resolves to a specific recipe. The Bourdain adobo segment most commonly cited is the *No Reservations Philippines* episode (Season 8, Ep 1). Engineer must locate the specific YouTube video for that episode or remove the URL and update `chef` to reflect the source accurately. If no specific clip is available, reframe as "Inspired by Anthony Bourdain's *No Reservations* Philippines episode" with no URL.
**Cultural origin:** PASS — `filipino`. Correct.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution broken. Fix URL before launch.

---

## PASTA_CARBONARA · Pasta Carbonara · italian / pasta

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Gordon Ramsay. `SPECIFIC_VIDEO`. `https://www.youtube.com/watch?v=5t7JLjr1FxQ`.
**Cultural origin:** PASS — `italian`. Correct. Note: carbonara is a Roman dish; tag as `italian` is sufficient for v1 but could be refined to `roman` or `lazio` in a future taxonomy pass.
**Substitutions:** Pending second pass. Note: any substitution that replaces guanciale with bacon or pancetta, or egg yolks with cream, must be flagged as `compromise` or `different_dish` — these are not equivalent swaps in carbonara. Critical honesty check needed.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Substitution honesty is the key risk on this recipe; second pass required before ship.

---

## BEEF_STEW · Classic Beef Stew · french / beef

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** FAIL — `CHANNEL_PAGE`. Chef: Jacques Pépin. URL: `https://www.youtube.com/c/HomeCookingwithJacquesPepin` — channel root. Engineer must locate the specific Pépin beef stew episode on this channel and replace with `watch?v=` URL. If no specific match, reframe as "inspired by Jacques Pépin" with no URL.
**Cultural origin:** PASS — `french`. Appropriate for a braised beef stew in this style. Boeuf bourguignon styling would warrant a more specific label; standard `french` acceptable.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — broken attribution only. Second pass required.

---

## ROAST_CHICKEN · Perfect Roast Chicken · french / chicken

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** FAIL — `CHANNEL_PAGE`. Chef: Thomas Keller / Bouchon. URL: `https://www.youtube.com/@ChefThomasKeller` — channel homepage. The Keller roast chicken method is well-documented (Bouchon cookbook; also available via MasterClass). Engineer must find a specific YouTube video on `@ChefThomasKeller` that covers this exact technique, or switch attribution to the Bouchon cookbook (no URL, or a direct book citation format) if no suitable video exists.
**Cultural origin:** PASS — `french`. Keller's approach is French-trained. Correct.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution broken.

---

## MUSAKHAN · Musakhan · levantine / chicken

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** FAIL — `SITE_ROOT`. Chef: Reem Kassis / The Palestinian Table. URL: `https://www.reemkassis.com/` — root domain only. Engineer must locate the specific Musakhan recipe page on Reem Kassis's site, or update to a specific video or published page for this dish. Reem Kassis's *The Palestinian Table* (2017) is the primary source; if linking to the book, use the attribution format "Reem Kassis, *The Palestinian Table*" with no URL, or find a live web recipe page.
**Cultural origin:** PASS — `levantine`. No Israeli label. Musakhan is a Palestinian dish; the attribution to Reem Kassis (a Palestinian author) is exactly right. Consider adding a `region: 'palestinian'` annotation in future taxonomy pass for precision. For now, `levantine` is the correct top-level tag per CLAUDE.md rules.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution broken. Cultural labelling correct and well-handled.

---

## KAFTA · Kafta Meshwi · levantine / beef

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** FAIL — `SITE_ROOT`. Chef: Anissa Helou / Feast. URL: `https://www.anissas.com/` — root domain. Engineer must find specific kafta recipe page on `anissas.com`, or update to a specific published source. Anissa Helou's *Feast: Food of the Islamic World* (2018) contains kafta meshwi. If no specific web page available, update to book citation with no URL.
**Cultural origin:** PASS — `levantine`. Kafta meshwi is broadly Levantine (Lebanese / Syrian / Palestinian). Attribution to Anissa Helou (Lebanese-born food writer) is well-chosen. No Israeli label. Correct.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution broken. Cultural handling correct.

---

## HUMMUS · Hummus from Scratch · levantine / vegetarian

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** FAIL — `SITE_ROOT`. Chef: Reem Kassis / The Palestinian Table. URL: `https://www.reemkassis.com/` — root domain. Same issue as MUSAKHAN. Engineer must find the specific hummus page or update to a book citation. Reem Kassis is the right attribution — her hummus method (cold water blending, extensive tahini) is distinctive and citable.
**Cultural origin:** PASS — `levantine`. Hummus is a contested dish; the correct label under CLAUDE.md rules is Levantine. Reem Kassis attribution implicitly positions this as Palestinian-lineage. No Israeli label. Correct.
**Substitutions:** Pending second pass. Note: any swap of dried chickpeas for tinned must be flagged as `compromise` — the texture and depth are meaningfully different.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution broken. Culturally this is among the most sensitive recipes in the library; handling is correct.

---

## FATTOUSH · Fattoush · levantine / salad

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** FAIL — `SITE_ROOT`. Chef: Anissa Helou / Lebanese Cuisine. URL: `https://www.anissas.com/` — root domain. Same issue as KAFTA. Engineer must find specific fattoush recipe page or update to book citation. Anissa Helou's *Lebanese Cuisine* (1994) is the source reference.
**Cultural origin:** PASS — `levantine`. Fattoush is a Levantine salad (Lebanese in origin, eaten across Syria, Palestine, Jordan). Attribution to Anissa Helou is correct. No Israeli label.
**Substitutions:** Pending second pass. Note: sumac is the key flavouring; any swap must flag that the dish loses its characteristic tartness without it.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution broken.

---

## PRAWN_TACOS_PINEAPPLE · Prawn Tacos with Pineapple Salsa · mexican / seafood

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** FAIL — `CHANNEL_PAGE`. Chef: Andy Cooks. URL: `https://www.youtube.com/@andy_cooks` — channel homepage. Engineer must find the specific Andy Cooks prawn taco / pineapple salsa video and replace with `watch?v=` URL. Andy Cooks has published taco content; a direct search on the channel is required.
**Cultural origin:** PASS — `mexican`. Reasonable. Prawn tacos with charred pineapple salsa is a Baja / Pacific-coast Mexican style. Correct.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution broken.

---

## SOURDOUGH_MAINTENANCE · Sourdough Starter — Maintenance Guide · australian / baking

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** FAIL — `ABOUT_PAGE`. Chef: Chad Robertson / Tartine Bakery. URL: `https://tartinebakery.com/about` — about page, not a recipe. Chad Robertson's starter method is from *Tartine Bread* (2010). Engineer must either: (a) find a specific Tartine or Robertson video showing starter maintenance (there are official YouTube clips), or (b) update attribution to book citation "Chad Robertson, *Tartine Bread*" with no URL.
**Cultural origin:** PASS — `australian` is a reasonable tag for a maintenance guide (no specific cuisine, general baking). Acceptable.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution broken.

---

## SOURDOUGH_LOAF · Sourdough Country Loaf · australian / baking

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** FAIL — `ABOUT_PAGE`. Chef: Chad Robertson / Tartine Bakery. URL: `https://tartinebakery.com/about` — same broken link as SOURDOUGH_MAINTENANCE. The country loaf recipe is the centrepiece of *Tartine Bread*; the Chad Robertson attribution is correct. Engineer must update to a specific page — either a Tartine recipe page or a verified Robertson video (e.g. MasterClass clips exist but may be paywalled). If no live free URL is available, use book citation with no URL.
**Cultural origin:** PASS — `australian` acceptable for baking guide. No issues.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution broken.

---

## RISOTTO · Mushroom Risotto · italian / vegetarian

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** FAIL — `SITE_ROOT` + possible attribution ambiguity. Chef listed as "Marcella Hazan" but URL is `https://giulianohazan.com/` — Giuliano Hazan's site (Marcella's son, also a chef). Marcella Hazan passed away in 2013; her recipes are carried in part on Giuliano's site. Two issues: (1) site root, not a specific recipe page; (2) the URL is Giuliano's site, not Marcella's — if this is Marcella's recipe, cite it from Giuliano's site with a specific URL, or from *Essentials of Classic Italian Cooking* (book citation). Engineer must locate the specific mushroom risotto page on giulianohazan.com or confirm the correct book source.
**Cultural origin:** PASS — `italian`. Correct. Risotto is a northern Italian dish (Lombardy / Piedmont / Veneto). `italian` is sufficient for v1.
**Substitutions:** Pending second pass. Note: any swap of arborio/carnaroli for long-grain rice must be flagged as `different_dish` — starch content is the mechanism.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution broken.

---

## FISH_TACOS · Baja Fish Tacos · mexican / seafood

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Rick Bayless. `SPECIFIC_VIDEO`. `https://www.youtube.com/watch?v=MsLRAE7q3m8`. Rick Bayless is the preeminent US authority on Mexican cuisine; attribution is well-chosen for Baja style.
**Cultural origin:** PASS — `mexican`. Baja fish tacos are a northern Mexican (Baja California) dish. Correct.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Second pass required.

---

## THAI_GREEN_CURRY · Thai Green Curry · thai / chicken

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Andy Cooks. `SPECIFIC_VIDEO`. `https://www.youtube.com/watch?v=lleTlMtbN8Q`.
**Cultural origin:** PASS — `thai`. Correct.
**Substitutions:** Pending second pass. Note: any swap of fish sauce for soy must be flagged — the savoury profile changes meaningfully. Coconut milk vs coconut cream distinction also needs honest treatment.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Second pass required.

---

## FRENCH_ONION_SOUP · French Onion Soup · french / soup

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** FAIL — `CHANNEL_PAGE`. Chef: Anthony Bourdain / Les Halles. URL: `https://www.youtube.com/@AnthonyBourdainPartsUnknown` — Parts Unknown channel homepage. Two issues: (1) channel page, not a specific video; (2) the Les Halles book and the Parts Unknown show are different sources — the URL channel doesn't correspond to the stated source. Bourdain's French Onion Soup recipe is in *Anthony Bourdain's Les Halles Cookbook* (2004). Engineer must either: (a) find a specific video of Bourdain making this dish, or (b) update attribution to the book ("Anthony Bourdain, *Les Halles Cookbook*") with no URL.
**Cultural origin:** PASS — `french`. French onion soup (soupe à l'oignon) is definitively French. Correct.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution broken.

---

## PAD_THAI · Pad Thai · thai / noodles

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Andy Cooks. `SPECIFIC_VIDEO`. `https://www.youtube.com/watch?v=6Lb1PyJxVQM`.
**Cultural origin:** PASS — `thai`. Correct. Pad Thai is the national street food of Thailand.
**Substitutions:** Pending second pass. Note: tamarind paste swap honesty is critical — many recipes substitute lime juice, which gives acidity but misses the depth. Must be `compromise` not `great_swap`.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Second pass required.

---

## BRAISED_SHORT_RIBS · Red Wine Braised Short Ribs · american / beef

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Gordon Ramsay. `SPECIFIC_VIDEO`. `https://www.youtube.com/watch?v=QnxLau7m600`.
**Cultural origin:** PASS — `american`. Braised short ribs in this style (red wine, French technique, American cut) is correctly tagged. `french` would also be defensible but `american` is how the dish is understood in the home-cook context. Acceptable.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Second pass required.

---

## RAMEN · Shoyu Ramen · japanese / noodles

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** FAIL — `SITE_ROOT`. Chef: Ivan Orkin / Ivan Ramen. URL: `https://www.ivanramen.com/` — site root. Ivan Orkin is a genuinely exceptional choice for shoyu ramen attribution (his book *Ivan Ramen: Love, Obsession, and Recipes from Tokyo's Most Unlikely Noodle Joint* is the reference). Engineer must find a specific recipe page on `ivanramen.com` or a specific Ivan Orkin video. If no live URL available, update to book citation with no URL. Note: Ivan Ramen is a New York restaurant — for Australian audiences, sourcing context should note this is a US-based Japanese-style ramen; the recipe itself is authentic.
**Cultural origin:** PASS — `japanese`. Shoyu ramen is Japanese. Correct.
**Substitutions:** Pending second pass. Note: dashi/tare complexity means many substitutions fundamentally change the bowl. Must be honest about this.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution broken.

---

## BEEF_WELLINGTON · Beef Wellington · french / beef

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Gordon Ramsay. `SPECIFIC_VIDEO`. `https://www.youtube.com/watch?v=TE2omM_NoXU`. Ramsay is the definitive modern authority on Beef Wellington.
**Cultural origin:** PASS — `french` in the sense of classical French-trained technique (duxelles, pastry). The dish's origin is contested but it is cooked and presented in the French culinary tradition. `french` is defensible and appropriate for v1.
**Substitutions:** Pending second pass. Note: phyllo vs puff pastry swap is a significant texture compromise and must be tagged accordingly.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Second pass required.

---

## DAL · Tarka Dal · indian / vegetarian

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** FAIL — `CHEF_PAGE`. Chef: Madhur Jaffrey. URL: `https://thehappyfoodie.co.uk/chefs/madhur-jaffrey/` — a listing page of all Madhur Jaffrey recipes on The Happy Foodie, not a specific tarka dal page. Engineer must find the specific dal recipe on The Happy Foodie site (`thehappyfoodie.co.uk/recipes/...`) or locate a specific Madhur Jaffrey video. Note: Madhur Jaffrey does not have a large official YouTube presence; the book citation (*Indian Cookery*, 1982, or *Madhur Jaffrey's Curry Easy*) may be the more honest attribution route.
**Cultural origin:** PASS — `indian`. Tarka dal is pan-Indian home cooking. Correct.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution broken.

---

## SCRAMBLED_EGGS · Perfect Scrambled Eggs · australian / eggs

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** FAIL — `CHANNEL_PAGE`. Chef: Gordon Ramsay. URL: `https://www.youtube.com/@GordonRamsay` — channel homepage. The Ramsay scrambled eggs method is one of his most famous and is available as a specific video. Engineer must locate the specific scrambled eggs video (there are multiple; the most-cited is the ITV "F Word" clip, which is available on YouTube as a standalone video) and replace with `watch?v=` URL.
**Cultural origin:** PASS — `australian` is a reasonable tag for a technique dish with no specific cultural origin. Acceptable for v1.
**Substitutions:** Pending second pass. Note: crème fraîche is the Ramsay finish — any swap (sour cream, cream cheese, butter) changes the texture and must be flagged.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution broken.

---

## WEEKDAY_BOLOGNESE · The Weekday Bolognese · italian / pasta

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** FAIL — `CHANNEL_PAGE`. Chef: Andy Cooks. URL: `https://www.youtube.com/@andy_cooks` — channel homepage. Engineer must locate the specific Andy Cooks Bolognese video and replace with `watch?v=` URL. Andy Cooks (Andy Hearnden) has published a bolognese; check his channel for the specific episode.
**Cultural origin:** PASS — `italian`. Bolognese (ragù alla bolognese) is from Bologna. `italian` is correct.
**Substitutions:** Pending second pass. Note: any use of minced chicken or pork-free versions must be flagged — this changes the fat content and depth of the sauce. Must be tagged `compromise`.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution broken.

---

## AGLIO_E_OLIO · Spaghetti Aglio e Olio · italian / pasta

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Chef: Hone Kitchen. `NO_URL`. Aglio e olio is a Roman tradition dish; "Hone Kitchen" is the correct attribution for an original presentation of a traditional recipe with no specific chef claim. No issues.
**Cultural origin:** PASS — `italian`. Spaghetti aglio e olio is Roman (Lazio). `italian` is correct.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Second pass required.

---

## MUJADARA · Mujadara · levantine / vegetarian

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Chef: Hone Kitchen. `NO_URL`. Mujadara is a traditional Levantine dish with no single chef origin; "Hone Kitchen" is the correct attribution for a traditional home-cook version. No issues.
**Cultural origin:** PASS — `levantine`. Mujadara (lentils, rice, caramelised onion) is broadly Levantine — eaten across Lebanon, Syria, Palestine, Jordan. No Israeli label. Correct.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution and cultural origin clean. Second pass required.

---

## SHEET_PAN_HARISSA_CHICKEN · Sheet-Pan Harissa Chicken with Chickpeas · levantine / chicken

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Chef: Hone Kitchen. `NO_URL`. Original recipe; no chef claim. Correct.
**Cultural origin:** FLAG — `levantine` is imprecise for a harissa-forward dish. Harissa is North African in origin — Tunisian primarily, also Moroccan, Algerian, Libyan. Harissa is used in Levantine cooking but the flavour profile of this dish (harissa + chickpeas + yoghurt) is more accurately described as North African or Maghrebi. Recommend changing cuisine tag from `levantine` to `north_african` or `mediterranean`. This is not a Golden Rule violation (no Israeli label is an issue here) but it is a cultural accuracy issue. Flagged for Product Designer to raise with Patrick.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — cuisine tag needs correction. Attribution clean.

---

## EGG_FRIED_RICE · Proper Egg Fried Rice · chinese / rice

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Chef: Hone Kitchen. `NO_URL`. Egg fried rice is a foundational technique dish across Chinese regional cooking; "Hone Kitchen" attribution is correct for an original version. No issues.
**Cultural origin:** PASS — `chinese`. Egg fried rice is Chinese. Correct. Note: it's broadly Chinese (not specific to a region); `chinese` is the appropriate tag.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution and cultural origin clean. Second pass required.

---

## LAMB_SHAWARMA · Home Oven Lamb Shawarma · levantine / lamb

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Chef: Hone Kitchen. `NO_URL`. Shawarma is a Levantine street food tradition; "Hone Kitchen" attribution is correct for a home-oven adaptation. No issues.
**Cultural origin:** PASS — `levantine`. Shawarma is broadly Levantine (Syrian, Lebanese, Palestinian, Jordanian). No Israeli label. Correct.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution and cultural origin clean. Second pass required.

---

## NASI_LEMAK · Nasi Lemak · malaysian / rice

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Andy Hearnden (Andy Cooks). `SPECIFIC_VIDEO`. `https://www.youtube.com/watch?v=N_p7LC3d9To`. Andy Hearnden has lived experience with Malaysian cuisine; attribution is appropriate.
**Cultural origin:** PASS — `malaysian`. Nasi lemak is Malaysia's national dish. Correct.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Second pass required.

---

## BEEF_RENDANG · Beef Rendang · malaysian / beef

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Andy Hearnden (Andy Cooks). `SPECIFIC_VIDEO`. `https://www.youtube.com/watch?v=K4v2Rg2ZTUY`.
**Cultural origin:** PASS — `malaysian`. Rendang originated in Minangkabau (Padang, West Sumatra) but is a national dish of Malaysia. `malaysian` is the appropriate tag for Hone's context. No issues.
**Substitutions:** Pending second pass. Note: kerisik (toasted coconut) is non-negotiable in an authentic rendang; any substitute must be flagged as fundamentally changing the dish.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Second pass required.

---

## CURRY_LAKSA · Curry Laksa · malaysian / noodles

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Andy Hearnden (Andy Cooks). `SPECIFIC_VIDEO`. `https://www.youtube.com/watch?v=sp6iBhjpWsI`.
**Cultural origin:** PASS — `malaysian`. Curry laksa (as distinct from assam laksa) is a Malaysian dish. Correct.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Second pass required.

---

## CHAR_KWAY_TEOW · Char Kway Teow · malaysian / noodles

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Andy Hearnden (Andy Cooks). `SPECIFIC_VIDEO`. `https://www.youtube.com/watch?v=cgZ0VwfB6nw`.
**Cultural origin:** PASS — `malaysian`. Char kway teow is a Malaysian-Singaporean hawker dish; `malaysian` is appropriate. Some would argue `singaporean` is equally valid; for v1, `malaysian` is fine.
**Substitutions:** Pending second pass. Note: lap cheong (Chinese sausage) is central to the dish; any pork-free substitute must be flagged as a major compromise that changes the flavour profile.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Second pass required.

---

## BUTTER_CHICKEN · Butter Chicken from Scratch · indian / chicken

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Joshua Weissman. `SPECIFIC_VIDEO`. `https://www.youtube.com/watch?v=mrDJ2K3JXsA`. Note: Weissman is a capable attribution for a home-cook butter chicken but he is not an Indian culinary authority. This is a stylistic choice — "inspired by" framing may be more honest than direct attribution. Not a fail, but worth reviewing in second pass: would an Indian authority (Sanjeev Kapoor, Ranveer Brar, Meghna's Food Magic) be a more culturally appropriate attribution?
**Cultural origin:** PASS — `indian`. Butter chicken (murgh makhani) originated in Delhi (Moti Mahal, Kundan Lal Gujral attribution is standard). `indian` is correct.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution technically valid but cultural fit worth reviewing. Second pass required.

---

## SAAG_PANEER · Saag Paneer · indian / vegetarian

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Chef: Hone Kitchen. `NO_URL`. Saag paneer is a pan-Indian home-cook dish; "Hone Kitchen" attribution is acceptable. No issues.
**Cultural origin:** PASS — `indian`. Correct. Saag paneer is North Indian (Punjab / UP). `indian` is the right tag for v1.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Second pass required.

---

## CHICKEN_KATSU · Chicken Katsu · japanese / chicken

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Andy Hearnden (Andy Cooks). `SPECIFIC_VIDEO`. `https://www.youtube.com/watch?v=WfRbviqgiSA`.
**Cultural origin:** PASS — `japanese`. Chicken katsu (チキンカツ) is Japanese. Correct.
**Substitutions:** Pending second pass. Note: panko is non-negotiable for katsu; any swap to regular breadcrumbs must be flagged as a meaningful compromise on texture.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Second pass required.

---

## TOM_YUM · Tom Yum Goong · thai / soup

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Andy Hearnden (Andy Cooks). `SPECIFIC_VIDEO`. `https://www.youtube.com/watch?v=ZcGqfJSo5hU`.
**Cultural origin:** PASS — `thai`. Tom yum goong is a central-Thai dish. Correct.
**Substitutions:** Pending second pass. Note: galangal and kaffir lime leaves are non-substitutable in a way that maintains authenticity — any swap must be flagged as `different_dish`.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Second pass required.

---

## BARRAMUNDI · Pan-Seared Barramundi, Lemon Butter · australian / seafood

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Chef: Hone Kitchen. `NO_URL`. Original technique recipe with Australian fish; "Hone Kitchen" is the correct attribution. No issues.
**Cultural origin:** PASS — `australian`. Barramundi is an Australian fish. Pan-seared with lemon butter is modern Australian style. Correct.
**Substitutions:** Pending second pass. Note: barramundi is widely available at major Australian supermarkets; any swap should flag the texture difference (e.g. snapper is firmer, salmon is much fattier).
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Second pass required.

---

## PAVLOVA · Australian Pavlova · australian / baking

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Donna Hay. `SPECIFIC_VIDEO`. `https://www.youtube.com/watch?v=qknVSyzmuo4`. Donna Hay is the definitive modern Australian authority on pavlova. Well-chosen.
**Cultural origin:** PASS — `australian`. Pavlova is a dessert claimed by both Australia and New Zealand; Hone's Australian focus means `australian` is the right tag. No issues.
**Substitutions:** Pending second pass. Note: any swap of caster sugar for granulated must be flagged — grain size affects the dissolution rate and the meringue texture.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Second pass required.

---

## FLOUR_TORTILLAS · Flour Tortillas · mexican / baking

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS (with note) — Chef: Patrick Nasr. `NO_URL`. This appears to be an original Hone recipe with the owner's name as attribution. Technically not a Golden Rule 1 violation (no broken link, no fabricated chef). However: (a) should the chef be "Hone Kitchen" rather than "Patrick Nasr" for consistency? (b) Flour tortillas are a traditional Tex-Mex / Northern Mexican food; if this is Patrick's personal version, "Patrick Nasr" is honest; if it's meant to represent a traditional method, the attribution should be "Mexican tradition" or "Northern Mexican tradition." Flag for COO decision: keep personal attribution or standardise?
**Cultural origin:** PASS — `mexican`. Flour tortillas are from Northern Mexico (Sonora) / Tex-Mex. `mexican` is correct.
**Substitutions:** Pending second pass. Note: lard substitution (vegetable shortening vs oil) must accurately describe the texture difference — research file correctly calls this out. Verify the in-app substitution list matches.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution honest but chef field consistency decision needed. Second pass required.

---

## CHICKEN_SCHNITZEL · Chicken Schnitzel · australian / chicken

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Adam Liaw. `SPECIFIC_NON_YT`. `https://www.smh.com.au/goodfood/recipes/adam-liaws-classic-chicken-schnitzel-20180206-h0vphi.html`. Specific recipe page on Good Food / SMH. Adam Liaw is a natural choice for a modern Australian schnitzel. Verify link is still live before ship (newspaper recipe pages do go behind paywalls or get removed).
**Cultural origin:** PASS — `australian`. Schnitzel is Austrian/German in origin but chicken schnitzel is deeply embedded in Australian pub and home-cook culture. `australian` is the right tag for Hone's context.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean but URL liveness must be confirmed before launch (newspaper links can expire). Second pass required.

---

## CHICKEN_VEG_STIR_FRY · Easy Chicken & Vegetable Stir-Fry · chinese / chicken

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Nagi Maehashi (RecipeTin Eats). `SPECIFIC_NON_YT`. `https://www.recipetineats.com/chicken-stir-fry/`. Specific recipe page. Nagi Maehashi is a well-regarded Australian food blogger with strong Asian-cooking content. Appropriate attribution.
**Cultural origin:** FLAG — `chinese, australian`. Dual tag. A basic chicken and vegetable stir-fry in this home-cook style could be tagged as `chinese` alone (as the technique is Chinese); the `australian` tag is possibly from Nagi's Aus-audience lens. Not a fail, but the cultural mapping feels like an editorial choice rather than a culinary one. Acceptable for v1; note for future taxonomy review.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Cuisine dual-tag is a minor taxonomy note, not a blocker. Second pass required.

---

## BEEF_LASAGNE · Beef Lasagne · italian / pasta

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PARTIAL PASS — `SPECIFIC_NON_YT` but `MISMATCH`. Chef: Marcella Hazan. URL: `https://www.nytimes.com/recipes/12869/marcella-hazans-bolognese-meat-sauce.html`. The URL is a specific NYT recipe page — but it links to Marcella Hazan's Bolognese meat sauce, not a lasagne recipe. It's likely that our lasagne uses Hazan's Bolognese as the sauce component (this is a legitimate culinary decision — Hazan's bolognese is the standard for ragù alla bolognese). However, the recipe title is "Beef Lasagne" and the link lands on "Bolognese Meat Sauce." The attribution should either: (a) use the bolognese URL and note "Sauce: Marcella Hazan's bolognese from *Essentials of Classic Italian Cooking*; assembled as lasagne — Hone Kitchen"; or (b) find a Hazan lasagne page specifically. As is, a user clicking the link will be confused. Flagged for engineer to resolve attribution copy.
**Cultural origin:** PASS — `italian`. Lasagne al forno is an Emilian dish (Bologna). `italian` is correct.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution mismatch needs copy resolution. Not a broken link, but a context problem.

---

## ROAST_LAMB · Roast Lamb with Rosemary & Garlic · australian / lamb

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Maggie Beer. `SPECIFIC_NON_YT`. `https://maggiebeer.com.au/recipes/slow-roasted-lamb-shoulder`. Specific recipe page. Maggie Beer is one of the most respected voices in Australian food; attribution is excellent for an Australian roast lamb. Verify link is still live before ship.
**Cultural origin:** PASS — `australian`. Roast lamb is central to Australian food culture (particularly Sunday roast). Correct.
**Substitutions:** Pending second pass.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. URL liveness check required before launch. Second pass required.

---

## FISH_AND_CHIPS · Fish & Chips · australian / seafood

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Chef: "Australian Friday tradition". `NO_URL`. Fish and chips is a traditional dish with no single chef origin; tradition attribution is honest and appropriate. No issues.
**Cultural origin:** PASS — `australian`. Fish and chips is embedded in Australian coastal culture (originally British in origin, but `australian` is the right tag for Hone's audience and context). Correct.
**Substitutions:** Pending second pass. Note: should note that barramundi, whiting, and flathead are the traditional Australian choices; cod or haddock (British style) are typically unavailable at Australian fishmongers. This is an Australian-availability note worth surfacing.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution clean. Second pass required.

---

## FALAFEL · Falafel · levantine / vegetarian

**Audited:** 2026-05-08 by Culinary Verifier
**Attribution:** PASS — Chef: "Levantine tradition". `NO_URL`. Falafel's origins are contested (Egypt also has a strong claim with ta'ameya using fava beans). The "Levantine tradition" framing is honest and appropriate — it does not overclaim a specific country or chef. No issues.
**Cultural origin:** PASS — `levantine`. Falafel as made with chickpeas is Levantine (the Egyptian version uses fava beans). Chickpea falafel is Lebanese, Syrian, Palestinian, Jordanian. `levantine` is the correct tag under CLAUDE.md rules. No Israeli label. Correct.
**Substitutions:** Pending second pass. Note: dried chickpeas vs tinned is a critical substitution honesty point in falafel — tinned chickpeas retain too much moisture and produce a falafel that falls apart in the oil. Must be flagged as `compromise` at minimum, or `different_result`.
**Australian English:** Pending second pass.
**Voice:** Pending second pass.
**Recommendation:** FIX BEFORE SHIP — attribution and cultural handling clean. Second pass required.

---

## Pass 2 — Substitutions, Voice & Australian English

> **Status: Not yet started.** Requires a full read of each recipe's `ingredients[]`, `steps[]`, and `source.notes` in `seed-recipes.ts`.
>
> Scheduled before 13 May 2026. The following recipes carry pre-identified risks for second pass:
> - **PASTA_CARBONARA** — guanciale and cream substitution honesty
> - **HUMMUS** — dried vs tinned chickpea substitution
> - **FALAFEL** — dried vs tinned chickpea substitution (falafel falls apart with tinned)
> - **RISOTTO** — arborio vs long-grain substitution (different dish)
> - **BEEF_RENDANG** — kerisik non-substitutability
> - **BUTTER_CHICKEN** — cultural authority of attribution vs Indian sources
> - **CHICKEN_SCHNITZEL** — SMH URL liveness
> - **ROAST_LAMB** — Maggie Beer URL liveness

---

## Attribution failures — engineer handoff summary

16 recipes require `video_url` updates in `seed-recipes.ts`. See `handoffs.md` → Senior Engineer → `ATTR-FAIL`.

| Recipe ID | Chef | Current URL | Issue | Action |
|---|---|---|---|---|
| CHICKEN_ADOBO | Anthony Bourdain | `@AnthonyBourdainPartsUnknown` | Channel page + wrong channel | Find specific No Reservations clip or use book citation |
| BEEF_STEW | Jacques Pépin | `/c/HomeCookingwithJacquesPepin` | Channel page | Find specific beef stew episode |
| ROAST_CHICKEN | Thomas Keller | `@ChefThomasKeller` | Channel page | Find specific roast chicken video or use book citation |
| PRAWN_TACOS_PINEAPPLE | Andy Cooks | `@andy_cooks` | Channel page | Find specific prawn tacos video |
| FRENCH_ONION_SOUP | Anthony Bourdain | `@AnthonyBourdainPartsUnknown` | Channel page + wrong channel | Find Les Halles video or use book citation |
| SCRAMBLED_EGGS | Gordon Ramsay | `@GordonRamsay` | Channel page | Find specific scrambled eggs video (The F Word clip widely available) |
| WEEKDAY_BOLOGNESE | Andy Cooks | `@andy_cooks` | Channel page | Find specific bolognese video |
| MUSAKHAN | Reem Kassis | `reemkassis.com/` | Site root | Find specific recipe page or use book citation |
| KAFTA | Anissa Helou | `anissas.com/` | Site root | Find specific recipe page or use book citation |
| HUMMUS | Reem Kassis | `reemkassis.com/` | Site root | Find specific recipe page or use book citation |
| FATTOUSH | Anissa Helou | `anissas.com/` | Site root | Find specific recipe page or use book citation |
| SOURDOUGH_MAINTENANCE | Chad Robertson | `tartinebakery.com/about` | About page | Find specific video or use book citation |
| SOURDOUGH_LOAF | Chad Robertson | `tartinebakery.com/about` | About page | Find specific video or use book citation |
| RISOTTO | Marcella Hazan | `giulianohazan.com/` | Site root | Find specific recipe page or use book citation |
| RAMEN | Ivan Orkin | `ivanramen.com/` | Site root | Find specific recipe page or use book citation |
| DAL | Madhur Jaffrey | `thehappyfoodie.co.uk/chefs/madhur-jaffrey/` | Chef listing page | Find specific dal recipe page |

---

## Cultural issues — product designer handoff summary

| Recipe ID | Issue | Recommendation |
|---|---|---|
| SHEET_PAN_HARISSA_CHICKEN | `levantine` tag — harissa is North African, not Levantine | Change to `north_african` or `mediterranean` |
| CHICKEN_VEG_STIR_FRY | `chinese, australian` dual tag — minor taxonomy note | Review in taxonomy pass; acceptable for v1 |
| FLOUR_TORTILLAS | Chef field `Patrick Nasr` — consistency decision needed | COO decision: keep personal attribution or use `Hone Kitchen` |

---

*Last updated: 2026-05-08. Next update: Pass 2 (substitutions / voice / AU English), target 2026-05-12.*
