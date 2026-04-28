/**
 * Seed recipes for v0.1 — ported from the hone.html prototype source of truth
 * (22 chef-inspired recipes) plus 5 originals authored in-house and the existing
 * weekday-bolognese from the v0 seed.
 *
 * Conversion rules applied, verbatim from the handoff:
 *   difficulty    'easy' → 'Easy', 'medium' → 'Intermediate', 'hard' → 'Involved'
 *   time          → time_min
 *   baseServings  → base_servings
 *   inspiration + sourceUrl → source: { chef, video_url }
 *   heroImg       → hero_url
 *   heroEmoji     → emoji
 *   heroColor     → hero_fallback: [heroColor, warm mid-tone, parchment]
 *   step.why      → step.why_note
 *   step.timer    → step.timer_seconds        (nulls dropped)
 *   ingredient.notes → ingredient.prep
 *   category      → included in tags[]
 *
 * HTML "custom" scaling (water/stock via factor^0.85) is converted to the
 * schema's `curve` form with concrete servings-indexed values. See risotto
 * and sourdough-loaf below.
 *
 * Attribution (Golden Rule #2) is preserved on every chef-inspired recipe.
 * Originals use `chef: 'Hone Kitchen'` as source so the schema's refine
 * check passes without pretending to a chef who didn't author them.
 */

import type { Recipe } from './types';

// ── Fallback palette helper ─────────────────────────────────────────────────
// hero_fallback is used when the hero image URL fails to load. A 3-color
// gradient from the dish's dominant hue through a warm mid-tone to parchment
// keeps the offline card visually on-brand.
const MID = '#E8C9A0'; // warm cream mid-tone
const PARCHMENT = '#F7F2EA';
const fallback = (hero: string): [string, string, string] => [hero, MID, PARCHMENT];

// ────────────────────────────────────────────────────────────────────────────
//  22 ported recipes from hone.html
// ────────────────────────────────────────────────────────────────────────────

const SMASH_BURGER: Recipe = {
  id: 'smash-burger',
  title: 'Smash Burger',
  tagline: 'The crispy-edged diner classic',
  base_servings: 2,
  time_min: 20,
  difficulty: 'Easy',
  tags: ['beef', 'quick', 'crowd-pleaser'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Andy Cooks',
    video_url: 'https://www.youtube.com/watch?v=oa2g6gB_1BU',
  },
  emoji: '🍔',
  hero_fallback: fallback('#8B4513'),
  hero_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
  ingredients: [
    {
      id: 'i1', name: 'Beef mince (80/20 fat)', amount: 200, unit: 'g', scales: 'linear',
      prep: 'Fat ratio is non-negotiable — leaner beef steams instead of crisping',
      substitutions: [
        {
          ingredient: 'Lean beef mince (92/8 fat)',
          changes: 'Significantly less crust. The fat is what creates the crispy lacey edges — lean beef steams from its own moisture instead of browning. Burger becomes drier throughout.',
          quality: 'compromise',
        },
        {
          ingredient: 'Wagyu beef mince',
          changes: 'More marbling gives a richer, beefier result. Cook 10–15 seconds shorter per side — the extra fat means faster browning. Excellent upgrade if budget allows.',
          quality: 'good',
          hard_to_find: false,
          local_alternative: 'Coles and Woolworths both stock wagyu beef mince in the premium section.',
        },
        {
          ingredient: 'Lamb mince (20% fat)',
          changes: 'Completely different flavour profile — gamey and richer. Works very well with yoghurt sauce and mint instead of burger sauce. Not a substitute, more of a different dish.',
          quality: 'compromise',
        },
      ],
    },
    // Buns: HTML prototype had amount:1 for a 2-serving recipe, which scales oddly
    // (2 people → 1 bun). Corrected to 2 so scaling is intuitive. Each burger uses
    // one whole bun (split top/bottom).
    {
      id: 'i2', name: 'Burger buns (brioche)', amount: 2, unit: '', scales: 'linear',
      substitutions: [
        {
          ingredient: 'Potato bun',
          changes: 'Slightly denser, less sweet, holds up equally well to sauce and steam. Common in American diners — a legitimate choice.',
          quality: 'good',
        },
        {
          ingredient: 'Regular sesame-seed burger bun',
          changes: 'Less richness without the egg and butter content of brioche. Toasting is even more critical to prevent sogginess. Budget option that works fine.',
          quality: 'compromise',
        },
      ],
    },
    {
      id: 'i3', name: 'American cheese slices', amount: 2, unit: '', scales: 'linear',
      substitutions: [
        {
          ingredient: 'Mild cheddar, thinly sliced',
          changes: 'Better flavour but inferior melt. American cheese is engineered for even, glossy melt — cheddar can turn oily or uneven. Place it on the patty earlier and cover the pan with a lid to steam-melt it.',
          quality: 'compromise',
        },
        {
          ingredient: 'Provolone',
          changes: 'Melts cleanly and has a mild, slightly nutty flavour. Italian-American diner standard — a genuine upgrade in flavour with no compromise on melt.',
          quality: 'good',
        },
        {
          ingredient: 'Gruyère',
          changes: 'Rich, nutty, excellent melt. Changes the character toward a more bistro-style burger. Pairs exceptionally with caramelised onion.',
          quality: 'good',
        },
      ],
    },
    {
      id: 'i4', name: 'White onion, finely diced', amount: 30, unit: 'g', scales: 'linear',
      substitutions: [
        {
          ingredient: 'Brown onion',
          changes: 'Slightly more pungent raw. Dice as fine as possible — it sits on the burger uncooked.',
          quality: 'good',
        },
        {
          ingredient: 'Shallots, finely minced',
          changes: 'Milder and slightly sweeter than white onion. A genuine improvement in most cases.',
          quality: 'good',
        },
      ],
    },
    {
      id: 'i5', name: 'Dill pickles', amount: 4, unit: 'slices', scales: 'linear',
      substitutions: [
        {
          ingredient: 'Bread and butter pickles',
          changes: 'Sweeter, less sharp. The balance with the sauce shifts — reduce the ketchup in the sauce slightly to compensate.',
          quality: 'compromise',
        },
        {
          ingredient: 'Cornichons, sliced',
          changes: 'More acidic and vinegary than dill pickles. Slice lengthways — they are smaller. Arguably the better choice for acidity balance.',
          quality: 'good',
        },
      ],
    },
    // Sauce and salt — HTML marked these 'fixed' but that makes 2 tbsp sauce for
    // 8 people, which is absurd. They're per-patty condiments, so linear is right.
    {
      id: 'i6', name: 'Burger sauce (mayo + ketchup + mustard)', amount: 2, unit: 'tbsp', scales: 'linear',
      substitutions: [
        {
          ingredient: 'Aioli + tomato relish',
          changes: 'More grown-up flavour, less sweetness. No mustard sharpness. Works very well with good cheese and fresh tomato.',
          quality: 'good',
        },
        {
          ingredient: 'Kewpie mayo alone',
          changes: 'Japanese mayo is richer and slightly more umami than standard mayo. Skip the ketchup and mustard — use pickles and the beef flavour to do the work.',
          quality: 'good',
        },
      ],
    },
    { id: 'i7', name: 'Salt', amount: 0.5, unit: 'tsp', scales: 'linear' },
  ],
  steps: [
    { id: 's1', title: 'Ball and season', content: "Divide the beef into 100g balls per patty — don't pack them tightly. Season only the outside with salt right before cooking. Salting early draws moisture and stops the crust forming.", why_note: 'Pre-salting denatures proteins and pulls water to the surface, which steams instead of browning. You want a dry surface hitting that hot iron.' },
    { id: 's2', title: 'Get the pan screaming', content: 'Cast iron or heavy steel pan on highest heat for at least 3 minutes. No oil — the beef fat does the work. It should be starting to smoke.', timer_seconds: 180, why_note: 'Maillard browning needs metal above 180°C. A warm pan just steams the meat. Three minutes on max heat gets cast iron where it needs to be.' },
    { id: 's3', title: 'Smash hard and hold', content: 'Place a ball on the pan, put a piece of baking paper on top, and press down with a flat spatula as hard as you can. Hold for 10 full seconds. The patty should be 1cm thin.', timer_seconds: 10, why_note: 'The smash maximises surface contact with hot metal. More contact = more Maillard = more crust. The paper stops the spatula sticking.' },
    { id: 's4', title: 'Cook and cheese', content: 'Cook 90 seconds without touching — you want a deep brown crust forming. Flip once, immediately add the cheese slice. Cook 45 more seconds. The cheese melts from the residual heat.', timer_seconds: 90, why_note: 'Single flip. Moving the patty cools the surface and breaks the crust formation. Cheese goes on right after the flip so it has the full second side cook time to melt properly.' },
    { id: 's5', title: 'Toast the bun', content: 'While the patty finishes, toast the bun cut-side down in the same pan. 30–45 seconds until golden. The beef fat left in the pan flavours it.', timer_seconds: 30, why_note: "A toasted bun won't go soggy when sauces and steam hit it. The fat residue adds flavour that plain toasting misses." },
    { id: 's6', title: 'Stack and serve', content: 'Sauce on the bottom bun, pickles, onion, patty (cheese-side up), top bun. Eat immediately — smash burgers do not improve with waiting.', why_note: 'Order matters: sauce on bottom bun protects it from moisture. Onion under the patty gets slightly warmed by the meat. Eat within 2 minutes before the crust softens.' },
  ],
  categories: { cuisines: ['american'], types: ['burgers', 'beef'] },
  whole_food_verified: true,
};

const CHICKEN_ADOBO: Recipe = {
  id: 'chicken-adobo',
  title: 'Chicken Adobo',
  tagline: 'Filipino vinegar braise — deeply savoury',
  base_servings: 4,
  time_min: 50,
  difficulty: 'Easy',
  tags: ['chicken', 'asian', 'braise', 'meal-prep'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Anthony Bourdain / No Reservations',
    video_url: 'https://www.youtube.com/@AnthonyBourdainPartsUnknown',
  },
  emoji: '🍗',
  hero_fallback: fallback('#5C3317'),
  hero_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80',
  ingredients: [
    {
      id: 'i1', name: 'Chicken thighs, bone-in', amount: 800, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Chicken drumsticks', changes: 'Identical technique and fat content. More collagen means an equally silky sauce. Some find them easier to eat. Use the same amount.', quality: 'great_swap' },
        { ingredient: 'Pork belly, cut in 4cm pieces', changes: 'Classic Filipino alternative — richer, fattier, and beautifully gelatinous. Add 15 minutes to the braise. Changes the dish significantly but stays true to the tradition.', quality: 'great_swap' },
        { ingredient: 'Chicken breast, bone-in', changes: 'Less fat means less collagen — the sauce will be thinner and less silky. Shorten the braise to 15 minutes or it dries out. Not ideal, but usable.', quality: 'compromise' },
      ],
    },
    {
      id: 'i2', name: 'White cane vinegar', amount: 120, unit: 'ml', scales: 'linear', prep: 'Filipino cane vinegar if you can find it — white wine vinegar works',
      substitutions: [
        { ingredient: 'White wine vinegar', changes: 'Slightly less sharp, similar acidity. Very close result — the go-to substitute. Use the same amount.', quality: 'great_swap' },
        { ingredient: 'Apple cider vinegar', changes: 'Subtle fruity note that actually suits the dish. Same acidity level. A solid everyday swap.', quality: 'good_swap' },
        { ingredient: 'Rice wine vinegar', changes: 'Milder and slightly sweeter — the adobo will be noticeably less punchy. Acceptable if that\'s all you have.', quality: 'compromise', quantity_note: 'reduce by about 20ml to avoid over-sweetening' },
      ],
    },
    {
      id: 'i3', name: 'Soy sauce', amount: 80, unit: 'ml', scales: 'linear',
      substitutions: [
        { ingredient: 'Tamari (gluten-free soy sauce)', changes: 'Identical flavour. No gluten. Use the same amount.', quality: 'perfect_swap' },
        { ingredient: 'Coconut aminos', changes: 'Sweeter and less salty than soy sauce. Add a pinch of salt to compensate and expect a slightly milder flavour.', quality: 'good_swap', quantity_note: 'increase by about 10ml' },
      ],
    },
    { id: 'i4', name: 'Garlic cloves, crushed', amount: 8, unit: '', scales: 'linear',
      substitutions: [
        { ingredient: 'Garlic paste (1 tsp per clove)', changes: 'Convenient. Use 2 tsp per 3 cloves. The flavour is slightly more muted than fresh-crushed. Works well in a braise.', quality: 'good_swap' },
      ],
    },
    { id: 'i5', name: 'Bay leaves', amount: 4, unit: '', scales: 'fixed' },
    { id: 'i6', name: 'Black peppercorns, whole', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i7', name: 'Neutral oil', amount: 1, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Coconut oil', changes: 'Very subtle coconut note that integrates into the dish. Slightly higher smoke point than canola or sunflower. Legitimate in Filipino cooking.', quality: 'good_swap' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Brown the chicken', content: 'Heat oil in a wide pan over high heat. Brown chicken thighs skin-side down for 5 minutes without moving. They should release when the skin is properly crisp. Flip, 2 more minutes.', timer_seconds: 300, why_note: 'The browning creates complex flavour compounds (Maillard) that the braising liquid will carry throughout the dish. Skipping this makes adobo flat and grey.' },
    { id: 's2', title: 'Add everything and braise', content: 'Add vinegar, soy sauce, garlic, bay leaves, and peppercorns. Bring to a boil, then reduce to a low simmer. Cover and cook 25 minutes.', timer_seconds: 1500, why_note: "The acid in the vinegar breaks down collagen in the thighs to gelatin — that's what gives adobo its silky, clingy sauce. Low heat keeps the muscle fibres from seizing up." },
    { id: 's3', title: 'Reduce the sauce', content: 'Remove the lid, turn heat up to medium. Cook 10–15 minutes until the sauce reduces by half and turns glossy and mahogany-coloured.', timer_seconds: 600, why_note: "Reducing concentrates the sugar and amino acids into a glaze. The colour change from light brown to mahogany is your signal — it's Maillard happening in the liquid." },
    { id: 's4', title: 'Serve over rice', content: 'Serve immediately over steamed white rice. The sauce is the point — make sure every plate gets a generous spoonful.' },
  ],
  categories: { cuisines: ['filipino'], types: ['chicken'] },
  whole_food_verified: true,
};

const PASTA_CARBONARA: Recipe = {
  id: 'pasta-carbonara',
  title: 'Pasta Carbonara',
  tagline: 'The Roman original — no cream, ever',
  base_servings: 2,
  time_min: 25,
  difficulty: 'Intermediate',
  tags: ['pasta', 'italian', 'quick', 'eggs'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Gordon Ramsay',
    video_url: 'https://www.youtube.com/watch?v=5t7JLjr1FxQ',
  },
  emoji: '🍝',
  hero_fallback: fallback('#C8963C'),
  hero_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80',
  ingredients: [
    {
      id: 'i1', name: 'Spaghetti or rigatoni', amount: 160, unit: 'g', scales: 'linear',
      substitutions: [
        {
          ingredient: 'Rigatoni (if using spaghetti)',
          changes: 'Rigatoni holds sauce inside the tube — many Romans prefer it. Identical technique. Pure preference.',
          quality: 'good',
        },
        {
          ingredient: 'Bucatini',
          changes: 'Hollow spaghetti-like strands that hold more sauce. Takes 1–2 minutes longer to cook. Excellent choice.',
          quality: 'good',
        },
      ],
    },
    {
      id: 'i2', name: 'Guanciale (or pancetta)', amount: 100, unit: 'g', scales: 'linear',
      substitutions: [
        {
          ingredient: 'Pancetta, diced',
          changes: 'Less fat than guanciale, slightly milder pork flavour. Widely accepted — many Roman trattorias use it. Minimal perceptible difference.',
          quality: 'good',
          hard_to_find: true,
          local_alternative: 'Guanciale is at Italian delis and Harris Farm Markets. Woolworths and Coles stock pancetta as a direct alternative.',
        },
        {
          ingredient: 'Smoked bacon (short-cut, rind off)',
          changes: 'Smokiness dominates and changes the character of the dish significantly. The result is delicious but is technically not carbonara — more of a bacon-and-egg pasta. Render it slowly the same way.',
          quality: 'compromise',
        },
      ],
    },
    {
      id: 'i3', name: 'Egg yolks', amount: 3, unit: '', scales: 'linear',
      substitutions: [
        {
          ingredient: 'Whole eggs (use 2 whole eggs instead of 3 yolks + 1 whole)',
          changes: 'More egg white protein makes the sauce set firmer and slightly rubbery if overworked. You lose the deep golden richness of a yolk-heavy sauce. Harder to keep in the emulsified window.',
          quality: 'compromise',
        },
      ],
    },
    { id: 'i4', name: 'Whole egg', amount: 1, unit: '', scales: 'fixed' },
    {
      id: 'i5', name: 'Pecorino Romano, finely grated', amount: 60, unit: 'g', scales: 'linear',
      substitutions: [
        {
          ingredient: 'Parmigiano Reggiano',
          changes: 'Milder, nuttier, less sharp than Pecorino. A legitimate Roman variant — not a compromise, just a different style. Some prefer it.',
          quality: 'good',
        },
        {
          ingredient: 'Pecorino + Parmesan, 50/50',
          changes: 'The traditional Roman household approach. Sharper from the Pecorino, body and umami from the Parmesan. Arguably the best of both.',
          quality: 'good',
        },
      ],
    },
    { id: 'i6', name: 'Black pepper, freshly cracked', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i7', name: 'Salt (for pasta water)', amount: 1, unit: 'tbsp', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Mix the sauce off-heat', content: 'Whisk yolks, whole egg, and pecorino into a thick paste. Add cracked pepper. This is your sauce — make it before anything else.', why_note: "Cold eggs mixed with cold cheese form a stable emulsion. Mixing it warm causes the eggs to start cooking before they hit the pasta, and you'll get scrambled eggs instead of silk." },
    { id: 's2', title: 'Render the guanciale', content: 'Cook guanciale cubes in a cold, dry pan over medium heat. The fat renders slowly and the meat crisps without burning. Remove and leave the fat in the pan.', timer_seconds: 480, why_note: 'Starting cold renders the fat gradually — starting hot burns the outside before the inside renders. The rendered fat is your cooking medium for the whole dish.' },
    { id: 's3', title: 'Cook pasta in well-salted water', content: 'Salt your pasta water until it tastes like the sea. Cook pasta 2 minutes short of package time — it finishes cooking in the sauce. Reserve 200ml of pasta water before draining.', why_note: "Pasta water is starch and salt. It's the only liquid that can loosen carbonara sauce without breaking it. Plain water dilutes and ruins it." },
    { id: 's4', title: 'Combine off heat — this is the critical step', content: 'Add drained pasta to the guanciale pan. Take the pan completely off heat. Add egg mixture, toss constantly, adding pasta water a splash at a time until you have a creamy sauce that coats every strand. If it seizes, add more water.', why_note: "Eggs scramble above 70°C. Off heat, the pasta's residual heat (around 65°C) is exactly right to cook the eggs without curdling. Adding water regulates the temperature and creates the emulsion. This is why carbonara has a reputation — the temperature window is narrow." },
    { id: 's5', title: 'Serve immediately', content: 'Plate immediately, top with extra pecorino and more black pepper. Carbonara does not wait — it thickens rapidly as it cools.' },
  ],
  categories: { cuisines: ['italian'], types: ['pasta'] },
  whole_food_verified: true,
};

const BEEF_STEW: Recipe = {
  id: 'beef-stew',
  title: 'Classic Beef Stew',
  tagline: 'Low and slow, built for winter',
  base_servings: 4,
  time_min: 180,
  difficulty: 'Easy',
  tags: ['beef', 'braise', 'winter', 'batch-cook'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Jacques Pépin',
    video_url: 'https://www.youtube.com/c/HomeCookingwithJacquesPepin',
  },
  emoji: '🥘',
  hero_url: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=600&q=80',
  hero_fallback: fallback('#6B3A2A'),
  ingredients: [
    {
      id: 'i1', name: 'Beef chuck, 4cm cubes', amount: 700, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Beef short ribs, bone-in (cut between bones)', changes: 'More fat and collagen than chuck — the sauce becomes even glossier and the meat more fall-apart tender. Allow an extra 20–30 minutes.', quality: 'perfect_swap' },
        { ingredient: 'Beef brisket, cut in chunks', changes: 'Deeper beefy flavour and excellent marbling. Slightly less collagen than chuck but still great. Add 20 minutes to the braise.', quality: 'great_swap' },
        { ingredient: 'Lamb shoulder, bone-in chunks', changes: 'Turns this into a lamb stew — gamey, rich, and very satisfying. Same technique, reduce braising time to 90 minutes.', quality: 'good_swap' },
      ],
    },
    { id: 'i2', name: 'Carrots, cut in chunks', amount: 300, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Parsnips, cut in chunks', changes: 'Sweeter and earthier than carrot. A beautiful British-inspired variation that pairs brilliantly with braised beef.', quality: 'great_swap' },
        { ingredient: 'Sweet potato, cut in chunks', changes: 'Softer and sweeter than regular potato. Add in the last 20 minutes only — it cooks faster.', quality: 'good_swap', quantity_note: 'add in the last 20 minutes' },
      ],
    },
    { id: 'i3', name: 'Potatoes, cut in chunks', amount: 400, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Turnip, cut in chunks', changes: 'Less starchy and slightly bitter. Holds its shape better than potato in a long braise. Traditional in French stew.', quality: 'good_swap' },
        { ingredient: 'Celeriac, cut in chunks', changes: 'Celery-like flavour, earthy and complex. Holds shape well. A refined alternative.', quality: 'great_swap' },
      ],
    },
    { id: 'i4', name: 'Onion, roughly chopped', amount: 200, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Brown onion', changes: 'Same as yellow onion in Australian supermarkets. Direct swap.', quality: 'perfect_swap' },
        { ingredient: 'Leek (white part only)', changes: 'Milder and sweeter. Adds a subtle savouriness. Dice the leek rather than cutting in rough chunks.', quality: 'good_swap' },
      ],
    },
    { id: 'i5', name: 'Tomato paste', amount: 2, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Tomato passata (4 tbsp)', changes: 'Less concentrated — cook it down in the pan for an extra 5 minutes before adding wine to compensate.', quality: 'good_swap', quantity_note: 'use 4 tbsp passata and cook down 5 extra minutes' },
        { ingredient: 'Sundried tomatoes, very finely chopped (1 tbsp)', changes: 'Intensely concentrated tomato flavour. Use half the quantity — these are more powerful than paste. Adds slight sweetness.', quality: 'good_swap', quantity_note: 'use 1 tbsp finely chopped sundried tomatoes per 2 tbsp paste' },
      ],
    },
    {
      id: 'i6', name: 'Red wine', amount: 200, unit: 'ml', scales: 'linear',
      substitutions: [
        { ingredient: 'Pomegranate juice', changes: 'Similar body and tartness to red wine. A genuinely good alcohol-free option with a subtle fruit note that suits braised beef well.', quality: 'good_swap' },
        { ingredient: 'Extra beef stock + 1 tbsp red wine vinegar', changes: 'Adds the acidity without alcohol. The stew will be less complex without the wine\'s tannins — still good, but one-dimensional.', quality: 'compromise' },
      ],
    },
    {
      id: 'i7', name: 'Beef stock', amount: 500, unit: 'ml', scales: 'linear',
      substitutions: [
        { ingredient: 'Beef bone broth', changes: 'Higher gelatin content makes the sauce even silkier and richer. Use the same amount — an upgrade, not a compromise.', quality: 'perfect_swap' },
        { ingredient: 'Chicken stock', changes: 'Lighter colour and flavour. The sauce will be less robustly beefy but still a solid stew. Good if that\'s all you have.', quality: 'compromise' },
      ],
    },
    { id: 'i8', name: 'Thyme sprigs', amount: 4, unit: '', scales: 'fixed',
      substitutions: [
        { ingredient: 'Rosemary sprigs', changes: 'More assertive and piney. Use 2 sprigs only — rosemary can overpower a stew at full quantity.', quality: 'good_swap', quantity_note: 'use 2 rosemary sprigs per 4 thyme sprigs' },
        { ingredient: 'Dried thyme', changes: 'More concentrated than fresh. Use half the amount.', quality: 'good_swap', quantity_note: 'use 1 tsp dried thyme per 4 fresh sprigs' },
      ],
    },
    { id: 'i9', name: 'Bay leaves', amount: 2, unit: '', scales: 'fixed' },
    { id: 'i10', name: 'Plain flour', amount: 2, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Cornflour (1 tbsp)', changes: 'Gluten-free thickener — twice as powerful as plain flour. Mix with a splash of cold water before adding to avoid lumps.', quality: 'good_swap', quantity_note: 'use 1 tbsp cornflour mixed with cold water per 2 tbsp plain flour' },
        { ingredient: 'Arrowroot powder (1 tbsp)', changes: 'Gluten-free. Slightly glossier sauce than cornflour. Dissolve in cold water first.', quality: 'good_swap', quantity_note: 'use 1 tbsp arrowroot mixed with cold water per 2 tbsp plain flour' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Season and sear in batches', content: 'Season beef generously. Sear in hot oil in batches — never crowd the pan. Each piece needs 2 minutes undisturbed on each side until deeply browned. Set aside.', why_note: 'Crowding drops the pan temperature below 120°C and the meat steams instead of browns. Steam = grey, flavourless exterior. Batch searing keeps the pan hot.' },
    { id: 's2', title: 'Build the base', content: 'In the same pot, soften onion 5 minutes. Add tomato paste, stir 2 minutes until it darkens. This is caramelising the paste — it loses its raw tin taste and becomes nutty.', timer_seconds: 300, why_note: 'Raw tomato paste tastes acidic and one-dimensional. Cooking it in fat triggers the Maillard reaction, converting the sugars and developing complex savoury notes.' },
    { id: 's3', title: 'Flour and deglaze', content: 'Return the beef. Sprinkle flour over everything and stir to coat. Add wine, scraping up every browned bit from the bottom. Those bits are pure flavour.', why_note: 'The flour coats the meat in a thin layer that thickens the stew as it cooks. The fond (browned bits) contains concentrated Maillard compounds — deglazing recovers them.' },
    { id: 's4', title: 'Braise low and slow', content: 'Add stock, thyme, bay leaves. Liquid should just cover the meat. Bring to a bare simmer — not a boil. Cover and cook 1.5 hours.', timer_seconds: 5400, why_note: 'Collagen in chuck converts to gelatin between 70–80°C over extended time — this is what makes stew silky. Boiling instead of simmering makes the meat tough and stringy.' },
    { id: 's5', title: 'Add veg and finish', content: 'Add carrots and potatoes. Continue simmering, uncovered, 30–40 minutes until vegetables are tender and sauce has thickened.', timer_seconds: 1800, why_note: 'Vegetables added early turn to mush. Added in the last 30–40 minutes they cook through without disintegrating. Removing the lid lets steam escape and the sauce reduce and concentrate.' },
  ],
  categories: { cuisines: ['french'], types: ['beef', 'soups'] },
  whole_food_verified: true,
};

const ROAST_CHICKEN: Recipe = {
  id: 'roast-chicken',
  title: 'Perfect Roast Chicken',
  tagline: 'Crisp skin, juicy thighs, every time',
  base_servings: 4,
  time_min: 90,
  difficulty: 'Easy',
  tags: ['chicken', 'roast', 'sunday', 'classic'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Thomas Keller / Bouchon',
    video_url: 'https://www.youtube.com/@ChefThomasKeller',
  },
  emoji: '🐔',
  hero_fallback: fallback('#B8721A'),
  hero_url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=600&q=80',
  ingredients: [
    {
      id: 'i1', name: 'Whole chicken', amount: 1.8, unit: 'kg', scales: 'fixed', prep: 'One chicken feeds 4 — buy a bigger bird for more people, not more chickens',
      substitutions: [
        { ingredient: 'Spatchcocked (butterflied) chicken', changes: 'Split the backbone with shears and flatten. Cooks 20 minutes faster with more even browning across the whole bird. Better for weeknights.', quality: 'great_swap' },
        { ingredient: 'Chicken maryland pieces (4 large)', changes: 'Roast at 220°C for 35–40 minutes instead. More surface area browns faster. No carving needed. Nearly as satisfying, much less drama.', quality: 'great_swap' },
      ],
    },
    {
      id: 'i2', name: 'Unsalted butter, softened', amount: 60, unit: 'g', scales: 'fixed',
      substitutions: [
        { ingredient: 'Clarified butter (ghee)', changes: 'Higher smoke point means the skin browns faster at 230°C without any risk of burning. Excellent for high-heat roasting. Use the same amount.', quality: 'perfect_swap' },
        { ingredient: 'Extra virgin olive oil', changes: 'Dairy-free option. Doesn\'t baste the breast meat as richly but still flavours and crisps the skin well.', quality: 'good_swap', quantity_note: 'use 4 tablespoons (about 55ml)' },
      ],
    },
    { id: 'i3', name: 'Garlic cloves', amount: 4, unit: '', scales: 'fixed',
      substitutions: [
        { ingredient: 'Garlic paste (1 tsp per clove)', changes: 'Blends into the butter mixture more smoothly. Use 4 tsp total. Works very well under the skin.', quality: 'good_swap', quantity_note: 'use 4 tsp garlic paste total' },
        { ingredient: 'Roasted garlic (8 cloves)', changes: 'Sweeter, nuttier, and milder than raw. Squeeze from the skins and mash into the butter. Deeply fragrant without being sharp.', quality: 'great_swap', quantity_note: 'use 8 roasted cloves to match the flavour impact of 4 raw' },
      ],
    },
    {
      id: 'i4', name: 'Fresh thyme', amount: 6, unit: 'sprigs', scales: 'fixed',
      substitutions: [
        { ingredient: 'Fresh rosemary', changes: 'More assertive and piney than thyme — a strong classic pairing with roast chicken. Use fewer sprigs.', quality: 'great_swap', quantity_note: 'use 3–4 sprigs only — rosemary is more potent' },
        { ingredient: 'Fresh tarragon', changes: 'Sweet, anise-like, and classically French. A different character entirely but arguably the best herb with roast chicken. Same amount.', quality: 'great_swap' },
        { ingredient: 'Dried thyme', changes: 'Works fine — dried is more concentrated so you need less. No texture but the flavour carries through.', quality: 'good_swap', quantity_note: 'use 1.5 tsp dried per 6 sprigs fresh' },
      ],
    },
    { id: 'i5', name: 'Lemon', amount: 1, unit: '', scales: 'fixed',
      substitutions: [
        { ingredient: 'Orange', changes: 'Sweeter, less sharp. The skin and juice inside the cavity perfume the steam. Changes the character but delicious — particularly good with tarragon.', quality: 'good_swap' },
      ],
    },
    { id: 'i6', name: 'Flaky salt', amount: 1, unit: 'tbsp', scales: 'fixed' },
    { id: 'i7', name: 'Black pepper', amount: 1, unit: 'tsp', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Dry brine the day before', content: 'Pat the chicken completely dry. Rub salt all over, including inside the cavity. Refrigerate uncovered overnight — at minimum 2 hours.', why_note: 'Dry brining draws moisture to the surface via osmosis, then the salt dissolves back in. The resulting brine penetrates the meat. The uncovered fridge also dries the skin — dry skin crisps, wet skin steams.' },
    { id: 's2', title: 'Bring to room temp and preheat', content: 'Take chicken out of fridge 45 minutes before cooking. Preheat oven to 230°C (fan 210°C).', timer_seconds: 2700, why_note: 'Cold meat hitting a hot oven creates a large gradient — the outside overcooks before the inside is done. Room temp meat cooks more evenly. 230°C is high enough to blister the skin before reducing.' },
    { id: 's3', title: 'Butter under and over the skin', content: 'Mix softened butter with crushed garlic and thyme leaves. Carefully separate the skin from the breast meat with your fingers and push butter under it. Rub remaining butter over the outside.', why_note: 'Butter under the skin bastes the breast meat directly as it melts. Butter on the outside browns the skin through the Maillard reaction. The breast is the first part to dry out — this solves that.' },
    { id: 's4', title: 'Roast high then reduce', content: 'Place chicken breast-side up in a roasting pan. Roast at 230°C for 15 minutes, then reduce to 190°C. Continue for 50–60 minutes until the thigh juices run clear.', timer_seconds: 900, why_note: 'The initial high heat blisters and crisps the skin. Reducing heat prevents the skin burning before the interior is cooked. The breast-side-up position means the thighs — which take longer — face the heat from below and the reflected heat from the sides.' },
    { id: 's5', title: 'Rest properly', content: 'Transfer to a board, loosely tent with foil. Rest 15 minutes before carving. This is not optional.', timer_seconds: 900, why_note: 'Muscle fibres that contracted during cooking relax during resting, and the juices redistribute evenly. Cutting early releases all those juices onto the board. 15 minutes for a whole chicken — 5 minutes is not enough.' },
  ],
  categories: { cuisines: ['french'], types: ['chicken'] },
  whole_food_verified: true,
};

const MUSAKHAN: Recipe = {
  id: 'musakhan',
  title: 'Musakhan',
  tagline: 'Palestinian roasted chicken with sumac and onions',
  base_servings: 4,
  time_min: 90,
  difficulty: 'Intermediate',
  tags: ['chicken', 'levantine', 'palestinian', 'slow'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Reem Kassis / The Palestinian Table',
    video_url: 'https://www.reemkassis.com/',
  },
  emoji: '🍗',
  hero_fallback: fallback('#8B3A1A'),
  hero_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Whole chicken, jointed into 8 pieces', amount: 1.6, unit: 'kg', scales: 'linear',
      substitutions: [
        { ingredient: 'Chicken maryland pieces (thigh + drumstick)', changes: 'Already jointed — saves prep time. More fat and collagen than a whole bird. Identical technique, same result.', quality: 'perfect_swap' },
        { ingredient: 'Bone-in chicken thighs', changes: 'Fattiest cut — the sauce is richer and the skin crisps more. A genuine upgrade over jointed breast pieces. Use 1.4kg for the same 4 servings.', quality: 'great_swap', quantity_note: 'use 1.4kg thighs for 4 servings' },
      ],
    },
    { id: 'i2', name: 'Yellow onions, thinly sliced', amount: 1, unit: 'kg', scales: 'linear', prep: 'The onions are half the dish — do not reduce them',
      substitutions: [
        { ingredient: 'Brown onions', changes: 'The same thing in Australian supermarkets — direct swap. Slight sweetness variation depending on age but negligible.', quality: 'perfect_swap' },
        { ingredient: 'White onions, thinly sliced', changes: 'Slightly sharper and less sweet than yellow onions. Caramelise identically. A minor difference only.', quality: 'great_swap' },
        { ingredient: 'Red onions, thinly sliced', changes: 'Sweeter when caramelised and turn a deep, beautiful purple-mahogany. Slightly different flavour but works well with sumac.', quality: 'good_swap' },
      ],
    },
    {
      id: 'i3', name: 'Sumac', amount: 5, unit: 'tbsp', scales: 'linear',
      prep: 'Sumac is the defining flavour. Use a fresh, vivid-red one — stale sumac tastes of nothing',
      substitutions: [
        {
          ingredient: 'Lemon zest + a pinch of citric acid',
          changes: 'Gets close to sumac\'s tartness but lacks the fruity, floral complexity. The dish will taste bright but one-dimensional. Increase lemon zest to about 2 tbsp and add ¼ tsp citric acid.',
          quality: 'compromise',
          hard_to_find: false,
          local_alternative: 'Sumac is at Woolworths and Coles in the spice aisle. Middle Eastern grocery stores carry fresher, better-quality sumac at lower prices.',
        },
      ],
    },
    { id: 'i4', name: 'Extra virgin olive oil', amount: 120, unit: 'ml', scales: 'linear', prep: 'Palestinian olive oil if you can find it',
      substitutions: [
        { ingredient: 'Regular extra virgin olive oil', changes: 'Any good-quality EVOO works. Palestinian and Lebanese oils have a distinctive grassy, peppery note, but any EVOO is appropriate here.', quality: 'great_swap' },
        { ingredient: 'Avocado oil', changes: 'Higher smoke point and neutral flavour. Works for the high-heat chicken roasting but misses the olive-oil character in the onion caramelisation. Use for roasting, EVOO for the onions.', quality: 'good_swap' },
      ],
    },
    { id: 'i5', name: 'Ground allspice', amount: 1, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Baharat spice blend', changes: 'A seven-spice blend that includes allspice, black pepper, coriander, cumin, cloves, nutmeg, and cinnamon. Adds more complexity but changes the character. Skip the separate cinnamon and cardamom if using baharat.', quality: 'great_swap', quantity_note: 'use 2 tsp baharat and skip the cinnamon and cardamom' },
        { ingredient: 'Ground cloves + ground nutmeg (pinch each)', changes: 'Approximates allspice\'s warm complexity. Use very sparingly — cloves overpower easily.', quality: 'compromise', quantity_note: 'pinch of cloves + pinch of nutmeg per 1 tsp allspice' },
      ],
    },
    { id: 'i6', name: 'Ground cinnamon', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i7', name: 'Ground cardamom', amount: 0.5, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Ground coriander', changes: 'Replaces the floral, aromatic note of cardamom with an earthier, lemony one. The spice profile shifts noticeably. Use when cardamom is unavailable.', quality: 'compromise' },
      ],
    },
    {
      id: 'i8', name: 'Flatbread or taboon (or thick pittas)', amount: 4, unit: 'large', scales: 'linear',
      prep: 'Taboon is traditional — the bread soaks up the onion and chicken juices underneath',
      substitutions: [
        {
          ingredient: 'Thick pita bread',
          changes: 'The most practical substitute — absorbs juices well. Split and open them flat so they have more surface area under the chicken.',
          quality: 'good',
          hard_to_find: true,
          local_alternative: 'Taboon bread from Middle Eastern bakeries. In Sydney: Green Peppercorn and Lakemba bakeries. Pita from Woolworths or Coles works fine.',
        },
        {
          ingredient: 'Lebanese flatbread (thin)',
          changes: 'Thinner and crispier — it will not hold as much juice without going soggy. Layer two pieces for more structure.',
          quality: 'compromise',
        },
      ],
    },
    {
      id: 'i9', name: 'Pine nuts, toasted', amount: 60, unit: 'g', scales: 'linear',
      substitutions: [
        {
          ingredient: 'Slivered almonds, toasted',
          changes: 'Less rich and buttery than pine nuts but the texture is similar. Toast them the same way.',
          quality: 'good',
        },
        {
          ingredient: 'Roughly chopped walnuts, toasted',
          changes: 'More bitter and earthy. Changes the garnish character noticeably but works within the Levantine flavour profile.',
          quality: 'compromise',
        },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Spice-rub and roast the chicken', content: 'Mix half the sumac with allspice, cinnamon, cardamom, salt, and 3 tbsp olive oil. Rub all over chicken pieces. Roast at 200°C for 35–40 minutes until skin is deep golden and juices run clear.', timer_seconds: 2100, why_note: "The spice rub forms a crust that carries sumac's tartness directly on the skin. The acid in sumac also slightly tenderises the surface proteins. Roasting at 200°C gets the skin crisp before the inside overcooks." },
    { id: 's2', title: 'Caramelise the onions with sumac', content: 'While the chicken roasts, cook onions in remaining olive oil over medium-low heat for 30–35 minutes until deep golden and jammy. Add the remaining sumac, stir through. The onions should be sweet, sour, and slightly sticky.', timer_seconds: 1800, why_note: 'Slow-caramelised onions lose their harsh bite and develop sweetness through Maillard and caramelisation reactions. The sumac added at the end retains its bright tartness — adding it too early dulls it and loses the acid contrast.' },
    { id: 's3', title: 'Build on the bread', content: 'Lay flatbreads on a baking tray. Spread the sumac onions generously over them. Place the roasted chicken pieces on top. Drizzle with the roasting pan juices.', why_note: 'The bread is not a side — it is structural. The onion-soaked, juice-drenched bread underneath the chicken is the best part of musakhan. It is meant to go soft and flavour-saturated, not stay crisp.' },
    { id: 's4', title: 'Final oven blast and finish', content: 'Put the assembled dish back in the oven at 200°C for 8–10 minutes until the edges of the bread crisp and the chicken skin re-crisps. Scatter toasted pine nuts and serve immediately.', timer_seconds: 480, why_note: 'The second oven blast revives the chicken skin that softened on top of the moist onions. Pine nuts add texture contrast — toast them until golden-brown, not pale, or they taste of nothing.' },
  ],
  categories: { cuisines: ['levantine'], types: ['chicken'] },
  whole_food_verified: true,
};

const KAFTA: Recipe = {
  id: 'kafta',
  title: 'Kafta Meshwi',
  tagline: 'Lebanese grilled spiced mince on skewers',
  base_servings: 4,
  time_min: 30,
  difficulty: 'Easy',
  tags: ['beef', 'levantine', 'lebanese', 'grill', 'quick'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Anissa Helou / Feast',
    video_url: 'https://www.anissas.com/',
  },
  emoji: '🥩',
  hero_fallback: fallback('#8B4A1A'),
  hero_url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Lamb mince (or beef/lamb mix)', amount: 500, unit: 'g', scales: 'linear', prep: 'Higher fat content = juicier kafta. Ask for 20% fat',
      substitutions: [
        { ingredient: 'Pure beef mince (20% fat)', changes: 'Less gamey, slightly milder. Works very well — many cooks prefer it. Same technique exactly.', quality: 'great_swap' },
        { ingredient: 'Chicken mince', changes: 'Much lighter flavour and colour. Mix in 1 tbsp olive oil to compensate for lower fat content. Reduce grill time by 2 minutes.', quality: 'good_swap', quantity_note: 'add 1 tbsp olive oil to the mixture' },
      ],
    },
    { id: 'i2', name: 'Onion, very finely grated', amount: 1, unit: 'medium', scales: 'linear', prep: 'Grated, not chopped — the juice is what you want, not chunks',
      substitutions: [
        { ingredient: 'Shallots, very finely grated', changes: 'Milder and sweeter than brown onion. The kafta will be slightly less pungent — good for those who find raw onion overpowering.', quality: 'great_swap' },
        { ingredient: 'Spring onion (white part only), finely grated', changes: 'Mildest option. Less moisture than a brown onion — squeeze out a little less juice before adding.', quality: 'good_swap' },
      ],
    },
    { id: 'i3', name: 'Flat-leaf parsley, very finely chopped', amount: 30, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Fresh mint, finely chopped', changes: 'A traditional Lebanese and Turkish variation — bright, cooling, aromatic. Use half the quantity as mint is more assertive than parsley.', quality: 'great_swap', quantity_note: 'use 15g mint per 30g parsley' },
        { ingredient: 'Fresh coriander, finely chopped', changes: 'Leans toward Iraqi and Persian style kafta. Assertive flavour — pairs especially well with a yoghurt dipping sauce.', quality: 'good_swap' },
      ],
    },
    { id: 'i4', name: 'Ground allspice', amount: 1, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Baharat spice blend', changes: 'Ready-made seven-spice blend that includes allspice, pepper, cinnamon, coriander and more. Adds complexity. Reduce the separate cinnamon and cumin slightly.', quality: 'great_swap', quantity_note: 'use 2 tsp baharat, skip the separate cinnamon and cumin' },
      ],
    },
    { id: 'i5', name: 'Ground cinnamon', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i6', name: 'Ground cumin', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i7', name: 'Chilli flakes', amount: 0.5, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Fresh long red chilli, very finely minced', changes: 'Brighter, fresher heat than dried flakes. Use ½ small red chilli per ½ tsp flakes.', quality: 'great_swap', quantity_note: 'use ½ small long red chilli per ½ tsp chilli flakes' },
        { ingredient: 'Cayenne pepper', changes: 'Hotter and more one-dimensional than chilli flakes. Use half the quantity.', quality: 'good_swap', quantity_note: 'use ¼ tsp cayenne per ½ tsp chilli flakes' },
      ],
    },
    { id: 'i8', name: 'Salt', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i9', name: 'Flat pittas, to serve', amount: 4, unit: '', scales: 'linear',
      substitutions: [
        { ingredient: 'Lebanese flatbread', changes: 'Thinner, larger, and more pliable than pitta. Traditional in Lebanese kitchens — wraps around the kafta more easily.', quality: 'great_swap' },
        { ingredient: 'Lavash', changes: 'Very thin flatbread. Toast briefly before rolling or it cracks. Best for a crunchier wrap.', quality: 'good_swap' },
      ],
    },
    { id: 'i10', name: 'Sumac, for serving', amount: 1, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Lemon zest', changes: 'Provides tartness but none of sumac\'s fruity complexity. A pinch of lemon zest scattered over serves a similar acidic purpose in a pinch.', quality: 'compromise' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Mix thoroughly with cold hands', content: 'Combine mince, grated onion (squeeze out some juice first), parsley, and all spices. Mix aggressively with cold hands for 3–4 minutes until the mixture becomes slightly sticky and uniform.', why_note: 'The extended mixing develops the myosin proteins in the meat, which act like glue. This is what lets kafta hold its shape on a skewer over fire without falling apart. Under-mixed kafta crumbles. Cold hands prevent the fat from melting and going greasy.' },
    { id: 's2', title: 'Rest in the fridge', content: 'Cover and refrigerate at least 30 minutes, up to overnight.', timer_seconds: 1800, why_note: 'Resting allows the salt to draw moisture from the onion into the meat, which then reabsorbs. The mixture firms up and the spices bloom into the fat. Kafta cooked straight after mixing is softer and harder to skewer.' },
    { id: 's3', title: 'Shape onto skewers', content: 'Wet your hands. Take a handful of the mix (about 80–90g) and press firmly around a flat metal skewer, forming a flat sausage shape about 15cm long. Squeeze hard at the ends to seal.', why_note: "Flat skewers grip the meat — round skewers spin and the kafta can rotate off. Wetting hands prevents sticking. The hard squeeze at the ends is critical: that's the join that breaks first over heat." },
    { id: 's4', title: 'Grill hard and fast', content: 'Grill over the highest heat possible — charcoal is traditional and makes a genuine difference. 3–4 minutes per side. You want char marks and juicy interior. Do not overcook lamb kafta.', timer_seconds: 240, why_note: 'Lamb fat renders fast and then burns. The window between perfectly charred and dried-out is narrow — under 8 minutes total at high heat. Low heat slowly grey-stews the outside instead of charring it.' },
    { id: 's5', title: 'Serve in flatbread with sumac onions', content: 'Slide the kafta off the skewer into a warm pitta. Add thinly sliced raw onion tossed with sumac and a squeeze of lemon. Serve immediately.' },
  ],
  categories: { cuisines: ['levantine'], types: ['lamb', 'beef'] },
  whole_food_verified: true,
};

const HUMMUS: Recipe = {
  id: 'hummus',
  title: 'Hummus from Scratch',
  tagline: 'Palestinian hummus — dried chickpeas only',
  base_servings: 6,
  time_min: 720,
  difficulty: 'Easy',
  tags: ['levantine', 'palestinian', 'vegetarian', 'vegan'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Reem Kassis / The Palestinian Table',
    video_url: 'https://www.reemkassis.com/',
  },
  emoji: '🫘',
  hero_fallback: fallback('#C4A04A'),
  hero_url: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Dried chickpeas', amount: 250, unit: 'g', scales: 'linear', prep: 'Tinned chickpeas make edible hummus. They do not make good hummus.',
      substitutions: [
        { ingredient: 'Tinned chickpeas (2 × 400g tins, drained)', changes: 'The hummus will be grainier and less silky. You skip the 12-hour soak and long cook, which is the trade-off. If you use tinned, boil them with bicarbonate for a further 20 minutes to soften them enough.', quality: 'compromise', quantity_note: 'use 2 × 400g tins, draining off the liquid' },
      ],
    },
    { id: 'i2', name: 'Good tahini (Palestinian or Lebanese)', amount: 120, unit: 'ml', scales: 'linear', prep: 'Brand matters enormously. Bitter or thin tahini ruins hummus. Taste it raw first — it should be nutty, not bitter.',
      substitutions: [
        { ingredient: 'Unhulled tahini', changes: 'Darker, more bitter, and earthier. The hummus will have a stronger sesame flavour — some prefer it. Use a touch less lemon to balance.', quality: 'good_swap' },
      ],
    },
    { id: 'i3', name: 'Lemon juice, freshly squeezed', amount: 60, unit: 'ml', scales: 'linear',
      substitutions: [
        { ingredient: 'White wine vinegar', changes: 'Sharper and less fruity than lemon. Use about half the quantity and taste — it lacks the floral note of fresh lemon but brightens the dip.', quality: 'compromise', quantity_note: 'use 30–35ml white wine vinegar' },
      ],
    },
    { id: 'i4', name: 'Garlic cloves', amount: 2, unit: '', scales: 'fixed',
      substitutions: [
        { ingredient: 'Roasted garlic cloves', changes: 'Sweeter, nuttier, and milder than raw garlic. The hummus will be more mellow — less pungent but deeply flavoured. Roast a whole head at 180°C for 45 minutes.', quality: 'great_swap', quantity_note: 'use 4 roasted cloves to match the flavour impact of 2 raw' },
      ],
    },
    { id: 'i5', name: 'Ice-cold water', amount: 60, unit: 'ml', scales: 'linear' },
    { id: 'i6', name: 'Bicarbonate of soda', amount: 0.5, unit: 'tsp', scales: 'fixed', prep: 'Added to the cooking water — it softens the chickpea skins and lets them blend ultra-smooth' },
    { id: 'i7', name: 'Salt', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i8', name: 'Extra virgin olive oil, to serve', amount: 2, unit: 'tbsp', scales: 'fixed' },
    { id: 'i9', name: 'Paprika and whole chickpeas, to garnish', amount: 1, unit: 'pinch', scales: 'fixed',
      substitutions: [
        { ingredient: 'Sumac and toasted pine nuts', changes: 'A more complex, Middle Eastern garnish. Sumac adds tartness; pine nuts add richness and texture. A genuine upgrade.', quality: 'great_swap' },
        { ingredient: 'Smoked paprika and toasted sesame seeds', changes: 'Deeper colour and a smoky note. Looks beautiful and adds another layer of flavour.', quality: 'great_swap' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Soak overnight', content: 'Cover dried chickpeas with cold water — at least 3× their volume. Soak 12 hours minimum, 24 is better. They will roughly double in size.', why_note: 'Soaking rehydrates the chickpeas so they cook evenly. Unsoaked chickpeas have a hard, grainy centre even after long cooking. The soak water goes slightly acidic and breaks down oligosaccharides that cause gas — discard it.' },
    { id: 's2', title: 'Cook very soft with bicarbonate', content: 'Drain and rinse. Cover with fresh cold water, add bicarbonate of soda. Bring to boil, skim foam. Simmer 1.5–2 hours until completely, utterly soft — they should crush between two fingers with almost no pressure.', timer_seconds: 5400, why_note: 'Bicarbonate of soda raises the pH of the cooking water. In alkaline conditions, pectin in the chickpea cell walls breaks down faster, resulting in a softer, creamier texture. Under-cooked chickpeas give you grainy hummus no matter how long you blend.' },
    { id: 's3', title: 'Blend tahini and lemon first', content: 'In a food processor, blend tahini, lemon juice, and garlic for 1 minute until completely smooth and light-coloured. The mixture will seize and go thick — this is correct.', timer_seconds: 60, why_note: 'Blending tahini before adding chickpeas creates a stable emulsion base. The lemon acid causes the tahini proteins to reorganise into a smoother, fluffier texture. Adding chickpeas to unblended tahini gives a coarser result.' },
    { id: 's4', title: 'Add chickpeas and blend until completely smooth', content: 'Drain chickpeas but save the cooking water. Add hot chickpeas to the tahini mixture. Blend 4–5 minutes straight. Add ice-cold water gradually to achieve a silky, dropping consistency. Season with salt.', timer_seconds: 300, why_note: "Hot chickpeas blend smoother than cold ones — temperature helps break down the starch. The ice-cold water creates a thermal contrast that makes the emulsion fluffier (the same principle as cold butter in mantecatura). Blending 4–5 minutes isn't optional — 1–2 minutes produces gritty hummus." },
    { id: 's5', title: 'Rest and serve warm', content: 'Let the hummus rest 30 minutes before serving — flavours integrate. To serve, spread in a shallow bowl making a well in the centre, fill with olive oil, scatter chickpeas, sprinkle paprika.', timer_seconds: 1800, why_note: 'Freshly blended hummus tastes flat and slightly metallic. The rest allows the lemon, garlic, and tahini flavours to fully integrate. Hummus is at its best at room temperature or slightly warm — cold hummus is firm and mutes the flavour.' },
  ],
  categories: { cuisines: ['levantine'], types: ['vegetarian'] },
  whole_food_verified: true,
};

const FATTOUSH: Recipe = {
  id: 'fattoush',
  title: 'Fattoush',
  tagline: 'Lebanese crispy bread salad with sumac dressing',
  base_servings: 4,
  time_min: 20,
  difficulty: 'Easy',
  tags: ['levantine', 'lebanese', 'vegetarian', 'salad', 'quick'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Anissa Helou / Lebanese Cuisine',
    video_url: 'https://www.anissas.com/',
  },
  emoji: '🥗',
  hero_fallback: fallback('#6B8C3A'),
  hero_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Stale pitta bread (2 days old)', amount: 2, unit: 'large', scales: 'linear', prep: 'Stale bread fries and stays crunchy. Fresh bread absorbs oil and goes soft immediately.',
      substitutions: [
        { ingredient: 'Lebanese flatbread, stale', changes: 'Slightly thinner than pitta — fries faster and crispier. Watch it closely, it can burn in 30 seconds at high heat.', quality: 'great_swap' },
        { ingredient: 'Sourdough, torn into rough pieces and baked until dry', changes: 'Less traditional but makes excellent croutons. Bake at 180°C for 10 minutes rather than frying.', quality: 'good_swap' },
      ],
    },
    { id: 'i2', name: 'Romaine lettuce, roughly torn', amount: 1, unit: 'head', scales: 'linear',
      substitutions: [
        { ingredient: 'Cos lettuce', changes: 'Same family as romaine — virtually identical in texture and flavour. Direct swap.', quality: 'perfect_swap' },
        { ingredient: 'Butter lettuce', changes: 'Softer and less crunchy than romaine. The salad will be less textural but still good.', quality: 'good_swap' },
      ],
    },
    { id: 'i3', name: 'Tomatoes, cut in wedges', amount: 3, unit: 'medium', scales: 'linear',
      substitutions: [
        { ingredient: 'Cherry tomatoes, halved', changes: 'Sweeter and juicier. The smaller size means more surface area — the juice integrates into the dressing faster. Slightly different texture.', quality: 'great_swap' },
      ],
    },
    { id: 'i4', name: 'Cucumber, halved and sliced', amount: 1, unit: 'medium', scales: 'linear',
      substitutions: [
        { ingredient: 'Lebanese cucumbers (3–4)', changes: 'Thinner skin, fewer seeds, more concentrated flavour than a standard cucumber. The preferred choice in Lebanese kitchens.', quality: 'great_swap' },
      ],
    },
    { id: 'i5', name: 'Radishes, thinly sliced', amount: 6, unit: '', scales: 'linear',
      substitutions: [
        { ingredient: 'Fennel bulb (½), very thinly sliced', changes: 'Anise-like and crunchy — provides the same textural role as radish with a sweeter, more complex flavour.', quality: 'good_swap' },
        { ingredient: 'Daikon (white radish), thinly sliced', changes: 'Milder in flavour than regular radishes but the same sharp crunch. Works well in the salad.', quality: 'good_swap' },
      ],
    },
    { id: 'i6', name: 'Spring onions, sliced', amount: 4, unit: '', scales: 'linear',
      substitutions: [
        { ingredient: 'Red onion, very thinly sliced', changes: 'Sharper and more pungent than spring onion. Soak in cold water for 10 minutes to mellow it before adding.', quality: 'good_swap' },
        { ingredient: 'Shallots, thinly sliced', changes: 'Milder than red onion, similar to spring onion in intensity. A good middle ground.', quality: 'good_swap' },
      ],
    },
    { id: 'i7', name: 'Flat-leaf parsley', amount: 20, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Fresh coriander', changes: 'More assertive, citrusy-herbal flavour. Common in some Lebanese households. Changes the character noticeably but stays within the Levantine flavour profile.', quality: 'good_swap' },
        { ingredient: 'Watercress leaves', changes: 'Peppery and slightly bitter. Less traditional but adds a different dimension that works with the sumac dressing.', quality: 'compromise' },
      ],
    },
    { id: 'i8', name: 'Fresh mint leaves', amount: 10, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Fresh basil leaves', changes: 'Sweeter and more anise-like than mint. Less traditional but works with the tomato and lemon.', quality: 'compromise' },
      ],
    },
    { id: 'i9', name: 'Sumac', amount: 2, unit: 'tsp', scales: 'fixed', prep: "This is the flavour of the dish — don't reduce it",
      substitutions: [
        { ingredient: 'Lemon zest (1 full lemon) + pinch of citric acid', changes: 'Approximates sumac\'s tartness without its fruity complexity. The salad will taste bright but one-dimensional. Sumac is widely available — use it if you can.', quality: 'compromise' },
      ],
    },
    { id: 'i10', name: 'Lemon juice', amount: 3, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Lime juice', changes: 'More floral and slightly more acidic than lemon. Works very well in the dressing — a common swap when lemons are out of season.', quality: 'great_swap' },
        { ingredient: 'White wine vinegar', changes: 'Sharper and less fruity than lemon. Use about 2 tbsp — it\'s more assertive. Less floral but provides the acidity the dressing needs.', quality: 'compromise', quantity_note: 'use 2 tbsp white wine vinegar per 3 tbsp lemon juice' },
      ],
    },
    { id: 'i11', name: 'Extra virgin olive oil', amount: 4, unit: 'tbsp', scales: 'fixed' },
    { id: 'i12', name: 'Pomegranate molasses', amount: 1, unit: 'tsp', scales: 'fixed', prep: 'Optional but traditional — adds depth and sourness',
      substitutions: [
        { ingredient: 'Extra lemon juice + pinch of sugar', changes: 'Replicates the sour-sweet balance of pomegranate molasses without the fruity depth. Increase lemon by 1 tsp and add ¼ tsp sugar.', quality: 'compromise' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Fry the bread until shatteringly crisp', content: 'Tear pitta into rough pieces. Shallow-fry in olive oil over medium-high heat until deep golden and rigid. Drain on paper. Season with salt immediately.', why_note: 'The fried bread needs to stay crunchy even after dressing — this only works with stale pitta fried in enough oil at high enough heat. Baked croutons go soft faster. Season while hot because salt sticks to hot, oily surfaces.' },
    { id: 's2', title: 'Make the sumac dressing', content: 'Whisk together lemon juice, olive oil, sumac, pomegranate molasses if using, and salt. Taste: it should be assertively sour and salty.', why_note: 'Sumac is water and fat-soluble — whisking it into both lemon juice and oil distributes it through the whole dressing. Fattoush dressing is intentionally sharp: it needs to cut through the oil-soaked bread.' },
    { id: 's3', title: 'Toss and serve immediately', content: 'Combine all vegetables and herbs in a large bowl. Add the fried bread. Pour over the dressing and toss. Serve within 5 minutes — the bread should still have some crunch.', why_note: 'Fattoush is a race against the bread going soft. The acid in the dressing starts breaking down the crisp surfaces the moment it touches them. Dress and serve; do not let it sit.' },
  ],
  categories: { cuisines: ['levantine'], types: ['salads', 'vegetarian'] },
  whole_food_verified: true,
};

const PRAWN_TACOS_PINEAPPLE: Recipe = {
  id: 'prawn-tacos-pineapple',
  title: 'Prawn Tacos with Pineapple Salsa',
  tagline: 'Spiced prawns, charred pineapple, chipotle crema',
  base_servings: 2,
  time_min: 25,
  difficulty: 'Easy',
  tags: ['fish', 'mexican', 'andy-cooks', 'quick'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Andy Cooks',
    video_url: 'https://www.youtube.com/@andy_cooks',
  },
  emoji: '🌮',
  hero_fallback: fallback('#C47820'),
  hero_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Raw tiger prawns, peeled and deveined', amount: 300, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'King prawns or banana prawns', changes: 'Slightly larger and sweeter. Same technique — cook the same time.', quality: 'perfect_swap' },
        { ingredient: 'Firm white fish, cut in chunks (barramundi, snapper, flathead)', changes: 'Great baja-style fish taco variation. Cook 2–3 minutes per side in the same spiced oil.', quality: 'great_swap' },
        { ingredient: 'Firm tofu, cubed and pressed dry', changes: 'Vegan version. Needs a longer sear to develop colour — about 3 minutes per side. Absorbs the spices well.', quality: 'good_swap' },
      ],
    },
    { id: 'i2', name: 'Small corn tortillas', amount: 6, unit: '', scales: 'linear',
      substitutions: [
        { ingredient: 'Flour tortillas (small)', changes: 'Softer and more pliable — less likely to crack. Less corn flavour. Charring is less essential.', quality: 'good_swap' },
      ],
    },
    { id: 'i3', name: 'Ancho chilli powder', amount: 1, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Regular chilli powder + extra smoked paprika', changes: 'Ancho is mild, fruity, and dark. Regular chilli powder is hotter and less fruity. Use a little less and add 0.5 tsp more smoked paprika.', quality: 'good_swap' },
      ],
    },
    { id: 'i4', name: 'Smoked paprika', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i5', name: 'Ground cumin', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i6', name: 'Garlic powder', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i7', name: 'Fresh pineapple, cut into 1cm rings', amount: 200, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Fresh mango, sliced', changes: 'Sweeter and less acidic than pineapple. The salsa will be fruitier and milder — excellent in summer when mangoes are in season.', quality: 'great_swap' },
        { ingredient: 'Tinned pineapple rings, drained', changes: 'Less firm and less sweet than fresh. Pat completely dry before charring — tinned pineapple holds more moisture.', quality: 'compromise' },
      ],
    },
    { id: 'i8', name: 'Red onion, finely diced', amount: 0.5, unit: '', scales: 'linear',
      substitutions: [
        { ingredient: 'White onion, finely diced', changes: 'Sharper and more pungent than red onion raw. Soak in cold water 5 minutes to mellow it slightly.', quality: 'good_swap' },
        { ingredient: 'Shallots, finely diced', changes: 'Milder and slightly sweeter. The best substitute if the raw onion flavour is too strong.', quality: 'great_swap' },
      ],
    },
    { id: 'i9', name: 'Coriander, chopped', amount: 15, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Flat-leaf parsley + squeeze of lime', changes: 'For those who dislike coriander. Parsley lacks the citrus-soapy note but the extra lime compensates partly.', quality: 'compromise' },
      ],
    },
    { id: 'i10', name: 'Jalapeño, finely diced', amount: 1, unit: '', scales: 'fixed',
      substitutions: [
        { ingredient: 'Long green chilli', changes: 'Milder heat than jalapeño, more widely available in Australia. Use 1–2 depending on size.', quality: 'good_swap' },
        { ingredient: 'Serrano chilli', changes: 'Hotter than jalapeño. Use half the quantity — firm texture is almost identical.', quality: 'good_swap', quantity_note: 'use half a serrano per jalapeño' },
      ],
    },
    { id: 'i11', name: 'Lime', amount: 3, unit: '', scales: 'linear' },
    { id: 'i12', name: 'Chipotle in adobo', amount: 2, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Smoked paprika + sriracha', changes: 'Less complex — chipotle in adobo has vinegary depth and smokiness that this can\'t fully replicate. But it works in a pinch.', quality: 'compromise', quantity_note: '1 tsp smoked paprika + ½ tsp sriracha per 2 tsp chipotle', hard_to_find: true, local_alternative: 'Chipotle in adobo is at most Woolworths and Coles stores in the Mexican foods aisle. Old El Paso brand is widely stocked.' },
      ],
    },
    { id: 'i13', name: 'Soured cream or crema', amount: 4, unit: 'tbsp', scales: 'linear',
      substitutions: [
        { ingredient: 'Full-fat natural yoghurt', changes: 'Tangier and thinner than crema. Works well — provides the same cooling contrast to the heat.', quality: 'good_swap' },
        { ingredient: 'Coconut cream', changes: 'Vegan option. Much milder and sweeter — no tang. Still provides the cooling element needed against the chipotle.', quality: 'compromise' },
      ],
    },
    { id: 'i14', name: 'Neutral oil', amount: 2, unit: 'tbsp', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Char the pineapple', content: 'Slice pineapple into rings or planks. Cook in a dry pan over high heat, no oil, 2–3 minutes per side until charred and caramelised. Cool slightly, dice into small cubes.', timer_seconds: 180, why_note: "Dry heat caramelises the pineapple's natural sugars (55g per 100ml in ripe pineapple) through direct Maillard reaction on the surface. The char adds slight bitterness that balances the sweetness. Oil would steam it instead of charring." },
    { id: 's2', title: 'Make the pineapple salsa', content: 'Combine charred pineapple, red onion, jalapeño, coriander, and the juice of 1 lime. Season. Taste — it should be sweet, sour, and have some heat.' },
    { id: 's3', title: 'Make chipotle crema', content: 'Mix soured cream with chipotle in adobo, juice of half a lime, and a pinch of salt. Start with 1 tsp chipotle and add more to your heat preference.', why_note: 'Chipotle in adobo is smoked jalapeño in a vinegary tomato sauce. The smokiness is the point — it bridges the char on the pineapple and the spice on the prawns. Making it ahead lets the flavours integrate.' },
    { id: 's4', title: 'Season and cook the prawns fast', content: "Toss prawns in ancho chilli, paprika, cumin, garlic powder, salt, and olive oil. Cook in a screaming hot pan or griddle — 90 seconds maximum per side. They're done when they turn pink and curl into a C shape.", timer_seconds: 90, why_note: 'Prawns overcook almost instantly. The window between translucent (raw) and a C shape (perfect) and an O shape (overcooked rubber) is about 30 seconds. The pan needs to be scorching — a warm pan steams prawns grey instead of searing them.' },
    { id: 's5', title: 'Char the tortillas and build', content: 'Char tortillas directly on a gas flame or dry hot pan, 20–30 seconds per side. Build: chipotle crema, 3–4 prawns, pineapple salsa, squeeze of lime.', why_note: 'Cold tortillas crack. Charring adds flavour from the corn and makes them pliable. Build in this order so the crema acts as a moisture barrier between the warm tortilla and the juicy salsa.' },
  ],
  categories: { cuisines: ['mexican'], types: ['seafood'] },
  whole_food_verified: true,
};

const SOURDOUGH_MAINTENANCE: Recipe = {
  id: 'sourdough-maintenance',
  title: 'Sourdough Starter — Maintenance Guide',
  tagline: 'Keep your starter alive and ready to bake',
  base_servings: 1,
  time_min: 15,
  difficulty: 'Easy',
  tags: ['bread', 'technique', 'fermentation'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Chad Robertson / Tartine Bakery',
    video_url: 'https://tartinebakery.com/about',
  },
  emoji: '🍞',
  hero_fallback: fallback('#8B6914'),
  hero_url: 'https://images.unsplash.com/photo-1585478259715-1c195ae2b568?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Existing starter', amount: 50, unit: 'g', scales: 'fixed', prep: 'The "seed" — this is what you keep from each feeding' },
    { id: 'i2', name: 'Strong white flour (or 50/50 white/wholemeal)', amount: 50, unit: 'g', scales: 'fixed', prep: 'Wholemeal contains more wild yeast and bacteria — feeds the culture better than white alone' },
    { id: 'i3', name: 'Water (room temperature, unchlorinated)', amount: 50, unit: 'g', scales: 'fixed', prep: 'Tap water is fine if left out 30 minutes for chlorine to off-gas. Chlorine kills the bacteria you are trying to feed.' },
  ],
  steps: [
    { id: 's1', title: 'What a healthy starter looks like', content: "A healthy starter at peak activity is bubbly throughout — not just on top — and has roughly doubled in volume. It smells pleasantly sour and slightly yeasty, like yoghurt or beer. It should pass the float test: drop a small piece in water — it floats if full of gas. A healthy starter that has been refrigerated looks flat, smells more sharply acidic, and may have a grey liquid on top (hooch — just stir it in or pour it off, it's harmless alcohol).", why_note: 'The bubbles are CO2 produced by wild yeast fermenting the flour. Peak activity (maximum bubble volume) is the window when your starter has the most leavening power — this is when to use it for baking. Hooch is ethanol produced when yeast runs out of food — it means the starter is hungry but not dead.' },
    { id: 's2', title: 'Regular feeding (counter / daily baking)', content: 'Discard all but 50g of your starter. Add 50g flour and 50g room-temperature water (1:1:1 ratio by weight). Stir vigorously — you want to incorporate air. Leave covered at room temperature. It will peak in 4–8 hours depending on temperature.', why_note: 'Discarding is not waste — it keeps the starter manageable in size and prevents acid build-up that would eventually suppress the yeast. The 1:1:1 ratio gives the culture enough food without overfeeding it, which dilutes the yeast population. Vigorous stirring oxygenates the culture, which yeast prefers in early fermentation.' },
    { id: 's3', title: 'Refrigerator maintenance (baking weekly)', content: 'After feeding, let it sit at room temperature 2–4 hours until bubbly, then put it in the fridge. Feed once a week. To use from cold: take it out the night before, feed it, leave at room temperature overnight, use at peak the next morning.', why_note: 'Cold (4°C) dramatically slows fermentation — the culture stays dormant but alive. Weekly feeding is enough to keep the yeast population healthy. Taking it out 12 hours before baking gives it time to warm up and go through a full rise cycle so it has maximum strength when it goes into your dough.' },
    { id: 's4', title: 'Reviving a neglected starter', content: 'If it has been in the fridge for months: pour off the hooch and any discoloured liquid. It may smell very sharp or like acetone. Feed daily for 3–5 days at room temperature, discarding before each feed, until it doubles consistently within 6–8 hours.', why_note: 'Long neglect allows acetic acid bacteria to dominate over yeast (bacteria tolerate acidity better than yeast). Repeated feedings restore the balance by introducing fresh food and removing accumulated acid. Doubling consistently within 6–8 hours is the signal that the yeast population is strong enough for baking.' },
    { id: 's5', title: 'Signs something is wrong', content: 'Mould is the only true emergency — pink, orange, or fuzzy growth means discard the whole thing and start fresh. Black streaks or liquid are usually just over-fermentation. A consistently flat, non-rising starter after 5 days of daily feeding in a warm kitchen likely means the flour or water is inhibiting microbial activity — try bottled water and wholemeal flour.', why_note: 'Mould is a contaminant from the air and wins when acidity drops too low to protect the culture. Once mould is visible on the surface, it has almost certainly penetrated deeper — stirring it away does not fix it. Every other problem short of mould is recoverable with patience and consistent feeding.' },
  ],
  categories: { cuisines: ['australian'], types: ['baking'] },
  whole_food_verified: true,
};

const SOURDOUGH_LOAF: Recipe = {
  id: 'sourdough-loaf',
  title: 'Sourdough Country Loaf',
  tagline: 'Open crumb, blistered crust — 24-hour process',
  base_servings: 8,
  time_min: 1440,
  difficulty: 'Involved',
  tags: ['bread', 'sourdough', 'technique', 'advanced'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Chad Robertson / Tartine Bakery',
    video_url: 'https://tartinebakery.com/about',
  },
  emoji: '🍞',
  hero_fallback: fallback('#6B4A14'),
  hero_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Bread flour (strong white)', amount: 450, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Plain (all-purpose) flour', changes: 'Lower protein (10–11% vs 13%) — the gluten network is weaker. The loaf will be denser and less open. Reduce water to 65% hydration (325g) to compensate.', quality: 'compromise', quantity_note: 'reduce water to 325g (65% hydration)' },
      ],
    },
    { id: 'i2', name: 'Wholemeal or spelt flour', amount: 50, unit: 'g', scales: 'linear', prep: '10% wholemeal adds flavour and enzymes — more than this starts making the crumb dense',
      substitutions: [
        { ingredient: 'Rye flour', changes: 'Even more enzymatic activity than wholemeal — speeds fermentation and adds a distinctive tang. Use the same amount. Bulk fermentation may be 30–45 minutes shorter.', quality: 'great_swap' },
      ],
    },
    // custom curve derived from HTML's factor^0.85 rule for water/stock:
    // base=8 → 375g. Factor^0.85: 4→0.554, 8→1.0, 12→1.416, 16→1.803, 20→2.176
    { id: 'i3', name: 'Water (warm, 30°C)', amount: 375, unit: 'g', scales: 'custom',
      curve: { '4': 208, '8': 375, '12': 531, '16': 676, '20': 816 },
      prep: 'This is 75% hydration — high but manageable for an open crumb. Drop to 70% (350g) for your first loaf.' },
    { id: 'i4', name: 'Active sourdough starter (at peak)', amount: 100, unit: 'g', scales: 'fixed', prep: 'Must be at peak — bubbly, doubled, passes the float test. Cold starter = no rise.' },
    { id: 'i5', name: 'Fine sea salt', amount: 10, unit: 'g', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Autolyse', content: 'Mix flours and 350g of the water (hold back 25g). Stir until no dry flour remains — no kneading yet. Cover and rest 30–60 minutes.', timer_seconds: 1800, why_note: 'Autolyse lets the flour fully hydrate before adding starter and salt. During this rest, enzymes begin breaking down proteins and the gluten network starts forming on its own. Dough after autolyse is smoother and more extensible and develops better structure with less kneading.' },
    { id: 's2', title: 'Add starter and salt', content: 'Add starter to the dough. Dissolve salt in the reserved 25g water, add that too. Squeeze the dough through your fingers until fully incorporated — it will feel slimy then come back together.', why_note: 'Salt is added after starter because salt inhibits yeast. Adding them separately prevents the salt from directly contacting the starter culture. The squeeze method distributes the starter throughout without deflating the gluten structure built during autolyse.' },
    { id: 's3', title: 'Bulk fermentation with stretch and folds', content: "Leave covered at room temperature (24–26°C ideal) for 4–5 hours total. In the first 2 hours: every 30 minutes, perform a set of stretch-and-folds (pull one side up and fold over, rotate 90°, repeat 4 times). That's 4 sets of folds. After that, leave undisturbed.", timer_seconds: 14400, why_note: 'Bulk fermentation is where most flavour development and structure building happens. Stretch-and-folds replace kneading — they align the gluten network without degassing it. The dough is ready when it has grown 50–75% in volume, feels airy and jiggly, and you can see bubbles on the sides of the container.' },
    { id: 's4', title: 'Shape and cold proof', content: 'Gently turn dough onto an unfloured surface. Pre-shape into a rough ball, rest 20 minutes. Final shape: fold the edges in toward the centre, flip over, drag toward you on the unfloured surface to build tension. Place seam-side up in a floured banneton or bowl lined with a floured cloth. Refrigerate 10–16 hours (overnight).', timer_seconds: 600, why_note: 'Cold proofing slows fermentation and develops more complex acid flavour. It also firms up the dough so it holds its shape when scored and going into a hot oven. The tension built during shaping is what allows the loaf to spring dramatically in the oven — insufficient tension and it spreads flat.' },
    { id: 's5', title: 'Bake in a covered pot at maximum heat', content: 'Preheat oven to 250°C (as hot as it goes) with a Dutch oven inside for 1 hour. Score the cold loaf with a sharp razor or lame. Put it straight from the fridge into the scorching Dutch oven. Cover and bake 20 minutes. Remove lid, bake 20–25 more minutes until deep mahogany.', timer_seconds: 2400, why_note: 'The covered Dutch oven traps steam released by the cold dough in the first 20 minutes. This steam keeps the crust supple enough to expand fully (oven spring). At 20 minutes, the crust has set — removing the lid now allows the Maillard reaction on the crust surface and the deep caramelisation that makes sourdough crust flavour. Internal temperature should hit 96°C. Rest 1 hour before cutting — the crumb continues cooking via carry-over heat.' },
  ],
  categories: { cuisines: ['australian'], types: ['baking'] },
  whole_food_verified: true,
};

const RISOTTO: Recipe = {
  id: 'risotto',
  title: 'Mushroom Risotto',
  tagline: 'The slow stir pays off',
  base_servings: 2,
  time_min: 40,
  difficulty: 'Intermediate',
  tags: ['vegetarian', 'rice', 'italian', 'dinner-party'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Marcella Hazan',
    video_url: 'https://giulianohazan.com/',
  },
  emoji: '🍚',
  hero_fallback: fallback('#8B7355'),
  hero_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Arborio rice', amount: 160, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Carnaroli rice', changes: 'Firmer, higher starch, and harder to overcook. Many Italian chefs consider it superior to Arborio — the risotto holds its shape better and the texture is more precise. Same technique.', quality: 'great_swap' },
        { ingredient: 'Vialone Nano rice', changes: 'A Veneto variety — slightly smaller grain, absorbs sauce beautifully. Creates a more flowing, slightly looser risotto (all\'onda style). Excellent choice.', quality: 'great_swap', hard_to_find: true, local_alternative: 'Italian delis and specialty food stores. Harris Farm sometimes stocks it.' },
      ],
    },
    { id: 'i2', name: 'Mixed mushrooms, sliced', amount: 300, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Button mushrooms + dried porcini (20g)', changes: 'Dried porcini reconstituted in 100ml boiling water adds intense umami depth. Add the soaking liquid (strained) to the stock. The button mushrooms provide bulk.', quality: 'great_swap' },
        { ingredient: 'Oyster mushrooms', changes: 'Delicate, silky texture and mild flavour. Don\'t overcook — add them only in the last 5 minutes.', quality: 'great_swap' },
        { ingredient: 'Swiss brown (cremini) mushrooms', changes: 'Earthier and more flavourful than button mushrooms. The most flavourful widely available single variety.', quality: 'great_swap' },
      ],
    },
    { id: 'i3', name: 'Dry white wine', amount: 100, unit: 'ml', scales: 'linear',
      substitutions: [
        { ingredient: 'Dry white vermouth', changes: 'More herbal and aromatic than regular white wine. Many classic Italian recipes call for it specifically — it adds complexity.', quality: 'great_swap' },
        { ingredient: 'Vegetable stock + 1 tbsp white wine vinegar', changes: 'Alcohol-free option. The vinegar provides the acidity that wine brings. Less complex but still provides the acidic hit that balances the starchy rice.', quality: 'good_swap' },
      ],
    },
    // custom curve derived from HTML's factor^0.85 rule for water/stock:
    // base=2 → 800ml. Factor^0.85: 1→0.554, 2→1.0, 4→1.803, 6→2.563, 8→3.249
    { id: 'i4', name: 'Vegetable stock, hot', amount: 800, unit: 'ml', scales: 'custom',
      curve: { '1': 443, '2': 800, '4': 1443, '6': 2050, '8': 2599 },
      prep: 'Add up to 200ml more if needed — exact amount varies with heat',
      substitutions: [
        { ingredient: 'Chicken stock', changes: 'Richer and more savoury — makes an excellent, non-vegetarian mushroom risotto. Many consider this the better option. Same technique.', quality: 'great_swap' },
        { ingredient: 'Mushroom stock (from dried porcini soaking liquid)', changes: 'Maximum mushroom flavour. Use the strained soaking water from dried porcini — intensely savoury. Dilute with water if too strong.', quality: 'great_swap' },
      ],
    },
    { id: 'i5', name: 'Shallots, finely diced', amount: 2, unit: '', scales: 'linear',
      substitutions: [
        { ingredient: 'White onion, finely diced (½ medium)', changes: 'Slightly more assertive than shallots. Soften a full 5 minutes to mellow. Works very well — the most common home cook substitution.', quality: 'good_swap' },
        { ingredient: 'Leek (white part only), thinly sliced', changes: 'Milder and sweeter than either onion or shallot. Adds a subtle savouriness that works beautifully with mushrooms.', quality: 'great_swap' },
      ],
    },
    { id: 'i6', name: 'Garlic cloves', amount: 2, unit: '', scales: 'fixed' },
    { id: 'i7', name: 'Parmesan, grated', amount: 60, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Grana Padano', changes: 'Less complex and slightly milder than Parmigiano Reggiano but far cheaper. Melts and emulsifies identically. A professional kitchen staple as a cost-saving swap.', quality: 'great_swap' },
        { ingredient: 'Pecorino Romano', changes: 'Sharper, saltier, and more tangy. Changes the character of the risotto noticeably. Use less.', quality: 'good_swap', quantity_note: 'use 40g per 60g parmesan — it\'s much saltier' },
      ],
    },
    { id: 'i8', name: 'Unsalted butter, cold', amount: 40, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Good extra virgin olive oil', changes: 'Dairy-free mantecatura — creates a lighter, less rich finish. The emulsification still works but the result is less glossy. A valid Italian regional variation.', quality: 'good_swap' },
      ],
    },
    { id: 'i9', name: 'Olive oil', amount: 2, unit: 'tbsp', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Sauté mushrooms separately', content: "Sauté mushrooms in oil over high heat until golden — 5 minutes without stirring. Season. Set aside. Do this in the same pan you'll use for the risotto.", timer_seconds: 300, why_note: 'Mushrooms release water when heated. Crowding or stirring keeps them wet and they steam instead of browning. High heat and patience gives you golden, meaty mushrooms — not grey rubber.' },
    { id: 's2', title: 'Soften shallots in butter', content: 'Reduce heat. Add butter, soften shallots and garlic 3–4 minutes until translucent. They should not colour.', timer_seconds: 240, why_note: 'Shallots cook faster than onions and have a milder, sweeter flavour for risotto. Translucent, not browned — browning adds bitterness that fights the delicate mushroom and wine notes.' },
    { id: 's3', title: 'Toast the rice', content: 'Add rice, stir to coat in fat. Toast 2 minutes until the edges turn translucent. Then add wine — it will sizzle aggressively.', timer_seconds: 120, why_note: 'Toasting the rice seals the exterior of each grain in fat, slowing starch release. This is what creates the slow, controlled creaminess of proper risotto. Skip this and you get gluey porridge.' },
    { id: 's4', title: 'Add stock gradually', content: 'Add hot stock one ladleful at a time, stirring frequently. Add the next ladle when the pan looks almost dry. Keep heat at a steady medium — active simmer, not a boil.', why_note: 'Gradual addition forces each grain to absorb liquid slowly, releasing surface starch incrementally. That starch is the "cream" of risotto — there is no cream in the recipe. Hot stock maintains temperature; cold stock stalls cooking.' },
    { id: 's5', title: 'Mantecatura — the final butter', content: 'When rice is al dente (it should have a firm but not chalky centre — taste it), remove from heat. Add cold butter in pieces and stir vigorously for 1 minute. Add mushrooms back in.', why_note: 'Mantecatura means "creaming". Cold butter emulsifies into the hot starch, creating a glossy, rich finish. Hot butter separates. Off heat prevents further starch release, which would make it gluey.' },
  ],
  categories: { cuisines: ['italian'], types: ['vegetarian'] },
  whole_food_verified: true,
};

const FISH_TACOS: Recipe = {
  id: 'fish-tacos',
  title: 'Baja Fish Tacos',
  tagline: 'Crispy, fresh, and done in 20 minutes',
  base_servings: 2,
  time_min: 25,
  difficulty: 'Easy',
  tags: ['fish', 'mexican', 'quick', 'weeknight'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Rick Bayless',
    video_url: 'https://www.youtube.com/watch?v=MsLRAE7q3m8',
  },
  emoji: '🌮',
  hero_fallback: fallback('#C87941'),
  hero_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'White fish fillets (cod/halibut)', amount: 300, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Barramundi fillets', changes: 'The ideal Australian substitute — firm, sweet, and holds together in batter. Excellent choice.', quality: 'great_swap' },
        { ingredient: 'Flathead fillets', changes: 'Classic Australian whiting-style fish. Delicate and sweet. Slightly shorter fry time — check at 2.5 minutes.', quality: 'great_swap' },
        { ingredient: 'Snapper fillets', changes: 'Firm and flavourful. Cut away the skin first for easier battered frying. Same technique.', quality: 'great_swap' },
        { ingredient: 'Prawns, peeled', changes: 'Makes prawn tacos — same batter and frying method. Cook 2–3 minutes only.', quality: 'great_swap' },
      ],
    },
    { id: 'i2', name: 'Small corn tortillas', amount: 4, unit: '', scales: 'linear',
      substitutions: [
        { ingredient: 'Flour tortillas (small, 15cm)', changes: 'Softer and more forgiving — less likely to crack. Less corn flavour. The most widely available option in Australian supermarkets.', quality: 'good_swap' },
      ],
    },
    { id: 'i3', name: 'Plain flour', amount: 60, unit: 'g', scales: 'fixed',
      substitutions: [
        { ingredient: 'Rice flour', changes: 'Gluten-free batter that is actually crispier than plain flour. Mix with a pinch of baking powder. Slightly lighter texture.', quality: 'great_swap' },
      ],
    },
    { id: 'i4', name: 'Cold beer (lager)', amount: 100, unit: 'ml', scales: 'fixed',
      substitutions: [
        { ingredient: 'Sparkling water + squeeze of lemon', changes: 'Alcohol-free batter. The carbonation still creates lightness. Slightly less flavour complexity but works very well.', quality: 'good_swap' },
        { ingredient: 'Cold soda water', changes: 'Same principle as sparkling water — CO2 creates lightness. Neutral flavour. A solid non-alcohol option.', quality: 'good_swap' },
      ],
    },
    { id: 'i5', name: 'Red cabbage, shredded', amount: 100, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Green cabbage, shredded', changes: 'Milder flavour and less colour than red. Works identically — the lime-wilt still improves it.', quality: 'great_swap' },
      ],
    },
    { id: 'i6', name: 'Lime', amount: 2, unit: '', scales: 'linear' },
    { id: 'i7', name: 'Crema or soured cream', amount: 4, unit: 'tbsp', scales: 'linear',
      substitutions: [
        { ingredient: 'Full-fat natural yoghurt', changes: 'Tangier and slightly thinner. Provides the cooling contrast needed against the chipotle.', quality: 'good_swap' },
        { ingredient: 'Kewpie mayonnaise', changes: 'Richer and more umami than crema. Mix with a squeeze of lime juice to balance.', quality: 'good_swap' },
      ],
    },
    { id: 'i8', name: 'Chipotle in adobo, minced', amount: 1, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Smoked paprika + sriracha + drop of white vinegar', changes: 'Mimics the smoky heat of chipotle. Not as complex or deep but serviceable.', quality: 'compromise', quantity_note: '½ tsp smoked paprika + ¼ tsp sriracha + drop of vinegar' },
      ],
    },
    { id: 'i9', name: 'Neutral oil for frying', amount: 500, unit: 'ml', scales: 'fixed' },
    { id: 'i10', name: 'Coriander leaves', amount: 1, unit: 'handful', scales: 'linear',
      substitutions: [
        { ingredient: 'Flat-leaf parsley', changes: 'For those who dislike coriander. Doesn\'t have the same citrus-herbal note but adds fresh colour and herb flavour.', quality: 'compromise' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Make the chipotle crema', content: 'Mix crema or soured cream with minced chipotle. Squeeze in half a lime. Taste — it should be smoky, creamy, with a gentle heat.', why_note: 'Making the sauce first lets the flavours meld while you cook the fish. Chipotle needs a few minutes to bloom in the cream.' },
    { id: 's2', title: 'Make batter and prep cabbage', content: 'Whisk flour with cold beer and a pinch of salt until just combined — lumps are fine. Toss cabbage with juice of half a lime and salt.', why_note: 'Cold beer creates carbonation that makes the batter light. Overmixing develops gluten and makes it tough. The cabbage acid-wilts slightly while you cook — intentional texture shift.' },
    { id: 's3', title: 'Fry the fish', content: 'Heat oil to 180°C in a deep pan. Cut fish into strips, dip in batter, lower gently into oil. Cook 3–4 minutes until deep golden. Drain on paper.', timer_seconds: 180, why_note: '180°C is the sweet spot — lower and the batter absorbs oil and goes greasy; higher and it browns before the fish cooks through. Use a thermometer. Sound also tells you: a steady active sizzle means correct temperature.' },
    { id: 's4', title: 'Warm tortillas and assemble', content: 'Char tortillas directly on a gas flame or dry pan — 30 seconds per side. Stack fish, cabbage, crema, coriander, squeeze lime over the top.', why_note: 'Cold, raw tortillas taste of nothing and tear. Charring activates the corn flavour and makes them pliable enough to fold without cracking.' },
  ],
  categories: { cuisines: ['mexican'], types: ['seafood'] },
  whole_food_verified: true,
};

const THAI_GREEN_CURRY: Recipe = {
  id: 'thai-green-curry',
  title: 'Thai Green Curry',
  tagline: 'Aromatic, balanced, deeply fragrant',
  base_servings: 4,
  time_min: 35,
  difficulty: 'Intermediate',
  tags: ['chicken', 'thai', 'asian', 'curry'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Andy Cooks',
    video_url: 'https://www.youtube.com/watch?v=lleTlMtbN8Q',
  },
  emoji: '🍛',
  hero_fallback: fallback('#3D7A3D'),
  hero_url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80',
  ingredients: [
    {
      id: 'i1', name: 'Chicken thighs, sliced', amount: 600, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Prawns, peeled and deveined', changes: 'A great seafood version. Add in the last 3 minutes only — prawns cook very fast and turn rubbery if overdone.', quality: 'great_swap' },
        { ingredient: 'Firm tofu, pressed and cubed', changes: 'Absorbs the curry paste beautifully when pressed dry. Vegan option. Fry the tofu first for extra texture.', quality: 'great_swap' },
        { ingredient: 'Chicken breast, thinly sliced', changes: 'Leaner and quicker-cooking. Reduce the chicken step to 2 minutes or it dries out.', quality: 'good_swap' },
      ],
    },
    {
      id: 'i2', name: 'Coconut milk (full-fat)', amount: 400, unit: 'ml', scales: 'linear', prep: 'Use full fat — light coconut milk breaks and looks watery',
      substitutions: [
        { ingredient: 'Coconut cream', changes: 'Richer and thicker — a genuine upgrade. Dilute slightly before use.', quality: 'great_swap', quantity_note: 'use 350ml coconut cream + 100ml water' },
        { ingredient: 'Light coconut milk', changes: 'Will separate and look watery. The fat is what cracks the paste and carries the flavour — this is the one swap to avoid if you can.', quality: 'compromise' },
      ],
    },
    {
      id: 'i3', name: 'Green curry paste', amount: 3, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Red curry paste', changes: 'A completely different curry with an identical method. Bolder, deeper, and sweeter than green. Not a substitute — a different dish.', quality: 'good_swap' },
        { ingredient: 'Yellow curry paste', changes: 'Milder and more turmeric-forward. Same technique but a gentler, more aromatic result.', quality: 'good_swap' },
      ],
    },
    { id: 'i4', name: 'Thai aubergine or courgette', amount: 200, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Zucchini (courgette), cut in rounds', changes: 'Already in the recipe as an alternative — same technique, milder flavour. Widely available. Cooks slightly faster than eggplant.', quality: 'perfect_swap' },
        { ingredient: 'Broccolini, cut into florets', changes: 'More assertive, slightly bitter. Add in the last 5 minutes — broccolini overcooks fast. Holds its colour well.', quality: 'good_swap', quantity_note: 'add in the last 5 minutes of simmering' },
        { ingredient: 'Snow peas or sugar snap peas', changes: 'Sweet and crunchy — adds texture contrast. Add in the last 2 minutes only or they go limp.', quality: 'good_swap', quantity_note: 'add in the last 2 minutes' },
        { ingredient: 'Capsicum (red or green), sliced', changes: 'Adds sweetness and bulk. Holds up well in the simmer. Standard Thai curry vegetable addition.', quality: 'good_swap' },
        { ingredient: 'Butternut pumpkin, cut in 3cm cubes', changes: 'Sweet and starchy — absorbs the curry beautifully. Add at the same time as the coconut milk, not later, as it needs the full 12 minutes.', quality: 'good_swap' },
      ],
    },
    {
      id: 'i5', name: 'Fish sauce', amount: 2, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Light soy sauce', changes: 'Less funky, different saltiness profile. Vegan alternative. Use slightly less.', quality: 'good_swap', quantity_note: 'use 1.5 tbsp — soy is saltier than fish sauce' },
        { ingredient: 'Coconut aminos', changes: 'Sweeter and milder. Add a pinch of salt to compensate for the lower sodium.', quality: 'compromise' },
      ],
    },
    { id: 'i6', name: 'Palm sugar or brown sugar', amount: 1, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Brown sugar', changes: 'Less complex caramel note than palm sugar, but perfectly serviceable. Dissolves faster. Direct swap.', quality: 'great_swap' },
        { ingredient: 'Coconut sugar', changes: 'Less sweet, more mineral, and slightly earthier than palm sugar. Works well in Thai cooking — a natural pairing.', quality: 'great_swap' },
        { ingredient: 'Honey', changes: 'Sweeter and more floral. Use half the quantity and stir in off-heat to avoid bitterness. Subtle flavour difference.', quality: 'good_swap', quantity_note: 'use ½ tsp honey per 1 tsp palm sugar' },
      ],
    },
    { id: 'i7', name: 'Kaffir lime leaves', amount: 4, unit: '', scales: 'fixed',
      substitutions: [
        { ingredient: 'Lime zest, freshly grated', changes: 'Provides citrus brightness without the distinctive floral-herbal complexity of kaffir lime. The broth will be simpler but still fragrant.', quality: 'compromise', quantity_note: 'use zest of 1 lime per 4 kaffir lime leaves', hard_to_find: true, local_alternative: 'Available frozen at most Asian grocers, Harris Farm Markets, and some Woolworths stores. Worth having in the freezer.' },
      ],
    },
    { id: 'i8', name: 'Thai basil', amount: 1, unit: 'handful', scales: 'fixed',
      substitutions: [
        { ingredient: 'Fresh Italian basil + a few fresh mint leaves', changes: 'Italian basil is sweeter and less anise-like than Thai basil. Adding a little mint approximates the aromatic complexity. Still works — just not identical.', quality: 'compromise', quantity_note: 'use a small handful of Italian basil + 4–5 fresh mint leaves' },
        { ingredient: 'Holy basil', changes: 'Slightly more peppery and clove-like than Thai basil. Traditional in some Thai dishes. The most authentic substitute — closer than Italian basil.', quality: 'great_swap', hard_to_find: true, local_alternative: 'Asian grocery stores. Less common than Thai basil but the same shops usually stock both.' },
      ],
    },
    { id: 'i9', name: 'Neutral oil', amount: 2, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Coconut oil', changes: 'Adds a subtle coconut note that integrates naturally into the curry. Works well and is commonly used in Thai cooking.', quality: 'great_swap' },
        { ingredient: 'Vegetable oil or sunflower oil', changes: 'Same neutral-flavour function. Either works identically. Standard swap.', quality: 'perfect_swap' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Fry the paste', content: 'Heat oil in a wok over high heat. Add curry paste and stir fry 2 minutes until fragrant and separated — it will spit.', timer_seconds: 120, why_note: 'Frying the paste in oil cooks out the raw galangal and lemongrass notes and develops a caramelised base flavour. Adding it directly to liquid makes a flat, raw-tasting curry.' },
    { id: 's2', title: 'Add coconut cream first', content: 'Add just the thick cream from the top of the can (don\'t shake it). Stir with the paste 2–3 minutes until the oil separates — "cracking" the coconut.', timer_seconds: 180, why_note: '"Cracking" means the coconut cream\'s emulsion breaks and the fat separates. This fat then carries the fat-soluble flavour compounds from the paste throughout the dish. You\'ll see the oil visibly pool — this is correct.' },
    { id: 's3', title: 'Cook the chicken', content: 'Add chicken, stir to coat in the paste-cream. Cook 3–4 minutes until sealed.', timer_seconds: 240 },
    { id: 's4', title: 'Add remaining coconut milk and simmer', content: 'Pour in the rest of the coconut milk and the thin liquid from the can. Add kaffir lime leaves, fish sauce, sugar, vegetables. Simmer 12 minutes.', timer_seconds: 720, why_note: 'The balance of fish sauce (salt + umami), sugar (sweetness), and lime leaf (citrus-floral) is the holy trinity of Thai cooking. Taste and adjust — the exact amounts depend on your brand of paste and fish sauce.' },
    { id: 's5', title: 'Finish with basil', content: "Remove from heat. Stir in Thai basil leaves — they'll wilt from the residual heat. Serve with jasmine rice.", why_note: 'Thai basil loses its anise-clove aroma with prolonged heat. Adding off heat preserves the volatile compounds. Italian basil is a poor substitute — different flavour profile entirely.' },
  ],
  categories: { cuisines: ['thai'], types: ['chicken'] },
  whole_food_verified: true,
};

const FRENCH_ONION_SOUP: Recipe = {
  id: 'french-onion-soup',
  title: 'French Onion Soup',
  tagline: 'Three hours of patience, forty years of tradition',
  base_servings: 4,
  time_min: 180,
  difficulty: 'Intermediate',
  tags: ['soup', 'french', 'vegetarian-option', 'slow'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Anthony Bourdain / Les Halles',
    video_url: 'https://www.youtube.com/@AnthonyBourdainPartsUnknown',
  },
  emoji: '🧅',
  hero_fallback: fallback('#8B5A2B'),
  hero_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Yellow onions, thinly sliced', amount: 1.5, unit: 'kg', scales: 'linear', prep: 'They cook down to a quarter of their volume — this amount is correct',
      substitutions: [
        { ingredient: 'Brown onions', changes: 'The same as yellow onions in Australia — direct swap. Slightly more pungent raw but identical after 60 minutes of caramelisation.', quality: 'perfect_swap' },
        { ingredient: 'White onions', changes: 'Less sweet and slightly more pungent than yellow. Caramelise just as well — minimal difference in the final dish.', quality: 'great_swap' },
        { ingredient: 'Shallots, thinly sliced', changes: 'More delicate and sweeter. Caramelise faster — check at 40 minutes. The soup will be more refined and less robustly flavoured. Expensive at 1.5kg quantity.', quality: 'good_swap', quantity_note: 'check at 40–45 minutes — shallots caramelise faster' },
      ],
    },
    { id: 'i2', name: 'Unsalted butter', amount: 60, unit: 'g', scales: 'fixed',
      substitutions: [
        { ingredient: 'Clarified butter (ghee)', changes: 'Higher smoke point — less risk of burning during the long caramelisation. Same richness. A marginal improvement for a 75-minute cook.', quality: 'great_swap' },
        { ingredient: 'Salted butter', changes: 'Reduce or eliminate additional salt. The long cook concentrates salt — be very careful to taste throughout.', quality: 'good_swap', quantity_note: 'reduce added salt — salted butter at 60g adds significant sodium' },
      ],
    },
    { id: 'i3', name: 'Olive oil', amount: 2, unit: 'tbsp', scales: 'fixed' },
    {
      id: 'i4', name: 'Dry white wine or vermouth', amount: 150, unit: 'ml', scales: 'linear',
      substitutions: [
        { ingredient: 'Dry white vermouth', changes: 'More herbal and aromatic than wine. Many classic French recipes use vermouth specifically — it\'s excellent and often preferred.', quality: 'great_swap' },
        { ingredient: 'Dry apple cider', changes: 'Subtle fruitiness that works surprisingly well. Use a proper dry cider, not a sweet one.', quality: 'good_swap' },
        { ingredient: 'Extra beef stock + white wine vinegar', changes: 'Non-alcohol option. Less complex — the long caramelised onion carries through anyway.', quality: 'compromise', quantity_note: 'use 120ml stock + 2 tbsp white wine vinegar' },
      ],
    },
    {
      id: 'i5', name: 'Good beef stock', amount: 1.2, unit: 'L', scales: 'linear',
      substitutions: [
        { ingredient: 'Rich chicken stock', changes: 'Lighter in colour and less robustly beefy. Still an excellent soup — more delicate.', quality: 'good_swap' },
        { ingredient: 'Vegetable stock', changes: 'Vegetarian version. Caramelise the onions even darker than usual to compensate for the lighter base.', quality: 'compromise' },
      ],
    },
    {
      id: 'i6', name: 'Gruyère, grated', amount: 200, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Comté', changes: 'Nuttier and slightly sweeter than Gruyère. Almost identical melt behaviour. Many consider it the superior choice.', quality: 'perfect_swap' },
        { ingredient: 'Raclette', changes: 'Extremely good melt with a mild, milky character. Different flavour but excellent for this application.', quality: 'great_swap' },
        { ingredient: 'Emmental', changes: 'Sweeter, milder, with large holes. Very good melt. Widely available at Australian supermarkets when Gruyère isn\'t.', quality: 'good_swap' },
      ],
    },
    { id: 'i7', name: 'Sourdough bread, sliced', amount: 4, unit: 'thick slices', scales: 'linear',
      substitutions: [
        { ingredient: 'Baguette, sliced diagonally 2cm thick', changes: 'The classic French bistro approach. Slightly more surface area per slice — toast until very crisp and dry.', quality: 'great_swap' },
        { ingredient: 'Country white bread, thickly sliced', changes: 'Less flavourful than sourdough or baguette. Toast until completely dry. Works in a pinch.', quality: 'good_swap' },
      ],
    },
    { id: 'i8', name: 'Fresh thyme', amount: 4, unit: 'sprigs', scales: 'fixed',
      substitutions: [
        { ingredient: 'Dried thyme', changes: 'More concentrated — use half the amount. The flavour carries through the long simmer well.', quality: 'good_swap', quantity_note: 'use ½ tsp dried thyme per 4 fresh sprigs' },
      ],
    },
    { id: 'i9', name: 'Bay leaves', amount: 2, unit: '', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Caramelise — the long game', content: 'Melt butter and oil in a heavy pot over medium-low heat. Add all the onions and salt lightly. Cook 60–75 minutes, stirring every 5–10 minutes, until deep amber-brown. If they stick, add a splash of water.', timer_seconds: 3600, why_note: 'True caramelisation requires the Maillard reaction and sugar caramelisation, which only happen when the water has fully evaporated from the onions and the temperature rises above 120°C. This takes a real 60 minutes on low heat — 20-minute versions are cheating and taste like it.' },
    { id: 's2', title: 'Deglaze and build the soup', content: 'Add wine, scraping the bottom. Cook until evaporated. Add stock, thyme, bay leaves. Bring to a simmer, cook 30 minutes.', timer_seconds: 1800, why_note: "Deglazing with wine recovers the fond (caramelised sugars stuck to the pot) — that's where half the flavour is. The subsequent simmer melds the stock with the onion base." },
    { id: 's3', title: 'Toast the bread', content: 'Toast sourdough slices until very firm — they need to stay rigid under the cheese and soup. Rub with a cut garlic clove while hot.', why_note: 'Soft bread sinks and disintegrates into the soup. Toast until dry and hard so it floats on top and stays there. The garlic rubbing penetrates the surface of hot bread in a way it never would on cold bread.' },
    { id: 's4', title: 'Grill and serve', content: 'Ladle soup into oven-safe bowls. Float a bread slice. Cover generously with gruyère — it should overhang the bowl slightly. Grill under a hot broiler 3–5 minutes until bubbling and spotted black in places.', timer_seconds: 300, why_note: 'The slight charring on the cheese is flavour, not failure. Maillard on the cheese creates nutty, bitter notes that balance the sweet onion and rich stock. Pale melted gruyère is aesthetically wrong and flavourwise missed.' },
  ],
  categories: { cuisines: ['french'], types: ['soups'] },
  whole_food_verified: true,
};

const PAD_THAI: Recipe = {
  id: 'pad-thai',
  title: 'Pad Thai',
  tagline: 'The tamarind is non-negotiable',
  base_servings: 2,
  time_min: 20,
  difficulty: 'Intermediate',
  tags: ['noodles', 'thai', 'asian', 'quick'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Andy Cooks',
    video_url: 'https://www.youtube.com/watch?v=6Lb1PyJxVQM',
  },
  emoji: '🍜',
  hero_fallback: fallback('#C87020'),
  hero_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Flat rice noodles (5mm)', amount: 160, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Rice vermicelli (thin)', changes: 'Much thinner — the texture is more delicate and cooks faster. Soak 3 minutes only. The dish is lighter.', quality: 'good_swap' },
        { ingredient: 'Egg noodles (thin, fresh)', changes: 'Wheaten noodles with an eggy richness. Stir-fry the same way but cook from fresh without soaking.', quality: 'good_swap' },
      ],
    },
    {
      id: 'i2', name: 'Prawns or chicken, sliced', amount: 200, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Pork belly, thinly sliced', changes: 'Richer and fattier — less traditional but deeply satisfying. Cook in the wok the same way.', quality: 'great_swap' },
        { ingredient: 'Firm tofu only (no meat)', changes: 'Fully vegan version. Fry the tofu first until golden before adding to the wok.', quality: 'good_swap' },
        { ingredient: 'Squid, cleaned and sliced', changes: 'Classic Thai market Pad Thai. Cook very fast — 60–90 seconds only or it turns rubbery.', quality: 'great_swap' },
      ],
    },
    { id: 'i3', name: 'Eggs', amount: 2, unit: '', scales: 'linear' },
    {
      id: 'i4', name: 'Tamarind paste', amount: 3, unit: 'tbsp', scales: 'fixed', prep: 'Ketchup is not a substitute — it changes the dish entirely',
      substitutions: [
        { ingredient: 'Tamarind concentrate', changes: 'More concentrated than paste — stronger and thicker. Use less and dilute with a splash of water.', quality: 'great_swap', quantity_note: 'use 2 tbsp concentrate + 1 tbsp water' },
        { ingredient: 'Lime juice + splash of rice vinegar', changes: 'Approximates the sourness without the deep complexity of tamarind. The result is thinner in body but the acidity works.', quality: 'compromise', quantity_note: '2 tbsp lime juice + 1 tbsp rice vinegar' },
      ],
    },
    {
      id: 'i5', name: 'Fish sauce', amount: 2, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Light soy sauce', changes: 'Less funky, different saltiness. Works as a vegan alternative. Use slightly less.', quality: 'good_swap', quantity_note: 'use 1.5 tbsp — soy is saltier' },
      ],
    },
    {
      id: 'i6', name: 'Palm sugar', amount: 1, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Brown sugar or dark muscovado', changes: 'Similar caramel notes. Brown sugar dissolves faster and is widely available. Nearly identical result.', quality: 'great_swap' },
        { ingredient: 'Coconut sugar', changes: 'Less sweet and more mineral. Works well — same amount.', quality: 'great_swap' },
      ],
    },
    { id: 'i7', name: 'Bean sprouts', amount: 80, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Shredded cabbage', changes: 'Crunchier but doesn\'t wilt as fast. A serviceable substitute when bean sprouts aren\'t available.', quality: 'good_swap' },
      ],
    },
    { id: 'i8', name: 'Spring onions, sliced', amount: 3, unit: '', scales: 'linear',
      substitutions: [
        { ingredient: 'Chives, thinly sliced', changes: 'Milder and more delicate. Add off heat only — they wilt immediately in the wok. Works well as a fresh garnish.', quality: 'good_swap' },
        { ingredient: 'Leek (green tops only), thinly sliced', changes: 'More robust than spring onion. Add to the wok 30 seconds before plating to warm through.', quality: 'good_swap' },
      ],
    },
    { id: 'i9', name: 'Crushed peanuts', amount: 40, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Cashews, toasted and roughly chopped', changes: 'Creamier and milder than peanuts. A good nut-allergy-alternative within the cashew category. Different but excellent.', quality: 'good_swap' },
        { ingredient: 'Toasted sunflower seeds', changes: 'Nut-free. Less rich, similar crunch. Toast in a dry pan until golden.', quality: 'compromise' },
      ],
    },
    { id: 'i10', name: 'Tofu, firm, cubed', amount: 100, unit: 'g', scales: 'linear' },
  ],
  steps: [
    { id: 's1', title: 'Soak noodles, mix sauce', content: 'Soak noodles in cold water 20 minutes until pliable but not cooked. Mix tamarind, fish sauce, sugar — taste it. Should be sour, salty, subtly sweet in that order.', timer_seconds: 1200, why_note: 'Cold soak (not boiling) means the noodles still have structural integrity when they hit the wok. Boiled noodles finish as mush. The sauce ratio defines pad Thai — get it right off the heat where you can taste clearly.' },
    { id: 's2', title: 'High heat wok', content: 'Wok on the highest flame you have for 3 minutes. Add oil — it should smoke immediately. This is the right temperature.', timer_seconds: 180, why_note: 'Wok hei — the smoky breath of the wok — only happens above 200°C on a dry wok. Restaurant woks run on industrial flames; home woks need maximum time to accumulate heat. A warm wok makes pad Thai soggy and grey.' },
    { id: 's3', title: 'Protein, then egg', content: 'Add protein to the wok edge, cook 2 minutes. Push to the side. Crack eggs into the hot centre, scramble until almost set, then push to the side with the protein.', timer_seconds: 120, why_note: 'Cooking protein and egg separately in zones keeps both from overcooking while you deal with the noodles. Mixed too early and you end up with one overcooked, broken mess.' },
    { id: 's4', title: 'Noodles and sauce', content: 'Add drained noodles, pour sauce over. Toss everything together using tongs. Cook 2 minutes — the sauce should evaporate and caramelise into the noodles.', timer_seconds: 120, why_note: 'Two minutes of high-heat contact lets the tamarind-sugar mixture caramelise onto the noodles. This creates the characteristic stickiness and complex flavour. Remove from heat the moment it looks slightly dry — residual heat finishes it.' },
    { id: 's5', title: 'Serve immediately', content: 'Top with bean sprouts, spring onions, peanuts. Serve with lime wedge, extra fish sauce, sugar, and chilli flakes on the side for adjusting.', why_note: 'Pad Thai cools fast and goes sticky cold. Serve immediately. The condiment table is traditional — every diner adjusts their own bowl.' },
  ],
  categories: { cuisines: ['thai'], types: ['pasta', 'seafood'] },
  whole_food_verified: true,
};

const BRAISED_SHORT_RIBS: Recipe = {
  id: 'braised-short-ribs',
  title: 'Red Wine Braised Short Ribs',
  tagline: 'Low and slow, fork-tender, restaurant result',
  base_servings: 4,
  time_min: 210,
  difficulty: 'Intermediate',
  tags: ['beef', 'braise', 'dinner-party', 'slow'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Gordon Ramsay',
    video_url: 'https://www.youtube.com/watch?v=QnxLau7m600',
  },
  emoji: '🥩',
  hero_fallback: fallback('#7A1C1C'),
  hero_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
  ingredients: [
    {
      id: 'i1', name: 'Beef short ribs, bone-in', amount: 1.2, unit: 'kg', scales: 'linear',
      substitutions: [
        { ingredient: 'Osso buco (veal shin, cross-cut)', changes: 'A different but equally stunning braise — gelatinous, silky, and deeply flavoured. The classic Italian application of this exact technique. Same time.', quality: 'perfect_swap' },
        { ingredient: 'Beef chuck, cut in 6cm cubes', changes: 'Less fat and collagen than short rib — still a very good braise but less luxurious. The sauce won\'t be quite as glossy.', quality: 'good_swap' },
        { ingredient: 'Lamb shoulder, bone-in', changes: 'Turns this into a red wine braised lamb — gamey, rich, and wonderful. Same technique. Reduce braising time to 2 hours.', quality: 'good_swap' },
      ],
    },
    {
      id: 'i2', name: 'Red wine (Cabernet or Merlot)', amount: 375, unit: 'ml', scales: 'linear',
      substitutions: [
        { ingredient: 'Stout beer (Guinness or dark stout)', changes: 'Darker, maltier, and more bitter than wine. The result is an Irish-style braise — deeply satisfying and different. A classic pairing with short ribs.', quality: 'great_swap' },
        { ingredient: 'Pomegranate juice + balsamic vinegar', changes: 'No-alcohol option with complex fruit acids and good body. Different character but genuinely delicious.', quality: 'good_swap', quantity_note: 'use 330ml pomegranate juice + 2 tbsp balsamic' },
      ],
    },
    { id: 'i3', name: 'Beef stock', amount: 500, unit: 'ml', scales: 'linear',
      substitutions: [
        { ingredient: 'Beef bone broth', changes: 'Higher gelatin content makes the braising liquid even richer. A genuine upgrade — the sauce will be glossier and more silky. Same amount.', quality: 'great_swap' },
        { ingredient: 'Chicken stock', changes: 'Lighter colour and less robustly beefy. Still produces an excellent braise but the sauce lacks the deep brown colour. Acceptable when that\'s all you have.', quality: 'good_swap' },
      ],
    },
    { id: 'i4', name: 'Carrot, roughly chopped', amount: 1, unit: 'large', scales: 'fixed',
      substitutions: [
        { ingredient: 'Parsnip, roughly chopped', changes: 'Sweeter and earthier than carrot. Dissolves beautifully into the braising liquid after 3 hours, adding body and sweetness. A classic swap in French braises.', quality: 'great_swap' },
        { ingredient: 'Celery root (celeriac), roughly chopped', changes: 'Earthy and slightly celery-flavoured. Adds aromatic depth. Holds its shape better than parsnip or carrot over 3 hours.', quality: 'good_swap' },
      ],
    },
    { id: 'i5', name: 'Celery stalks', amount: 2, unit: '', scales: 'fixed',
      substitutions: [
        { ingredient: 'Fennel bulb (½ medium), roughly chopped', changes: 'Milder and sweeter than celery with a slight anise note. Works very well in red wine braises — a French-Italian hybrid character.', quality: 'great_swap' },
        { ingredient: 'Celeriac (celery root), roughly chopped', changes: 'Concentrates the celery flavour into the braise beautifully. More robust than celery stalks — adds body rather than just aromatics.', quality: 'great_swap' },
      ],
    },
    { id: 'i6', name: 'Onion', amount: 1, unit: 'large', scales: 'fixed',
      substitutions: [
        { ingredient: 'Shallots (4 large), halved', changes: 'Milder, sweeter, and more elegant than a whole onion. Traditional in French restaurant braises. Soften faster — add them after the other aromatics.', quality: 'great_swap' },
        { ingredient: 'Leek (white and pale green part), sliced', changes: 'Subtle and sweet. Adds a refined onion note without the sharpness of brown onion. Wash well — leeks trap grit.', quality: 'good_swap' },
      ],
    },
    { id: 'i7', name: 'Tomato paste', amount: 2, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Tomato passata (4 tbsp)', changes: 'Less concentrated than paste but similar effect when cooked down with the aromatics. Cook an extra 5 minutes before adding the wine.', quality: 'good_swap', quantity_note: 'use 4 tbsp passata and cook down 5 extra minutes' },
      ],
    },
    { id: 'i8', name: 'Garlic cloves', amount: 5, unit: '', scales: 'fixed',
      substitutions: [
        { ingredient: 'Garlic paste (1 tsp per clove)', changes: 'Convenient. The flavour is slightly more muted than fresh-crushed but integrates well into a long braise. Use 5 tsp total.', quality: 'good_swap', quantity_note: 'use 1 tsp garlic paste per clove' },
      ],
    },
    { id: 'i9', name: 'Fresh rosemary and thyme', amount: 4, unit: 'sprigs each', scales: 'fixed',
      substitutions: [
        { ingredient: 'Dried rosemary and dried thyme', changes: 'More concentrated — use half the amount. The flavour carries through the long braise just as well as fresh.', quality: 'good_swap', quantity_note: 'use 1 tsp dried rosemary + 1 tsp dried thyme per 4 sprigs each' },
        { ingredient: 'Herbes de Provence (1 tsp)', changes: 'A ready-made Provençal herb blend that includes thyme, rosemary, marjoram, and lavender. Adds complexity. A convenient one-ingredient swap.', quality: 'great_swap' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Preheat and season', content: 'Preheat oven to 160°C. Season ribs aggressively — they need more salt than you think. Let them sit 10 minutes.', timer_seconds: 600, why_note: 'Short ribs are thick cuts with a lot of collagen and fat. Heavy seasoning on the outside is needed because the interior is self-seasoning via osmosis only in the hours of braising.' },
    { id: 's2', title: 'Sear every side', content: 'In a heavy oven-safe pan, sear ribs on all sides — including the ends — in batches, until very dark brown. Do not rush this.', why_note: "Every surface that doesn't get browned is flavour left behind. Short ribs have six faces — sear all of them. The exterior Maillard compounds end up in the braising liquid and define the sauce." },
    { id: 's3', title: 'Build aromatics, reduce wine', content: 'Remove ribs, soften vegetables in the same pan. Add tomato paste, cook 2 minutes. Add wine and reduce by half — 8–10 minutes.', timer_seconds: 480, why_note: 'Reducing wine removes harsh alcohol notes and concentrates the flavour. Full bottle of wine added direct gives you a boozy, raw-wine sauce. Reduced wine gives depth without the sharpness.' },
    { id: 's4', title: 'Braise 3 hours', content: 'Return ribs, add stock until liquid comes halfway up the ribs. Add herbs. Cover tightly and braise in oven at 160°C for 3 hours.', timer_seconds: 10800, why_note: '160°C oven heat is even on all sides, unlike stovetop braising which hot-spots at the bottom. Three hours converts the collagen in short rib connective tissue to gelatin — that\'s what makes the meat fall apart and the sauce sticky.' },
    { id: 's5', title: 'Rest and reduce sauce', content: 'Remove ribs, rest 15 minutes. Strain the braising liquid, skim fat, reduce in a pan over high heat to a glossy sauce.', timer_seconds: 900, why_note: 'Straining removes the now-exhausted vegetables. Skimming removes fat that would make the sauce greasy. Reducing concentrates into a glaze — pour it over the ribs and it should coat a spoon.' },
  ],
  categories: { cuisines: ['american'], types: ['beef'] },
  whole_food_verified: true,
};

const RAMEN: Recipe = {
  id: 'ramen',
  title: 'Shoyu Ramen',
  tagline: 'Rich tonkotsu-style with proper tare',
  base_servings: 2,
  time_min: 30,
  difficulty: 'Easy',
  tags: ['noodles', 'japanese', 'asian', 'comfort'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Ivan Orkin / Ivan Ramen',
    video_url: 'https://www.ivanramen.com/',
  },
  emoji: '🍜',
  hero_fallback: fallback('#4A3520'),
  hero_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Ramen noodles, fresh or dried', amount: 160, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Thin egg noodles (fresh or dried)', changes: 'Similar wheat noodle — slightly less chewy than ramen noodles but very close. A practical supermarket option.', quality: 'good_swap' },
        { ingredient: 'Soba noodles (buckwheat)', changes: 'Nuttier and earthier than ramen. Changes the character of the bowl noticeably but makes a great dish in its own right.', quality: 'good_swap' },
      ],
    },
    { id: 'i2', name: 'Good chicken stock', amount: 800, unit: 'ml', scales: 'linear',
      substitutions: [
        { ingredient: 'Pork bone broth', changes: 'Richer and more gelatinous — closer to tonkotsu style. A genuine upgrade if you can make or source it. Same technique.', quality: 'great_swap' },
        { ingredient: 'Dashi (kombu and bonito flakes)', changes: 'A completely different style — lighter, cleaner, and more delicate. Produces a shoyu-style ramen more faithful to the Japanese original.', quality: 'great_swap', hard_to_find: true, local_alternative: 'Asian grocers. Kombu and bonito flakes are widely available at Japanese food stores and large Asian supermarkets.' },
      ],
    },
    { id: 'i3', name: 'Soy sauce (tare)', amount: 3, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Tamari', changes: 'Gluten-free. Slightly less sharp than soy sauce with a rounder flavour. Near-identical result.', quality: 'perfect_swap' },
        { ingredient: 'White soy sauce (shiro shoyu)', changes: 'Paler colour and more delicate — produces a lighter-coloured broth. More refined and slightly sweeter.', quality: 'great_swap', hard_to_find: true, local_alternative: 'Japanese grocery stores and specialty food stores.' },
      ],
    },
    { id: 'i4', name: 'Mirin', amount: 1, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Dry sake + pinch of sugar', changes: 'Replicates mirin\'s sweetness and alcohol. Use the same amount of sake and add ¼ tsp sugar.', quality: 'good_swap' },
        { ingredient: 'Rice wine vinegar + pinch of sugar', changes: 'Adds sweetness without alcohol but also adds acidity. Use very sparingly.', quality: 'compromise', quantity_note: 'use ½ tbsp rice vinegar + ½ tsp sugar' },
      ],
    },
    { id: 'i5', name: 'Sesame oil', amount: 1, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Chilli sesame oil', changes: 'Adds both the sesame aroma and mild heat. Same amount. Changes the broth character slightly toward a spiced version.', quality: 'good_swap' },
        { ingredient: 'Tahini, thinned (¼ tsp in 1 tsp warm water)', changes: 'Sesame paste that approximates the flavour. Less fragrant than toasted sesame oil but provides the sesame note.', quality: 'compromise', quantity_note: 'stir ¼ tsp tahini into 1 tsp warm water before adding to broth' },
      ],
    },
    { id: 'i6', name: 'Eggs (for soft-boiled)', amount: 2, unit: '', scales: 'linear' },
    { id: 'i7', name: 'Chashu pork belly (or roasted pork)', amount: 100, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Roast pork shoulder, sliced', changes: 'Less silky than chashu but very good. Slice thinly and warm briefly in the hot broth.', quality: 'good_swap' },
        { ingredient: 'Chicken thigh, poached and sliced', changes: 'Lighter and more delicate. A common modern variation. Poach in the ramen broth itself for extra flavour.', quality: 'good_swap' },
        { ingredient: 'Firm tofu, pan-fried until golden', changes: 'Vegan option. Press dry, fry in sesame oil until golden. Soaks up the tare beautifully.', quality: 'good_swap' },
      ],
    },
    { id: 'i8', name: 'Spring onions', amount: 3, unit: 'stalks', scales: 'linear',
      substitutions: [
        { ingredient: 'Chives, thinly sliced', changes: 'Milder and more delicate than spring onion. The standard Japanese substitute — many ramen shops use chives. Same visual effect.', quality: 'great_swap' },
        { ingredient: 'Leek (green tops only), thinly sliced', changes: 'More robust than spring onion. Blanch briefly in the ramen broth before plating.', quality: 'good_swap' },
      ],
    },
    { id: 'i9', name: 'Nori sheets', amount: 2, unit: '', scales: 'linear',
      substitutions: [
        { ingredient: 'No substitute needed', changes: 'Nori adds a subtle sea-vegetable flavour and visual distinction. If unavailable, skip it — the bowl is complete without it. No ingredient truly replaces it.', quality: 'compromise' },
      ],
    },
    { id: 'i10', name: 'Bamboo shoots', amount: 40, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Tinned water chestnuts, sliced', changes: 'Crunchier and milder. A practical substitute that adds textural interest.', quality: 'good_swap' },
        { ingredient: 'Bean sprouts', changes: 'Widely available and adds the same textural crunch. Blanch 30 seconds in boiling water before adding.', quality: 'good_swap' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Soft-boil the eggs', content: 'Bring water to a rolling boil. Lower eggs in gently. Cook exactly 6.5 minutes. Transfer immediately to iced water for 5 minutes. Peel carefully.', timer_seconds: 390, why_note: '6.5 minutes gives a fully set white with a just-jammy yolk — the ramen standard. Below 6 minutes is too runny, above 7 is too hard. The ice bath stops residual cooking immediately.' },
    { id: 's2', title: 'Make the tare', content: 'Mix soy sauce and mirin in a small pan. Bring to a simmer 2 minutes to cook off the alcohol. This is your seasoning base.', timer_seconds: 120, why_note: "Tare is ramen's seasoning concentrate. Making it separately means you can adjust the saltiness of each bowl individually by adding more or less — rather than trying to season 800ml of stock accurately." },
    { id: 's3', title: 'Heat the broth', content: 'Heat stock to a rolling boil. Add sesame oil. Taste — it should be rich but slightly under-seasoned (the tare finishes it).', why_note: 'The stock provides body; the tare provides the seasoning signature. Separating them is the Japanese technique that makes ramen adjustable. Pre-seasoning the stock makes every bowl identical — not necessarily wrong, but less flexible.' },
    { id: 's4', title: 'Cook noodles separately', content: 'Cook noodles in a separate pan of unsalted water — not in the broth. Fresh: 1–2 minutes. Dried: follow package. Drain and rinse briefly.', timer_seconds: 90, why_note: 'Ramen noodles cook in unsalted water because the broth does all the seasoning. Cooking them in the broth clouds it and makes the bowl starchy. Rinsing removes excess surface starch.' },
    { id: 's5', title: 'Assemble properly', content: 'Tare in the bowl first. Noodles. Hot broth ladled over. Then toppings in distinct sections: halved egg, pork, nori, spring onion, bamboo. Each topping should be visually distinct.', why_note: "Adding tare first ensures it distributes through the broth as it's poured. Keeping toppings visually separate isn't just aesthetic — it lets you eat each element alone or in combination at your own pace." },
  ],
  categories: { cuisines: ['japanese'], types: ['soups', 'pasta'] },
  whole_food_verified: true,
};

const BEEF_WELLINGTON: Recipe = {
  id: 'beef-wellington',
  title: 'Beef Wellington',
  tagline: 'The showstopper — done right',
  base_servings: 6,
  time_min: 120,
  difficulty: 'Involved',
  tags: ['beef', 'showstopper', 'dinner-party', 'advanced'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Gordon Ramsay',
    video_url: 'https://www.youtube.com/watch?v=TE2omM_NoXU',
  },
  emoji: '🥩',
  hero_fallback: fallback('#7A3A1A'),
  hero_url: 'https://images.unsplash.com/photo-1551183053-bf91798d9cf3?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Beef fillet (centre cut)', amount: 800, unit: 'g', scales: 'fixed', prep: 'Centre cut only — consistent diameter means even cooking',
      substitutions: [
        { ingredient: 'Venison loin (deer fillet)', changes: 'Leaner, gamier, and more intense than beef. Treat identically but cook to 50°C (medium-rare) — venison is unforgiving if overdone.', quality: 'good_swap' },
      ],
    },
    { id: 'i2', name: 'Chestnut mushrooms', amount: 500, unit: 'g', scales: 'fixed',
      substitutions: [
        { ingredient: 'Swiss brown (cremini) mushrooms', changes: 'Earthier and more flavourful than button mushrooms. Closest widely available alternative to chestnut mushrooms — virtually identical result.', quality: 'perfect_swap' },
        { ingredient: 'Mixed mushrooms (portobello + button)', changes: 'Portobello adds deep, earthy flavour. Blend the two for a complex duxelles. Ensure you cook out ALL moisture — portobello releases a lot of water.', quality: 'great_swap' },
        { ingredient: 'Button mushrooms', changes: 'Milder flavour but works. The duxelles will be less complex. Cook for an extra 5 minutes to ensure all moisture is gone.', quality: 'good_swap' },
      ],
    },
    { id: 'i3', name: 'Prosciutto/Parma ham slices', amount: 8, unit: 'slices', scales: 'fixed',
      substitutions: [
        { ingredient: 'Jamon serrano (Spanish cured ham)', changes: 'Slightly drier and saltier than Prosciutto. Works identically as the moisture barrier layer.', quality: 'great_swap' },
        { ingredient: 'Pancetta, thinly sliced', changes: 'Less delicate than prosciutto, slightly more fatty. Still creates a good barrier between the duxelles and pastry.', quality: 'good_swap', hard_to_find: false },
      ],
    },
    { id: 'i4', name: 'Puff pastry, all-butter', amount: 500, unit: 'g', scales: 'fixed',
      substitutions: [
        { ingredient: 'Rough puff pastry, homemade', changes: 'More work but a purer flavour with better lamination. The flakiness is more pronounced. Recipe notes: 250g butter to 250g flour with cold water.', quality: 'great_swap' },
      ],
    },
    { id: 'i5', name: 'Dijon mustard', amount: 2, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Wholegrain mustard', changes: 'Adds texture and a slightly more assertive mustard flavour. Coarser texture means slightly less even adherence, but works very well.', quality: 'good_swap' },
        { ingredient: 'English mustard', changes: 'Sharper and hotter than Dijon. Use slightly less — it\'s a stronger, more pungent product. Good for those who like a pronounced mustard hit.', quality: 'good_swap', quantity_note: 'use 1.5 tbsp English mustard per 2 tbsp Dijon' },
      ],
    },
    { id: 'i6', name: 'Egg yolk for wash', amount: 2, unit: '', scales: 'fixed' },
    { id: 'i7', name: 'English mustard powder', amount: 0.5, unit: 'tsp', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Sear the fillet', content: 'Season heavily and sear in a screaming hot pan, all sides including ends, 1–2 minutes per side until brown all over. Allow to cool completely.', why_note: "The sear creates a flavour crust and — critically — dries the surface so the pastry doesn't get a steam-soggy bottom. Cool completely before wrapping or the mushroom paste will cook and the prosciutto will be cooked before the pastry even goes in the oven." },
    { id: 's2', title: 'Make the duxelles', content: 'Blitz mushrooms until fine paste. Cook in a dry pan over medium heat, stirring, for 10–12 minutes until completely dry. Season. Cool.', timer_seconds: 720, why_note: "Mushroom duxelles contains 90% water. Every drop must be evaporated before wrapping — if it isn't, the steam will make the pastry soggy. It's done when it looks like dark, dry, crumbly soil." },
    { id: 's3', title: 'Wrap in prosciutto', content: 'Lay prosciutto slices overlapping on cling film. Spread duxelles evenly. Brush fillet with Dijon. Roll the fillet in the prosciutto using the cling film to form a tight cylinder. Refrigerate 30 minutes.', timer_seconds: 1800, why_note: 'Prosciutto creates a moisture barrier between the duxelles and pastry. Dijon helps it adhere and adds subtle acidity. The cling film forms a tight cylindrical shape so the Wellington keeps its form.' },
    { id: 's4', title: 'Wrap in pastry', content: 'Preheat oven to 220°C. Unwrap, roll in pastry, seal edges with egg wash. Brush all over with egg yolk. Score lightly. Chill 10 minutes.', timer_seconds: 600, why_note: 'A second chill after pastry wrapping helps the pastry hold its shape and means the butter in the pastry is cold when it hits the oven — cold butter = steam = flaky layers.' },
    { id: 's5', title: 'Bake to internal temp', content: 'Bake at 220°C for 25–30 minutes until pastry is deep golden. Internal temperature: 52°C for rare, 55°C for medium-rare. Rest 10 minutes before cutting.', timer_seconds: 1500, why_note: 'Pastry colour is a guide; internal temperature is the truth. Use a probe thermometer. The beef carries over by about 3°C during the rest, so pull it slightly under target. Without resting, the juices run everywhere when cut.' },
  ],
  categories: { cuisines: ['french'], types: ['beef'] },
  whole_food_verified: true,
};

const DAL: Recipe = {
  id: 'dal',
  title: 'Tarka Dal',
  tagline: 'The spiced lentil dish that makes everything better',
  base_servings: 4,
  time_min: 40,
  difficulty: 'Easy',
  tags: ['vegetarian', 'vegan', 'indian', 'batch-cook', 'cheap'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Madhur Jaffrey',
    video_url: 'https://thehappyfoodie.co.uk/chefs/madhur-jaffrey/',
  },
  emoji: '🫘',
  hero_fallback: fallback('#C4843A'),
  hero_url: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&q=80',
  ingredients: [
    {
      id: 'i1', name: 'Red lentils', amount: 250, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Masoor dal (whole red lentils)', changes: 'Slightly more texture when cooked — holds its shape a bit better. Same flavour base and cooking method.', quality: 'perfect_swap' },
        { ingredient: 'Yellow split peas (chana dal)', changes: 'Creamier and nuttier than red lentils. A classic South Indian dal base. Needs significantly longer cooking.', quality: 'great_swap', quantity_note: 'cook for 40–50 minutes instead of 20' },
      ],
    },
    { id: 'i2', name: 'Onion, thinly sliced', amount: 1, unit: 'large', scales: 'linear',
      substitutions: [
        { ingredient: 'Shallots, thinly sliced', changes: 'Milder and slightly sweeter. The tarka will be more delicate. Same technique.', quality: 'great_swap' },
      ],
    },
    { id: 'i3', name: 'Tomatoes, chopped', amount: 2, unit: '', scales: 'linear',
      substitutions: [
        { ingredient: 'Tinned chopped tomatoes (200g)', changes: 'Consistent and convenient. Cook an extra 2 minutes to drive off excess liquid. Works very well.', quality: 'great_swap' },
      ],
    },
    { id: 'i4', name: 'Garlic cloves', amount: 4, unit: '', scales: 'linear',
      substitutions: [
        { ingredient: 'Garlic paste (1 tsp per clove)', changes: 'Consistent and convenient. Use 4 tsp total. Blends smoothly into the tarka — a reliable shortcut.', quality: 'good_swap', quantity_note: 'use 4 tsp garlic paste total' },
        { ingredient: 'Roasted garlic (8 cloves)', changes: 'Sweeter and milder than raw. Use double the quantity. Adds a subtle sweetness to the tarka. Roast a whole head at 180°C for 45 minutes.', quality: 'great_swap', quantity_note: 'use 8 roasted cloves to match the flavour impact of 4 raw' },
      ],
    },
    { id: 'i5', name: 'Fresh ginger, grated', amount: 1, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Ginger paste (from a tube or jar)', changes: 'Convenient and consistent. 1 tsp paste per 1 cm of fresh ginger is a good ratio.', quality: 'good_swap', quantity_note: '1 tbsp paste per 1 tbsp fresh grated' },
        { ingredient: 'Ground ginger', changes: 'Drier and less fresh-tasting. Use sparingly — it\'s very different to fresh.', quality: 'compromise', quantity_note: 'use ½ tsp ground per 1 tbsp fresh' },
      ],
    },
    { id: 'i6', name: 'Turmeric', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i7', name: 'Cumin seeds', amount: 1, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Ground cumin', changes: 'Less textural pop but same flavour. Use half the quantity — ground spices are more potent.', quality: 'good_swap', quantity_note: 'use ½ tsp ground cumin per 1 tsp cumin seeds' },
      ],
    },
    { id: 'i8', name: 'Mustard seeds', amount: 1, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Brown mustard seeds (if you have yellow)', changes: 'Yellow mustard seeds are milder. Brown are more pungent and traditional in South Indian tarka. Both work fine.', quality: 'good_swap' },
      ],
    },
    { id: 'i9', name: 'Dried red chillies', amount: 2, unit: '', scales: 'fixed',
      substitutions: [
        { ingredient: 'Chilli flakes', changes: 'Same heat and flavour but no whole pod texture. Use ¼ tsp per dried chilli.', quality: 'good_swap', quantity_note: '¼ tsp flakes per whole dried chilli' },
      ],
    },
    {
      id: 'i10', name: 'Ghee or clarified butter', amount: 3, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Coconut oil', changes: 'Vegan tarka with a subtle coconut note that works well with the spices. Same amount.', quality: 'great_swap' },
        { ingredient: 'Brown butter', changes: 'Cook butter until golden-brown before adding spices — the nutty Maillard notes take the tarka to a different level. Technically better than plain ghee.', quality: 'great_swap' },
        { ingredient: 'Neutral vegetable oil', changes: 'Pure vehicle for the spices with no added flavour. Fully vegan. The dal is less rich but the spicing still works.', quality: 'good_swap' },
      ],
    },
    { id: 'i11', name: 'Garam masala', amount: 0.5, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: '¼ tsp ground coriander + pinch each of cardamom and cinnamon', changes: 'Approximates garam masala\'s warmth from its component spices. Toast and grind whole spices for the best result.', quality: 'good_swap' },
        { ingredient: 'Mild curry powder', changes: 'Broader and less aromatic than garam masala. The dal will taste slightly more generic. Acceptable when garam masala isn\'t available.', quality: 'compromise' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Cook the lentils', content: 'Rinse lentils until water runs clear. Cover with cold water (3:1 ratio), add turmeric. Bring to boil, skim foam, simmer 20 minutes until completely soft. They should dissolve into a thick porridge.', timer_seconds: 1200, why_note: 'Red lentils have no outer husk so they disintegrate fully — this is correct and intended. The foam in the first minutes is starch — skim it for a cleaner dal. Turmeric goes in now because fat-soluble curcumin distributes better in the later tarka.' },
    { id: 's2', title: 'Make the tarka', content: "Heat ghee in a small pan until very hot. Add mustard seeds — wait for them to pop. Add cumin seeds, dried chillies, let them sizzle 30 seconds. Add sliced onion, cook until deeply golden-brown.", why_note: "Tarka is the finishing oil — it's made separately and poured over the lentils at the end. The mustard seeds need hot oil to pop; they won't in warm oil. Each spice needs a few seconds to bloom its volatile aromatics into the fat." },
    { id: 's3', title: 'Add garlic, ginger, tomato', content: 'Add garlic and ginger to the tarka pan. Cook 2 minutes. Add tomatoes, cook until they break down into the oil — about 5 minutes.', timer_seconds: 300, why_note: "Garlic and ginger added after the spices don't burn. The tomatoes must cook until their water fully evaporates and they're frying in the ghee — this concentrates flavour and removes the raw acidic edge." },
    { id: 's4', title: 'Combine and finish', content: 'Pour cooked lentils into the tarka pan (or vice versa). Add garam masala. Simmer together 5 minutes, season. The dal should coat a spoon but not be thick like cement.', timer_seconds: 300 },
  ],
  categories: { cuisines: ['indian'], types: ['vegetarian', 'soups'] },
  whole_food_verified: true,
};

const SCRAMBLED_EGGS: Recipe = {
  id: 'scrambled-eggs',
  title: 'Perfect Scrambled Eggs',
  tagline: 'Low and slow — 7 minutes of patience',
  base_servings: 1,
  time_min: 10,
  difficulty: 'Easy',
  tags: ['eggs', 'quick', 'breakfast', 'technique'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Gordon Ramsay',
    video_url: 'https://www.youtube.com/@GordonRamsay',
  },
  emoji: '🥚',
  hero_fallback: fallback('#D4A93A'),
  hero_url: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Eggs', amount: 3, unit: '', scales: 'linear' },
    { id: 'i2', name: 'Unsalted butter', amount: 15, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Clarified butter (ghee)', changes: 'Higher smoke point — more forgiving on higher heat if you momentarily lose control of the temperature. Same richness.', quality: 'great_swap' },
        { ingredient: 'Extra virgin olive oil', changes: 'Dairy-free option. The eggs will be slightly less silky and the flavour will be fruitier. Still excellent.', quality: 'good_swap' },
      ],
    },
    { id: 'i3', name: 'Crème fraîche', amount: 1, unit: 'tbsp', scales: 'linear',
      substitutions: [
        { ingredient: 'Full-fat soured cream', changes: 'Very similar to crème fraîche — slightly more acidic. Stops the cooking equally well and adds the same richness.', quality: 'great_swap' },
        { ingredient: 'Double cream', changes: 'Richer and less tangy. The eggs will be fattier and more luxurious. No acidity to brighten them — add a small squeeze of lemon at the end if using this.', quality: 'good_swap' },
        { ingredient: 'Full-fat natural yoghurt', changes: 'Tangier and lighter than crème fraîche. Works well — adds the same cooling-stop effect. The eggs are less rich but very good.', quality: 'good_swap' },
      ],
    },
    { id: 'i4', name: 'Salt', amount: 1, unit: 'pinch', scales: 'fixed' },
    { id: 'i5', name: 'Chives, chopped', amount: 1, unit: 'tsp', scales: 'linear',
      substitutions: [
        { ingredient: 'Spring onion (green tops only), finely sliced', changes: 'Milder than chives with a slightly onion-like flavour. A good everyday substitute.', quality: 'good_swap' },
        { ingredient: 'Flat-leaf parsley, finely chopped', changes: 'Fresh and herbal but without the onion note. A different flavour direction — works very well with butter and egg.', quality: 'good_swap' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Cold eggs, cold pan, cold butter', content: 'Crack eggs directly into a cold pan. Add all the butter. Do not whisk. Put on medium-low heat.', why_note: 'Starting cold means the eggs heat gradually and uniformly. Starting hot shocks them into large, rubbery curds. No whisking now — whisking incorporates air, which makes a fluffy omelette texture, not silky scrambled eggs.' },
    { id: 's2', title: 'Stir continuously, on and off heat', content: 'Stir constantly with a silicone spatula, moving in figure-eights. Every 30 seconds, take the pan off the heat for 10 seconds, continue stirring. Do this for 4–5 minutes.', timer_seconds: 300, why_note: 'The on-off-heat technique keeps the pan temperature oscillating around 65–70°C — just above the egg protein coagulation point. This creates the slow, creamy, uniform texture. Above 80°C, proteins tighten into dry curds.' },
    { id: 's3', title: 'Salt and finish at the last second', content: 'When eggs are 90% set — still slightly glossy and wet — remove from heat. Add crème fraîche, stir once. Season with salt. Serve immediately.', why_note: 'Salt draws water from proteins by osmosis. Added early, it makes the eggs watery. Added at the end, it seasons without affecting texture. The crème fraîche adds richness and stops the cooking instantly by cooling the mass. Residual heat finishes them perfectly.' },
  ],
  categories: { cuisines: ['australian'], types: ['eggs'] },
  whole_food_verified: true,
};

// ────────────────────────────────────────────────────────────────────────────
//  Kept from v0 seed (not in hone.html)
// ────────────────────────────────────────────────────────────────────────────

const WEEKDAY_BOLOGNESE: Recipe = {
  id: 'weekday-bolognese',
  title: 'The Weekday Bolognese',
  tagline: 'A proper ragù without the all-day Sunday commitment',
  description: 'Short version of the real thing. The soffritto and the milk-first step do the work 3 hours of simmering usually gets credit for.',
  base_servings: 4,
  time_min: 75,
  difficulty: 'Intermediate',
  tags: ['italian', 'pasta', 'beef', 'comfort'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Andy Cooks',
    video_url: 'https://www.youtube.com/@andy_cooks',
    notes: "In the spirit of Andy's technique-first approach: soffritto built properly, milk before wine, patience with the brown bits.",
  },
  emoji: '🍝',
  hero_fallback: ['#8B3A2F', '#C44536', '#D4A574'],
  ingredients: [
    { id: 'oil', name: 'Olive oil', amount: 2, unit: 'tbsp', scales: 'linear' },
    { id: 'onion', name: 'Onion, fine dice', amount: 1, unit: 'medium', scales: 'linear',
      substitutions: [
        { ingredient: 'Shallots, finely diced', changes: 'Milder and sweeter than brown onion. Use 3–4 shallots per 1 medium onion. A more refined soffritto base.', quality: 'great_swap', quantity_note: 'use 3–4 shallots per 1 medium onion' },
        { ingredient: 'Leek (white and pale green part), finely sliced', changes: 'Milder and sweeter than onion. Sweats down beautifully in the soffritto. Wash well — leeks trap grit.', quality: 'good_swap' },
      ],
    },
    { id: 'carrot', name: 'Carrot, fine dice', amount: 1, unit: 'medium', scales: 'linear',
      substitutions: [
        { ingredient: 'Parsnip, finely diced', changes: 'Sweeter and earthier than carrot. Works beautifully in a Northern Italian ragù — slightly different sweetness that blends well.', quality: 'great_swap' },
      ],
    },
    { id: 'celery', name: 'Celery stalk, fine dice', amount: 1, unit: 'stalk', scales: 'linear',
      substitutions: [
        { ingredient: 'Fennel bulb, finely diced', changes: 'Anise-like and slightly sweet. Works very well in Italian ragù — fennel and pork mince are a natural pairing.', quality: 'great_swap' },
        { ingredient: 'Celeriac (celery root), finely diced', changes: 'Concentrated celery flavour. Use a slightly smaller amount — celeriac is more assertive than celery stalk.', quality: 'good_swap', quantity_note: 'use slightly less — celeriac is more assertive than celery stalk' },
      ],
    },
    { id: 'garlic', name: 'Garlic cloves, minced', amount: 3, unit: 'cloves', scales: 'fixed', cap: 6,
      substitutions: [
        { ingredient: 'Garlic paste (1 tsp per clove)', changes: 'Consistent and convenient. Works very well in a long-cooked ragù where the raw edge will be cooked out regardless.', quality: 'good_swap', quantity_note: 'use 1 tsp garlic paste per clove' },
      ],
    },
    {
      id: 'beef', name: 'Beef mince (80/20)', amount: 400, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Veal mince', changes: 'Lighter, more delicate flavour — very traditional in Northern Italian ragù. The ragù will be paler and more refined.', quality: 'great_swap' },
        { ingredient: 'All beef mince (80/20), no pork', changes: 'Slightly less complex without the pork fat. Increase the total amount to compensate for the missing pork.', quality: 'compromise', quantity_note: 'use 600g beef total to replace both minces' },
      ],
    },
    {
      id: 'pork', name: 'Pork mince', amount: 200, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Italian sausage mince (casings removed)', changes: 'Already seasoned with fennel and garlic — adds complexity and richness. Reduce added salt elsewhere.', quality: 'great_swap' },
      ],
    },
    { id: 'milk', name: 'Whole milk', amount: 200, unit: 'ml', scales: 'linear',
      substitutions: [
        { ingredient: 'Full-fat oat milk or coconut milk', changes: 'Dairy-free. Oat milk is the closest in behaviour; coconut milk adds a subtle sweetness. The milk-first technique still tenderises. Same amount.', quality: 'good_swap' },
      ],
    },
    {
      id: 'wine', name: 'Dry red wine', amount: 200, unit: 'ml', scales: 'linear',
      substitutions: [
        { ingredient: 'Dry white wine', changes: 'Lighter character and paler sauce. A white-wine Bolognese is a real tradition in Emilia-Romagna — not a compromise, just different.', quality: 'good_swap' },
        { ingredient: 'Extra beef stock + red wine vinegar', changes: 'No alcohol option. Add the vinegar at the end — it won\'t replicate the tannins but adds the needed acidity.', quality: 'compromise', quantity_note: 'use 200ml extra stock + 1 tbsp red wine vinegar' },
      ],
    },
    { id: 'tomatoes', name: 'Tinned whole tomatoes', amount: 400, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Tinned chopped tomatoes', changes: 'Already chopped — identical result after 45 minutes of simmering. Slightly more watery initially.', quality: 'perfect_swap' },
        { ingredient: 'Tomato passata', changes: 'Already smooth — skip the breaking-down step. Use 350ml per 400g tin. Slightly sweeter and thicker.', quality: 'great_swap', quantity_note: 'use 350ml passata per 400g tin' },
        { ingredient: 'Fresh ripe tomatoes, roughly chopped (4 large)', changes: 'Better in peak tomato season. Blanch and peel for a smoother result. Extend simmering by 10–15 minutes — fresh tomatoes have more water.', quality: 'great_swap', quantity_note: 'extend simmering by 10–15 minutes — fresh tomatoes have more liquid' },
      ],
    },
    { id: 'stock', name: 'Beef stock', amount: 300, unit: 'ml', scales: 'linear',
      substitutions: [
        { ingredient: 'Chicken stock', changes: 'Lighter colour and less robustly beefy. Still makes excellent bolognese — the pork mince and long simmer carry the body.', quality: 'good_swap' },
      ],
    },
    { id: 'bay', name: 'Bay leaves', amount: 2, unit: 'leaves', scales: 'fixed', cap: 3 },
    {
      id: 'pasta', name: 'Pappardelle or tagliatelle', amount: 400, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Rigatoni', changes: 'The sauce gets inside the tubes — many prefer this over flat pasta. Cook to package time exactly, then marry in the pan.', quality: 'great_swap' },
        { ingredient: 'Spaghetti or linguine', changes: 'Thinner strands hold less sauce per bite but work fine. Classic trattoria substitute.', quality: 'good_swap' },
      ],
    },
    { id: 'parm', name: 'Parmigiano, grated', amount: 60, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Grana Padano, grated', changes: 'Less complex and slightly milder than Parmigiano Reggiano. Melts and emulsifies identically. Far cheaper — a professional kitchen cost-saving standard.', quality: 'great_swap' },
        { ingredient: 'Pecorino Romano, grated', changes: 'Sharper, saltier, and more tangy. Use less — 40g per 60g Parmigiano. Changes the character slightly but classically Italian.', quality: 'good_swap', quantity_note: 'use 40g Pecorino per 60g Parmigiano — it\'s much saltier' },
      ],
    },
    { id: 'salt', name: 'Salt & black pepper', amount: 1, unit: 'to taste', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Build the soffritto', content: 'Warm oil over medium heat. Add onion, carrot, celery with a pinch of salt. Sweat gently for 12–15 min until soft and translucent — no colour.', stage_note: 'Vegetables glossy and soft, no browning on the edges. You should smell sweetness, not Maillard.', why_note: 'This quiet step is roughly 30% of the final flavour. Rushing it with higher heat browns the outside but leaves the inside raw-tasting.', timer_seconds: 900, ingredient_refs: ['oil', 'onion', 'carrot', 'celery'] },
    { id: 's2', title: 'Brown the mince', content: "Push soffritto to the side. Crank heat high. Add both minces in a single layer. Don't stir. Let them crust, then break up and brown.", stage_note: 'Deep mahogany brown in patches. Fond visible on the pan bottom. Audible crackle.', why_note: 'The dark fond — the stuck bits — is the foundation of the sauce. Stirring too early steams the meat and nothing sticks.', timer_seconds: 600, ingredient_refs: ['beef', 'pork'] },
    { id: 's3', title: 'Milk first — this matters', content: 'Pour in milk. Scrape up fond from the pan bottom. Simmer until nearly evaporated.', stage_note: 'Milk reduced to a thin glaze. No pooling liquid.', why_note: "Milk tenderises the meat proteins BEFORE the acid of wine and tomato tightens them. Adding it later doesn't undo what the acid already did — it has to go first.", timer_seconds: 420, ingredient_refs: ['milk'] },
    { id: 's4', title: 'Wine, then tomatoes & stock', content: 'Add wine, reduce by half. Then tomatoes (crushed by hand), stock, bay, and garlic. Bring to a murmur.', stage_note: 'Gently blipping, not boiling. One bubble every couple of seconds.', timer_seconds: 120, ingredient_refs: ['wine', 'tomatoes', 'stock', 'bay', 'garlic'] },
    { id: 's5', title: 'The long simmer', content: 'Partially cover. Simmer 45 min minimum — longer if you have it. Stir every 10. Splash of water if it tightens too much.', stage_note: 'Thick, glossy, fat separating slightly at the edges. Taste aggressively for salt.', lookahead: 'In the last 15 min, put a big pot of heavily-salted water on for the pasta.', timer_seconds: 2700 },
    { id: 's6', title: 'Marry with pasta', content: 'Cook pasta one minute shy of al dente. Transfer directly into the ragù with a ladle of pasta water. Toss over medium heat for 60 seconds. Finish with parmigiano off-heat.', stage_note: 'Each strand coated. No sauce pooling at the bottom of the bowl. Silky, not soupy.', why_note: "Starchy pasta water emulsifies with the fat in the sauce — that's what turns a ragù from \"meat in tomato\" into something that clings to the pasta.", timer_seconds: 60, ingredient_refs: ['pasta', 'parm'] },
  ],
  leftover_mode: {
    extra_servings: 2,
    note: 'Packs for two lunches the next day. Ragù actually improves overnight — make more, not less.',
  },
  categories: { cuisines: ['italian'], types: ['beef', 'pasta'] },
  whole_food_verified: true,
};

// ────────────────────────────────────────────────────────────────────────────
//  5 Originals — Hone Kitchen
//  Authored in-house in the chef-guide voice. Sourced as "Hone Kitchen"
//  so the Zod refine check passes honestly — no chef is claimed who didn't
//  actually author these.
// ────────────────────────────────────────────────────────────────────────────

const AGLIO_E_OLIO: Recipe = {
  id: 'aglio-e-olio',
  title: 'Spaghetti Aglio e Olio',
  tagline: 'Four ingredients, one technique, no cutting corners',
  description: 'The whole dish lives or dies on the garlic — too pale and it tastes of nothing, too dark and the whole pan is bitter. Medium-low heat and your eyes do the work.',
  base_servings: 2,
  time_min: 15,
  difficulty: 'Easy',
  tags: ['pasta', 'italian', 'vegetarian', 'quick', 'pantry'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Hone Kitchen',
    notes: 'Original in-house recipe in the style of a Roman trattoria late-night plate. No chef attribution — this is our own.',
  },
  emoji: '🍝',
  hero_fallback: fallback('#D4900A'),
  ingredients: [
    { id: 'i1', name: 'Spaghetti (bronze-die if you can find it)', amount: 180, unit: 'g', scales: 'linear', prep: 'Bronze die gives a rougher surface — sauce clings to it',
      substitutions: [
        { ingredient: 'Linguine', changes: 'Slightly flatter strand — coats well in the oil. A classic alternative for aglio e olio. Same technique.', quality: 'great_swap' },
        { ingredient: 'Bucatini', changes: 'Hollow spaghetti-like strands that hold oil inside the tube. Takes 1–2 minutes longer to cook. Excellent choice.', quality: 'great_swap' },
      ],
    },
    { id: 'i2', name: 'Garlic cloves, very thinly sliced', amount: 6, unit: '', scales: 'linear', prep: 'Sliced, not crushed — thin discs cook evenly and look like confetti' },
    { id: 'i3', name: 'Extra virgin olive oil', amount: 80, unit: 'ml', scales: 'linear', prep: 'Use something you like the taste of raw — this is the whole sauce' },
    { id: 'i4', name: 'Dried chilli flakes', amount: 0.5, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Fresh long red chilli, thinly sliced', changes: 'Brighter, less smoky heat than dried flakes. Add to the garlic in the oil at the same time. Use ½ a chilli per 0.5 tsp flakes.', quality: 'great_swap' },
        { ingredient: 'Cayenne pepper', changes: 'Hotter and more one-dimensional than chilli flakes. Use significantly less.', quality: 'good_swap', quantity_note: 'use ⅛ tsp cayenne per ½ tsp chilli flakes' },
      ],
    },
    { id: 'i5', name: 'Flat-leaf parsley, finely chopped', amount: 15, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Fresh basil, torn', changes: 'Sweeter and more anise-like. Adds a completely different aromatic character — still Italian, just different. Add off heat like the parsley.', quality: 'good_swap' },
      ],
    },
    { id: 'i6', name: 'Salt for pasta water', amount: 1, unit: 'tbsp', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Salt the water properly', content: 'Bring a large pot of water to a rolling boil. Salt it until it tastes like the sea — roughly 1 tbsp per 2L. Drop the spaghetti.', why_note: 'There are only four flavours in this dish. Under-salted pasta water is the single most common way home cooks flatten it. The salt seasons the pasta from within as it cooks — you cannot catch up with finishing salt later.' },
    { id: 's2', title: 'Cold pan, cold oil, cold garlic', content: 'While the pasta cooks, pour oil into a wide cold pan. Add the sliced garlic and chilli flakes. Set on medium-low heat.', why_note: 'Starting cold means the garlic infuses the oil gradually rather than shocking brown on contact with hot oil. This is how you get the pale-golden, sweet garlic that makes aglio e olio and not the acrid burnt version.' },
    { id: 's3', title: 'Watch — this is the whole game', content: 'Let the garlic go from raw white to pale gold. Swirl the pan gently. The moment any slice shows amber edges, pull the pan off the heat. This takes 4–6 minutes and you do not leave it.', timer_seconds: 300, why_note: "Garlic carries over dramatically on residual pan heat — by the time you see dark gold in the pan, it will be bitter brown on the plate. Pull it early and let carry-over finish. If you look away and any slice goes truly brown, start again — one bitter slice poisons the whole dish." },
    { id: 's4', title: 'Reserve water, drain shy', content: 'Scoop out a mugful of pasta water. Drain the spaghetti about 90 seconds before the package time — it should still have a firm bite.', why_note: "The pasta will finish cooking in the oil and absorb water from that reserve. Fully cooked pasta at this point ends up mushy by the time it's coated." },
    { id: 's5', title: 'Emulsify in the pan', content: 'Return the garlic pan to medium heat. Add drained pasta and a good splash of pasta water. Toss vigorously for 60–90 seconds. The oil and water should turn cloudy and coat every strand.', timer_seconds: 90, why_note: "Starchy pasta water is what lets oil and water agree to be one sauce. Without it, the oil pools at the bottom and the pasta stays bare. Keep tossing — agitation is what builds the emulsion." },
    { id: 's6', title: 'Parsley off heat, serve immediately', content: 'Kill the heat. Toss through parsley and a final glug of olive oil. Plate at once — this dish seizes as it cools.', why_note: 'Parsley off heat keeps it green and fresh-tasting. The final raw olive oil adds fragrance that a cooked oil loses. Eat while the sauce is still glossy; a minute later it will be sticky.' },
  ],
  categories: { cuisines: ['italian'], types: ['pasta', 'vegetarian'] },
  whole_food_verified: true,
};

const MUJADARA: Recipe = {
  id: 'mujadara',
  title: 'Mujadara',
  tagline: 'Lentils, rice, and deeply browned onions — the humblest Levantine classic',
  description: 'A poor-kitchen dish that tastes of patience. The onions are not garnish; they are the soul of the plate. Undercook them and you have grain with a sad frill on top.',
  base_servings: 4,
  time_min: 70,
  difficulty: 'Easy',
  tags: ['levantine', 'vegetarian', 'vegan', 'rice', 'pantry', 'batch-cook'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Hone Kitchen',
    notes: 'Original in-house recipe built on the standard Lebanese / Palestinian ratios. No chef attribution — our own.',
  },
  emoji: '🍚',
  hero_fallback: fallback('#6B4A14'),
  ingredients: [
    { id: 'i1', name: 'Green or brown lentils', amount: 200, unit: 'g', scales: 'linear', prep: 'Not red lentils — those fall apart. Green or brown hold shape',
      substitutions: [
        { ingredient: 'Beluga (black) lentils', changes: 'Smaller and firmer than green lentils — hold their shape even better. Slightly earthier flavour. Same cooking time.', quality: 'great_swap' },
        { ingredient: 'Puy lentils (French green lentils)', changes: 'Stay very firm after cooking. Slightly peppery flavour. Excellent choice — some consider them superior.', quality: 'great_swap', hard_to_find: false },
      ],
    },
    { id: 'i2', name: 'Long-grain white rice (basmati)', amount: 200, unit: 'g', scales: 'linear', prep: 'Rinsed until the water runs clear, then drained',
      substitutions: [
        { ingredient: 'Egyptian (short-grain) white rice', changes: 'Stickier and slightly less fluffy. More traditional in some Palestinian versions of mujadara.', quality: 'great_swap' },
        { ingredient: 'Brown rice', changes: 'Nuttier and chewier. Extend cooking time to 30–35 minutes. Add an extra 50ml of lentil water.', quality: 'good_swap', quantity_note: 'extend cooking to 30–35 minutes, add 50ml more water' },
      ],
    },
    { id: 'i3', name: 'Large yellow onions, sliced thin', amount: 3, unit: 'large', scales: 'linear', prep: 'Thin half-moons — uniform thickness is what lets them brown evenly',
      substitutions: [
        { ingredient: 'Brown onions', changes: 'Same thing as yellow onions in Australia — direct swap. Slight variation in sweetness depending on the individual onion, but negligible.', quality: 'perfect_swap' },
        { ingredient: 'Red onions', changes: 'Slightly sweeter and milder when caramelised, and the deep purple turns a beautiful mahogany. An excellent variation.', quality: 'great_swap' },
      ],
    },
    { id: 'i4', name: 'Olive oil', amount: 100, unit: 'ml', scales: 'linear', prep: 'Generous — some is for frying the onions, some drizzles the final plate',
      substitutions: [
        { ingredient: 'A mix of olive oil and neutral oil (50/50)', changes: 'Raises the smoke point slightly for frying the onions. Less expensive than all olive oil. The final drizzle should still be extra virgin.', quality: 'good_swap' },
      ],
    },
    { id: 'i5', name: 'Ground cumin', amount: 1, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Cumin seeds, toasted and ground', changes: 'More aromatic than pre-ground. Toast 60 seconds in a dry pan until fragrant, then grind in a mortar. A minor but noticeable upgrade.', quality: 'great_swap' },
        { ingredient: 'Caraway seeds, ground', changes: 'Earthy and slightly anise-like. Used in some Palestinian mujadara variants — a traditional alternative.', quality: 'good_swap' },
      ],
    },
    { id: 'i6', name: 'Ground allspice', amount: 0.5, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Ground cinnamon + pinch of ground cloves', changes: 'Approximates allspice\'s warm, complex character. Use ¼ tsp cinnamon and a tiny pinch of ground cloves.', quality: 'compromise', quantity_note: '¼ tsp cinnamon + tiny pinch of ground cloves' },
      ],
    },
    { id: 'i7', name: 'Salt', amount: 1.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i8', name: 'Black pepper', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i9', name: 'Plain yoghurt, to serve', amount: 200, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Coconut yoghurt', changes: 'Vegan option. Slightly sweet with a faint coconut note — surprisingly good against the spiced lentils.', quality: 'good_swap' },
        { ingredient: 'Labneh (strained yoghurt)', changes: 'Thicker, tangier, and more intensely flavoured than plain yoghurt. A genuine upgrade — the acidity cuts through the richness of the fried onion oil.', quality: 'great_swap' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Start the lentils', content: 'Rinse lentils, cover with 1L of cold water. Bring to a boil, then simmer uncovered 20 minutes until they are tender but still hold shape. Drain and reserve 500ml of the cooking liquid.', timer_seconds: 1200, why_note: 'Cooking the lentils alone first lets you control their texture — in Mujadara they should be soft but distinct, not mushy. The lentil water is full of flavour; you are about to cook rice in it.', ingredient_refs: ['i1'] },
    { id: 's2', title: 'Brown the onions properly — this is the dish', content: 'While lentils cook, heat 70ml of olive oil in a wide pan over medium heat. Add all the onions. Cook 25–30 minutes, stirring every 3–4 minutes, until they are deep mahogany and crispy at the edges. They will collapse to a quarter of their volume.', timer_seconds: 1800, why_note: 'Mujadara is a Maillard dish masquerading as a rice-and-lentil dish. Pale golden onions are the single biggest mistake home cooks make — you are aiming for a colour most people would call "about to burn". Medium heat and 30 real minutes is the right answer. Half the onions get stirred into the pot; the other half crown the plate, and those are the ones that have to be crunchy.', ingredient_refs: ['i3', 'i4'] },
    { id: 's3', title: 'Split the onions', content: 'When the onions are deep brown and crisp, scoop out roughly half onto a paper towel and season immediately with salt. Leave the other half in the pan — these will flavour the grains.', why_note: 'The reserved crispy onions keep their crunch because they cool on paper away from the oil. The pan onions will go into the pot and melt into the rice — that is what you want there, not crispness.', ingredient_refs: ['i3'] },
    { id: 's4', title: 'Toast rice with spices', content: 'Add the drained rice, cumin, allspice, salt, and pepper to the onion pan. Stir 1 minute so every grain is coated and glossy.', timer_seconds: 60, why_note: 'Toasting the rice in the spiced oil coats each grain in a flavoured fat layer, which is what keeps them separate and fragrant after steaming. Adding spices to the water instead gives you a muddy, blander pot.', ingredient_refs: ['i2', 'i5', 'i6', 'i7', 'i8'] },
    { id: 's5', title: 'Combine and steam together', content: 'Add the drained lentils. Pour in 400ml of the reserved lentil water — it should sit about 1cm above the grains. Bring to a boil, then reduce to lowest heat, lid on, and cook undisturbed for 18 minutes.', timer_seconds: 1080, why_note: "Absorption method — no stirring. Lifting the lid or stirring breaks the steam seal and the top layer stays hard. If after 18 minutes the grains still feel firm, splash in 50ml more water and give it 5 more off the heat with the lid on.", ingredient_refs: ['i1', 'i2'] },
    { id: 's6', title: 'Rest, fluff, plate', content: 'Kill the heat. Leave the pot covered for 10 minutes. Then fluff with a fork, tip onto a platter, and crown with the reserved crispy onions. Serve with cold yoghurt on the side.', timer_seconds: 600, why_note: 'The 10-minute rest lets the steam finish the rice evenly and firms each grain so fluffing does not smash them. Cold yoghurt against the warm spiced grains is the whole point of the pairing — sour, fatty, cooling — do not skip it.', ingredient_refs: ['i9'] },
  ],
  leftover_mode: {
    extra_servings: 2,
    note: 'Keeps three days in the fridge and actually improves. Reheat with a splash of water, lid on.',
  },
  categories: { cuisines: ['levantine'], types: ['vegetarian'] },
  whole_food_verified: true,
};

const SHEET_PAN_HARISSA_CHICKEN: Recipe = {
  id: 'sheet-pan-harissa-chicken',
  title: 'Sheet-Pan Harissa Chicken with Chickpeas',
  tagline: 'One tray, 45 minutes, dinner done',
  description: 'Weeknight survival food that does not taste like it. The harissa browns on the skin and the chickpeas soak up what drips off — there is no waste heat on this tray.',
  base_servings: 4,
  time_min: 55,
  difficulty: 'Easy',
  tags: ['chicken', 'north-african', 'sheet-pan', 'weeknight', 'one-pan'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Hone Kitchen',
    notes: 'Original in-house recipe. The rose harissa / honey combination leans Tunisian; the approach is modern sheet-pan. No chef attribution.',
  },
  emoji: '🌶️',
  hero_fallback: fallback('#C4422A'),
  ingredients: [
    {
      id: 'i1', name: 'Chicken thighs, bone-in and skin-on', amount: 800, unit: 'g', scales: 'linear', prep: 'Thighs — breasts dry out before the chickpeas colour',
      substitutions: [
        { ingredient: 'Boneless, skin-on chicken thighs', changes: 'Slightly faster cooking and easier to eat. Skin still crisps well. Check at 25 minutes.', quality: 'great_swap' },
        { ingredient: 'Chicken legs (drumstick + thigh joined)', changes: 'More bone = more flavour, but harder to eat. Add 5–10 minutes to the cooking time.', quality: 'good_swap' },
        { ingredient: 'Bone-in chicken breast', changes: 'Leaner — watch carefully after 25 minutes or it dries out. The chickpeas will be ready before the breast is forgiving.', quality: 'compromise' },
      ],
    },
    {
      id: 'i2', name: 'Tinned chickpeas, drained', amount: 480, unit: 'g', scales: 'linear', prep: '2 × 240g tins, drained and patted dry',
      substitutions: [
        { ingredient: 'Dried chickpeas, soaked and cooked', changes: 'Better texture and flavour if you have time. Soak overnight, boil 45–60 minutes until tender, then drain and use the same way.', quality: 'perfect_swap' },
        { ingredient: 'Butter beans (cannellini)', changes: 'Larger and creamier than chickpeas. Absorbs the harissa beautifully and becomes even more silky. An excellent upgrade.', quality: 'great_swap' },
        { ingredient: 'Cannellini beans', changes: 'Softer and smaller than chickpeas. Works well — different texture but same concept.', quality: 'great_swap' },
      ],
    },
    { id: 'i3', name: 'Red onion, cut in thick wedges', amount: 1, unit: 'large', scales: 'linear',
      substitutions: [
        { ingredient: 'Brown onion, cut in thick wedges', changes: 'Less sweet and purple than red onion but caramelises just as well in the oven at 220°C. Minor visual difference — still very good.', quality: 'great_swap' },
        { ingredient: 'Shallots, halved', changes: 'Smaller and sweeter than red onion. Check at 20 minutes — they soften faster than a full onion. More elegant presentation.', quality: 'good_swap', quantity_note: 'use 4–6 shallots, halved; check at 20 minutes' },
        { ingredient: 'Fennel bulb, cut in thick wedges', changes: 'Completely different flavour — sweet and anise-like. Roasts beautifully at 220°C and pairs brilliantly with harissa. Changes the dish in a delicious way.', quality: 'good_swap' },
      ],
    },
    {
      id: 'i4', name: 'Rose harissa paste', amount: 3, unit: 'tbsp', scales: 'fixed', prep: "Rose harissa has floral notes plain harissa doesn't — worth tracking down. Otherwise use plain harissa + a pinch of dried rose petals",
      substitutions: [
        { ingredient: 'Plain harissa paste', changes: 'Bolder and spicier without the floral rose note. The result is more straightforward but equally good. Start with less and taste.', quality: 'good_swap', quantity_note: 'start with 2 tbsp — plain harissa is often hotter' },
        { ingredient: 'Harissa powder + olive oil', changes: 'Mix into a paste. Not as complex or fragrant as ready-made harissa but works when that\'s all you have.', quality: 'compromise', quantity_note: '2 tbsp harissa powder + 2 tbsp olive oil' },
      ],
    },
    { id: 'i5', name: 'Honey', amount: 1, unit: 'tbsp', scales: 'fixed', prep: 'Balances the harissa heat — not enough to taste sweet, just to round it',
      substitutions: [
        { ingredient: 'Maple syrup', changes: 'Slightly more complex than honey, less floral. Works identically in the marinade. Same amount.', quality: 'great_swap' },
        { ingredient: 'Date syrup (dibs al-tamr)', changes: 'Deeply complex sweetener used across the Levant and North Africa. Rich and slightly toffee-like. A more culturally appropriate swap — genuinely excellent.', quality: 'great_swap', hard_to_find: true, local_alternative: 'Middle Eastern grocery stores and some Harris Farm Markets.' },
        { ingredient: 'Brown sugar', changes: 'Pure sweetness without honey\'s floral notes. Dissolve in the olive oil before adding to the marinade so it disperses evenly.', quality: 'good_swap' },
      ],
    },
    { id: 'i6', name: 'Olive oil', amount: 3, unit: 'tbsp', scales: 'fixed' },
    { id: 'i7', name: 'Lemon (zest and juice)', amount: 1, unit: '', scales: 'fixed' },
    { id: 'i8', name: 'Ground cumin', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i9', name: 'Garlic cloves, crushed', amount: 3, unit: '', scales: 'fixed' },
    { id: 'i10', name: 'Salt', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i11', name: 'Flat-leaf parsley, chopped', amount: 15, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Fresh coriander, chopped', changes: 'Citrusy and aromatic — works very well with harissa\'s North African roots. If you like coriander, it\'s actually the more traditional pairing here.', quality: 'great_swap' },
        { ingredient: 'Fresh mint, chopped', changes: 'Cooling and aromatic. Balances the harissa heat more than parsley does. Use half the quantity — mint is more assertive.', quality: 'good_swap', quantity_note: 'use 7–8g fresh mint per 15g parsley' },
      ],
    },
    { id: 'i12', name: 'Plain yoghurt, to serve', amount: 200, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Labneh (strained yoghurt)', changes: 'Thicker, tangier, and richer than plain yoghurt. The concentrated flavour cuts through the harissa more assertively. An upgrade if you have it.', quality: 'great_swap' },
        { ingredient: 'Coconut yoghurt', changes: 'Vegan and dairy-free. Slightly sweet and less tangy — provides the cooling contrast needed against the harissa but with a different flavour profile.', quality: 'good_swap' },
        { ingredient: 'Tahini sauce', changes: 'Blend 4 tbsp tahini with 2 tbsp lemon juice, 1 minced garlic clove, and water to thin. A rich, nutty alternative that pairs beautifully with harissa and chickpeas.', quality: 'great_swap' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Oven on, tray going in empty', content: 'Preheat oven to 220°C (fan 200°C) with a large rimmed sheet tray inside. Let it heat for 10 minutes.', timer_seconds: 600, why_note: "A cold tray fights you — the chicken sits and steams while the tray catches up. A preheated tray sears the skin the moment the chicken lands, which is the entire reason for doing this in a single pan." },
    { id: 's2', title: 'Mix the marinade', content: 'In a large bowl, whisk harissa, honey, 2 tbsp olive oil, lemon zest, cumin, garlic, and salt into a thick paste. Add the chicken thighs. Turn them over until every piece is coated — get it under the skin where you can.', why_note: 'Honey and fat cling to skin. Lemon zest has the floral oils you want — the juice comes at the end where it will not burn. Getting harissa under the skin is where the real colour develops — the top bakes into a crust, the underside braises.', ingredient_refs: ['i4', 'i5', 'i6', 'i7', 'i8', 'i9', 'i10', 'i1'] },
    { id: 's3', title: 'Toss chickpeas and onions', content: 'In a second bowl, toss chickpeas and onion wedges with the remaining 1 tbsp olive oil and a pinch of salt.', why_note: 'Keeping the chickpeas out of the harissa keeps them crispy — if they get coated in the paste they steam instead of crisp. The onions go in now to soften and char at the edges over the same 35 minutes.', ingredient_refs: ['i2', 'i3', 'i6'] },
    { id: 's4', title: 'Everything onto the hot tray', content: 'Pull the hot tray out. Scatter chickpeas and onions across it. Nestle the chicken thighs skin-side up among them, leaving space between pieces. It should sizzle on contact.', why_note: "Crowding means steam. You want every piece of chicken to have bare tray on all sides so the heat circulates. If it does not sizzle when it hits the tray, your oven is not hot enough — give it 5 more minutes before committing.", ingredient_refs: ['i1', 'i2', 'i3'] },
    { id: 's5', title: 'Roast and let the tray do the work', content: 'Roast 30–35 minutes, unstirred, until the chicken skin is deeply blackened at the edges, the chickpeas are crispy, and the thigh juices run clear when pierced. Internal temperature should be 75°C.', timer_seconds: 2100, why_note: "The char is the point — this is a sheet-pan dinner, not a gentle roast. At 30 minutes the skin should look almost too dark. If the chickpeas are still pale, give it another 5. Stirring midway ruins the crust development you are waiting on.", ingredient_refs: ['i1'] },
    { id: 's6', title: 'Lemon, parsley, yoghurt', content: 'Squeeze the juice of the zested lemon over the tray. Scatter parsley. Serve straight from the tray with cold yoghurt on the side.', why_note: 'Raw lemon juice at the end punches through the fat and harissa — the acid has to hit raw or it goes flat. Yoghurt is not optional garnish; it is the cooling element the harissa heat needs.', ingredient_refs: ['i7', 'i11', 'i12'] },
  ],
  leftover_mode: {
    extra_servings: 2,
    note: 'Pack in a container with the chickpeas — the chicken reheats in the oven (not microwave, the skin goes sad). Works cold too.',
  },
  categories: { cuisines: ['levantine'], types: ['chicken'] },
  whole_food_verified: true,
};

const EGG_FRIED_RICE: Recipe = {
  id: 'egg-fried-rice',
  title: 'Proper Egg Fried Rice',
  tagline: 'Day-old rice, screaming wok, everything else is details',
  description: 'Fresh rice is the number one reason home fried rice comes out stodgy. The rest is timing and heat — no fancy ingredients hide for you here.',
  base_servings: 2,
  time_min: 12,
  difficulty: 'Easy',
  tags: ['eggs', 'rice', 'asian', 'quick', 'pantry', 'weeknight'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Hone Kitchen',
    notes: 'Original in-house recipe, Cantonese style (egg + spring onion base, no carrots and peas clutter).',
  },
  emoji: '🍳',
  hero_fallback: fallback('#D4A93A'),
  ingredients: [
    { id: 'i1', name: 'Cooked long-grain rice, cold from the fridge', amount: 400, unit: 'g', scales: 'linear', prep: 'Day-old rice, broken up with your hands until no clumps remain. Fresh-cooked rice makes mush — non-negotiable',
      substitutions: [
        { ingredient: 'Fresh-cooked rice, spread on a tray and chilled 20 minutes in the freezer', changes: 'If you have no day-old rice — cook it, spread it thin on a tray, and fast-chill in the freezer for 20 minutes until the grains are dry and separate. Not quite as good as overnight rice but far better than warm fresh rice.', quality: 'good_swap' },
        { ingredient: 'Cooked jasmine rice, cold', changes: 'Slightly stickier grain than long-grain. Break up clumps very thoroughly — jasmine rice binds more. Works well.', quality: 'good_swap' },
      ],
    },
    { id: 'i2', name: 'Eggs', amount: 3, unit: '', scales: 'linear', prep: 'Whisked until the white and yolk are completely blended, with a pinch of salt' },
    { id: 'i3', name: 'Spring onions', amount: 4, unit: '', scales: 'linear', prep: 'Whites and greens separated, both thinly sliced',
      substitutions: [
        { ingredient: 'Chives', changes: 'Milder and more delicate than spring onion. Use only as the green garnish at the end — chives don\'t withstand wok heat.', quality: 'good_swap' },
        { ingredient: 'Leek (white part only), thinly sliced', changes: 'Sweeter and milder than spring onion. Soften the white part with the garlic before adding the rice.', quality: 'good_swap' },
      ],
    },
    { id: 'i4', name: 'Neutral oil (sunflower or groundnut)', amount: 3, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Lard or rendered pork fat', changes: 'Traditional for wok cooking across Southeast Asia — adds an unmistakable savoury depth. The wok hei is more pronounced. Same amount.', quality: 'great_swap' },
      ],
    },
    { id: 'i5', name: 'Light soy sauce', amount: 1, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Tamari (gluten-free soy)', changes: 'Gluten-free. Slightly richer flavour. Direct swap.', quality: 'perfect_swap' },
        { ingredient: 'Coconut aminos', changes: 'Sweeter and milder than soy. Slightly less salty. Add a pinch of salt to compensate.', quality: 'good_swap', quantity_note: 'use 1.5 tbsp coconut aminos + pinch of salt' },
      ],
    },
    { id: 'i6', name: 'Toasted sesame oil', amount: 1, unit: 'tsp', scales: 'fixed', prep: "Off heat at the end — do not cook with it, it's for fragrance not frying",
      substitutions: [
        { ingredient: 'Chilli sesame oil', changes: 'Adds both the sesame aroma and mild heat. Use the same amount. Changes the finished rice slightly toward a spiced version — excellent.', quality: 'good_swap' },
        { ingredient: 'Omit entirely', changes: 'The fried rice is complete without it — you lose the fragrance note but the dish works. Better to omit than to substitute a non-sesame oil.', quality: 'compromise' },
      ],
    },
    { id: 'i7', name: 'White pepper, freshly ground', amount: 0.5, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Black pepper, finely ground', changes: 'More assertive, slightly different spice note. Works fine — the flavour is a little more Western but good.', quality: 'good_swap', quantity_note: 'use ¼ tsp black pepper per ½ tsp white' },
      ],
    },
    { id: 'i8', name: 'Salt', amount: 0.5, unit: 'tsp', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Break the rice up before the wok is hot', content: 'Tip the cold rice into a bowl. Wet your fingers and crumble every clump into separate grains. If any block is still stuck together, it will stay stuck together in the wok.', why_note: 'Fried rice is a stir-fry of individual grains. Cold rice clumps because the starch has set — your job is to reverse that mechanically before the heat hits. Every clump is a pocket of stodge waiting to happen.', ingredient_refs: ['i1'] },
    { id: 's2', title: 'Heat the wok until it smokes', content: 'Dry wok on the highest flame. Wait until it is smoking — two to three minutes. Add 2 tbsp of the oil, swirl, pour out, add the remaining 1 tbsp.', timer_seconds: 150, why_note: 'The hot-wok-cold-oil trick seasons the surface so eggs do not weld to it. Most home cooks stop heating too soon — if there is no visible smoke, it is not hot enough. A stir-fry at low heat stews.' },
    { id: 's3', title: 'Scramble the eggs aggressively', content: 'Pour in the eggs. Swirl once and stir with a spatula for 15–20 seconds — they should set in soft, loose curds, not sheets. Stop before they look fully cooked; residual heat finishes them.', timer_seconds: 20, why_note: 'Wok hei on egg means short contact at extreme heat — the outside coagulates while the inside stays tender. Fully cooked eggs at this stage will be rubbery by the time the dish is on the plate.', ingredient_refs: ['i2'] },
    { id: 's4', title: 'Rice goes in, rice gets tossed', content: 'Tip all the rice in on top of the eggs. Press it against the wok for 20 seconds, then toss. Repeat for 2 minutes — each toss breaks up another pocket of rice and exposes new grains to the hot metal.', timer_seconds: 120, why_note: 'Pressing is what gives fried rice its characteristic browned edges and smoky flavour (wok hei) — grains that never touch the metal are just warm rice. If you stir gently the whole time, you will never get there.', ingredient_refs: ['i1'] },
    { id: 's5', title: 'Soy, white pepper, spring onion whites', content: 'Drizzle the soy sauce around the edge of the wok (not the middle — it burns onto the metal and flavours the rice). Add white pepper, salt, and the spring onion whites. Toss 30 seconds.', timer_seconds: 30, why_note: "Soy poured on the hot metal edge caramelises into the rice rather than pooling. White pepper is the pepper in Chinese cooking — black pepper tastes too assertive here. The whites go in now so they soften slightly; the greens are for the end.", ingredient_refs: ['i5', 'i7', 'i8', 'i3'] },
    { id: 's6', title: 'Sesame oil, greens, serve', content: 'Off the heat. Drizzle the sesame oil, scatter the spring onion greens, toss once. Plate immediately while the rice is loose and steaming.', why_note: 'Toasted sesame oil is fragile — real heat destroys the volatile compounds that make it taste of sesame. Always off heat, always at the end. The dish goes claggy as it cools so serve within two minutes.', ingredient_refs: ['i6', 'i3'] },
  ],
  categories: { cuisines: ['chinese'], types: ['eggs'] },
  whole_food_verified: true,
};

const LAMB_SHAWARMA: Recipe = {
  id: 'lamb-shawarma',
  title: 'Home Oven Lamb Shawarma',
  tagline: 'Slow-roast shoulder with a spice bark — no rotisserie required',
  description: 'Real shawarma meat drips off a vertical spit. You will not build one of those in a London kitchen. But shoulder cooked low-and-slow, rested, then blasted high, gets you about 90% of the way — and the leftover fat in the tray is a treasure.',
  base_servings: 6,
  time_min: 300,
  difficulty: 'Intermediate',
  tags: ['levantine', 'middle-eastern', 'beef', 'slow', 'dinner-party', 'batch-cook'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Hone Kitchen',
    notes: 'Original in-house recipe — a home-oven adaptation of the spit-roasted original. No chef attribution.',
  },
  emoji: '🥩',
  hero_url: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&q=80',
  hero_fallback: fallback('#6B3A2A'),
  ingredients: [
    { id: 'i1', name: 'Bone-in lamb shoulder', amount: 2, unit: 'kg', scales: 'fixed', prep: 'Bone-in — the bone keeps it from drying out during the long cook',
      substitutions: [
        { ingredient: 'Bone-in lamb leg', changes: 'Leaner than shoulder — less forgiving in a long cook. Reduce time to 3 hours covered and check frequently. Still excellent but tighter margin for error.', quality: 'good_swap' },
        { ingredient: 'Boneless lamb shoulder (butterflied)', changes: 'No bone to slow heat penetration — reduce covered cook time to 3 hours. Roll and tie tightly so it holds together when shredding.', quality: 'good_swap', quantity_note: 'reduce covered cook time to 3 hours' },
        { ingredient: 'Goat shoulder, bone-in', changes: 'Traditional in some shawarma traditions. Slightly gamier and leaner than lamb. Excellent — treat identically.', quality: 'great_swap' },
      ],
    },
    { id: 'i2', name: 'Yoghurt, full-fat', amount: 200, unit: 'g', scales: 'linear', prep: 'The tenderising base for the marinade',
      substitutions: [
        { ingredient: 'Coconut yoghurt', changes: 'Vegan and dairy-free. The lactic acid still tenderises; the coconut flavour is very subtle after the long cook. A good alternative.', quality: 'good_swap' },
        { ingredient: 'Buttermilk', changes: 'Tangier than yoghurt and more liquid. Works well as a marinade base — the acids tenderise similarly.', quality: 'good_swap' },
      ],
    },
    { id: 'i3', name: 'Garlic cloves', amount: 8, unit: '', scales: 'linear',
      substitutions: [
        { ingredient: 'Garlic paste (1 tsp per clove)', changes: 'Blends smoothly into the yoghurt marinade. Use 8 tsp total. A reliable shortcut for a dish with such strong competing flavours.', quality: 'good_swap', quantity_note: 'use 8 tsp garlic paste total' },
      ],
    },
    { id: 'i4', name: 'Lemon (juice and zest)', amount: 2, unit: '', scales: 'linear',
      substitutions: [
        { ingredient: 'Lime (juice and zest)', changes: 'More floral and slightly more acidic than lemon. Works very well in shawarma marinade — a common variation in Lebanese cooking.', quality: 'great_swap' },
      ],
    },
    { id: 'i5', name: 'Olive oil', amount: 4, unit: 'tbsp', scales: 'fixed' },
    { id: 'i6', name: 'Ground cumin', amount: 2, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Cumin seeds, toasted and ground', changes: 'More aromatic than pre-ground. Toast in a dry pan 60 seconds until fragrant, then grind. A minor but noticeable upgrade.', quality: 'great_swap' },
        { ingredient: 'Caraway seeds, ground', changes: 'Earthy and slightly anise-like. Closer to cumin than most spices — used in North African cooking in similar applications.', quality: 'good_swap' },
      ],
    },
    { id: 'i7', name: 'Ground coriander', amount: 2, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Coriander seeds, toasted and ground', changes: 'More aromatic and complex than pre-ground. Toast 60 seconds, grind in a mortar. Worth the extra minute.', quality: 'great_swap' },
        { ingredient: 'Ground caraway seeds', changes: 'Earthy and slightly anise-flavoured — different to coriander but works in the context of a complex spice blend.', quality: 'compromise' },
      ],
    },
    { id: 'i8', name: 'Smoked paprika', amount: 1, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Sweet paprika', changes: 'Less smoky but still adds colour and mild warmth. The char from the oven blast compensates partially for the missing smoke.', quality: 'good_swap' },
      ],
    },
    { id: 'i9', name: 'Ground cinnamon', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i10', name: 'Ground cardamom', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i11', name: 'Ground cloves', amount: 0.25, unit: 'tsp', scales: 'fixed', prep: 'A tiny amount — cloves take over if you push it' },
    { id: 'i12', name: 'Black pepper, freshly ground', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i13', name: 'Salt', amount: 2, unit: 'tsp', scales: 'fixed' },
    { id: 'i14', name: 'Flatbreads or pitta, to serve', amount: 6, unit: 'large', scales: 'linear',
      substitutions: [
        { ingredient: 'Lebanese flatbread', changes: 'Thinner and more pliable than pitta — wraps beautifully around the pulled shawarma. Traditional in Lebanese shawarma shops.', quality: 'great_swap' },
        { ingredient: 'Lavash', changes: 'Very thin and wide. Roll tightly — better for a compact wrap than a laid-flat serve.', quality: 'good_swap' },
      ],
    },
    { id: 'i15', name: 'Tahini sauce or garlic sauce, to serve', amount: 150, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Toum (Lebanese garlic sauce)', changes: 'Intensely garlicky and creamy — an entirely legitimate and arguably superior choice. Whip garlic, lemon, salt, and oil in a food processor until cloud-like.', quality: 'great_swap' },
        { ingredient: 'Tzatziki', changes: 'Yoghurt-based cooling sauce with cucumber and garlic. Different cultural context but pairs very well with spiced lamb.', quality: 'good_swap' },
      ],
    },
    { id: 'i16', name: 'Pickled turnips or amba, to serve', amount: 100, unit: 'g', scales: 'linear', prep: 'The sharp pickled thing is not optional — it cuts the richness',
      substitutions: [
        { ingredient: 'Pickled cucumbers (gherkins), sliced', changes: 'Less complex than turnips but provides the same acidic cut through the fat. Widely available.', quality: 'good_swap' },
        { ingredient: 'Pickled red cabbage', changes: 'Vinegary and crunchy. Different flavour profile to turnips but serves the same purpose of cutting richness.', quality: 'good_swap' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Build the marinade and rub', content: 'Mix yoghurt, crushed garlic, lemon zest and juice, olive oil, cumin, coriander, smoked paprika, cinnamon, cardamom, cloves, pepper, and salt into a thick paste. Smear it into every crevice of the shoulder — get under any flaps and into score marks if your shoulder is scored. Cover and refrigerate overnight, or at least 6 hours.', why_note: "Yoghurt's lactic acid tenderises lamb shoulder gently without turning it mushy the way a straight lemon marinade would at this length of soak. Overnight means the salt pulls moisture out and then back in, seasoning through the full thickness. A 1-hour marinade seasons only the surface — not enough.", ingredient_refs: ['i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'i8', 'i9', 'i10', 'i11', 'i12', 'i13', 'i1'] },
    { id: 's2', title: 'Out of the fridge an hour before', content: 'Take the shoulder out of the fridge 60 minutes before roasting so it comes to room temperature. Preheat oven to 160°C (fan 140°C) in the last 20 minutes.', timer_seconds: 3600, why_note: 'Cold meat in a hot oven cooks unevenly — the outside crusts while the inside takes an hour longer to come up to temp. Room-temp starts the whole cook at the same baseline and gets you a more consistent interior.', ingredient_refs: ['i1'] },
    { id: 's3', title: 'Low and slow, covered', content: 'Place the shoulder in a deep roasting tray. Pour 200ml water into the tray around (not over) the lamb. Cover the whole tray tightly with a layer of baking paper then a layer of foil — a sealed lid, essentially. Roast for 4 hours. Do not peek.', timer_seconds: 14400, why_note: "This is a braise disguised as a roast. The sealed tray traps steam, which keeps the meat from drying as the collagen converts. The water at the bottom becomes the most flavourful dripping you will ever taste — do not pour it away. Opening the tray breaks the steam seal and you lose an hour of moisture in five seconds.", ingredient_refs: ['i1'] },
    { id: 's4', title: 'Rest, then crank the heat', content: 'Pull the tray. Uncover it. The shoulder should be pullable with a fork and the fat cap golden. Let it rest, uncovered, for 20 minutes while you turn the oven up to its maximum — 240°C if it will go there.', timer_seconds: 1200, why_note: 'The rest lets the juices redistribute and gives you a dry surface to crisp. Putting a wet-from-steam shoulder into a hot oven just steams it more. The oven crank during the rest means no wasted time when you put it back in.', ingredient_refs: ['i1'] },
    { id: 's5', title: 'Blast for crust', content: 'Return the uncovered tray to the oven at maximum heat for 10–15 minutes. Watch it — you want the fat cap and exposed meat to catch colour and crisp at the edges. If it looks like it is about to burn, pull it.', timer_seconds: 600, why_note: "This is your spit-roast simulation — fast, dry heat on a surface that is already dry from resting. The spice bark on the outside browns in a way it cannot under a foil cover. Under-blast and you have a stew; over-blast and it dries in 60 seconds.", ingredient_refs: ['i1'] },
    { id: 's6', title: 'Pull, shred, wrap', content: 'Pull the shoulder out. Shred the meat with two forks directly on the tray so every piece gets rolled in the spiced fat from the bottom. Pile into warm flatbreads with tahini sauce and pickled turnips. Eat standing up if you have to.', why_note: "The shredding-on-the-tray step is what separates this from a dry roast — you are deliberately re-dressing the meat in its own rendered spice-fat before serving. Never drain that fat; it is the best bit. The pickle and tahini make the wrap balanced — fatty meat alone is one-note.", ingredient_refs: ['i14', 'i15', 'i16', 'i1'] },
  ],
  leftover_mode: {
    extra_servings: 3,
    note: 'This is built for leftovers. Shredded shawarma keeps 3 days in the fridge, freezes well, and reheats best in a pan with a splash of water — not the microwave.',
  },
  categories: { cuisines: ['levantine'], types: ['lamb'] },
  whole_food_verified: true,
};


// ────────────────────────────────────────────────────────────────────────────
//  Phase 3 — Malaysian, Indian, Japanese, Thai, Australian
// ────────────────────────────────────────────────────────────────────────────

const NASI_LEMAK: Recipe = {
  id: 'nasi-lemak',
  title: 'Nasi Lemak',
  tagline: 'Malaysian coconut rice with all the fixings',
  description: 'Nasi lemak is Malaysia\'s national dish — a study in contrast. Fragrant coconut rice against spicy sambal, crispy anchovies against cool cucumber, the rich egg against the nutty peanuts. Every component is simple; together they\'re complex.',
  base_servings: 4,
  time_min: 60,
  difficulty: 'Intermediate',
  tags: ['malaysian', 'rice', 'coconut', 'sambal', 'anchovies'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Andy Hearnden (Andy Cooks)',
    video_url: 'https://www.youtube.com/watch?v=N_p7LC3d9To',
    notes: 'Inspired by Andy Cooks\' Malaysian trip series. Sambal recipe follows traditional Malay method.',
  },
  emoji: '🍚',
  hero_fallback: fallback('#4A7C59'),
  categories: { cuisines: ['malaysian'], types: ['chicken'] },
  whole_food_verified: true,
  ingredients: [
    { id: 'i1', name: 'Jasmine rice', amount: 400, unit: 'g', scales: 'linear', prep: 'Rinsed until water runs clear — removes excess starch that would make it gluey',
      substitutions: [
        { ingredient: 'Basmati rice', changes: 'Longer, drier grain. Slightly less fragrant result. Works but not traditional.', quality: 'compromise' },
      ],
    },
    { id: 'i2', name: 'Coconut milk, full-fat', amount: 400, unit: 'ml', scales: 'linear',
      substitutions: [
        { ingredient: 'Light coconut milk', changes: 'Less richness and coconut flavour. Rice will be drier.', quality: 'compromise' },
      ],
    },
    { id: 'i3', name: 'Pandan leaves, knotted', amount: 3, unit: '', scales: 'fixed', prep: 'Tie in a loose knot — exposes more surface area to the steam',
      substitutions: [
        { ingredient: '¼ tsp vanilla extract', changes: 'Loses the grassy, floral pandan note. Different flavour entirely but still aromatic rice.', quality: 'compromise', hard_to_find: true, local_alternative: 'Harris Farm Markets, most Asian grocers. Look in the freezer section if fresh isn\'t available.' },
      ],
    },
    { id: 'i4', name: 'Lemongrass stalks', amount: 2, unit: '', scales: 'fixed', prep: 'Bruised with the back of a knife to release oils',
      substitutions: [
        { ingredient: 'Lemon zest (from 1 lemon) + 1 kaffir lime leaf', changes: 'Gives a citrus note without the distinctive lemongrass flavour. The rice won\'t be as complex. Lemongrass is available at most Coles and Woolworths.', quality: 'compromise' },
      ],
    },
    { id: 'i5', name: 'Salt', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i6', name: 'Dried anchovies (ikan bilis)', amount: 60, unit: 'g', scales: 'linear', prep: 'Rinsed, heads removed if whole',
      substitutions: [
        { ingredient: 'Dried whitebait', changes: 'Similar result, slightly milder flavour. Widely available in Asian grocers.', quality: 'good_swap', hard_to_find: true, local_alternative: 'Asian grocers, Chinatown supermarkets. Avoid tinned anchovies — they\'re too soft and oily.' },
        { ingredient: 'Tinned sardines in oil, drained and patted dry', changes: 'Not traditional — tinned sardines are too moist and oily to fry crisp. Pan-fry in very little oil until golden-edged instead. A compromise when ikan bilis are unavailable.', quality: 'compromise' },
      ],
    },
    { id: 'i7', name: 'Roasted peanuts', amount: 80, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Roasted cashews', changes: 'Creamier and milder than peanuts. Less traditional but works well — a good option for peanut allergies.', quality: 'good_swap' },
        { ingredient: 'Toasted sunflower seeds', changes: 'Nut-free alternative for allergies. Crunchy and nutty. Toast in a dry pan until golden.', quality: 'good_swap' },
      ],
    },
    { id: 'i8', name: 'Eggs', amount: 4, unit: '', scales: 'linear' },
    { id: 'i9', name: 'Lebanese cucumbers', amount: 2, unit: '', scales: 'linear', prep: 'Sliced into rounds',
      substitutions: [
        { ingredient: 'Regular telegraph cucumber (½ large)', changes: 'Larger with more seeds and slightly more water content. Slice thinly — the thicker skin is fine to leave on. Same cooling effect.', quality: 'great_swap' },
        { ingredient: 'Persian cucumbers', changes: 'Virtually identical to Lebanese cucumbers — small, thin-skinned, sweet. Direct swap by weight.', quality: 'perfect_swap' },
      ],
    },
    { id: 'i10', name: 'Vegetable oil, for frying', amount: 250, unit: 'ml', scales: 'fixed' },
    { id: 'i11', name: 'Dried chillies', amount: 20, unit: 'g', scales: 'linear', prep: 'Soaked in boiling water 20 min, drained — for the sambal' },
    { id: 'i12', name: 'Red onion', amount: 1, unit: 'large', scales: 'linear', prep: 'Roughly chopped — for the sambal',
      substitutions: [
        { ingredient: 'Brown onion, roughly chopped', changes: 'Slightly more pungent and less sweet than red onion in the raw paste. Works identically in the sambal — any pungency difference vanishes after 8 minutes of frying.', quality: 'great_swap' },
        { ingredient: 'Shallots (6–8 Thai shallots or 3–4 large), halved', changes: 'Smaller, sweeter, and more traditional in Malaysian cooking than red onion. An authentic upgrade if you can find them.', quality: 'great_swap' },
      ],
    },
    { id: 'i13', name: 'Garlic cloves', amount: 6, unit: '', scales: 'fixed', prep: 'For the sambal',
      substitutions: [
        { ingredient: 'Garlic paste (1 tsp per clove)', changes: 'Blends more smoothly into the sambal paste. Use 2 tbsp garlic paste total. Convenient and consistent.', quality: 'good_swap', quantity_note: 'use 2 tbsp garlic paste total' },
      ],
    },
    { id: 'i14', name: 'Belacan (shrimp paste block)', amount: 20, unit: 'g', scales: 'fixed', prep: 'Toasted wrapped in foil for 5 min — kills the raw edge',
      substitutions: [
        { ingredient: 'Fish sauce, 1 tbsp', changes: 'Adds umami depth but no paste texture. Sambal will be thinner and less complex.', quality: 'compromise', hard_to_find: true, local_alternative: 'Asian grocers. Look for Malay brands like Adabi. Wrap tightly — the smell is intense.' },
      ],
    },
    { id: 'i15', name: 'Palm sugar', amount: 2, unit: 'tbsp', scales: 'fixed', prep: 'Grated — for the sambal',
      substitutions: [
        { ingredient: 'Brown sugar', changes: 'Less complex, missing the slight caramel-toffee note of palm sugar. Works fine. Dark brown sugar is closer in character than light.', quality: 'good_swap', hard_to_find: true, local_alternative: 'Asian grocers. Also called gula melaka.' },
        { ingredient: 'Coconut sugar', changes: 'More mineral and less sweet than palm sugar. Closer in character than brown sugar. Works well.', quality: 'great_swap' },
      ],
    },
    { id: 'i16', name: 'Tamarind paste', amount: 2, unit: 'tbsp', scales: 'fixed', prep: 'For the sambal',
      substitutions: [
        { ingredient: 'Lime juice', changes: 'Less depth and sweetness. Add a tiny pinch of sugar to compensate.', quality: 'compromise' },
      ],
    },
    { id: 'i17', name: 'Salt', amount: 1, unit: 'tsp', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Make the sambal', content: 'Blend soaked dried chillies, red onion, garlic, and toasted belacan until a coarse paste. Heat 3 tbsp oil in a wok on high. Fry paste, stirring constantly, 8–10 minutes until deep red-brown and oil separates — this is the matang stage. Add tamarind, palm sugar, and salt. Cook 2 more minutes. Taste: should be spicy, sweet, sour, and deeply savoury.', timer_seconds: 720, why_note: 'Frying the spice paste until the oil splits (matang) is non-negotiable. Raw shrimp paste is harsh and one-dimensional. The 8–10 minutes of frying drives off moisture and develops the Maillard reactions that give sambal its complexity. Undercooked sambal smells raw and tastes flat.' },
    { id: 's2', title: 'Cook the coconut rice', content: 'Combine rinsed rice, coconut milk, 150ml water, pandan leaves, lemongrass, and salt in a heavy pot. Bring to a boil, stir once, then reduce to the lowest heat possible and cover tightly. Cook 12 minutes. Remove from heat, leave covered 10 more minutes. Fluff with a fork, remove aromatics.', timer_seconds: 1320, why_note: 'The steam-rest is where the rice finishes cooking — residual heat drives moisture evenly through every grain. Lifting the lid during the 10-minute rest releases that steam and leaves the top layer chalky. The pandan and lemongrass perfume the steam, which perfumes the rice.' },
    { id: 's3', title: 'Fry the ikan bilis', content: 'Heat oil to 180°C. Fry the dried anchovies in small batches, 2–3 minutes until golden and crispy. They go from pale to burnt fast — watch them. Drain on paper towel, season lightly with salt while hot.', timer_seconds: 180, stage_note: 'Golden brown, visibly crispy. They should shatter when you bite them.', why_note: 'Hot oil and small batches keep the temperature from dropping. Crowding the oil drops the temp, and the anchovies steam instead of fry — they go soft instead of crispy.' },
    { id: 's4', title: 'Fry the eggs', content: 'Pour most of the ikan bilis oil out, leaving about 2 tbsp. On high heat, fry eggs one at a time, basting with hot oil until the white is crispy at the edges but yolk is still runny. The white should puff up and blister.', timer_seconds: 90, why_note: 'The hot oil basting sets the white from above while the yolk stays soft — no need to flip. The crispy edges are textural contrast against the soft rice. This technique is standard across Southeast Asia for fried eggs.' },
    { id: 's5', title: 'Plate and serve', content: 'Pack rice into a small bowl and invert onto each plate to form a dome. Arrange sambal, ikan bilis, peanuts, cucumber slices, and a fried egg around it. Serve immediately — the ikan bilis go soft fast.', why_note: 'The dome presentation is traditional and practical — it holds the accompaniments separate so each person can mix as they go. The sambal should be stirred into the rice at the table, not pre-mixed.' },
  ],
};

const BEEF_RENDANG: Recipe = {
  id: 'beef-rendang',
  title: 'Beef Rendang',
  tagline: 'The slow-cooked Malaysian dry curry that rewards patience',
  description: 'Rendang is not a curry in the conventional sense — you cook it until almost all the liquid has gone and the spice paste re-fries in the coconut oil it separates out. The result is intensely flavoured, mahogany-dark beef that is simultaneously tender and textured. It takes three hours. It is worth it.',
  base_servings: 6,
  time_min: 210,
  difficulty: 'Involved',
  tags: ['malaysian', 'beef', 'coconut', 'slow', 'batch-cook'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Andy Hearnden (Andy Cooks)',
    video_url: 'https://www.youtube.com/watch?v=K4v2Rg2ZTUY',
    notes: 'Follows the Minangkabau rendang method from West Sumatra — the origin of the dish.',
  },
  emoji: '🍖',
  hero_fallback: fallback('#5C2D0E'),
  categories: { cuisines: ['malaysian'], types: ['beef'] },
  whole_food_verified: true,
  ingredients: [
    { id: 'i1', name: 'Beef chuck or beef shin', amount: 1.2, unit: 'kg', scales: 'linear', prep: 'Cut into 5cm chunks — larger than you think, they shrink',
      substitutions: [
        { ingredient: 'Lamb shoulder, cut in 5cm chunks', changes: 'Richer and slightly gamier. Shorter cook time — starts to fall apart around 2.5 hours. The rendang is delicious — just different.', quality: 'good_swap', quantity_note: 'reduce total cook time to about 2.5 hours' },
        { ingredient: 'Bone-in chicken thighs', changes: 'Much faster — 45 minutes. A different dish conceptually. The rendang method still works but the deeply reduced, almost-dry finish is harder to achieve without overcooking the chicken.', quality: 'compromise', quantity_note: 'total cook time is about 45 minutes — watch closely' },
        { ingredient: 'Goat shoulder, cut in 5cm chunks', changes: 'Traditional in some Minangkabau rendang variants. Gamey and rich. Treat identically to beef — same time.', quality: 'great_swap' },
      ],
    },
    { id: 'i2', name: 'Coconut milk, full-fat', amount: 800, unit: 'ml', scales: 'linear',
      substitutions: [
        { ingredient: 'Coconut cream + 200ml water', changes: 'Richer starting base that gives a more intense coconut flavour. Use 600ml coconut cream + 200ml water to approximate full-fat coconut milk.', quality: 'great_swap', quantity_note: '600ml coconut cream + 200ml water' },
      ],
    },
    { id: 'i3', name: 'Kerisik (toasted coconut)', amount: 4, unit: 'tbsp', scales: 'fixed', prep: 'Toast desiccated coconut in a dry pan until deep golden, then pound in mortar — releases coconut oil and gives the rendang its distinctive nutty paste',
      substitutions: [
        { ingredient: 'Desiccated coconut, untoasted', changes: 'Loses the deep toasted flavour. Toast in a dry pan first and pound — don\'t skip the pounding.', quality: 'compromise' },
      ],
    },
    { id: 'i4', name: 'Lemongrass stalks', amount: 4, unit: '', scales: 'fixed', prep: 'White parts only, roughly chopped — for paste',
      substitutions: [
        { ingredient: 'Lemongrass paste (from a tube)', changes: 'Available at Coles and Woolworths — a reliable shortcut. Use 1 tsp paste per stalk. The flavour is slightly less vibrant but very close.', quality: 'good_swap', quantity_note: '1 tsp paste per lemongrass stalk' },
      ],
    },
    { id: 'i5', name: 'Galangal', amount: 4, unit: 'cm', scales: 'fixed', prep: 'Peeled, roughly sliced — for paste',
      substitutions: [
        { ingredient: 'Fresh ginger', changes: 'Sharper, more peppery. Galangal has a pine-like flavour ginger can\'t replicate — use galangal if you can.', quality: 'compromise', hard_to_find: true, local_alternative: 'Most Asian grocers stock it fresh. Also sold frozen.' },
      ],
    },
    { id: 'i6', name: 'Dried chillies', amount: 15, unit: 'g', scales: 'fixed', prep: 'Soaked in boiling water 20 min, drained — for paste' },
    { id: 'i7', name: 'Fresh red chillies', amount: 4, unit: '', scales: 'fixed', prep: 'For paste',
      substitutions: [
        { ingredient: 'Long red chillies', changes: 'Milder heat than bird\'s eye chillies, more fruity flavour. Use 5–6 long red chillies to maintain the heat level.', quality: 'great_swap', quantity_note: 'use 5–6 long red chillies' },
        { ingredient: 'Chilli flakes + a roasted capsicum', changes: 'Use 2 tsp chilli flakes for heat and a small roasted capsicum for the fresh chilli body and flavour. An emergency substitute only.', quality: 'compromise' },
      ],
    },
    { id: 'i8', name: 'Shallots', amount: 8, unit: '', scales: 'fixed', prep: 'Peeled, halved — for paste',
      substitutions: [
        { ingredient: 'Brown onion (1 medium)', changes: 'More pungent and less sweet than shallots raw. The paste will be slightly more assertive but works fine — the long frying stage mellows it completely.', quality: 'great_swap', quantity_note: 'use 1 medium brown onion per 8 shallots' },
        { ingredient: 'Red onion (1 medium)', changes: 'Slightly sweeter than brown onion. Works well — the red colour disappears during frying. Direct swap.', quality: 'great_swap', quantity_note: 'use 1 medium red onion per 8 shallots' },
      ],
    },
    { id: 'i9', name: 'Garlic cloves', amount: 8, unit: '', scales: 'fixed', prep: 'For paste',
      substitutions: [
        { ingredient: 'Garlic paste (1 tsp per clove)', changes: 'Blends more smoothly into the rempah. Use 8 tsp total. Convenient and consistent — a perfectly acceptable shortcut.', quality: 'good_swap', quantity_note: 'use 8 tsp garlic paste total' },
      ],
    },
    { id: 'i10', name: 'Candlenuts', amount: 6, unit: '', scales: 'fixed', prep: 'For paste — adds body and creaminess',
      substitutions: [
        { ingredient: 'Macadamia nuts', changes: 'Almost identical result — same fat content and creaminess. The best substitute available in Australian supermarkets. Always cook them — macadamias can also cause issues raw in large quantities.', quality: 'good_swap', hard_to_find: true, local_alternative: 'Candlenuts: Asian grocers. Macadamia nuts: all supermarkets. Candlenuts are toxic raw — always cook them.' },
        { ingredient: 'Raw cashews', changes: 'Less oily than macadamia or candlenut. Adds creaminess to the paste but slightly more starchy. Soak in warm water 20 minutes before blending for a smoother result.', quality: 'good_swap' },
      ],
    },
    { id: 'i11', name: 'Turmeric', amount: 2, unit: 'tsp', scales: 'fixed', prep: 'Ground, for paste',
      substitutions: [
        { ingredient: 'Fresh turmeric (thumb-sized piece)', changes: 'Brighter, more pungent, and more floral than ground. Peel and slice before adding to the blender. An upgrade if you can find it.', quality: 'great_swap', quantity_note: 'use a 4cm piece fresh turmeric per 2 tsp ground', hard_to_find: true, local_alternative: 'Harris Farm Markets and Asian grocers regularly stock fresh turmeric.' },
      ],
    },
    { id: 'i12', name: 'Kaffir lime leaves', amount: 6, unit: '', scales: 'fixed', prep: 'Torn — two added to paste, four left whole in the braise',
      substitutions: [
        { ingredient: 'Lime zest, 2 tsp', changes: 'Less floral, more straightforward citrus. The distinctive kaffir note is missing.', quality: 'compromise', hard_to_find: true, local_alternative: 'Asian grocers. Also sold frozen. Makrut lime is the same thing.' },
      ],
    },
    { id: 'i13', name: 'Palm sugar', amount: 2, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Brown sugar or dark muscovado', changes: 'Slightly less complex caramel character than palm sugar. Dark muscovado is closest — it has a molasses-rich depth. Brown sugar works fine.', quality: 'great_swap' },
        { ingredient: 'Coconut sugar', changes: 'Less sweet and more mineral — actually quite close to the palm sugar character. A natural pairing in Indonesian and Malaysian cooking.', quality: 'great_swap' },
      ],
    },
    { id: 'i14', name: 'Salt', amount: 2, unit: 'tsp', scales: 'fixed' },
    { id: 'i15', name: 'Vegetable oil', amount: 3, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Coconut oil', changes: 'Adds a subtle coconut note to the rempah frying. Very authentic — coconut oil is traditional in Sumatran cooking. Same amount.', quality: 'great_swap' },
        { ingredient: 'Peanut oil (groundnut)', changes: 'High smoke point, slightly nutty. Works very well in this application.', quality: 'great_swap' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Make the rempah (spice paste)', content: 'Blend lemongrass, galangal, dried and fresh chillies, shallots, garlic, candlenuts, turmeric, and 2 kaffir lime leaves with a splash of water until completely smooth — 3–4 minutes in a high-powered blender or longer with a stick blender.', timer_seconds: 240, why_note: 'Rempah is the foundation. Every flavour in the rendang builds from this paste. Inadequate blending leaves fibrous lemongrass chunks that never fully cook out. If you don\'t have a powerful blender, slice everything finely and then blend — it gives the blades something to grip.' },
    { id: 's2', title: 'Fry the paste', content: 'Heat oil in a wide, heavy pot on medium-high. Fry the rempah, stirring constantly, 10–12 minutes until deep golden-red and oil separates out around the edges — the matang stage. The kitchen will fill with extraordinary smell.', timer_seconds: 720, why_note: 'Same principle as the nasi lemak sambal — you are driving off moisture and frying the spices in their own released oils. Undercooked rempah smells sharp and herby; properly cooked rempah smells complex and deep. The oil separating is your signal.' },
    { id: 's3', title: 'Brown the beef', content: 'Add the beef chunks in batches, turning each piece to coat in the paste. Don\'t worry about deep browning — you are searing, not caramelising here. Add remaining 4 kaffir lime leaves.', timer_seconds: 300, why_note: 'The beef surface picks up colour and paste coating. In a long braise like this, deep searing is less important than in a quick dish — the 3-hour simmer will develop more flavour than a crust will provide. Getting the paste onto the surface of the meat matters more.' },
    { id: 's4', title: 'Add coconut milk and slow braise', content: 'Pour in all the coconut milk. Bring to a boil, add palm sugar and salt. Reduce to the lowest simmer that maintains very gentle movement — not a rapid boil. Cook uncovered for 2 hours, stirring occasionally. The coconut milk reduces and thickens.', timer_seconds: 7200, why_note: 'Low and slow is the only method. A rapid boil makes the beef tough and the sauce greasy. The coconut milk fat gradually separates over the 2 hours — this is what you want. That fat will eventually fry the paste in the final stage.' },
    { id: 's5', title: 'Dry it out — the critical final stage', content: 'After 2 hours, the sauce should be thick and paste-like. Now stir in the kerisik. Keep cooking on low, stirring frequently, until almost all liquid is gone and the paste is frying in the coconut oil — you\'ll hear it transition from bubbling-liquid sounds to a frying sizzle. This takes 30–45 more minutes. The beef should be mahogany coloured.', timer_seconds: 2400, stage_note: 'Listen: when you hear sizzling rather than bubbling, you\'re in the frying stage. Look: mahogany-dark paste clinging to deep brown beef.', why_note: 'This is what makes rendang rendang — the deliberate drying out until the paste fries in the coconut oil. Most westernised recipes stop before this stage. The frying concentrates every flavour, toasts the spices again, and gives the beef its characteristic dry-but-tender texture. Pull it 2 minutes too early and you have a curry. Pull it 2 minutes too late and you burn it.' },
    { id: 's6', title: 'Taste, rest, serve', content: 'Taste and adjust salt and palm sugar. Rest 20 minutes off the heat — the flavour improves. Serve with steamed jasmine rice. Rendang reheats brilliantly — it\'s better the next day.', why_note: 'Resting allows the beef to reabsorb some of the spice-fat that surrounds it. Rendang is famously a dish that improves with time — traditionally made in bulk for celebrations and eaten over several days.' },
  ],
};

const CURRY_LAKSA: Recipe = {
  id: 'curry-laksa',
  title: 'Curry Laksa',
  tagline: 'Kuala Lumpur\'s coconut curry noodle soup — rich, spicy, aromatic',
  description: 'Laksa divides into two schools: the Penang assam laksa (sour, tamarind-based, no coconut) and the KL curry laksa (coconut milk, spice paste, prawn). This is the KL version — the one that will make you want to book a flight.',
  base_servings: 4,
  time_min: 75,
  difficulty: 'Intermediate',
  tags: ['malaysian', 'noodles', 'coconut', 'prawn', 'spicy'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Andy Hearnden (Andy Cooks)',
    video_url: 'https://www.youtube.com/watch?v=sp6iBhjpWsI',
    notes: 'KL-style curry laksa. Assam laksa is a different dish — do not confuse them.',
  },
  emoji: '🍜',
  hero_fallback: fallback('#D4820A'),
  categories: { cuisines: ['malaysian'], types: ['seafood'] },
  whole_food_verified: true,
  ingredients: [
    { id: 'i1', name: 'Raw prawns, shell-on', amount: 500, unit: 'g', scales: 'linear', prep: 'Shell and devein, reserve shells for stock',
      substitutions: [
        { ingredient: 'Chicken thighs, sliced', changes: 'Heartier, loses the prawn sweetness. Equally traditional — many laksa stalls use both. Cook for 5–6 minutes in the broth.', quality: 'good_swap' },
        { ingredient: 'Firm tofu, pressed and cubed', changes: 'Full vegan protein option. Pan-fry until golden before adding to the broth. Soaks up the laksa broth beautifully.', quality: 'good_swap' },
        { ingredient: 'Squid (calamari), cleaned and sliced', changes: 'Classic laksa addition in Malaysia. Cook very fast — 90 seconds in the hot broth. Goes rubbery if overdone.', quality: 'great_swap', quantity_note: 'cook for 90 seconds maximum in the hot broth' },
      ],
    },
    { id: 'i2', name: 'Firm tofu', amount: 200, unit: 'g', scales: 'linear', prep: 'Cut into cubes, pan-fried until golden — adds protein and soaks up broth',
      substitutions: [
        { ingredient: 'Hard-boiled eggs, halved', changes: 'Richer and more substantial than tofu. A common Malaysian laksa addition. Boil 8 minutes for fully set yolk.', quality: 'great_swap' },
        { ingredient: 'Puffed tofu (tau pok)', changes: 'Deep-fried tofu puffs sold ready-made at Asian grocers. Extremely good — absorbs the laksa broth like a sponge. The most traditional choice alongside the prawns.', quality: 'great_swap', hard_to_find: true, local_alternative: 'Asian grocers, refrigerated section. Well worth seeking out.' },
      ],
    },
    { id: 'i3', name: 'Rice vermicelli or thin egg noodles', amount: 300, unit: 'g', scales: 'linear', prep: 'Soaked in boiling water 5 min, drained',
      substitutions: [
        { ingredient: 'Hokkien noodles (thick yellow wheat noodles)', changes: 'Thicker and more substantial. Blanch in boiling water 2 minutes. A common laksa variation in KL.', quality: 'great_swap', quantity_note: 'blanch in boiling water 2 minutes' },
        { ingredient: 'Flat rice noodles (same as pad thai width)', changes: 'Wider and silkier than vermicelli. Soak in boiling water 5 minutes. Holds the broth beautifully.', quality: 'great_swap' },
      ],
    },
    { id: 'i4', name: 'Coconut milk, full-fat', amount: 400, unit: 'ml', scales: 'linear',
      substitutions: [
        { ingredient: 'Coconut cream + 100ml water', changes: 'Richer and more intense coconut flavour. Use 300ml coconut cream + 100ml water. The broth will be slightly thicker.', quality: 'great_swap', quantity_note: '300ml coconut cream + 100ml water' },
      ],
    },
    { id: 'i5', name: 'Chicken stock', amount: 600, unit: 'ml', scales: 'linear',
      substitutions: [
        { ingredient: 'Vegetable stock', changes: 'Vegetarian version — pair with tofu only and skip the prawn stock step. Less savoury body but a respectable laksa.', quality: 'good_swap' },
      ],
    },
    { id: 'i6', name: 'Lemongrass stalks', amount: 3, unit: '', scales: 'fixed', prep: 'White part only — for paste',
      substitutions: [
        { ingredient: 'Lemongrass paste (from tube)', changes: 'Available at Coles and Woolworths. Use 1 tsp paste per stalk. Slightly less vibrant but a very practical shortcut for the paste.', quality: 'good_swap', quantity_note: '1 tsp paste per stalk = 3 tsp total' },
        { ingredient: 'Lemon zest + a few drops of lime juice', changes: 'Citrusy but without lemongrass\'s distinctive floral-herbal complexity. The laksa will be noticeably different — still good, just less authentic.', quality: 'compromise', quantity_note: 'zest of 1 lemon + a few drops of lime per stalk' },
      ],
    },
    { id: 'i7', name: 'Galangal', amount: 3, unit: 'cm', scales: 'fixed', prep: 'Peeled — for paste',
      substitutions: [
        { ingredient: 'Fresh ginger', changes: 'Sharper, more peppery, without galangal\'s distinctive pine/pepper complexity. Use fresh ginger if galangal is unavailable — the laksa will still be excellent, just slightly different.', quality: 'compromise', hard_to_find: true, local_alternative: 'Asian grocers stock it fresh. Also available frozen — keep a piece in the freezer.' },
      ],
    },
    { id: 'i8', name: 'Dried chillies', amount: 10, unit: 'g', scales: 'fixed', prep: 'Soaked, drained — for paste',
      substitutions: [
        { ingredient: 'Kashmiri chilli powder', changes: 'Milder, deeply red, and gives an excellent colour. Use 2 tsp for 10g dried chillies. Not as complex but works in a blended paste.', quality: 'compromise', quantity_note: 'use 2 tsp kashmiri chilli powder per 10g dried chillies' },
        { ingredient: 'Sambal oelek', changes: 'Ready-made chilli paste. Add 1.5 tbsp directly to the paste without soaking. Heat level is consistent. Convenient emergency substitute.', quality: 'good_swap', quantity_note: 'use 1.5 tbsp sambal oelek per 10g dried chillies' },
      ],
    },
    { id: 'i9', name: 'Fresh red chillies', amount: 3, unit: '', scales: 'fixed',
      substitutions: [
        { ingredient: 'Long red chillies (milder)', changes: 'Less heat than bird\'s eye chillies. Use 4–5 long red chillies for the same amount of colour and a milder result.', quality: 'great_swap', quantity_note: 'use 4–5 long red chillies' },
        { ingredient: 'Chilli flakes (1 tsp)', changes: 'Less fresh flavour, no body in the paste. Add to the fried paste stage rather than blending. The paste will be slightly rougher in texture.', quality: 'compromise' },
      ],
    },
    { id: 'i10', name: 'Shallots', amount: 6, unit: '', scales: 'fixed',
      substitutions: [
        { ingredient: 'Brown onion (1 medium)', changes: 'Sharper and more pungent than shallots. Still works — the 8–10 minute frying stage mellows the raw onion flavour completely. Use 1 medium onion.', quality: 'great_swap', quantity_note: '1 medium brown onion per 6 shallots' },
      ],
    },
    { id: 'i11', name: 'Garlic cloves', amount: 5, unit: '', scales: 'fixed',
      substitutions: [
        { ingredient: 'Garlic paste (1 tsp per clove)', changes: 'Blends more smoothly into the paste. Use 5 tsp total. A reliable shortcut.', quality: 'good_swap', quantity_note: 'use 5 tsp garlic paste total' },
      ],
    },
    { id: 'i12', name: 'Belacan (shrimp paste)', amount: 15, unit: 'g', scales: 'fixed', prep: 'Toasted',
      substitutions: [
        { ingredient: 'Fish sauce (1.5 tbsp)', changes: 'Less paste-body and texture in the paste but adds the same umami-shrimp depth. The laksa paste will be slightly thinner and less complex.', quality: 'good_swap', quantity_note: 'use 1.5 tbsp fish sauce per 15g belacan', hard_to_find: true, local_alternative: 'Asian grocers. Wrap tightly and refrigerate — the smell is powerful.' },
        { ingredient: 'Thai shrimp paste (kapi)', changes: 'Very similar to belacan — equally pungent and paste-like. Direct swap by weight. Available at Asian grocers.', quality: 'perfect_swap', hard_to_find: true, local_alternative: 'Asian grocery stores. Usually sold in small tubs or jars.' },
      ],
    },
    { id: 'i13', name: 'Candlenuts', amount: 4, unit: '', scales: 'fixed',
      substitutions: [
        { ingredient: 'Macadamia nuts', changes: 'Almost identical result — same high fat content and creamy texture. The best substitute available in Australian supermarkets.', quality: 'good_swap', hard_to_find: true, local_alternative: 'Candlenuts: Asian grocers. Macadamia nuts: all supermarkets.' },
        { ingredient: 'Raw cashews, soaked 20 minutes', changes: 'Slightly more starchy than macadamia but still adds body to the paste. Soak to soften before blending for the smoothest result.', quality: 'good_swap' },
      ],
    },
    { id: 'i14', name: 'Turmeric', amount: 1.5, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Fresh turmeric (3cm piece)', changes: 'More vibrant and floral. Peel and add directly to the blender. An upgrade if you can find it.', quality: 'great_swap', quantity_note: 'use a 3cm piece fresh turmeric per 1.5 tsp ground', hard_to_find: true, local_alternative: 'Harris Farm Markets and Asian grocers.' },
      ],
    },
    { id: 'i15', name: 'Ground coriander', amount: 1, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Whole coriander seeds, toasted and ground', changes: 'More aromatic than pre-ground. Toast in a dry pan 60 seconds then grind in a mortar. A minor upgrade.', quality: 'great_swap' },
      ],
    },
    { id: 'i16', name: 'Fish sauce', amount: 2, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Light soy sauce', changes: 'Less funky and briny, but adds the saltiness and umami. Vegan alternative. Use slightly less.', quality: 'good_swap', quantity_note: 'use 1.5 tbsp soy sauce per 2 tbsp fish sauce' },
      ],
    },
    { id: 'i17', name: 'Palm sugar or brown sugar', amount: 1, unit: 'tbsp', scales: 'fixed' },
    { id: 'i18', name: 'Salt', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i19', name: 'Bean sprouts', amount: 100, unit: 'g', scales: 'linear', prep: 'Blanched 30 seconds in boiling water',
      substitutions: [
        { ingredient: 'Shredded cabbage, blanched', changes: 'Less delicate than bean sprouts but provides a similar crunchy texture. Blanch 1 minute.', quality: 'good_swap' },
      ],
    },
    { id: 'i20', name: 'Fresh coriander leaves', amount: 1, unit: 'handful', scales: 'fixed', prep: 'To garnish' },
    { id: 'i21', name: 'Sambal oelek or fresh chilli, to serve', amount: 2, unit: 'tsp', scales: 'fixed' },
    { id: 'i22', name: 'Lime, to serve', amount: 1, unit: '', scales: 'linear' },
    { id: 'i23', name: 'Vegetable oil', amount: 3, unit: 'tbsp', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Prawn stock from shells', content: 'Toast prawn shells in a dry pot 3 minutes until fragrant and pink-red. Add 800ml water, bring to boil, simmer 15 minutes. Strain. This is your prawn stock — use it instead of 200ml of the chicken stock for extra depth.', timer_seconds: 1080, why_note: 'Prawn shells contain glutamates and chitin that dissolve into an intensely savoury stock in 15 minutes. Most home cooks throw them away. This is a 15-minute investment that separates a good laksa from a great one.' },
    { id: 's2', title: 'Make the laksa paste', content: 'Blend lemongrass, galangal, chillies, shallots, garlic, toasted belacan, candlenuts, turmeric, and ground coriander with 3 tbsp water until smooth — 3 minutes minimum.', timer_seconds: 180, why_note: 'The paste is the heart of laksa. Over-blending doesn\'t exist here — the finer the paste, the more surface area for the frying stage.' },
    { id: 's3', title: 'Fry the paste to matang', content: 'Heat oil in a heavy pot on medium-high. Fry the paste 8–10 minutes, stirring constantly, until oil splits and paste is deep golden. The smell will intensify dramatically — raw to cooked is obvious.', timer_seconds: 600, why_note: 'The matang principle again — you are frying the spices in their own released oils until they\'re fully cooked through. Uncooked laksa paste has a sharp, harsh flavour. Cooked paste is rich, complex, and fragrant.' },
    { id: 's4', title: 'Build the broth', content: 'Add chicken stock and prawn stock to the fried paste. Bring to a boil, then reduce to a simmer. Add coconut milk — don\'t boil after this, just maintain a gentle simmer. Season with fish sauce, palm sugar, and salt. Simmer 15 minutes for everything to integrate.', timer_seconds: 900, why_note: 'Boiling coconut milk after it\'s been added causes it to split — it separates into greasy curds and clear liquid. A gentle simmer below 100°C keeps the emulsion stable.' },
    { id: 's5', title: 'Cook the prawns and tofu', content: 'Add the tofu cubes and simmer 3 minutes. Add the prawns and cook exactly 2–3 minutes until just pink and curled. They should be barely cooked through — they will continue cooking in the residual heat of the bowl.', timer_seconds: 360, stage_note: 'Prawns are done when fully pink with a slight curl. Overcooked prawns go rubbery within 30 seconds.', why_note: 'Prawns cook far faster than most people expect. They go from raw to overcooked in about 90 seconds in hot broth. Pull them the moment they\'re pink.' },
    { id: 's6', title: 'Bowl up', content: 'Divide noodles between bowls, ladle over the broth with prawns and tofu. Top with bean sprouts, fresh coriander, and a lime wedge. Serve with sambal on the side for heat adjustment.', why_note: 'Assembling in bowls (not the pot) keeps the noodles from going soggy. Bean sprouts should have some crunch — add them at the last second.' },
  ],
};

const CHAR_KWAY_TEOW: Recipe = {
  id: 'char-kway-teow',
  title: 'Char Kway Teow',
  tagline: 'Penang wok-fried flat rice noodles with the wok hei you can\'t fake',
  description: 'Char kway teow from a Penang hawker stall is one of the most complex simple dishes on earth. The secret is wok hei — the smoky, slightly charred quality that only comes from ultra-high heat in a seasoned wok. A home stove gets you most of the way there if you use the right technique.',
  base_servings: 2,
  time_min: 20,
  difficulty: 'Intermediate',
  tags: ['malaysian', 'noodles', 'prawn', 'wok', 'street-food'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Andy Hearnden (Andy Cooks)',
    video_url: 'https://www.youtube.com/watch?v=cgZ0VwfB6nw',
    notes: 'Penang-style CKT. Cook 1–2 portions at a time — scaling up kills wok hei.',
  },
  emoji: '🥢',
  hero_fallback: fallback('#2C1A0E'),
  categories: { cuisines: ['malaysian'], types: ['seafood'] },
  whole_food_verified: true,
  ingredients: [
    { id: 'i1', name: 'Fresh flat rice noodles (kway teow)', amount: 300, unit: 'g', scales: 'linear', prep: 'If refrigerated, bring to room temp — cold noodles kill wok heat',
      substitutions: [
        { ingredient: 'Dried flat rice noodles', changes: 'Soak in warm water 30 min, drain well. Slightly less silky but works. Dry completely before adding to wok.', quality: 'good_swap', hard_to_find: true, local_alternative: 'Fresh: Asian grocery refrigerated section. Dried: all Asian grocers.' },
      ],
    },
    { id: 'i2', name: 'Raw prawns, peeled', amount: 150, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Squid (calamari), cleaned and scored', changes: 'Classic Penang CKT addition — many stalls use a mix of prawns and squid. Cook very fast, 60–90 seconds, or it turns rubbery.', quality: 'great_swap' },
        { ingredient: 'Scallops, halved', changes: 'More luxurious. Sear hard 60 seconds per side — they overcook even faster than prawns.', quality: 'good_swap' },
      ],
    },
    { id: 'i3', name: 'Chinese lap cheong sausage', amount: 1, unit: 'link', scales: 'fixed', prep: 'Sliced on the diagonal',
      substitutions: [
        { ingredient: 'Char siu (Chinese BBQ pork), sliced', changes: 'Less fatty and sweet than lap cheong. Already cooked — add it later in the process to avoid overcooking. Still delicious.', quality: 'good_swap', hard_to_find: true, local_alternative: 'Lap cheong: Asian grocers, Chinatown butchers. Char siu: Chinese BBQ shops.' },
        { ingredient: 'Thin-cut pork belly, sliced and rendered', changes: 'Fresh pork — more work but deeply satisfying. Render in the wok before the other ingredients.', quality: 'good_swap' },
      ],
    },
    { id: 'i4', name: 'Eggs', amount: 2, unit: '', scales: 'linear' },
    { id: 'i5', name: 'Bean sprouts', amount: 100, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Shredded cabbage', changes: 'Provides crunch but less delicate — blanch briefly or add raw for maximum texture. Less traditional but practical.', quality: 'good_swap' },
      ],
    },
    { id: 'i6', name: 'Chives or spring onions', amount: 4, unit: 'stalks', scales: 'fixed', prep: 'Cut into 4cm lengths' },
    { id: 'i7', name: 'Garlic cloves', amount: 4, unit: '', scales: 'fixed', prep: 'Minced' },
    { id: 'i8', name: 'Soy sauce', amount: 1.5, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Tamari (gluten-free soy)', changes: 'Gluten-free and slightly richer. Direct swap — same saltiness and colour.', quality: 'perfect_swap' },
        { ingredient: 'Coconut aminos', changes: 'Sweeter and less salty. Add a pinch of salt to the dish to compensate. Works but alters the savouriness.', quality: 'compromise', quantity_note: 'use 2 tbsp coconut aminos + a pinch of salt' },
      ],
    },
    { id: 'i9', name: 'Kecap manis (sweet soy sauce)', amount: 1.5, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Soy sauce + brown sugar', changes: 'Slightly less thick and complex. Works well — the caramelisation in the wok compensates for the missing complexity of properly aged kecap manis.', quality: 'good_swap', quantity_note: '1 tbsp soy sauce + 1 tsp brown sugar per 1.5 tbsp kecap manis', hard_to_find: true, local_alternative: 'Most large Woolworths and Coles stock it. Asian grocers always do.' },
      ],
    },
    { id: 'i10', name: 'Fish sauce', amount: 1, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Light soy sauce', changes: 'Less funky and briny. Vegan alternative. Use the same amount. The dish will be less complex but still well-seasoned.', quality: 'good_swap' },
        { ingredient: 'Oyster sauce', changes: 'Sweeter and thicker. Changes the flavour profile toward Cantonese-style noodles. Reduce the kecap manis slightly to avoid over-sweetening.', quality: 'good_swap' },
      ],
    },
    { id: 'i11', name: 'White pepper', amount: 0.5, unit: 'tsp', scales: 'fixed', prep: 'Freshly ground — this is the dominant spice note in CKT',
      substitutions: [
        { ingredient: 'Black pepper, finely ground', changes: 'More assertive and slightly piney. Works — the spice note just shifts from floral to earthy. Use ¼ tsp as it\'s more pungent.', quality: 'good_swap', quantity_note: 'use ¼ tsp black pepper per ½ tsp white' },
      ],
    },
    { id: 'i12', name: 'Lard or neutral oil', amount: 3, unit: 'tbsp', scales: 'fixed', prep: 'Lard is traditional and gives better wok hei. Vegetable oil works.',
      substitutions: [
        { ingredient: 'Vegetable or peanut oil', changes: 'Slightly less savoury depth without the pork fat. The wok hei difference is noticeable to someone who knows, but the dish is still excellent.', quality: 'good_swap' },
        { ingredient: 'Beef tallow (rendered beef fat)', changes: 'Less traditional but excellent wok hei and savoury depth — similar to lard in function. Substitute 1:1.', quality: 'good_swap' },
      ],
    },
    { id: 'i13', name: 'Fresh red chilli, sliced, to serve', amount: 1, unit: '', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Get the wok screaming hot — this is the whole game', content: 'Place your heaviest wok on the largest burner turned to maximum. Heat 3–4 minutes until the wok is smoking and you can see a slight shimmer of heat waves. Have all your ingredients prepped and right next to the wok. Once you start, this dish takes 4 minutes total and you cannot stop.', why_note: 'Wok hei — the smoky, slightly charred quality of good CKT — requires surface temperatures above 200°C. A domestic gas burner gets your wok to around 180°C if preheated properly. The wok must be hotter than the cooking medium, so it keeps heating even as you add cold ingredients.' },
    { id: 's2', title: 'Fry the sausage and aromatics', content: 'Add lard or oil. When it shimmers immediately, add lap cheong slices. Let them sear 30 seconds — they\'ll start rendering fat. Add garlic and fry 20 seconds, tossing constantly.', timer_seconds: 60, why_note: 'The lap cheong fat renders and flavours the oil, which then flavours everything else. Garlic goes in second — alone on a screaming-hot wok it burns in under 15 seconds. Keep it moving.' },
    { id: 's3', title: 'Add prawns, then noodles', content: 'Add prawns, toss 30 seconds until just turning pink. Push everything to the side of the wok. Add the noodles to the hot centre — press them flat against the wok surface and leave for 20 seconds, then toss. Add soy sauce, kecap manis, fish sauce, and white pepper, tossing constantly.', timer_seconds: 90, why_note: 'The 20-second press is deliberate — you are creating direct wok contact to char the noodle surface. Constant tossing without that initial press produces pale, soft noodles. The sauces caramelise on contact with the hot wok surface.' },
    { id: 's4', title: 'Scramble in the eggs', content: 'Push noodles to the side. Add eggs to the empty wok centre — let them set slightly for 10 seconds, then scramble loosely and toss into the noodles before fully set.', timer_seconds: 20, why_note: 'Half-scrambled eggs integrated into the noodles is the texture you want — neither a separate omelette nor invisible. Adding fully cooked eggs to the noodles gives rubbery chunks; adding raw egg directly to the noodles gives a wet, coating result.' },
    { id: 's5', title: 'Bean sprouts and greens, then plate', content: 'Add bean sprouts and chives. Toss 15 seconds — they should still have crunch. Immediately plate on a warm dish. Serve with fresh chilli slices.', timer_seconds: 15, stage_note: 'Bean sprouts should still have crunch. If they\'ve gone soft, you overcooked them by 20 seconds.', why_note: 'Bean sprouts wilt and release water in about 30 seconds of heat. That water steams the noodles and destroys the wok hei you just built. The 15-second toss is enough to warm them through while preserving crunch.' },
  ],
};

const BUTTER_CHICKEN: Recipe = {
  id: 'butter-chicken',
  title: 'Butter Chicken from Scratch',
  tagline: 'Tandoor-inspired chicken in a tomato-cream sauce — no jar',
  description: 'Butter chicken (murgh makhani) was invented in Delhi in the 1950s by Kundan Lal Gujral and Kundan Lal Jaggi — the story is that leftover tandoor chicken was simmered in a rich tomato and butter sauce to stop it drying out. A happy accident. This version does the whole thing from scratch, which takes time but tastes completely different from any commercial version you\'ve tried.',
  base_servings: 4,
  time_min: 90,
  difficulty: 'Intermediate',
  tags: ['indian', 'chicken', 'tomato', 'cream', 'curry'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Joshua Weissman',
    video_url: 'https://www.youtube.com/watch?v=mrDJ2K3JXsA',
    notes: 'Inspired by Joshua\'s from-scratch Indian dishes. Tikka marinade and makhani sauce method.',
  },
  emoji: '🍗',
  hero_fallback: fallback('#D4660A'),
  categories: { cuisines: ['indian'], types: ['chicken'] },
  whole_food_verified: true,
  ingredients: [
    { id: 'i1', name: 'Chicken thighs, boneless skinless', amount: 800, unit: 'g', scales: 'linear', prep: 'Cut into large chunks — smaller pieces dry out in the oven',
      substitutions: [
        { ingredient: 'Chicken breast', changes: 'Dries out more easily. Reduce oven time by 5 minutes and watch closely.', quality: 'compromise' },
      ],
    },
    { id: 'i2', name: 'Full-fat natural yoghurt', amount: 150, unit: 'g', scales: 'linear', prep: 'For the marinade',
      substitutions: [
        { ingredient: 'Buttermilk', changes: 'More liquid than yoghurt but the same lactic acid that tenderises the chicken. Use 120ml — it\'s thinner so you\'ll need less. Works very well.', quality: 'good_swap', quantity_note: 'use 120ml buttermilk per 150g yoghurt' },
        { ingredient: 'Coconut yoghurt', changes: 'Dairy-free. The lactic acid still tenderises. Subtle coconut flavour integrates into the marinade. Same amount.', quality: 'good_swap' },
      ],
    },
    { id: 'i3', name: 'Lemon juice', amount: 2, unit: 'tbsp', scales: 'fixed', prep: 'For the marinade',
      substitutions: [
        { ingredient: 'Lime juice', changes: 'More floral and slightly more acidic than lemon. Works identically in the marinade — a common variation in Indian cooking.', quality: 'great_swap' },
        { ingredient: 'White wine vinegar', changes: 'Sharper acid note. Use slightly less — it\'s more assertive than lemon juice.', quality: 'good_swap', quantity_note: 'use 1.5 tbsp white wine vinegar per 2 tbsp lemon juice' },
      ],
    },
    { id: 'i4', name: 'Garlic cloves', amount: 8, unit: '', scales: 'linear', prep: '4 for marinade, 4 for sauce',
      substitutions: [
        { ingredient: 'Garlic paste (1 tsp per clove)', changes: 'Convenient — blends smoothly into both the marinade and the sauce. Use 4 tsp in each. A reliable shortcut.', quality: 'good_swap', quantity_note: 'use 4 tsp garlic paste in the marinade and 4 tsp in the sauce' },
      ],
    },
    { id: 'i5', name: 'Fresh ginger', amount: 6, unit: 'cm', scales: 'fixed', prep: 'Half for marinade, half for sauce — grated',
      substitutions: [
        { ingredient: 'Ginger paste (from tube)', changes: 'Consistent and convenient. Use 1 tsp per cm of fresh ginger — 3 tsp for the marinade and 3 tsp for the sauce.', quality: 'good_swap', quantity_note: 'use 3 tsp ginger paste for marinade + 3 tsp for sauce' },
        { ingredient: 'Ground ginger', changes: 'Dried and less fresh-tasting. Use very sparingly — it\'s a completely different flavour profile to fresh.', quality: 'compromise', quantity_note: 'use ¼ tsp ground ginger per 1 cm fresh — last resort only' },
      ],
    },
    { id: 'i6', name: 'Kashmiri chilli powder', amount: 2, unit: 'tsp', scales: 'fixed', prep: 'For marinade — gives the deep red colour without excessive heat',
      substitutions: [
        { ingredient: 'Mild paprika + pinch of cayenne', changes: 'Less vibrant colour but similar warmth. Use 1.5 tsp sweet paprika + ¼ tsp cayenne pepper.', quality: 'good_swap', quantity_note: '1.5 tsp mild paprika + ¼ tsp cayenne per 2 tsp kashmiri chilli', hard_to_find: true, local_alternative: 'Indian grocers and some Woolworths stores carry Kashmiri chilli powder.' },
      ],
    },
    { id: 'i7', name: 'Garam masala', amount: 2, unit: 'tsp', scales: 'fixed' },
    { id: 'i8', name: 'Ground cumin', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i9', name: 'Ground coriander', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i10', name: 'Turmeric', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i11', name: 'Salt', amount: 2, unit: 'tsp', scales: 'fixed' },
    { id: 'i12', name: 'Canned crushed tomatoes', amount: 400, unit: 'g', scales: 'linear', prep: 'For the makhani sauce',
      substitutions: [
        { ingredient: 'Fresh ripe tomatoes, roughly chopped (4 large)', changes: 'More vibrant and less cooked-tin flavour. Blanch and peel if you want a smoother sauce. Blending is essential.', quality: 'great_swap' },
        { ingredient: 'Tomato passata', changes: 'Already smooth — skip the blending step. Slightly sweeter and more concentrated. Use 350ml per 400g tin.', quality: 'great_swap', quantity_note: 'use 350ml passata per 400g tin' },
      ],
    },
    { id: 'i13', name: 'Unsalted butter', amount: 60, unit: 'g', scales: 'fixed', prep: 'Real butter — this is the makhani (butter) in the name',
      substitutions: [
        { ingredient: 'Ghee', changes: 'More concentrated butter flavour and higher smoke point. An excellent upgrade — richer result.', quality: 'great_swap' },
      ],
    },
    { id: 'i14', name: 'Double cream', amount: 150, unit: 'ml', scales: 'linear',
      substitutions: [
        { ingredient: 'Coconut cream', changes: 'Dairy-free and vegan. Subtly sweet with a faint coconut note that integrates well into the spiced tomato base. A popular variation.', quality: 'good_swap' },
        { ingredient: 'Full-fat natural yoghurt', changes: 'Less rich and tangier than cream. Stir in off heat only — it will curdle if it boils. Produces a lighter, healthier result.', quality: 'good_swap' },
        { ingredient: 'Thickened cream', changes: 'Australian cream with a slightly lower fat content than double cream. Same technique — identical result in practice.', quality: 'perfect_swap' },
      ],
    },
    { id: 'i15', name: 'Cardamom pods', amount: 4, unit: '', scales: 'fixed', prep: 'Lightly crushed' },
    { id: 'i16', name: 'Cloves', amount: 3, unit: '', scales: 'fixed' },
    { id: 'i17', name: 'Cinnamon stick', amount: 1, unit: 'small', scales: 'fixed' },
    { id: 'i18', name: 'Yellow onion', amount: 1, unit: 'large', scales: 'linear', prep: 'Finely diced — for the sauce',
      substitutions: [
        { ingredient: 'Brown onion', changes: 'The same as yellow onion in Australian supermarkets — direct swap. Finely dice and cook 10–12 minutes until deeply golden as the recipe states.', quality: 'perfect_swap' },
        { ingredient: 'Shallots (4 large), finely diced', changes: 'Sweeter and milder than brown onion. Caramelise faster — check at 8 minutes. The sauce will be slightly more delicate.', quality: 'great_swap', quantity_note: 'check at 8 minutes — shallots caramelise faster' },
        { ingredient: 'Red onion, finely diced', changes: 'Slightly sweeter than yellow. Works fine — the colour difference disappears after 10+ minutes of cooking and blending.', quality: 'great_swap' },
      ],
    },
    { id: 'i19', name: 'Neutral oil', amount: 2, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Ghee (additional, instead of butter + oil)', changes: 'Use 3 tbsp ghee total instead of the butter and oil combination. More concentrated butter flavour with a higher smoke point. An upgrade.', quality: 'great_swap' },
      ],
    },
    { id: 'i20', name: 'Honey or sugar', amount: 1, unit: 'tsp', scales: 'fixed', prep: 'Small amount to balance the tomato acid',
      substitutions: [
        { ingredient: 'Maple syrup', changes: 'Slightly more complex than honey. Same amount. Works identically.', quality: 'great_swap' },
        { ingredient: 'Date syrup', changes: 'Rich and complex. Adds a deeper sweetness than honey. Pairs exceptionally well with the Indian spice profile.', quality: 'great_swap', hard_to_find: true, local_alternative: 'Middle Eastern grocers and some health food stores.' },
        { ingredient: 'Jaggery (grated)', changes: 'Unrefined cane sugar used throughout South Asian cooking. Earthy, complex sweetness. Very appropriate in this context.', quality: 'great_swap', hard_to_find: true, local_alternative: 'Indian grocers. Widely used in Indian desserts and curries.' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Marinate the chicken — minimum 4 hours', content: 'Mix yoghurt, lemon juice, 4 crushed garlic cloves, half the grated ginger, kashmiri chilli, 1 tsp garam masala, cumin, coriander, turmeric, and 1 tsp salt into a paste. Coat chicken thoroughly. Cover and refrigerate 4 hours minimum — overnight is better.', timer_seconds: 14400, why_note: 'The yoghurt marinade does two things: the lactic acid tenderises the surface proteins, and the fat in the yoghurt helps the spices penetrate. Four hours is the minimum for flavour to reach the centre of large chicken pieces. Under-marinated chicken tastes of sauce, not of spiced chicken.' },
    { id: 's2', title: 'Grill or roast the chicken hard', content: 'Set oven to 230°C grill/broil. Spread marinated chicken on a rack over a baking tray — the rack is important, it lets heat circulate underneath. Grill 15–18 minutes, turning once, until charred at the edges and cooked through (75°C internal). Some burning is correct — you want those slightly charred bits.', timer_seconds: 1080, stage_note: 'Charred edges, not raw pink centres. Some blackened spots on the edges are the goal — this is the tikka quality.', why_note: 'The char is not a mistake — it\'s the tandoor effect. Those blackened proteins add a smoky, complex note to the sauce that butter and cream alone can\'t provide. Missing this step is why restaurant butter chicken often tastes flat.' },
    { id: 's3', title: 'Build the makhani sauce', content: 'In a heavy pot, melt butter with oil on medium. Add cardamom, cloves, and cinnamon — fry 30 seconds. Add onion and fry 10–12 minutes until deeply golden, stirring often. Add remaining garlic and ginger, fry 2 minutes. Add crushed tomatoes, remaining garam masala, and salt. Simmer 20 minutes until thick.', timer_seconds: 2040, why_note: 'The whole-spice blooming in butter-oil releases fat-soluble flavour compounds from the cardamom and cloves — this is what gives makhani sauce its complexity beyond just tomato and cream. The deep golden onion is also non-negotiable: pale onions give a raw, sharp flavour; deeply golden onions give sweetness and depth.' },
    { id: 's4', title: 'Blend the sauce smooth', content: 'Remove the cinnamon stick. Carefully blend the sauce until completely smooth — use a stick blender in the pot or carefully transfer to a blender in batches. This silky-smooth sauce is the signature.', why_note: 'Blending transforms the onion and tomato into an emulsified, restaurant-quality sauce. Many home versions skip this and end up chunky. A chunk of onion in butter chicken sauce is jarring.' },
    { id: 's5', title: 'Finish with cream, simmer with chicken', content: 'Return blended sauce to pot on low heat. Pour in cream and honey. Add the grilled chicken pieces — including any charred drips from the tray. Simmer gently 10 minutes. Taste and adjust salt. The sauce should be rich, slightly sweet, mildly spiced, and bright orange-red.', timer_seconds: 600, why_note: 'Cream goes in at the end — boiling after adding cream makes it split and grassy. The chicken simmers in the sauce to pick up flavour and soften the char, while the sauce picks up the smoky chicken drips. The honey balances the tomato\'s sharpness without making it noticeably sweet.' },
  ],
};

const SAAG_PANEER: Recipe = {
  id: 'saag-paneer',
  title: 'Saag Paneer',
  tagline: 'Spiced spinach with golden-fried paneer — properly made',
  description: 'Most restaurant saag paneer is a green slurry with white cheese cubes floating in it. Properly made, it\'s intensely flavoured wilted spinach with aromatic tempering, bright from fresh ginger, and paneer that has been fried until it has a golden crust that holds up against the sauce.',
  base_servings: 4,
  time_min: 45,
  difficulty: 'Easy',
  tags: ['indian', 'vegetarian', 'spinach', 'paneer'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Joshua Weissman',
    video_url: 'https://www.youtube.com/@JoshuaWeissman',
    notes: 'Technique from Joshua\'s Indian cooking series. Uses fresh spinach — not frozen.',
  },
  emoji: '🌿',
  hero_fallback: fallback('#2A5C3A'),
  categories: { cuisines: ['indian'], types: ['vegetarian'] },
  whole_food_verified: true,
  ingredients: [
    { id: 'i1', name: 'Paneer', amount: 400, unit: 'g', scales: 'linear', prep: 'Cut into 2cm cubes',
      substitutions: [
        { ingredient: 'Extra-firm tofu, pressed dry', changes: 'Neutral flavour with a similar texture when fried. Press the tofu dry before frying for a better crust. Makes it fully vegan.', quality: 'good_swap', hard_to_find: false },
        { ingredient: 'Halloumi, cut in 2cm cubes', changes: 'Saltier and with a squeak. Reduce all added salt in the dish significantly. Fries beautifully. Different flavour character — Mediterranean meets Indian.', quality: 'good_swap', quantity_note: 'reduce added salt significantly — halloumi is very salty' },
        { ingredient: 'Fresh paneer (homemade)', changes: 'Simply boil whole milk, add lemon juice, strain through muslin, and press for 30 minutes. Softer and more milky than commercial paneer — often better.', quality: 'great_swap' },
      ],
    },
    { id: 'i2', name: 'Baby spinach', amount: 500, unit: 'g', scales: 'linear', prep: 'Washed — wilts to about ⅓ volume',
      substitutions: [
        { ingredient: 'English (full-leaf) spinach, stems removed', changes: 'Slightly more robust than baby spinach. Identical flavour. Wilt and blend the same way.', quality: 'perfect_swap' },
        { ingredient: 'Silverbeet (chard), stems removed', changes: 'Earthier and slightly more bitter than spinach. Use leaves only — the stems are too tough. The saag will be more robust in flavour.', quality: 'good_swap' },
        { ingredient: 'Frozen spinach (500g bag, thawed and squeezed dry)', changes: 'Convenient. Already wilted and ready to blend. Squeeze out as much water as possible — frozen spinach holds a lot of liquid.', quality: 'great_swap', quantity_note: 'thaw and squeeze out all excess water before blending' },
      ],
    },
    { id: 'i3', name: 'Yellow onion', amount: 1, unit: 'large', scales: 'linear', prep: 'Finely diced',
      substitutions: [
        { ingredient: 'Brown onion', changes: 'Identical to yellow onion in Australian supermarkets — direct swap. Finely dice and cook the full 10–12 minutes until deeply golden.', quality: 'perfect_swap' },
        { ingredient: 'Shallots (4 large), finely diced', changes: 'Milder and sweeter. Caramelise faster — 8 minutes. A more refined base for the masala.', quality: 'great_swap', quantity_note: 'check at 8 minutes — shallots caramelise faster' },
      ],
    },
    { id: 'i4', name: 'Garlic cloves', amount: 6, unit: '', scales: 'fixed', prep: 'Minced',
      substitutions: [
        { ingredient: 'Garlic paste (1 tsp per clove)', changes: 'Consistent and convenient. Use 2 tbsp garlic paste total. Works perfectly in this application.', quality: 'good_swap', quantity_note: 'use 2 tbsp garlic paste total' },
      ],
    },
    { id: 'i5', name: 'Fresh ginger', amount: 4, unit: 'cm', scales: 'fixed', prep: 'Grated',
      substitutions: [
        { ingredient: 'Ginger paste (from tube or jar)', changes: 'Convenient and consistent. Use 1 tsp paste per cm of fresh ginger — 4 tsp total. Works well in a cooked dish.', quality: 'good_swap', quantity_note: 'use 4 tsp ginger paste total' },
        { ingredient: 'Ground ginger', changes: 'Very different to fresh — drier and less bright. A last-resort substitute only. Use sparingly.', quality: 'compromise', quantity_note: 'use ¼ tsp ground ginger per 1 cm fresh ginger — last resort' },
      ],
    },
    { id: 'i6', name: 'Fresh green chilli', amount: 2, unit: '', scales: 'fixed', prep: 'Sliced — adjust to taste',
      substitutions: [
        { ingredient: 'Long green chilli', changes: 'Milder heat than Indian green chillies (which are like small serrano). Use 3–4 long green chillies for the same level of heat.', quality: 'good_swap', quantity_note: 'use 3–4 long green chillies' },
        { ingredient: 'Jalapeño, sliced', changes: 'Similar heat level to Indian green chillies. Slightly less authentic in flavour but works very well. Use 2 jalapeños.', quality: 'good_swap' },
        { ingredient: 'Chilli flakes (½ tsp)', changes: 'Adds heat without the fresh green note. Fine in the masala where it will be cooked — less appropriate as a garnish.', quality: 'compromise' },
      ],
    },
    { id: 'i7', name: 'Ripe tomatoes', amount: 2, unit: 'medium', scales: 'linear', prep: 'Roughly chopped',
      substitutions: [
        { ingredient: 'Tinned chopped tomatoes (200g)', changes: 'Convenient and consistent. Cook slightly longer — about 3 extra minutes — to drive off the extra liquid.', quality: 'good_swap' },
        { ingredient: 'Cherry tomatoes, halved', changes: 'Sweeter and less acidic. No need to chop — they break down during cooking.', quality: 'great_swap' },
      ],
    },
    { id: 'i8', name: 'Ghee or unsalted butter', amount: 3, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Coconut oil', changes: 'Vegan option. Subtle coconut flavour that is noticeable but works with the spices. Same amount.', quality: 'good_swap' },
        { ingredient: 'Neutral oil', changes: 'Fully vegan with no added flavour. The dish is less rich but all the spice flavour comes through.', quality: 'good_swap' },
      ],
    },
    { id: 'i9', name: 'Neutral oil', amount: 2, unit: 'tbsp', scales: 'fixed', prep: 'For frying the paneer' },
    { id: 'i10', name: 'Ground cumin', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i11', name: 'Ground coriander', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i12', name: 'Garam masala', amount: 1, unit: 'tsp', scales: 'fixed', prep: 'Added at the end — preserves its delicate aromatics' },
    { id: 'i13', name: 'Turmeric', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i14', name: 'Kashmiri chilli powder', amount: 0.5, unit: 'tsp', scales: 'fixed', prep: 'Mild, for colour',
      substitutions: [
        { ingredient: 'Sweet paprika or mild paprika', changes: 'Same deep red colour without the distinctive chilli warmth of Kashmiri. Use the same amount. The dish will be slightly less complex but the colour is preserved.', quality: 'good_swap', hard_to_find: true, local_alternative: 'Indian grocers stock Kashmiri chilli powder. Some Woolworths stores carry it.' },
      ],
    },
    { id: 'i15', name: 'Full-fat natural yoghurt', amount: 4, unit: 'tbsp', scales: 'linear', prep: 'Stirred in at the end for richness',
      substitutions: [
        { ingredient: 'Coconut cream (2 tbsp)', changes: 'Vegan and dairy-free. Richer and sweeter than yoghurt — the saag will be less tangy but still silky. Stir in off heat the same way.', quality: 'good_swap', quantity_note: 'use 2 tbsp coconut cream per 4 tbsp yoghurt — it\'s richer' },
        { ingredient: 'Cashew cream (4 tbsp)', changes: 'Vegan. Blend 50g soaked raw cashews with 60ml water until smooth. Adds richness and body without the tang of yoghurt.', quality: 'good_swap' },
        { ingredient: 'Thickened cream', changes: 'Richer, no tanginess. Stir in off heat. The saag becomes richer and less bright. Reduces the Indian character slightly.', quality: 'good_swap', quantity_note: 'use 2–3 tbsp thickened cream per 4 tbsp yoghurt — it\'s richer' },
      ],
    },
    { id: 'i16', name: 'Salt', amount: 1.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i17', name: 'Lemon juice', amount: 1, unit: 'tbsp', scales: 'fixed', prep: 'To brighten at the end' },
  ],
  steps: [
    { id: 's1', title: 'Fry the paneer until golden', content: 'Heat oil in a large non-stick pan or cast iron on medium-high. Fry paneer cubes in a single layer, turning every 2 minutes, until golden on at least 3 sides — about 8 minutes total. Remove and set aside. Don\'t skip this step.', timer_seconds: 480, stage_note: 'Deep golden crust on the flat sides. The interior should still be soft.', why_note: 'Unfried paneer dissolves into the sauce — it\'s soft enough that the spinach moisture breaks it down over 20 minutes. Golden-fried paneer has a skin that holds its shape and adds textural contrast. It also picks up flavour from the browning reaction.' },
    { id: 's2', title: 'Wilt the spinach', content: 'In the same pan (no need to clean), add a splash of water and pile in the spinach. Cover and cook on medium-high 3–4 minutes until completely wilted. Transfer to a blender and blend until smooth — or rough-blend for more texture. Set aside.', timer_seconds: 240, why_note: 'Blanching the spinach in its own steam (no extra water needed) keeps the colour vivid green. Blending some or all of it is what gives saag its sauce-like consistency — leaving it all whole just gives you fried paneer in wilted spinach, which is different.' },
    { id: 's3', title: 'Build the masala base', content: 'Melt ghee in a heavy pot on medium. Add onion and cook 10–12 minutes until deep golden — not pale, not brown, deep golden. Add garlic, ginger, and green chilli, fry 2 minutes. Add cumin, coriander, turmeric, and kashmiri chilli — fry 90 seconds. Add tomatoes and cook until they completely break down, 8–10 minutes.', timer_seconds: 1440, why_note: 'The masala base is the backbone of the dish. The golden onion provides sweetness, the tomato provides acid and body, and frying the ground spices in the fat-onion mixture (bhuna technique) develops their full flavour. Rushing this stage means flat, unintegrated spice flavour in the final dish.' },
    { id: 's4', title: 'Add spinach and simmer', content: 'Stir the blended spinach into the masala base. Simmer 5 minutes. Add the yoghurt one spoon at a time, stirring constantly — it will combine into the sauce rather than curdling. Add garam masala and lemon juice. Taste and adjust salt.', timer_seconds: 300, why_note: 'Garam masala goes in at the end because heat destroys its delicate aromatics — the cardamom and cloves that make garam masala distinctive evaporate quickly. Adding it with the other spices at the start is wasting it. The yoghurt goes in slowly because a sudden temperature shock can cause it to split.' },
    { id: 's5', title: 'Add paneer, serve', content: 'Add the golden paneer cubes, stir gently to coat. Simmer 3 minutes — long enough for the flavours to absorb into the paneer crust, not so long it softens again. Serve with basmati rice or naan.', timer_seconds: 180 },
  ],
};

const CHICKEN_KATSU: Recipe = {
  id: 'chicken-katsu',
  title: 'Chicken Katsu',
  tagline: 'Crispy panko chicken with Japanese curry sauce',
  description: 'Chicken katsu — crumbed, fried chicken — would be ordinary if not for the tonkatsu sauce and Japanese curry that go with it. The combination of shatteringly crispy panko crust, juicy chicken, and that sweet-savoury sauce is one of the most satisfying things to eat. The curry here is made from scratch, not from a block.',
  base_servings: 4,
  time_min: 60,
  difficulty: 'Easy',
  tags: ['japanese', 'chicken', 'crispy', 'panko', 'curry'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Andy Hearnden (Andy Cooks)',
    video_url: 'https://www.youtube.com/watch?v=WfRbviqgiSA',
    notes: 'Katsu crumbing technique from Andy\'s Japanese series. Curry sauce made from scratch, not from a Japanese curry block.',
  },
  emoji: '🍱',
  hero_fallback: fallback('#C4960A'),
  categories: { cuisines: ['japanese'], types: ['chicken'] },
  whole_food_verified: true,
  ingredients: [
    { id: 'i1', name: 'Chicken breast fillets', amount: 4, unit: 'large', scales: 'linear', prep: 'Pounded to 1.5cm even thickness — this is critical for even cooking',
      substitutions: [
        { ingredient: 'Chicken thigh fillets, boneless skinless', changes: 'Juicier and more forgiving than breast — harder to overcook. Harder to pound to even thickness. Score the underside deeply and pound gently.', quality: 'good_swap' },
        { ingredient: 'Pork loin steaks, pounded thin', changes: 'Tonkatsu — the pork version that katsu is named for. Same crumbing and sauce. Rich, flavourful, and the superior version many would argue.', quality: 'great_swap' },
        { ingredient: 'Firm fish fillets (flathead, barramundi), skin-off', changes: 'Fish katsu — lighter and more delicate. Reduce fry time to 2–3 minutes per side. Pairs beautifully with the Japanese curry sauce.', quality: 'good_swap', quantity_note: 'reduce fry time to 2–3 minutes per side' },
      ],
    },
    { id: 'i2', name: 'Panko breadcrumbs', amount: 150, unit: 'g', scales: 'linear',
      substitutions: [
        { ingredient: 'Regular dried breadcrumbs', changes: 'Much less crunch — panko has air pockets that create the shatter. Use panko if at all possible.', quality: 'compromise' },
      ],
    },
    { id: 'i3', name: 'Plain flour', amount: 60, unit: 'g', scales: 'linear', prep: 'For the breading station' },
    { id: 'i4', name: 'Eggs', amount: 2, unit: '', scales: 'linear', prep: 'Beaten — for the breading station' },
    { id: 'i5', name: 'Neutral oil', amount: 500, unit: 'ml', scales: 'fixed', prep: 'For shallow-frying — 3–4cm depth in the pan' },
    { id: 'i6', name: 'Salt and white pepper', amount: 1, unit: 'tsp', scales: 'fixed', prep: 'Season the chicken directly, not the flour' },
    { id: 'i7', name: 'Yellow onion', amount: 1, unit: 'large', scales: 'fixed', prep: 'For the curry — thinly sliced',
      substitutions: [
        { ingredient: 'Brown onion', changes: 'Identical to yellow onion in Australian supermarkets — direct swap. Cook the full 12 minutes until deeply golden.', quality: 'perfect_swap' },
        { ingredient: 'Shallots (3–4 large), thinly sliced', changes: 'Milder and sweeter. Caramelise faster — check at 8 minutes. The curry sauce will be slightly more delicate.', quality: 'great_swap', quantity_note: 'check at 8–9 minutes — shallots caramelise faster' },
      ],
    },
    { id: 'i8', name: 'Carrots', amount: 2, unit: 'medium', scales: 'fixed', prep: 'For the curry — cut into rough chunks',
      substitutions: [
        { ingredient: 'Parsnips, roughly chopped', changes: 'Sweeter and earthier than carrot. Blends into the curry sauce beautifully. Adds a different sweetness dimension.', quality: 'great_swap' },
        { ingredient: 'Sweet potato, roughly chopped', changes: 'Softer and sweeter. Adds natural body and sweetness — reduces the need for honey. Blend the same way.', quality: 'great_swap' },
        { ingredient: 'Butternut pumpkin, roughly chopped', changes: 'Sweet and starchy. Blends into a beautifully smooth sauce. Slightly thicker result — add extra stock if needed.', quality: 'great_swap', quantity_note: 'may need an extra splash of stock — pumpkin thickens the sauce more' },
      ],
    },
    { id: 'i9', name: 'Garlic cloves', amount: 4, unit: '', scales: 'fixed', prep: 'For the curry',
      substitutions: [
        { ingredient: 'Garlic paste (1 tsp per clove)', changes: 'Blends smoothly into the sauce. Use 4 tsp total. Reliable shortcut.', quality: 'good_swap', quantity_note: 'use 4 tsp garlic paste total' },
      ],
    },
    { id: 'i10', name: 'Fresh ginger', amount: 3, unit: 'cm', scales: 'fixed', prep: 'For the curry',
      substitutions: [
        { ingredient: 'Ginger paste (1 tsp per cm)', changes: 'Use 3 tsp total. Blends smoothly into the sauce. A reliable shortcut for a cooked dish.', quality: 'good_swap', quantity_note: 'use 3 tsp ginger paste total' },
      ],
    },
    { id: 'i11', name: 'Curry powder', amount: 2.5, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Japanese S&B curry powder', changes: 'The most authentic choice — slightly sweeter and milder than Indian-style curry powder. Direct swap.', quality: 'great_swap', hard_to_find: true, local_alternative: 'Japanese grocers and large Asian supermarkets. Also available online.' },
        { ingredient: 'Madras curry powder', changes: 'Spicier and more assertive. Use 2 tbsp rather than 2.5 — it\'s hotter. The sauce will be less sweet and more complex.', quality: 'good_swap', quantity_note: 'use 2 tbsp Madras curry powder — it\'s spicier than standard' },
      ],
    },
    { id: 'i12', name: 'Garam masala', amount: 1, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: '¼ tsp allspice + ¼ tsp ground cardamom', changes: 'Approximates garam masala\'s warm, aromatic quality. Less complex but works in a curry sauce with many other flavours.', quality: 'compromise', quantity_note: '¼ tsp ground allspice + ¼ tsp ground cardamom per 1 tsp garam masala' },
      ],
    },
    { id: 'i13', name: 'Plain flour', amount: 2, unit: 'tbsp', scales: 'fixed', prep: 'For thickening the curry' },
    { id: 'i14', name: 'Unsalted butter', amount: 30, unit: 'g', scales: 'fixed' },
    { id: 'i15', name: 'Chicken or vegetable stock', amount: 600, unit: 'ml', scales: 'fixed' },
    { id: 'i16', name: 'Soy sauce', amount: 1, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Tamari', changes: 'Gluten-free. Slightly richer and rounder. Direct swap.', quality: 'perfect_swap' },
      ],
    },
    { id: 'i17', name: 'Worcestershire sauce', amount: 1, unit: 'tbsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Soy sauce + splash of apple cider vinegar', changes: 'Approximates Worcestershire\'s savoury-sour notes without anchovies. Good for a pescatarian-friendly version.', quality: 'good_swap', quantity_note: '1 tbsp soy sauce + ½ tsp apple cider vinegar' },
      ],
    },
    { id: 'i18', name: 'Honey or mango chutney', amount: 1, unit: 'tbsp', scales: 'fixed', prep: 'For sweetness — Japanese curry is notably sweeter than Indian',
      substitutions: [
        { ingredient: 'Brown sugar', changes: 'Pure sweetness without the fruitiness of honey. Adjust to taste — brown sugar is more straightforward.', quality: 'good_swap' },
        { ingredient: 'Maple syrup', changes: 'Slightly more complex than honey. Same amount. Works well.', quality: 'good_swap' },
      ],
    },
    { id: 'i19', name: 'Steamed Japanese short-grain rice, to serve', amount: 300, unit: 'g uncooked', scales: 'linear' },
    { id: 'i20', name: 'Shredded cabbage, to serve', amount: 1, unit: 'handful', scales: 'fixed', prep: 'The traditional accompaniment — dressed with a little rice wine vinegar' },
  ],
  steps: [
    { id: 's1', title: 'Make the Japanese curry sauce', content: 'Melt butter in a saucepan on medium. Fry onion 12 minutes until deeply golden. Add garlic and ginger, cook 2 minutes. Add curry powder, garam masala, and flour — stir for 2 minutes to cook the flour. Gradually add stock, whisking to avoid lumps. Add soy sauce, Worcestershire, and honey. Add carrot chunks. Simmer 20 minutes until carrots are soft. Blend until completely smooth.', timer_seconds: 2160, why_note: 'Japanese curry sauce is a roux-thickened affair — hence the flour before the liquid. The deeply golden onion gives sweetness. Blending until completely smooth is what separates it from a stew; it should pour like a sauce, not sit like a chunky gravy. The carrot adds natural sweetness and body.' },
    { id: 's2', title: 'Pound the chicken', content: 'Place chicken between two pieces of baking paper. Pound with a rolling pin or meat mallet from the centre outward until uniformly 1.5cm thick. Season both sides with salt and white pepper.', why_note: 'Uniform thickness means the chicken cooks through at exactly the same moment the crust is golden. Uneven chicken means either raw thick spots or dry thin spots. This step takes 2 minutes and makes a big difference.' },
    { id: 's3', title: 'Set up the breading station and crumb', content: 'Three dishes in a row: flour, beaten egg, panko. Dredge each chicken piece in flour (shake off excess), dip in egg (let excess drip), then press firmly into panko on both sides. Press the panko in — don\'t just scatter it.', why_note: 'The flour-egg-panko sequence creates a system: flour gives the egg something to grip, egg gives the panko something to grip. Pressing the panko in (not just coating) increases surface area and ensures it stays on in the oil rather than floating off.' },
    { id: 's4', title: 'Shallow-fry at 170°C', content: 'Heat oil in a heavy pan to 170°C — use a thermometer. Fry 2 pieces at a time, 4–5 minutes per side until deep golden. The internal temp should hit 74°C. Rest on a wire rack, not paper towel — paper makes the bottom go soggy.', timer_seconds: 540, stage_note: 'Deep golden brown panko, not pale gold. Pale panko is undercooked. The oil should bubble steadily around the chicken.', why_note: '170°C is the sweet spot — hot enough to cook through without burning the panko. 180°C burns the outside before the centre reaches safe temp. 160°C produces pale, oily katsu because moisture can\'t escape fast enough. The wire rack keeps air circulating under the crust.' },
    { id: 's5', title: 'Slice and serve', content: 'Slice each piece on the diagonal into thick strips — this is the traditional presentation and makes them easy to eat with chopsticks or a fork. Fan them over steamed rice. Pour the curry sauce next to (not over) the chicken, so the crust stays crispy. Add shredded cabbage on the side.', why_note: 'Pouring sauce over the katsu turns the panko crust soggy in about 90 seconds. Serving the sauce alongside preserves the crust for the duration of the meal. Traditional Japanese restaurant plating always separates them.' },
  ],
};

const TOM_YUM: Recipe = {
  id: 'tom-yum',
  title: 'Tom Yum Goong',
  tagline: 'The Thai hot and sour prawn soup — punchy, bright, and properly made',
  description: 'Tom yum goong is Thailand\'s most internationally recognised soup — and also one of the most frequently watered down outside Thailand. The real version is bold: aggressively sour, intensely aromatic, with the prawn and mushroom as supporting acts to the galangal, lemongrass, and kaffir lime. Not a mild broth.',
  base_servings: 4,
  time_min: 35,
  difficulty: 'Easy',
  tags: ['thai', 'soup', 'prawn', 'lemongrass', 'spicy'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Andy Hearnden (Andy Cooks)',
    video_url: 'https://www.youtube.com/watch?v=ZcGqfJSo5hU',
    notes: 'Tom yum goong (prawn version). Follows traditional Thai hawker method — aromatic ingredients are left in the bowl to infuse, not strained out.',
  },
  emoji: '🍲',
  hero_fallback: fallback('#C44A2A'),
  categories: { cuisines: ['thai'], types: ['seafood'] },
  whole_food_verified: true,
  ingredients: [
    { id: 'i1', name: 'Raw prawns, shell-on', amount: 500, unit: 'g', scales: 'linear', prep: 'Peel and devein, reserve shells for stock',
      substitutions: [
        { ingredient: 'Chicken breast, sliced thinly', changes: 'Tom yum gai — equally traditional and very popular. Reduce cooking time to 3–4 minutes. Skip the prawn stock step and use all chicken stock.', quality: 'good_swap' },
        { ingredient: 'Mixed seafood (squid, scallop, prawn)', changes: 'Works beautifully. Add firmer items (squid) first, tender items (scallop) last. Maximum 2–3 minutes total for seafood.', quality: 'good_swap', quantity_note: 'cook squid first 90 seconds, then scallops 60 seconds' },
        { ingredient: 'Mushrooms only (vegetarian)', changes: 'Tom yum hed — a vegetarian version. Use 300g mixed mushrooms. Swap chicken stock for vegetable stock. Swap fish sauce for soy sauce.', quality: 'good_swap' },
      ],
    },
    { id: 'i2', name: 'Chicken stock', amount: 1, unit: 'litre', scales: 'linear',
      substitutions: [
        { ingredient: 'Vegetable stock', changes: 'Vegetarian/vegan base. Use with the mushroom-only protein option. Less savoury depth — compensate with an extra tablespoon of soy sauce.', quality: 'good_swap' },
        { ingredient: 'Prawn stock (from shells only)', changes: 'If you have a lot of prawn shells — make stock from 100% prawn shells for maximum prawn flavour intensity. Skip the chicken stock entirely.', quality: 'great_swap', quantity_note: 'toast shells, cover with 1.2 litres water, simmer 20 minutes, strain' },
      ],
    },
    { id: 'i3', name: 'Lemongrass stalks', amount: 3, unit: '', scales: 'fixed', prep: 'Bash with back of knife, cut into 4cm lengths',
      substitutions: [
        { ingredient: 'Lemongrass paste (1 tsp per stalk)', changes: 'Add to the broth instead of bashing whole stalks. Use 3 tsp total — strain the broth before serving if you want a cleaner result, or leave it in.', quality: 'good_swap', quantity_note: 'use 3 tsp lemongrass paste total' },
        { ingredient: 'Lemon zest + a strip of lime peel', changes: 'Provides citrus but not the distinctive floral-herbal lemongrass complexity. The soup will be simpler and less fragrant.', quality: 'compromise' },
      ],
    },
    { id: 'i4', name: 'Galangal', amount: 5, unit: 'cm', scales: 'fixed', prep: 'Peeled, sliced into coins',
      substitutions: [
        { ingredient: 'Fresh ginger', changes: 'Sharper, less piney flavour. Still makes a good soup — different character.', quality: 'compromise' },
      ],
    },
    { id: 'i5', name: 'Kaffir lime leaves', amount: 6, unit: '', scales: 'fixed', prep: 'Torn in half — releases oil from the midrib',
      substitutions: [
        { ingredient: 'Lime zest (2 tsp, freshly grated)', changes: 'Provides citrus brightness but lacks the distinctive floral-herbal kaffir complexity. The broth will taste simpler. Add at the end with the lime juice for maximum fragrance.', quality: 'compromise', quantity_note: 'use zest of 1 lime per 6 kaffir lime leaves', hard_to_find: true, local_alternative: 'Asian grocers stock kaffir lime leaves fresh and frozen. Frozen keeps well for months.' },
      ],
    },
    { id: 'i6', name: 'Bird\'s eye chillies', amount: 6, unit: '', scales: 'fixed', prep: 'Bashed — adjust to your heat preference',
      substitutions: [
        { ingredient: 'Long red chillies', changes: 'Milder, more fruity heat. Use double the quantity.', quality: 'compromise' },
      ],
    },
    { id: 'i7', name: 'Thai shallots', amount: 4, unit: '', scales: 'fixed', prep: 'Halved',
      substitutions: [
        { ingredient: 'Small French shallots', changes: 'Slightly milder and more rounded than Thai shallots. Works identically in the broth. Halve them the same way.', quality: 'good_swap' },
        { ingredient: 'Small red eschalots (banana shallots), halved', changes: 'Larger than Thai shallots — use 2 large banana shallots. Same mild, sweet onion flavour.', quality: 'good_swap', quantity_note: 'use 2 large banana shallots, quartered' },
      ],
    },
    { id: 'i8', name: 'Oyster mushrooms or straw mushrooms', amount: 150, unit: 'g', scales: 'linear', prep: 'Torn into pieces',
      substitutions: [
        { ingredient: 'Swiss brown (cremini) mushrooms, sliced', changes: 'Earthier and more robust. A practical substitute — widely available. Slice thinly so they cook through in 5 minutes.', quality: 'good_swap' },
        { ingredient: 'Enoki mushrooms', changes: 'Very delicate and visually striking. Add in the last 2 minutes only — they go mushy fast.', quality: 'good_swap' },
      ],
    },
    { id: 'i9', name: 'Fish sauce', amount: 4, unit: 'tbsp', scales: 'fixed', prep: 'The primary seasoning — add to taste, not all at once',
      substitutions: [
        { ingredient: 'Light soy sauce', changes: 'Less funky and briny than fish sauce. Vegan alternative. Use slightly less — soy is saltier.', quality: 'good_swap', quantity_note: 'use 3 tbsp soy sauce per 4 tbsp fish sauce' },
      ],
    },
    { id: 'i10', name: 'Lime juice, freshly squeezed', amount: 4, unit: 'tbsp', scales: 'fixed', prep: 'Add at the end — heat kills bright citrus',
      substitutions: [
        { ingredient: 'Lemon juice, freshly squeezed', changes: 'Less floral but similar acidity. Works as a substitute when limes are unavailable or expensive. Use the same amount.', quality: 'good_swap' },
        { ingredient: 'White wine vinegar (reduced amount)', changes: 'Sharp and clean acid. Significantly less floral than lime. Use half the amount and taste — it lacks the tropical note of lime.', quality: 'compromise', quantity_note: 'use 2 tbsp white wine vinegar per 4 tbsp lime juice' },
      ],
    },
    { id: 'i11', name: 'Palm sugar or brown sugar', amount: 1, unit: 'tsp', scales: 'fixed', prep: 'Just enough to balance the sourness',
      substitutions: [
        { ingredient: 'Brown sugar', changes: 'Less complex caramel note than palm sugar but works fine. Direct swap.', quality: 'great_swap' },
        { ingredient: 'Coconut sugar', changes: 'Slightly more mineral and less sweet. Close in character to palm sugar. A natural pairing in Thai cooking.', quality: 'great_swap' },
        { ingredient: 'Honey', changes: 'More floral. Use half the amount — honey is sweeter than palm sugar. Stir in after removing from heat.', quality: 'good_swap', quantity_note: 'use ½ tsp honey per 1 tsp palm sugar' },
      ],
    },
    { id: 'i12', name: 'Fresh coriander', amount: 1, unit: 'large handful', scales: 'fixed', prep: 'Leaves and tender stems — added at the end',
      substitutions: [
        { ingredient: 'Thai basil leaves', changes: 'Anise-like and aromatic — works very well in a Thai broth. Different from coriander but equally authentic. Add at the end the same way.', quality: 'great_swap' },
        { ingredient: 'Flat-leaf parsley', changes: 'For those who dislike coriander. Fresh and herbal without the citrus-soapy note. Lacks the South-East Asian character but is inoffensive.', quality: 'compromise' },
      ],
    },
    { id: 'i13', name: 'Spring onions', amount: 2, unit: '', scales: 'fixed', prep: 'Sliced — added at the end',
      substitutions: [
        { ingredient: 'Chives, sliced', changes: 'Milder and more delicate than spring onion. Add at the very end — they wilt immediately in the hot broth. Same visual effect.', quality: 'good_swap' },
      ],
    },
    { id: 'i14', name: 'Nam prik pao (roasted chilli paste)', amount: 2, unit: 'tbsp', scales: 'fixed', prep: 'Optional but traditional — adds smoky depth',
      substitutions: [
        { ingredient: 'Sambal oelek', changes: 'Less smoky, more fresh-chilli forward. Works.', quality: 'compromise', hard_to_find: true, local_alternative: 'Asian grocers. Worth having in the fridge for Thai cooking generally.' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Make prawn stock from shells', content: 'Toast prawn shells in a dry pot 2–3 minutes until fragrant. Add chicken stock. Bring to boil, simmer 10 minutes, strain — discard shells. This concentrates the prawn flavour into the base.', timer_seconds: 780, why_note: 'Same principle as the laksa prawn stock. The glutamates and iodine compounds from the prawn shells dissolve rapidly into the stock, adding a depth that plain chicken stock can\'t provide.' },
    { id: 's2', title: 'Simmer the aromatics', content: 'To the strained stock, add lemongrass, galangal, kaffir lime leaves, shallots, and chillies. Bring to a boil, reduce to a vigorous simmer — 10 minutes. Don\'t strain these out: they stay in the bowl.', timer_seconds: 600, why_note: 'The aromatics release their volatile oils into the stock during simmering. They are also left in the final bowl — not as things you eat (galangal is woody and inedible) but as visual signals of authenticity and as continuing flavour infusers while you eat. Straining them out is a westernisation.' },
    { id: 's3', title: 'Add mushrooms and cook', content: 'Add mushrooms and nam prik pao if using. Simmer 5 minutes.', timer_seconds: 300, why_note: 'Mushrooms need 3–5 minutes to soften and release their glutamates into the broth. Adding them with the prawns means one will be overcooked by the time the other is done.' },
    { id: 's4', title: 'Season the broth', content: 'Add fish sauce and palm sugar. Taste the broth — it should be intensely savoury, pleasantly salty, with a hint of sweetness. Adjust. The sourness comes in the next step after the heat is off.', why_note: 'Season without the lime juice first. Lime juice in a hot pot evaporates and tastes flat — you end up adding more and more to compensate. Adding it off-heat preserves the bright, sharp citrus that defines the soup.' },
    { id: 's5', title: 'Add prawns, finish, serve immediately', content: 'Add prawns to the simmering broth. Cook exactly 2 minutes — they should just turn opaque. Remove from heat immediately. Add lime juice, coriander, and spring onions. Taste one more time and adjust. Serve instantly into warmed bowls.', timer_seconds: 120, stage_note: 'Prawns are done when just opaque throughout — about 2 minutes. Do not let them sit in the broth cooking further.', why_note: 'Everything in the final 30 seconds is an off-heat addition. The lime juice is added after the heat source is off. The fresh herbs wilt instantly in the hot broth — that\'s fine, it\'s intended. Serve immediately: this soup does not hold.' },
  ],
};

const BARRAMUNDI: Recipe = {
  id: 'barramundi-lemon-butter',
  title: 'Pan-Seared Barramundi, Lemon Butter',
  tagline: 'The Australian fish, done right — crispy skin, brown butter, capers',
  description: 'Barramundi is Australia\'s best fish — firm, sweet, and forgiving. The skin is the prize: when properly pan-seared, it crisps like crackling. The lemon-caper brown butter is the classic accompaniment and the whole thing comes together in 12 minutes.',
  base_servings: 4,
  time_min: 20,
  difficulty: 'Easy',
  tags: ['australian', 'fish', 'seafood', 'quick', 'pan-fry'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Hone Kitchen',
    notes: 'Original in-house recipe. The dry-skin technique is standard professional kitchen practice.',
  },
  emoji: '🐟',
  hero_fallback: fallback('#4A8090'),
  categories: { cuisines: ['australian'], types: ['seafood'] },
  whole_food_verified: true,
  ingredients: [
    { id: 'i1', name: 'Barramundi fillets, skin-on', amount: 4, unit: '180g portions', scales: 'linear', prep: 'Pat completely dry with paper towel — the dryer the skin, the crispier it gets',
      substitutions: [
        { ingredient: 'Snapper fillets, skin-on', changes: 'Slightly more delicate and sweeter than barramundi. Same technique. One of the best Australian fish for pan-searing.', quality: 'great_swap' },
        { ingredient: 'Salmon fillets, skin-on', changes: 'Richer and more assertive flavour — highly fatty skin needs slightly lower heat (medium rather than high) to render without burning.', quality: 'good_swap', quantity_note: 'use medium-high heat instead of high — salmon skin is fattier and burns faster' },
        { ingredient: 'Kingfish fillets, skin-on', changes: 'Premium Australian choice. Firm, sweet, and richly flavoured. Treat identically to barramundi.', quality: 'great_swap' },
        { ingredient: 'Flathead fillets, skin-on', changes: 'Delicate, white, and sweet — classic Australian fish. Slightly thinner than barramundi so check at 4 minutes rather than 5–6.', quality: 'great_swap', quantity_note: 'check at 4 minutes skin-side — flathead is thinner than barramundi' },
      ],
    },
    { id: 'i2', name: 'Unsalted butter', amount: 80, unit: 'g', scales: 'fixed', prep: 'Divided: 20g for the pan, 60g for the butter sauce',
      substitutions: [
        { ingredient: 'Clarified butter (ghee)', changes: 'Higher smoke point — less risk of burning in the initial hot sear. Equally nutty when browned. A practical improvement for this high-heat application.', quality: 'great_swap' },
        { ingredient: 'Salted butter', changes: 'Reduce or eliminate added salt in the dish. The lemon-caper-butter sauce will be quite salty with salted butter — taste before seasoning.', quality: 'good_swap', quantity_note: 'reduce or skip added salt — salted butter adds significant sodium' },
      ],
    },
    { id: 'i3', name: 'Neutral oil', amount: 2, unit: 'tbsp', scales: 'fixed', prep: 'Mixed with butter in the pan to raise the smoke point' },
    { id: 'i4', name: 'Capers', amount: 2, unit: 'tbsp', scales: 'fixed', prep: 'Rinsed and patted dry — wet capers spit violently in hot butter',
      substitutions: [
        { ingredient: 'Cornichons, finely chopped', changes: 'More vinegary and less salty than capers. Adds the same acidic brightness. Use the same amount.', quality: 'good_swap' },
        { ingredient: 'Green olives, pitted and roughly chopped', changes: 'Brininess with more body than capers. Slightly oily — pat them dry. Changes the sauce character toward Mediterranean.', quality: 'good_swap' },
      ],
    },
    { id: 'i5', name: 'Lemon', amount: 2, unit: '', scales: 'fixed', prep: '1 juiced, 1 sliced into rounds for garnish',
      substitutions: [
        { ingredient: 'Lime', changes: 'More floral and tropical than lemon. Works very well with barramundi — a natural Australian pairing. The garnish rounds are smaller but the visual impact is similar.', quality: 'great_swap' },
      ],
    },
    { id: 'i6', name: 'Garlic cloves', amount: 2, unit: '', scales: 'fixed', prep: 'Thinly sliced' },
    { id: 'i7', name: 'Flat-leaf parsley', amount: 1, unit: 'small handful', scales: 'fixed', prep: 'Roughly chopped',
      substitutions: [
        { ingredient: 'Fresh dill', changes: 'Classic pairing with fish. Sweet, anise-like, and delicate. Don\'t add with heat — stir in off heat like the parsley.', quality: 'great_swap' },
        { ingredient: 'Fresh tarragon', changes: 'French classic with fish and brown butter. More assertive than parsley — use half the quantity.', quality: 'great_swap', quantity_note: 'use half the quantity — tarragon is more potent' },
      ],
    },
    { id: 'i8', name: 'Salt and white pepper', amount: 1, unit: 'tsp', scales: 'fixed', prep: 'Season skin-side only just before cooking — salt on skin too early draws moisture' },
    { id: 'i9', name: 'Asparagus or green beans, to serve', amount: 200, unit: 'g', scales: 'linear', prep: 'Blanched 2 minutes',
      substitutions: [
        { ingredient: 'Broccolini, blanched 2 minutes', changes: 'Slightly more bitter and robust than asparagus. Great with the brown butter.', quality: 'great_swap' },
        { ingredient: 'Sugar snap peas', changes: 'Sweet and crunchy. Blanch 90 seconds only to keep the snap. A lighter, fresher garnish.', quality: 'great_swap' },
      ],
    },
  ],
  steps: [
    { id: 's1', title: 'Dry the fish thoroughly', content: 'At least 30 minutes before cooking, lay the fillets skin-side up on a wire rack over a tray. Pat with paper towel. Leave uncovered in the fridge — the cold, dry air desiccates the skin surface. This step is the difference between crispy and flabby.', timer_seconds: 1800, why_note: 'Fish skin contains a lot of moisture. That moisture vaporises when it hits the hot pan, creating steam between the skin and the pan surface — steam is what makes skin stick and stay pale. A completely dry skin contact-fries immediately, achieving the Maillard reaction that creates the crisp you want.' },
    { id: 's2', title: 'Get the pan properly hot', content: 'Heat a stainless steel or cast iron pan on high for 3 minutes. Add oil and 20g butter. The butter will foam immediately — wait for the foam to subside before adding fish. If the foam hasn\'t subsided in 30 seconds, it\'s not hot enough.', timer_seconds: 210, why_note: 'Butter foams as water evaporates. Once the foam subsides, the butter solids have started to colour — this is the exact right moment to add the fish. Add it too early (in the foam) and the skin steams; add it too late (butter browning) and the skin burns before the flesh is cooked.' },
    { id: 's3', title: 'Sear skin-side down — resist touching it', content: 'Season the skin side with salt and white pepper. Lay fillets in the pan skin-side down. Press firmly for 10 seconds with a spatula to prevent curling. Cook on high heat 5–6 minutes WITHOUT MOVING. The fish is ready to flip when the flesh is opaque about ¾ of the way up the side.', timer_seconds: 360, stage_note: 'Opacity rising ¾ up the fillet. Skin should be pulling away from the pan without sticking.', why_note: 'The long undisturbed sear is counterintuitive — it feels like it should be checked. But lifting the fish before the skin has fully rendered and crisped means it tears and sticks. The skin releases naturally when it\'s ready. The 5–6 minutes completes about 85% of the cooking — the residual heat after flipping finishes the rest.' },
    { id: 's4', title: 'Flip and finish briefly', content: 'Flip the fillets flesh-side down. Cook 60–90 seconds only. Remove to a warm plate, skin-side up — never rest fish on the crispy side or it steams against the plate.', timer_seconds: 90, why_note: 'Barramundi is done when it just flakes at the thickest point — about 60°C internal. The flesh side needs almost no time because it\'s already 85% cooked from the skin-side sear. Resting skin-side up preserves the crispiness by allowing steam to escape upwards instead of condensing against a plate.' },
    { id: 's5', title: 'Make brown butter and plate', content: 'Turn heat to medium. Add remaining 60g butter to the pan — it will foam. Add garlic slices and cook 30 seconds, then add capers. When butter turns golden-brown and smells nutty — about 90 seconds — remove from heat. Add lemon juice. It will spit. Spoon over the fish. Scatter parsley.', timer_seconds: 90, stage_note: 'Butter should be golden-brown with a nutty smell — not dark brown or black. It happens fast.', why_note: 'Beurre noisette — brown butter — has a nutty, toffee-like flavour created by Maillard reactions in the milk solids. It\'s completely different from plain melted butter. Adding the lemon juice off-heat stops the browning instantly and deglazes any good bits from the pan.' },
  ],
};

const PAVLOVA: Recipe = {
  id: 'pavlova',
  title: 'Australian Pavlova',
  tagline: 'Crunchy shell, marshmallow centre, fresh cream and fruit — the national dessert',
  description: 'The meringue debate (Australia vs. New Zealand) is amusing but beside the point. What matters is the technique: getting that shatteringly crisp outer shell with the gooey, sticky marshmallow centre that makes pavlova what it is. Most failures come from oven temperature and humidity — address both and it\'s not as difficult as it seems.',
  base_servings: 8,
  time_min: 150,
  difficulty: 'Intermediate',
  tags: ['australian', 'dessert', 'meringue', 'cream', 'fruit'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Donna Hay',
    video_url: 'https://www.youtube.com/watch?v=qknVSyzmuo4',
    notes: 'Technique from Donna Hay\'s pavlova masterclass. The cornflour-and-vinegar method is the standard Australian pavlova approach.',
  },
  emoji: '🍓',
  hero_fallback: fallback('#F5F0E8'),
  categories: { cuisines: ['australian'], types: ['baking'] },
  whole_food_verified: true,
  ingredients: [
    { id: 'i1', name: 'Egg whites, at room temperature', amount: 6, unit: 'large', scales: 'linear', prep: 'Separated at least 30 minutes before — warm egg whites whip to greater volume than cold ones',
      substitutions: [
        { ingredient: 'Aquafaba (chickpea liquid)', changes: 'Vegan substitute. Use 45ml per egg white. Whips to a stable meringue but marshmallow centre is less pronounced.', quality: 'compromise' },
      ],
    },
    { id: 'i2', name: 'Caster sugar', amount: 300, unit: 'g', scales: 'linear', prep: 'Must be superfine — granulated sugar doesn\'t dissolve and leaves a grainy meringue',
      substitutions: [
        { ingredient: 'Blitz regular white sugar in blender 30 seconds', changes: 'Creates a superfine sugar. No difference in result.', quality: 'good_swap' },
      ],
    },
    { id: 'i3', name: 'White wine vinegar', amount: 1, unit: 'tsp', scales: 'fixed', prep: 'Acid stabilises the meringue and contributes to the marshmallow centre',
      substitutions: [
        { ingredient: 'Cream of tartar', changes: 'A more potent stabiliser — use less. Same marshmallow effect.', quality: 'great_swap', quantity_note: 'use ¼ tsp cream of tartar per 1 tsp white wine vinegar' },
        { ingredient: 'Fresh lemon juice', changes: 'Works identically to white wine vinegar. Same amount.', quality: 'perfect_swap' },
      ],
    },
    { id: 'i4', name: 'Cornflour', amount: 2, unit: 'tsp', scales: 'fixed', prep: 'Creates the marshmallow interior — do not skip',
      substitutions: [
        { ingredient: 'Arrowroot powder', changes: 'Gluten-free alternative. Same marshmallow result. Use the same amount.', quality: 'perfect_swap' },
      ],
    },
    { id: 'i5', name: 'Vanilla extract', amount: 1, unit: 'tsp', scales: 'fixed',
      substitutions: [
        { ingredient: 'Vanilla bean paste', changes: 'More intense vanilla flavour with visible seeds. Use the same amount. An upgrade.', quality: 'great_swap' },
      ],
    },
    { id: 'i6', name: 'Double cream', amount: 400, unit: 'ml', scales: 'linear', prep: 'Cold — whip to soft peaks just before serving',
      substitutions: [
        { ingredient: 'Thickened cream', changes: 'Australian standard whipping cream — behaves identically to double cream for this application. Direct swap.', quality: 'perfect_swap' },
      ],
    },
    { id: 'i7', name: 'Passionfruit', amount: 6, unit: '', scales: 'linear',
      substitutions: [
        { ingredient: 'Mango, diced', changes: 'Sweet and tropical — excellent in summer. No sourness to contrast the sweetness of the meringue, so add a squeeze of lime juice.', quality: 'great_swap' },
        { ingredient: 'Lemon curd', changes: 'Intensely sharp and tangy — a spectacular contrast with the sweet meringue. Spoon it into the cream hollow instead of passionfruit.', quality: 'great_swap' },
      ],
    },
    { id: 'i8', name: 'Strawberries', amount: 250, unit: 'g', scales: 'linear', prep: 'Hulled, halved',
      substitutions: [
        { ingredient: 'Raspberries', changes: 'More tart and intensely flavoured than strawberries. Don\'t need to be cut. Visually stunning against white meringue.', quality: 'great_swap' },
        { ingredient: 'Mixed summer berries (blueberries, raspberries, blackberries)', changes: 'Variety of flavours and textures. The full summer berry pavlova — a classic option.', quality: 'great_swap' },
      ],
    },
    { id: 'i9', name: 'Kiwi fruit', amount: 2, unit: '', scales: 'linear', prep: 'Peeled, sliced',
      substitutions: [
        { ingredient: 'Banana, sliced', changes: 'Softer and sweeter than kiwi. Less visual contrast against the white cream. Add just before serving — banana browns fast.', quality: 'good_swap' },
        { ingredient: 'Green grapes, halved', changes: 'Similar colour and visual lightness to kiwi. Sweet rather than tart — pairs well with the passionfruit.', quality: 'good_swap' },
      ],
    },
    { id: 'i10', name: 'Icing sugar', amount: 1, unit: 'tbsp', scales: 'fixed', prep: 'To sweeten the cream' },
  ],
  steps: [
    { id: 's1', title: 'Set up the oven and prepare your equipment', content: 'Preheat oven to 150°C (not fan — fan creates uneven browning). Draw a 22cm circle on baking paper, flip it ink-side down onto a baking tray. Your bowl and whisk must be completely grease-free — wipe with a cut lemon and dry. Even a trace of fat collapses egg white foam.', why_note: 'Fat — even residual dish soap — disrupts the protein network that makes meringue foam. Egg white foam is stabilised by protein strands linking together; fat molecules insert between them and prevent bonding. The lemon-wipe is standard professional technique. The 150°C starting temperature sets the meringue without rapid browning.' },
    { id: 's2', title: 'Whip egg whites to soft peaks', content: 'Beat egg whites on medium speed until white and foamy with soft peaks — about 3 minutes. The peaks should curl over when you lift the whisk. Do not over-beat to stiff peaks at this stage.', timer_seconds: 180, stage_note: 'Soft peaks: the foam holds its shape but the tips curl over. Firm but not dry.', why_note: 'Starting the sugar addition at soft peaks (not foamy, not stiff) gives the optimal base. Too early and the sugar can\'t integrate; too late and the meringue becomes dry and grainy when the sugar is added.' },
    { id: 's3', title: 'Add sugar gradually', content: 'With the mixer running, add caster sugar one tablespoon at a time, waiting 30 seconds between each addition. The full process takes about 8 minutes. When all sugar is incorporated, the meringue should be thick, glossy, and completely smooth — rub a little between your fingers; no grittiness means the sugar has dissolved.', timer_seconds: 480, stage_note: 'Glossy, thick, and smooth. No sugar grit between your fingers.', why_note: 'Adding sugar too fast dilutes the protein network before it can stabilise. The gradual addition allows the sugar to dissolve completely and integrate into a stable foam. Dissolved sugar = smooth, glossy meringue. Undissolved sugar = grainy texture and weeping after baking.' },
    { id: 's4', title: 'Fold in the secret ingredients', content: 'By hand, gently fold in vinegar, cornflour, and vanilla. Fold just until combined — 8–10 strokes. No electric mixer here; the cornflour would collapse the structure.', why_note: 'Cornflour and vinegar together create the marshmallow interior — they interfere with full starch gelatinisation, creating a soft, sticky centre rather than a completely set meringue. Vinegar (acid) tightens the protein network, giving a crisper crust. Overmixing at this stage deflates the foam.' },
    { id: 's5', title: 'Shape and start baking, then lower temperature', content: 'Pile the meringue onto the traced circle. Shape with a spatula — build high sides and a slight hollow in the centre (for the cream later). Put in the oven at 150°C for 5 minutes, then WITHOUT OPENING THE DOOR reduce to 120°C. Bake 1 hour 20 minutes.', timer_seconds: 4800, why_note: 'The initial blast at 150°C sets the outer crust before the internal heat reduces. Opening the door to adjust temperature would cause collapse. The long, low bake dries the inside without browning the outside. The hollow in the centre is where the marshmallow and cream live.' },
    { id: 's6', title: 'Cool in the oven — do not rush this', content: 'Turn the oven off. Leave the pavlova inside with the door ajar for at least 1 hour — ideally 2. Do not remove it to cool on a bench. The gradual temperature drop is why it doesn\'t crack.', timer_seconds: 3600, why_note: 'Rapid temperature change is the main cause of pavlova cracking. The outer shell contracts faster than the interior when shocked by cool air. Oven-cooling keeps the exterior and interior cooling at the same rate. A cracked pavlova still tastes the same — but a cream top hides it if needed.' },
    { id: 's7', title: 'Top and serve', content: 'Just before serving (not hours ahead), whip cold cream with icing sugar to soft peaks. Spoon into the hollow. Top with passionfruit pulp, strawberries, and kiwi. Serve immediately — assembled pavlova doesn\'t hold more than an hour before the cream soaks in.', why_note: 'The cream softens the meringue from the base up over time. Assembled too early, the whole thing collapses into a sweet cream puddle. Beautiful pavlova has contrasting textures — crisp shell, marshmallow interior, cloud cream, fresh fruit. All of that requires last-minute assembly.' },
  ],
};

const FLOUR_TORTILLAS: Recipe = {
  id: 'flour-tortillas',
  title: 'Flour Tortillas',
  tagline: "Patrick's hand-rolled flour tortillas — paper-thin and impossibly soft",
  base_servings: 5,
  time_min: 90,
  difficulty: 'Intermediate',
  tags: ['mexican', 'bread', 'weekend', 'from-scratch'],
  user_added: false,
  generated_by_claude: false,
  source: {
    chef: 'Patrick Nasr',
    notes: 'Original recipe — developed through testing to find the right flour protein level and technique for the home kitchen.',
  },
  emoji: '🫓',
  hero_fallback: fallback('#C8A96E'),
  ingredients: [
    {
      id: 'i1',
      name: 'Bread flour, high protein (~12.5g per 100g)',
      amount: 200,
      unit: 'g',
      scales: 'linear',
      prep: 'Lighthouse brand recommended — available at Coles and Woolworths but sells out quickly',
      substitutions: [
        {
          ingredient: 'Plain flour',
          changes: "Works in a pinch but won't stretch as thin. Check the nutrition label and aim for the highest protein you can find — anything above 10g per 100g is a step in the right direction.",
          quality: 'good_swap',
        },
      ],
    },
    {
      id: 'i2',
      name: 'Lard',
      amount: 40,
      unit: 'g',
      scales: 'linear',
      prep: '30–50g to taste — more lard gives a flakier, richer tortilla',
      substitutions: [
        {
          ingredient: 'Unsalted butter, softened',
          changes: "Slightly less flaky but still delicious. Make sure it's softened, not melted — melted butter coats the flour differently and you lose the fine breadcrumb texture in the rubbing step.",
          quality: 'great_swap',
        },
        {
          ingredient: 'Coconut oil, solid',
          changes: 'Vegan option. Adds a subtle sweetness that sits pleasantly in a tortilla. Use it solid so you can rub it into the flour properly.',
          quality: 'good_swap',
        },
      ],
    },
    {
      id: 'i3',
      name: 'Hot water',
      amount: 130,
      unit: 'ml',
      scales: 'linear',
      prep: 'Heat to ~60°C — hot to touch but not boiling',
    },
    {
      id: 'i4',
      name: 'Fine sea salt',
      amount: 4,
      unit: 'g',
      scales: 'linear',
      prep: 'About 1¼ teaspoons — weigh it for accuracy',
      substitutions: [
        {
          ingredient: 'Kosher salt',
          changes: "Use the same weight, not volume — kosher salt is fluffier so a teaspoon weighs significantly less than fine sea salt. Same result if you weigh it correctly.",
          quality: 'perfect_swap',
        },
      ],
    },
  ],
  steps: [
    {
      id: 's1',
      title: 'Weigh everything first',
      content: 'Get your food scale out before anything else. Weigh 200g flour, 4g salt, 40g lard, and measure 130ml water into a separate container. Baking rewards precision — guessing volumes changes the hydration ratio and you end up with different dough every time.',
      why_note: 'One gram of salt is a heaped teaspoon in one brand and a flat half in another. Weight removes that variable entirely. This is non-negotiable for consistent results.',
    },
    {
      id: 's2',
      title: 'Combine flour and salt',
      content: 'Add the flour to a large bowl. Tare your scale, then weigh the salt directly into the bowl and mix through until evenly distributed.',
    },
    {
      id: 's3',
      title: 'Rub in the fat',
      content: 'Add the lard and work it into the flour with your fingertips. Pinch, press, and rub continuously — break up every clump until the mixture looks like fine, even breadcrumbs throughout. No large lumps of fat should remain. This step is worth doing properly.',
      stage_note: 'Look for fine breadcrumbs with no large clumps of fat',
      why_note: "The fat coats the flour proteins before the water goes in — that's what gives tortillas their pliable, short texture rather than a bready chew. Clumpy fat means uneven texture across the tortilla.",
    },
    {
      id: 's4',
      title: 'Add hot water and knead',
      content: 'Heat your water to around 60°C — hot but not scalding. Pour it into the flour mixture and stir until a rough dough forms, then knead for 5–8 minutes until smooth and silky. It will feel tacky at first — keep going. Do not add more flour.',
      timer_seconds: 420,
      why_note: 'Adding flour changes the hydration ratio — fight the urge. The tackiness is the gluten network developing; it resolves with continued kneading. Hot water hydrates the proteins faster and gives you a more extensible dough.',
    },
    {
      id: 's5',
      title: 'Divide into balls',
      content: 'Divide the dough into five pieces of about 40g each. Round each piece in your palm. They don\'t need to be perfect spheres — roughly even is enough.',
    },
    {
      id: 's6',
      title: 'Cover and rest — don\'t rush this',
      content: 'Arrange the dough balls on a plate and cover with a damp tea towel. Alternatively, rub each ball lightly with olive oil so the surface doesn\'t dry out. Rest at room temperature for at least 45–60 minutes.',
      timer_seconds: 2700,
      stage_note: 'If the dough springs back and shrinks when you roll it, cover it and rest another 5 minutes before trying again',
      why_note: 'High-protein flour needs relaxation time or the gluten fights back. Roll the dough too early and it springs back to half the size the moment you take the pin off. That\'s gluten tension — rest is the only way through it.',
    },
    {
      id: 's7',
      title: 'Roll out paper-thin',
      content: 'On a lightly floured surface, roll each ball until paper-thin — 2–3mm thick, roughly the size of a side plate. Work from the centre outward, rotating the dough a quarter-turn between rolls. If a ball resists and springs back, set it aside under the tea towel and move to the next one. Come back after 2–3 minutes.',
    },
    {
      id: 's8',
      title: 'Get the pan ready',
      content: 'Place a cast iron or heavy-based pan over consistent medium heat and let it come to temperature for 2–3 minutes. Test by hovering your hand 5cm above — you should feel steady, even heat.',
      timer_seconds: 120,
      why_note: "Temperature consistency is everything here. Too hot and the surface burns before the dough cooks through. Too cold and the tortilla won't puff on the third flip — the steam can't build fast enough.",
    },
    {
      id: 's9',
      title: 'Cook — three flips',
      content: 'Lay a rolled tortilla flat in the dry pan. Cook about 10 seconds — a few light spots will begin to appear. Flip. Cook 15 seconds on the second side. Flip one more time. On this third flip, the tortilla puffs up like a balloon as steam inflates the pocket between the two layers. When it settles back down slightly, it\'s done.',
      stage_note: 'Watch for the puff on the third flip — that\'s when you know it\'s right',
    },
    {
      id: 's10',
      title: 'Stack in a lidded pot',
      content: 'Transfer each cooked tortilla immediately to a pot with a tight-fitting lid. Before sealing it, lay a clean tea towel over the stack — it absorbs condensation so they don\'t go soggy. Keep stacking each one directly on top of the last as you work through the batch.',
      why_note: "The steam trapped in the pot is what keeps them soft and pliable. Left on a bare plate they cool and stiffen in 2 minutes — the pot gives you 20, easily.",
    },
  ],
  categories: { cuisines: ['mexican'], types: ['baking'] },
  whole_food_verified: true,
};

// ────────────────────────────────────────────────────────────────────────────
//  Export — order reflects hone.html ordering, then kept v0 recipe, then
//  originals at the end.
// ────────────────────────────────────────────────────────────────────────────

export const SEED_RECIPES: Recipe[] = [
  SMASH_BURGER,
  CHICKEN_ADOBO,
  PASTA_CARBONARA,
  BEEF_STEW,
  ROAST_CHICKEN,
  MUSAKHAN,
  KAFTA,
  HUMMUS,
  FATTOUSH,
  PRAWN_TACOS_PINEAPPLE,
  SOURDOUGH_MAINTENANCE,
  SOURDOUGH_LOAF,
  RISOTTO,
  FISH_TACOS,
  THAI_GREEN_CURRY,
  FRENCH_ONION_SOUP,
  PAD_THAI,
  BRAISED_SHORT_RIBS,
  RAMEN,
  BEEF_WELLINGTON,
  DAL,
  SCRAMBLED_EGGS,
  WEEKDAY_BOLOGNESE,
  AGLIO_E_OLIO,
  MUJADARA,
  SHEET_PAN_HARISSA_CHICKEN,
  EGG_FRIED_RICE,
  LAMB_SHAWARMA,
  NASI_LEMAK,
  BEEF_RENDANG,
  CURRY_LAKSA,
  CHAR_KWAY_TEOW,
  BUTTER_CHICKEN,
  SAAG_PANEER,
  CHICKEN_KATSU,
  TOM_YUM,
  BARRAMUNDI,
  PAVLOVA,
  FLOUR_TORTILLAS,
];
