# Launch Recipe Research & Recommendation

> Research into the most cooked/eaten meals in Australia + recommended 10 launch recipes for Hone v1.0 (24 July 2026). Patrick to approve or amend.

---

## What the data says

I pulled from four sources to triangulate "what Australians actually cook at home." No single dataset is authoritative — combined, they give a clear picture.

### Source 1: Meat & Livestock Australia (MLA) household survey

Australia's most authoritative survey on home cooking. Key findings:
- **Roast chicken** — most popular meal type
- **Spaghetti bolognese** — cooked weekly by ~36% of households (third most popular overall)
- **Stir-fry** — 18% of weekly responses
- **Steak** — top three
- **Spag bol** plus **stir-fry** plus **roast chicken** form the trinity of weekly Australian cooking

### Source 2: Google Year in Search 2025 — Australia

Top trending recipes searched in Australia in 2025:
- Hot cross bun recipe (#1 trending)
- Chicken noodle dishes (most clicked recipe of the year)
- Pad see ew (Thai noodles)
- Dubai chocolate (viral)
- Cloud cake, Turkish pasta (viral via TikTok)

### Source 3: Supermarket recipe sites (Coles + Woolworths)

What Coles and Woolworths feature for "family dinners" — proxy for what supermarkets see selling:
- Chicken meatballs / homemade bolognese
- Mac and cheese
- Chicken schnitzel (parmigiana territory)
- Stir-fries (pork and cashew noodle)
- Tray bakes (chilli con carne)
- Roast dinners
- Slow-cooker meals
- Curries (Thai green, butter chicken)
- One-pot wonders
- Pasta dishes broadly

### Source 4: RecipeTin Eats (Australia's #1 cooking site)

Per Similarweb, RecipeTin Eats is the most-visited cooking website in Australia (Feb 2026). Nagi Maehashi is described as Australia's most popular cook. Confirmed strong-performing 2024 recipes include Singapore noodles (with chicken sub for char sui), and pasta dishes broadly. Their cookbook "Dinner: 150 recipes from Australia's most popular cook" is a useful corpus.

---

## What the data converges on

If you blend the four sources, the dishes that show up repeatedly as "most cooked at home in Australia" are:

**Tier 1 — top-tier Australian household frequency:**
1. Roast chicken
2. Spaghetti bolognese
3. Carbonara / creamy chicken pasta
4. Stir-fry (any kind of weeknight stir-fry)
5. Butter chicken / Thai green curry (Asian curries are massive in AU)
6. Chicken schnitzel / parmigiana
7. Lasagne

**Tier 2 — popular but more occasion-specific:**
8. Smash burger / pub burger
9. Roast lamb (Sunday roast tradition)
10. Fish and chips / pan-fried fish (salmon and barramundi most cooked at home)
11. Pavlova (iconic dessert, occasional)

**Tier 3 — popular in specific demographics:**
12. Chicken shawarma / kebab plate (Levantine, common in modern AU dining)
13. Hummus (very widely made)
14. Pad thai / pad see ew (Thai trending)

---

## The trade-off you're choosing between

**Option A: Strict popularity-only top 10.**
Pure data drives the list: bolognese, roast chicken, stir-fry, butter chicken, carbonara, schnitzel/parmi, lasagne, pavlova, smash burger, roast lamb. Lots of overlap with every other recipe app on the Play Store. Would require adding **schnitzel/parmi, lasagne, and roast lamb** to the seed library — about 1 extra session of recipe development. No cultural-depth recipes.

**Option B: Popularity-blended-with-showcase top 10. (Recommended.)**
Uses recipes already in the seed library so no new recipe development needed, hits most popular Australian home-cooked dishes, and adds two recipes that show off Hone's unique angle (cultural framing, substitution depth, chef attribution): one Levantine and one Australian classic.

Option B is the differentiator play. Supercook and Yummly have all the obvious ones; we beat them by being better at the obvious ones AND showing we care about food in a way they don't.

---

## ✅ LOCKED 29 April 2026 — Patrick's expanded launch library

Patrick reviewed the popularity tier list and elected to ship **all 17 recipes** as the v1.0 priority launch library. Carbonara only (no creamy chicken pasta). Both pan-fried fish AND fish & chips ship as separate recipes.

**The 17 priority launch library:**

| # | Recipe | In seed lib? | Showcase or Hero-only? |
|---|---|---|---|
| 1 | Roast Chicken with Lemon & Herbs | ✓ | Showcase |
| 2 | Spaghetti Bolognese | ✓ | Showcase |
| 3 | Spaghetti Carbonara | ✓ | Showcase |
| 4 | Easy Chicken & Vegetable Stir-Fry | NEW | Hero-only |
| 5 | Butter Chicken | ✓ | Showcase |
| 6 | Thai Green Curry | ✓ | Showcase |
| 7 | Chicken Schnitzel | NEW | Showcase |
| 8 | Beef Lasagne | NEW | Hero-only |
| 9 | Smash Burger | ✓ | Showcase |
| 10 | Roast Lamb with Rosemary & Garlic | NEW | Hero-only |
| 11 | Pan-Fried Fish (barramundi, salmon sub) | ✓ (barramundi) | Showcase |
| 12 | Fish & Chips (Australian Friday classic) | NEW | Hero-only |
| 13 | Pavlova | ✓ | Showcase |
| 14 | Chicken Shawarma | ✓ | Showcase |
| 15 | Hummus | ✓ | Hero-only (it's a side, not a main) |
| 16 | Pad Thai | ✓ | Hero-only |
| 17 | Falafel | NEW | Hero-only |

**Showcase 10 (full stage-by-stage photography):** Roast chicken, bolognese, carbonara, butter chicken, green curry, schnitzel, smash burger, pan-fried fish, pavlova, chicken shawarma.

**Hero-only 7 from the priority list (still launch, still prominent, "Photos soon" badge):** Stir-fry, lasagne, roast lamb, fish & chips, hummus, pad thai, falafel.

**Plus:** All currently-shipped existing recipes from `mobile/src/data/seed-recipes.ts` continue to ship in v1.0 with hero shot + "Photos soon" badge per DECISION-003. Estimated total v1.0 library: ~30+ recipes.

---

## What this changes vs the original 10-recipe plan

| Area | 10-recipe plan | 17-recipe plan |
|---|---|---|
| Total photography weekends | 5 (60 stage shots) | 5 stage + ~2 hero = 6–7 weekends |
| New recipes to add to seed lib | 0 | 6 (schnitzel, stir-fry, lasagne, roast lamb, fish & chips, falafel) |
| Culinary Verifier audit scope | 28 recipes | ~34 recipes |
| Senior Engineer extra work | None | ~1 session adding 6 new recipes |
| Launch date impact | 24 July baseline | 24 July still feasible if disciplined; no slack |

The 24 July date holds but margins shrink. If any milestone slips a week, it now slips the launch a week. No more buffer.

---

## What deliberately did NOT make Patrick's list (v1.1 backlog)

- Lamingtons, ANZAC biscuits, sausage rolls, meat pies (iconic but baking-skewed; v1.1 dessert/bakery push)
- Hot cross buns (seasonal, wrong launch month)
- Chicken parmigiana (overlap with schnitzel; v1.1)
- Pad see ew (overlap with pad thai)
- Creamy chicken pasta (Patrick chose carbonara only)
- Steak (in MLA top 3 but plain — better as a v1.1 "weeknight steak" feature)

---

## Original recommended 10 (preserved for reference)

| # | Recipe | Why it's here | What it showcases | Tier |
|---|---|---|---|---|
| 1 | **Spaghetti Bolognese** | MLA #3, weekly Australian staple | Pasta scaling, weeknight ease, soffritto + simmer technique | T1 |
| 2 | **Roast Chicken with Lemon & Herbs** | MLA #1 cooked meal | Sunday occasion, doneness cues (skin, juices), butchery skills | T1 |
| 3 | **Spaghetti Carbonara** | Top-tier pasta after bolognese | Technique masterclass — egg/pasta-water emulsion is the teaching moment for the chef-guide voice | T1 |
| 4 | **Butter Chicken** | Massive Australian-Indian household favourite | Marinade-rest-cook flow, two-step technique, kid-friendly weeknight | T1 |
| 5 | **Smash Burger** | Modern AU café/burger culture; already has 13 substitutions populated | Beef category, Maillard masterclass, weeknight + weekend dual-use | T2 |
| 6 | **Thai Green Curry** | Tier-1 Asian curry in AU households | Paste-fry technique, vegetable doneness cues, fast weeknight curry | T1 |
| 7 | **Chicken Shawarma** | Levantine — common in modern AU fast-casual; differentiator for cultural framing | Marinade flow, no-Israeli-labelling discipline, cultural depth | T3 |
| 8 | **Barramundi with Lemon Butter** | Australian fish, simple but technique-driven (the skin) | Seafood category, "doneness by sight" teaching, modern Australian | T2 |
| 9 | **Pavlova** | Iconic Australian dessert | Bake category, meringue technique masterclass, weekend project, photogenic | T2 |
| 10 | **Mujadara (Lentils, Rice & Caramelised Onion)** | Levantine vegetarian; widely loved AU-Mediterranean dish | Vegetarian representation, pantry-staple cooking, depth from caramelised onions | T3 |

---

## Coverage check

| Axis | Coverage |
|---|---|
| **Cuisine** | Italian (2), Australian (3), Levantine (2), Indian (1), American (1), Thai (1) |
| **Protein/type** | Beef (2), Chicken (3), Fish (1), Vegetarian (1), Dessert (1), Pasta (2) |
| **Technique** | Pasta (2), Roast (1), Sauté (1), Curry (2), Burger (1), Marinade-grill (1), Pan-fish (1), Bake (1) |
| **Time** | Weeknight (5), Weekend project (3), Special occasion (2) |
| **Difficulty** | Beginner (3), Intermediate (5), Advanced (2) |
| **Australian-specific** | Pavlova, Barramundi, Roast Chicken (the Sunday trinity) |
| **Cultural depth** | Shawarma + Mujadara give Levantine representation per Rule 1 + cultural rules |

---

## What this list deliberately doesn't include — and why

- **Lasagne** — popular in Australia, not in seed library, would require new recipe + photoshoot. Defer to v1.1.
- **Chicken parmigiana** — Australian pub classic, not in seed library. Defer to v1.1.
- **Roast lamb** — Sunday classic, not in seed library, expensive to test (lamb prices). Defer to v1.1.
- **Hummus** — a dip, not a dinner; doesn't earn a launch slot. Could ship as a non-launch recipe with hero shot only.
- **Pad thai** — already in seed library but pad see ew was the 2025 trend; if we do a Thai noodle, pad see ew might be more current. Up to you.
- **Hot cross buns** — #1 trending search in 2025, but seasonal. Wrong recipe for a July launch.

---

## Alternatives if you want to swap one out

If you want to swap any of the 10, here are the strongest candidates from the existing seed library:
- **Pad Thai** (swap with Thai Green Curry if you want more wok)
- **Char Kway Teow** (Malaysian stir-fry, already in lib — could replace #6 if you prefer stir-fry over curry)
- **Beef Rendang** (slow-cooked Malaysian, photogenic, replaces a curry slot)
- **Adobo** (Filipino chicken classic, simple technique, in lib)
- **Chicken Katsu** (Japanese, popular in AU, in lib)
- **French Onion Soup** (winter occasion dish, in lib)
- **Hummus** (would replace Mujadara if you want a Levantine showcase that's a side rather than a main)

---

## My honest take

If I'm being direct: pure popularity gives you a list that beats no one. Hone's launch story should be "we cook the dishes Australians cook every week, and we do them better than anyone else, with stage photos and substitution depth and honest chef attribution." The recommended 10 above does that.

Adding one risky/distinctive recipe (Mujadara as the vegetarian + Levantine showcase) is what separates a launch that gets a 4.5★ from one that gets 4.0★. Reviewers notice the dishes that show care.

If you'd rather go strict-popularity (Option A), I'll add lasagne, parmigiana, and roast lamb to the seed library and rebuild the photo plan accordingly. That's about one extra session of recipe development plus those three recipes need their own shoot weekend. Pushes the launch date by ~1–2 weeks.

---

## What I need from you

1. **Approve, amend, or swap.** Tell me to lock in the 10, or which ones to swap and what to swap them with.
2. **Once locked,** the Photography Director chat builds the per-recipe shot list and Patrick books the first photo weekend (3–4 May).

Both can happen in tomorrow's session.

---

## Sources

- [Australia's top 10 trending Google searches for 2025 — Time Out](https://www.timeout.com/australia/news/australias-top-10-trending-google-searches-for-2025-travel-recipes-definitions-and-more-120325)
- [Year in Search 2025: What Aussies searched — Google Australia](https://blog.google/intl/en-au/products/explore-get-answers/australia-year-in-search-2025/)
- [Australia's most-Googled recipes in 2025 — The New Daily](https://www.thenewdaily.com.au/life/eat-drink/2025/12/07/2025s-most-googled-recipes)
- [What Australians are really cooking at home in 2025 — Starts at 60](https://startsat60.com/media/from-ramen-to-roast-dinners-what-australians-are-really-cooking-at-home-in-2025)
- [The 13 Most Popular Recipes of 2025 — Broadsheet](https://www.broadsheet.com.au/national/food-and-drink/article/most-popular-recipes-2025)
- [What's Cooking — Australia's main meal preparers (MLA)](https://www.mla.com.au/contentassets/befa5c1eb92d4027b986a424ae132090/d.mhn.0036_whats_cooking.pdf)
- [First Spaghetti Bolognese recipe in Australia — Australian Food History Timeline](https://australianfoodtimeline.com.au/spaghetti-bolognese/)
- [Top Cooking and Recipes Websites Ranking in Australia — Similarweb](https://www.similarweb.com/top-websites/australia/food-and-drink/cooking-and-recipes/)
- [10 most popular new recipes of 2024 — RecipeTin Eats](https://www.recipetineats.com/10-most-popular-new-recipes-of-2024-so-far/)
- [Australian cuisine — Wikipedia](https://en.wikipedia.org/wiki/Australian_cuisine)
- [20 traditional Australian recipes — Women's Weekly Food](https://www.womensweeklyfood.com.au/lunch/traditional-australian-recipes-31901/)
- [Quick and Easy Family Dinners — Coles](https://www.coles.com.au/recipes-inspiration/tips/quick-and-easy-family-dinners)
- [Best kid-friendly dinners — Woolworths](https://www.woolworths.com.au/shop/articles/best-kid-friendly-dinners)
