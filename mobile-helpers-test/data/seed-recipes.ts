/**
 * Seed recipes for v0.1 — ported from the mise.html prototype source of truth
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
 * Originals use `chef: 'Simmer Fresh Kitchen'` as source so the schema's refine
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
//  22 ported recipes from mise.html
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
    video_url: 'https://www.youtube.com/@AndyCooks',
  },
  emoji: '🍔',
  hero_fallback: fallback('#8B4513'),
  hero_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Beef mince (80/20 fat)', amount: 200, unit: 'g', scales: 'linear', prep: 'Fat ratio is non-negotiable — leaner beef steams instead of crisping' },
    // Buns: HTML prototype had amount:1 for a 2-serving recipe, which scales oddly
    // (2 people → 1 bun). Corrected to 2 so scaling is intuitive. Each burger uses
    // one whole bun (split top/bottom).
    { id: 'i2', name: 'Burger buns (brioche)', amount: 2, unit: '', scales: 'linear' },
    { id: 'i3', name: 'American cheese slices', amount: 2, unit: '', scales: 'linear' },
    { id: 'i4', name: 'White onion, finely diced', amount: 30, unit: 'g', scales: 'linear' },
    { id: 'i5', name: 'Dill pickles', amount: 4, unit: 'slices', scales: 'linear' },
    // Sauce and salt — HTML marked these 'fixed' but that makes 2 tbsp sauce for
    // 8 people, which is absurd. They're per-patty condiments, so linear is right.
    { id: 'i6', name: 'Burger sauce (mayo + ketchup + mustard)', amount: 2, unit: 'tbsp', scales: 'linear' },
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
    video_url: 'https://www.youtube.com/@Parts-Unknown',
  },
  emoji: '🍗',
  hero_fallback: fallback('#5C3317'),
  hero_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Chicken thighs, bone-in', amount: 800, unit: 'g', scales: 'linear' },
    { id: 'i2', name: 'White cane vinegar', amount: 120, unit: 'ml', scales: 'linear', prep: 'Filipino cane vinegar if you can find it — white wine vinegar works' },
    { id: 'i3', name: 'Soy sauce', amount: 80, unit: 'ml', scales: 'linear' },
    { id: 'i4', name: 'Garlic cloves, crushed', amount: 8, unit: '', scales: 'linear' },
    { id: 'i5', name: 'Bay leaves', amount: 4, unit: '', scales: 'fixed' },
    { id: 'i6', name: 'Black peppercorns, whole', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i7', name: 'Neutral oil', amount: 1, unit: 'tbsp', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Brown the chicken', content: 'Heat oil in a wide pan over high heat. Brown chicken thighs skin-side down for 5 minutes without moving. They should release when the skin is properly crisp. Flip, 2 more minutes.', timer_seconds: 300, why_note: 'The browning creates complex flavour compounds (Maillard) that the braising liquid will carry throughout the dish. Skipping this makes adobo flat and grey.' },
    { id: 's2', title: 'Add everything and braise', content: 'Add vinegar, soy sauce, garlic, bay leaves, and peppercorns. Bring to a boil, then reduce to a low simmer. Cover and cook 25 minutes.', timer_seconds: 1500, why_note: "The acid in the vinegar breaks down collagen in the thighs to gelatin — that's what gives adobo its silky, clingy sauce. Low heat keeps the muscle fibres from seizing up." },
    { id: 's3', title: 'Reduce the sauce', content: 'Remove the lid, turn heat up to medium. Cook 10–15 minutes until the sauce reduces by half and turns glossy and mahogany-coloured.', timer_seconds: 600, why_note: "Reducing concentrates the sugar and amino acids into a glaze. The colour change from light brown to mahogany is your signal — it's Maillard happening in the liquid." },
    { id: 's4', title: 'Serve over rice', content: 'Serve immediately over steamed white rice. The sauce is the point — make sure every plate gets a generous spoonful.' },
  ],
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
    video_url: 'https://www.youtube.com/@GordonRamsay',
  },
  emoji: '🍝',
  hero_fallback: fallback('#C8963C'),
  hero_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Spaghetti or rigatoni', amount: 160, unit: 'g', scales: 'linear' },
    { id: 'i2', name: 'Guanciale (or pancetta)', amount: 100, unit: 'g', scales: 'linear' },
    { id: 'i3', name: 'Egg yolks', amount: 3, unit: '', scales: 'linear' },
    { id: 'i4', name: 'Whole egg', amount: 1, unit: '', scales: 'fixed' },
    { id: 'i5', name: 'Pecorino Romano, finely grated', amount: 60, unit: 'g', scales: 'linear' },
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
    video_url: 'https://www.youtube.com/@jacquespepin',
  },
  emoji: '🥘',
  hero_fallback: fallback('#6B3A2A'),
  hero_url: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Beef chuck, 4cm cubes', amount: 700, unit: 'g', scales: 'linear' },
    { id: 'i2', name: 'Carrots, cut in chunks', amount: 300, unit: 'g', scales: 'linear' },
    { id: 'i3', name: 'Potatoes, cut in chunks', amount: 400, unit: 'g', scales: 'linear' },
    { id: 'i4', name: 'Onion, roughly chopped', amount: 200, unit: 'g', scales: 'linear' },
    { id: 'i5', name: 'Tomato paste', amount: 2, unit: 'tbsp', scales: 'fixed' },
    { id: 'i6', name: 'Red wine', amount: 200, unit: 'ml', scales: 'linear' },
    { id: 'i7', name: 'Beef stock', amount: 500, unit: 'ml', scales: 'linear' },
    { id: 'i8', name: 'Thyme sprigs', amount: 4, unit: '', scales: 'fixed' },
    { id: 'i9', name: 'Bay leaves', amount: 2, unit: '', scales: 'fixed' },
    { id: 'i10', name: 'Plain flour', amount: 2, unit: 'tbsp', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Season and sear in batches', content: 'Season beef generously. Sear in hot oil in batches — never crowd the pan. Each piece needs 2 minutes undisturbed on each side until deeply browned. Set aside.', why_note: 'Crowding drops the pan temperature below 120°C and the meat steams instead of browns. Steam = grey, flavourless exterior. Batch searing keeps the pan hot.' },
    { id: 's2', title: 'Build the base', content: 'In the same pot, soften onion 5 minutes. Add tomato paste, stir 2 minutes until it darkens. This is caramelising the paste — it loses its raw tin taste and becomes nutty.', timer_seconds: 300, why_note: 'Raw tomato paste tastes acidic and one-dimensional. Cooking it in fat triggers the Maillard reaction, converting the sugars and developing complex savoury notes.' },
    { id: 's3', title: 'Flour and deglaze', content: 'Return the beef. Sprinkle flour over everything and stir to coat. Add wine, scraping up every browned bit from the bottom. Those bits are pure flavour.', why_note: 'The flour coats the meat in a thin layer that thickens the stew as it cooks. The fond (browned bits) contains concentrated Maillard compounds — deglazing recovers them.' },
    { id: 's4', title: 'Braise low and slow', content: 'Add stock, thyme, bay leaves. Liquid should just cover the meat. Bring to a bare simmer — not a boil. Cover and cook 1.5 hours.', timer_seconds: 5400, why_note: 'Collagen in chuck converts to gelatin between 70–80°C over extended time — this is what makes stew silky. Boiling instead of simmering makes the meat tough and stringy.' },
    { id: 's5', title: 'Add veg and finish', content: 'Add carrots and potatoes. Continue simmering, uncovered, 30–40 minutes until vegetables are tender and sauce has thickened.', timer_seconds: 1800, why_note: 'Vegetables added early turn to mush. Added in the last 30–40 minutes they cook through without disintegrating. Removing the lid lets steam escape and the sauce reduce and concentrate.' },
  ],
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
    video_url: 'https://www.youtube.com/@thomaskeller',
  },
  emoji: '🐔',
  hero_fallback: fallback('#B8721A'),
  hero_url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Whole chicken', amount: 1.8, unit: 'kg', scales: 'fixed', prep: 'One chicken feeds 4 — buy a bigger bird for more people, not more chickens' },
    { id: 'i2', name: 'Unsalted butter, softened', amount: 60, unit: 'g', scales: 'fixed' },
    { id: 'i3', name: 'Garlic cloves', amount: 4, unit: '', scales: 'fixed' },
    { id: 'i4', name: 'Fresh thyme', amount: 6, unit: 'sprigs', scales: 'fixed' },
    { id: 'i5', name: 'Lemon', amount: 1, unit: '', scales: 'fixed' },
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
    video_url: 'https://www.youtube.com/@reemkassis',
  },
  emoji: '🍗',
  hero_fallback: fallback('#8B3A1A'),
  hero_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Whole chicken, jointed into 8 pieces', amount: 1.6, unit: 'kg', scales: 'linear' },
    { id: 'i2', name: 'Yellow onions, thinly sliced', amount: 1, unit: 'kg', scales: 'linear', prep: 'The onions are half the dish — do not reduce them' },
    { id: 'i3', name: 'Sumac', amount: 5, unit: 'tbsp', scales: 'linear', prep: 'Sumac is the defining flavour. Use a fresh, vivid-red one — stale sumac tastes of nothing' },
    { id: 'i4', name: 'Extra virgin olive oil', amount: 120, unit: 'ml', scales: 'linear', prep: 'Palestinian olive oil if you can find it' },
    { id: 'i5', name: 'Ground allspice', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i6', name: 'Ground cinnamon', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i7', name: 'Ground cardamom', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i8', name: 'Flatbread or taboon (or thick pittas)', amount: 4, unit: 'large', scales: 'linear', prep: 'Taboon is traditional — the bread soaks up the onion and chicken juices underneath' },
    { id: 'i9', name: 'Pine nuts, toasted', amount: 60, unit: 'g', scales: 'linear' },
  ],
  steps: [
    { id: 's1', title: 'Spice-rub and roast the chicken', content: 'Mix half the sumac with allspice, cinnamon, cardamom, salt, and 3 tbsp olive oil. Rub all over chicken pieces. Roast at 200°C for 35–40 minutes until skin is deep golden and juices run clear.', timer_seconds: 2100, why_note: "The spice rub forms a crust that carries sumac's tartness directly on the skin. The acid in sumac also slightly tenderises the surface proteins. Roasting at 200°C gets the skin crisp before the inside overcooks." },
    { id: 's2', title: 'Caramelise the onions with sumac', content: 'While the chicken roasts, cook onions in remaining olive oil over medium-low heat for 30–35 minutes until deep golden and jammy. Add the remaining sumac, stir through. The onions should be sweet, sour, and slightly sticky.', timer_seconds: 1800, why_note: 'Slow-caramelised onions lose their harsh bite and develop sweetness through Maillard and caramelisation reactions. The sumac added at the end retains its bright tartness — adding it too early dulls it and loses the acid contrast.' },
    { id: 's3', title: 'Build on the bread', content: 'Lay flatbreads on a baking tray. Spread the sumac onions generously over them. Place the roasted chicken pieces on top. Drizzle with the roasting pan juices.', why_note: 'The bread is not a side — it is structural. The onion-soaked, juice-drenched bread underneath the chicken is the best part of musakhan. It is meant to go soft and flavour-saturated, not stay crisp.' },
    { id: 's4', title: 'Final oven blast and finish', content: 'Put the assembled dish back in the oven at 200°C for 8–10 minutes until the edges of the bread crisp and the chicken skin re-crisps. Scatter toasted pine nuts and serve immediately.', timer_seconds: 480, why_note: 'The second oven blast revives the chicken skin that softened on top of the moist onions. Pine nuts add texture contrast — toast them until golden-brown, not pale, or they taste of nothing.' },
  ],
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
    video_url: 'https://www.youtube.com/@anissahelou',
  },
  emoji: '🥩',
  hero_fallback: fallback('#8B4A1A'),
  hero_url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Lamb mince (or beef/lamb mix)', amount: 500, unit: 'g', scales: 'linear', prep: 'Higher fat content = juicier kafta. Ask for 20% fat' },
    { id: 'i2', name: 'Onion, very finely grated', amount: 1, unit: 'medium', scales: 'linear', prep: 'Grated, not chopped — the juice is what you want, not chunks' },
    { id: 'i3', name: 'Flat-leaf parsley, very finely chopped', amount: 30, unit: 'g', scales: 'linear' },
    { id: 'i4', name: 'Ground allspice', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i5', name: 'Ground cinnamon', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i6', name: 'Ground cumin', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i7', name: 'Chilli flakes', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i8', name: 'Salt', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i9', name: 'Flat pittas, to serve', amount: 4, unit: '', scales: 'linear' },
    { id: 'i10', name: 'Sumac, for serving', amount: 1, unit: 'tsp', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Mix thoroughly with cold hands', content: 'Combine mince, grated onion (squeeze out some juice first), parsley, and all spices. Mix aggressively with cold hands for 3–4 minutes until the mixture becomes slightly sticky and uniform.', why_note: 'The extended mixing develops the myosin proteins in the meat, which act like glue. This is what lets kafta hold its shape on a skewer over fire without falling apart. Under-mixed kafta crumbles. Cold hands prevent the fat from melting and going greasy.' },
    { id: 's2', title: 'Rest in the fridge', content: 'Cover and refrigerate at least 30 minutes, up to overnight.', timer_seconds: 1800, why_note: 'Resting allows the salt to draw moisture from the onion into the meat, which then reabsorbs. The mixture firms up and the spices bloom into the fat. Kafta cooked straight after mixing is softer and harder to skewer.' },
    { id: 's3', title: 'Shape onto skewers', content: 'Wet your hands. Take a handful of the mix (about 80–90g) and press firmly around a flat metal skewer, forming a flat sausage shape about 15cm long. Squeeze hard at the ends to seal.', why_note: "Flat skewers grip the meat — round skewers spin and the kafta can rotate off. Wetting hands prevents sticking. The hard squeeze at the ends is critical: that's the join that breaks first over heat." },
    { id: 's4', title: 'Grill hard and fast', content: 'Grill over the highest heat possible — charcoal is traditional and makes a genuine difference. 3–4 minutes per side. You want char marks and juicy interior. Do not overcook lamb kafta.', timer_seconds: 240, why_note: 'Lamb fat renders fast and then burns. The window between perfectly charred and dried-out is narrow — under 8 minutes total at high heat. Low heat slowly grey-stews the outside instead of charring it.' },
    { id: 's5', title: 'Serve in flatbread with sumac onions', content: 'Slide the kafta off the skewer into a warm pitta. Add thinly sliced raw onion tossed with sumac and a squeeze of lemon. Serve immediately.' },
  ],
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
    video_url: 'https://www.youtube.com/@reemkassis',
  },
  emoji: '🫘',
  hero_fallback: fallback('#C4A04A'),
  hero_url: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Dried chickpeas', amount: 250, unit: 'g', scales: 'linear', prep: 'Tinned chickpeas make edible hummus. They do not make good hummus.' },
    { id: 'i2', name: 'Good tahini (Palestinian or Lebanese)', amount: 120, unit: 'ml', scales: 'linear', prep: 'Brand matters enormously. Bitter or thin tahini ruins hummus. Taste it raw first — it should be nutty, not bitter.' },
    { id: 'i3', name: 'Lemon juice, freshly squeezed', amount: 60, unit: 'ml', scales: 'linear' },
    { id: 'i4', name: 'Garlic cloves', amount: 2, unit: '', scales: 'fixed' },
    { id: 'i5', name: 'Ice-cold water', amount: 60, unit: 'ml', scales: 'linear' },
    { id: 'i6', name: 'Bicarbonate of soda', amount: 0.5, unit: 'tsp', scales: 'fixed', prep: 'Added to the cooking water — it softens the chickpea skins and lets them blend ultra-smooth' },
    { id: 'i7', name: 'Salt', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i8', name: 'Extra virgin olive oil, to serve', amount: 2, unit: 'tbsp', scales: 'fixed' },
    { id: 'i9', name: 'Paprika and whole chickpeas, to garnish', amount: 1, unit: 'pinch', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Soak overnight', content: 'Cover dried chickpeas with cold water — at least 3× their volume. Soak 12 hours minimum, 24 is better. They will roughly double in size.', why_note: 'Soaking rehydrates the chickpeas so they cook evenly. Unsoaked chickpeas have a hard, grainy centre even after long cooking. The soak water goes slightly acidic and breaks down oligosaccharides that cause gas — discard it.' },
    { id: 's2', title: 'Cook very soft with bicarbonate', content: 'Drain and rinse. Cover with fresh cold water, add bicarbonate of soda. Bring to boil, skim foam. Simmer 1.5–2 hours until completely, utterly soft — they should crush between two fingers with almost no pressure.', timer_seconds: 5400, why_note: 'Bicarbonate of soda raises the pH of the cooking water. In alkaline conditions, pectin in the chickpea cell walls breaks down faster, resulting in a softer, creamier texture. Under-cooked chickpeas give you grainy hummus no matter how long you blend.' },
    { id: 's3', title: 'Blend tahini and lemon first', content: 'In a food processor, blend tahini, lemon juice, and garlic for 1 minute until completely smooth and light-coloured. The mixture will seize and go thick — this is correct.', timer_seconds: 60, why_note: 'Blending tahini before adding chickpeas creates a stable emulsion base. The lemon acid causes the tahini proteins to reorganise into a smoother, fluffier texture. Adding chickpeas to unblended tahini gives a coarser result.' },
    { id: 's4', title: 'Add chickpeas and blend until completely smooth', content: 'Drain chickpeas but save the cooking water. Add hot chickpeas to the tahini mixture. Blend 4–5 minutes straight. Add ice-cold water gradually to achieve a silky, dropping consistency. Season with salt.', timer_seconds: 300, why_note: "Hot chickpeas blend smoother than cold ones — temperature helps break down the starch. The ice-cold water creates a thermal contrast that makes the emulsion fluffier (the same principle as cold butter in mantecatura). Blending 4–5 minutes isn't optional — 1–2 minutes produces gritty hummus." },
    { id: 's5', title: 'Rest and serve warm', content: 'Let the hummus rest 30 minutes before serving — flavours integrate. To serve, spread in a shallow bowl making a well in the centre, fill with olive oil, scatter chickpeas, sprinkle paprika.', timer_seconds: 1800, why_note: 'Freshly blended hummus tastes flat and slightly metallic. The rest allows the lemon, garlic, and tahini flavours to fully integrate. Hummus is at its best at room temperature or slightly warm — cold hummus is firm and mutes the flavour.' },
  ],
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
    video_url: 'https://www.youtube.com/@anissahelou',
  },
  emoji: '🥗',
  hero_fallback: fallback('#6B8C3A'),
  hero_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Stale pitta bread (2 days old)', amount: 2, unit: 'large', scales: 'linear', prep: 'Stale bread fries and stays crunchy. Fresh bread absorbs oil and goes soft immediately.' },
    { id: 'i2', name: 'Romaine lettuce, roughly torn', amount: 1, unit: 'head', scales: 'linear' },
    { id: 'i3', name: 'Tomatoes, cut in wedges', amount: 3, unit: 'medium', scales: 'linear' },
    { id: 'i4', name: 'Cucumber, halved and sliced', amount: 1, unit: 'medium', scales: 'linear' },
    { id: 'i5', name: 'Radishes, thinly sliced', amount: 6, unit: '', scales: 'linear' },
    { id: 'i6', name: 'Spring onions, sliced', amount: 4, unit: '', scales: 'linear' },
    { id: 'i7', name: 'Flat-leaf parsley', amount: 20, unit: 'g', scales: 'linear' },
    { id: 'i8', name: 'Fresh mint leaves', amount: 10, unit: 'g', scales: 'linear' },
    { id: 'i9', name: 'Sumac', amount: 2, unit: 'tsp', scales: 'fixed', prep: "This is the flavour of the dish — don't reduce it" },
    { id: 'i10', name: 'Lemon juice', amount: 3, unit: 'tbsp', scales: 'fixed' },
    { id: 'i11', name: 'Extra virgin olive oil', amount: 4, unit: 'tbsp', scales: 'fixed' },
    { id: 'i12', name: 'Pomegranate molasses', amount: 1, unit: 'tsp', scales: 'fixed', prep: 'Optional but traditional — adds depth and sourness' },
  ],
  steps: [
    { id: 's1', title: 'Fry the bread until shatteringly crisp', content: 'Tear pitta into rough pieces. Shallow-fry in olive oil over medium-high heat until deep golden and rigid. Drain on paper. Season with salt immediately.', why_note: 'The fried bread needs to stay crunchy even after dressing — this only works with stale pitta fried in enough oil at high enough heat. Baked croutons go soft faster. Season while hot because salt sticks to hot, oily surfaces.' },
    { id: 's2', title: 'Make the sumac dressing', content: 'Whisk together lemon juice, olive oil, sumac, pomegranate molasses if using, and salt. Taste: it should be assertively sour and salty.', why_note: 'Sumac is water and fat-soluble — whisking it into both lemon juice and oil distributes it through the whole dressing. Fattoush dressing is intentionally sharp: it needs to cut through the oil-soaked bread.' },
    { id: 's3', title: 'Toss and serve immediately', content: 'Combine all vegetables and herbs in a large bowl. Add the fried bread. Pour over the dressing and toss. Serve within 5 minutes — the bread should still have some crunch.', why_note: 'Fattoush is a race against the bread going soft. The acid in the dressing starts breaking down the crisp surfaces the moment it touches them. Dress and serve; do not let it sit.' },
  ],
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
    video_url: 'https://www.youtube.com/@AndyCooks',
  },
  emoji: '🌮',
  hero_fallback: fallback('#C47820'),
  hero_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Raw tiger prawns, peeled and deveined', amount: 300, unit: 'g', scales: 'linear' },
    { id: 'i2', name: 'Small corn tortillas', amount: 6, unit: '', scales: 'linear' },
    { id: 'i3', name: 'Ancho chilli powder', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i4', name: 'Smoked paprika', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i5', name: 'Ground cumin', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i6', name: 'Garlic powder', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i7', name: 'Fresh pineapple, cut into 1cm rings', amount: 200, unit: 'g', scales: 'linear' },
    { id: 'i8', name: 'Red onion, finely diced', amount: 0.5, unit: '', scales: 'linear' },
    { id: 'i9', name: 'Coriander, chopped', amount: 15, unit: 'g', scales: 'linear' },
    { id: 'i10', name: 'Jalapeño, finely diced', amount: 1, unit: '', scales: 'fixed' },
    { id: 'i11', name: 'Lime', amount: 3, unit: '', scales: 'linear' },
    { id: 'i12', name: 'Chipotle in adobo', amount: 2, unit: 'tsp', scales: 'fixed' },
    { id: 'i13', name: 'Soured cream or crema', amount: 4, unit: 'tbsp', scales: 'linear' },
    { id: 'i14', name: 'Neutral oil', amount: 2, unit: 'tbsp', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Char the pineapple', content: 'Slice pineapple into rings or planks. Cook in a dry pan over high heat, no oil, 2–3 minutes per side until charred and caramelised. Cool slightly, dice into small cubes.', timer_seconds: 180, why_note: "Dry heat caramelises the pineapple's natural sugars (55g per 100ml in ripe pineapple) through direct Maillard reaction on the surface. The char adds slight bitterness that balances the sweetness. Oil would steam it instead of charring." },
    { id: 's2', title: 'Make the pineapple salsa', content: 'Combine charred pineapple, red onion, jalapeño, coriander, and the juice of 1 lime. Season. Taste — it should be sweet, sour, and have some heat.' },
    { id: 's3', title: 'Make chipotle crema', content: 'Mix soured cream with chipotle in adobo, juice of half a lime, and a pinch of salt. Start with 1 tsp chipotle and add more to your heat preference.', why_note: 'Chipotle in adobo is smoked jalapeño in a vinegary tomato sauce. The smokiness is the point — it bridges the char on the pineapple and the spice on the prawns. Making it ahead lets the flavours integrate.' },
    { id: 's4', title: 'Season and cook the prawns fast', content: "Toss prawns in ancho chilli, paprika, cumin, garlic powder, salt, and olive oil. Cook in a screaming hot pan or griddle — 90 seconds maximum per side. They're done when they turn pink and curl into a C shape.", timer_seconds: 90, why_note: 'Prawns overcook almost instantly. The window between translucent (raw) and a C shape (perfect) and an O shape (overcooked rubber) is about 30 seconds. The pan needs to be scorching — a warm pan steams prawns grey instead of searing them.' },
    { id: 's5', title: 'Char the tortillas and build', content: 'Char tortillas directly on a gas flame or dry hot pan, 20–30 seconds per side. Build: chipotle crema, 3–4 prawns, pineapple salsa, squeeze of lime.', why_note: 'Cold tortillas crack. Charring adds flavour from the corn and makes them pliable. Build in this order so the crema acts as a moisture barrier between the warm tortilla and the juicy salsa.' },
  ],
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
    video_url: 'https://www.youtube.com/@TartineBread',
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
    video_url: 'https://www.youtube.com/@TartineBread',
  },
  emoji: '🍞',
  hero_fallback: fallback('#6B4A14'),
  hero_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Bread flour (strong white)', amount: 450, unit: 'g', scales: 'linear' },
    { id: 'i2', name: 'Wholemeal or spelt flour', amount: 50, unit: 'g', scales: 'linear', prep: '10% wholemeal adds flavour and enzymes — more than this starts making the crumb dense' },
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
    video_url: 'https://www.youtube.com/@MarcellaCooking',
  },
  emoji: '🍚',
  hero_fallback: fallback('#8B7355'),
  hero_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Arborio rice', amount: 160, unit: 'g', scales: 'linear' },
    { id: 'i2', name: 'Mixed mushrooms, sliced', amount: 300, unit: 'g', scales: 'linear' },
    { id: 'i3', name: 'Dry white wine', amount: 100, unit: 'ml', scales: 'linear' },
    // custom curve derived from HTML's factor^0.85 rule for water/stock:
    // base=2 → 800ml. Factor^0.85: 1→0.554, 2→1.0, 4→1.803, 6→2.563, 8→3.249
    { id: 'i4', name: 'Vegetable stock, hot', amount: 800, unit: 'ml', scales: 'custom',
      curve: { '1': 443, '2': 800, '4': 1443, '6': 2050, '8': 2599 },
      prep: 'Add up to 200ml more if needed — exact amount varies with heat' },
    { id: 'i5', name: 'Shallots, finely diced', amount: 2, unit: '', scales: 'linear' },
    { id: 'i6', name: 'Garlic cloves', amount: 2, unit: '', scales: 'fixed' },
    { id: 'i7', name: 'Parmesan, grated', amount: 60, unit: 'g', scales: 'linear' },
    { id: 'i8', name: 'Unsalted butter, cold', amount: 40, unit: 'g', scales: 'linear' },
    { id: 'i9', name: 'Olive oil', amount: 2, unit: 'tbsp', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Sauté mushrooms separately', content: "Sauté mushrooms in oil over high heat until golden — 5 minutes without stirring. Season. Set aside. Do this in the same pan you'll use for the risotto.", timer_seconds: 300, why_note: 'Mushrooms release water when heated. Crowding or stirring keeps them wet and they steam instead of browning. High heat and patience gives you golden, meaty mushrooms — not grey rubber.' },
    { id: 's2', title: 'Soften shallots in butter', content: 'Reduce heat. Add butter, soften shallots and garlic 3–4 minutes until translucent. They should not colour.', timer_seconds: 240, why_note: 'Shallots cook faster than onions and have a milder, sweeter flavour for risotto. Translucent, not browned — browning adds bitterness that fights the delicate mushroom and wine notes.' },
    { id: 's3', title: 'Toast the rice', content: 'Add rice, stir to coat in fat. Toast 2 minutes until the edges turn translucent. Then add wine — it will sizzle aggressively.', timer_seconds: 120, why_note: 'Toasting the rice seals the exterior of each grain in fat, slowing starch release. This is what creates the slow, controlled creaminess of proper risotto. Skip this and you get gluey porridge.' },
    { id: 's4', title: 'Add stock gradually', content: 'Add hot stock one ladleful at a time, stirring frequently. Add the next ladle when the pan looks almost dry. Keep heat at a steady medium — active simmer, not a boil.', why_note: 'Gradual addition forces each grain to absorb liquid slowly, releasing surface starch incrementally. That starch is the "cream" of risotto — there is no cream in the recipe. Hot stock maintains temperature; cold stock stalls cooking.' },
    { id: 's5', title: 'Mantecatura — the final butter', content: 'When rice is al dente (it should have a firm but not chalky centre — taste it), remove from heat. Add cold butter in pieces and stir vigorously for 1 minute. Add mushrooms back in.', why_note: 'Mantecatura means "creaming". Cold butter emulsifies into the hot starch, creating a glossy, rich finish. Hot butter separates. Off heat prevents further starch release, which would make it gluey.' },
  ],
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
    video_url: 'https://www.youtube.com/@rickbayless',
  },
  emoji: '🌮',
  hero_fallback: fallback('#C87941'),
  hero_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'White fish fillets (cod/halibut)', amount: 300, unit: 'g', scales: 'linear' },
    { id: 'i2', name: 'Small corn tortillas', amount: 4, unit: '', scales: 'linear' },
    { id: 'i3', name: 'Plain flour', amount: 60, unit: 'g', scales: 'fixed' },
    { id: 'i4', name: 'Cold beer (lager)', amount: 100, unit: 'ml', scales: 'fixed' },
    { id: 'i5', name: 'Red cabbage, shredded', amount: 100, unit: 'g', scales: 'linear' },
    { id: 'i6', name: 'Lime', amount: 2, unit: '', scales: 'linear' },
    { id: 'i7', name: 'Crema or soured cream', amount: 4, unit: 'tbsp', scales: 'linear' },
    { id: 'i8', name: 'Chipotle in adobo, minced', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i9', name: 'Neutral oil for frying', amount: 500, unit: 'ml', scales: 'fixed' },
    { id: 'i10', name: 'Coriander leaves', amount: 1, unit: 'handful', scales: 'linear' },
  ],
  steps: [
    { id: 's1', title: 'Make the chipotle crema', content: 'Mix crema or soured cream with minced chipotle. Squeeze in half a lime. Taste — it should be smoky, creamy, with a gentle heat.', why_note: 'Making the sauce first lets the flavours meld while you cook the fish. Chipotle needs a few minutes to bloom in the cream.' },
    { id: 's2', title: 'Make batter and prep cabbage', content: 'Whisk flour with cold beer and a pinch of salt until just combined — lumps are fine. Toss cabbage with juice of half a lime and salt.', why_note: 'Cold beer creates carbonation that makes the batter light. Overmixing develops gluten and makes it tough. The cabbage acid-wilts slightly while you cook — intentional texture shift.' },
    { id: 's3', title: 'Fry the fish', content: 'Heat oil to 180°C in a deep pan. Cut fish into strips, dip in batter, lower gently into oil. Cook 3–4 minutes until deep golden. Drain on paper.', timer_seconds: 180, why_note: '180°C is the sweet spot — lower and the batter absorbs oil and goes greasy; higher and it browns before the fish cooks through. Use a thermometer. Sound also tells you: a steady active sizzle means correct temperature.' },
    { id: 's4', title: 'Warm tortillas and assemble', content: 'Char tortillas directly on a gas flame or dry pan — 30 seconds per side. Stack fish, cabbage, crema, coriander, squeeze lime over the top.', why_note: 'Cold, raw tortillas taste of nothing and tear. Charring activates the corn flavour and makes them pliable enough to fold without cracking.' },
  ],
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
    video_url: 'https://www.youtube.com/@AndyCooks',
  },
  emoji: '🍛',
  hero_fallback: fallback('#3D7A3D'),
  hero_url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Chicken thighs, sliced', amount: 600, unit: 'g', scales: 'linear' },
    { id: 'i2', name: 'Coconut milk (full-fat)', amount: 400, unit: 'ml', scales: 'linear', prep: 'Use full fat — light coconut milk breaks and looks watery' },
    { id: 'i3', name: 'Green curry paste', amount: 3, unit: 'tbsp', scales: 'fixed' },
    { id: 'i4', name: 'Thai aubergine or courgette', amount: 200, unit: 'g', scales: 'linear' },
    { id: 'i5', name: 'Fish sauce', amount: 2, unit: 'tbsp', scales: 'fixed' },
    { id: 'i6', name: 'Palm sugar or brown sugar', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i7', name: 'Kaffir lime leaves', amount: 4, unit: '', scales: 'fixed' },
    { id: 'i8', name: 'Thai basil', amount: 1, unit: 'handful', scales: 'fixed' },
    { id: 'i9', name: 'Neutral oil', amount: 2, unit: 'tbsp', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Fry the paste', content: 'Heat oil in a wok over high heat. Add curry paste and stir fry 2 minutes until fragrant and separated — it will spit.', timer_seconds: 120, why_note: 'Frying the paste in oil cooks out the raw galangal and lemongrass notes and develops a caramelised base flavour. Adding it directly to liquid makes a flat, raw-tasting curry.' },
    { id: 's2', title: 'Add coconut cream first', content: 'Add just the thick cream from the top of the can (don\'t shake it). Stir with the paste 2–3 minutes until the oil separates — "cracking" the coconut.', timer_seconds: 180, why_note: '"Cracking" means the coconut cream\'s emulsion breaks and the fat separates. This fat then carries the fat-soluble flavour compounds from the paste throughout the dish. You\'ll see the oil visibly pool — this is correct.' },
    { id: 's3', title: 'Cook the chicken', content: 'Add chicken, stir to coat in the paste-cream. Cook 3–4 minutes until sealed.', timer_seconds: 240 },
    { id: 's4', title: 'Add remaining coconut milk and simmer', content: 'Pour in the rest of the coconut milk and the thin liquid from the can. Add kaffir lime leaves, fish sauce, sugar, vegetables. Simmer 12 minutes.', timer_seconds: 720, why_note: 'The balance of fish sauce (salt + umami), sugar (sweetness), and lime leaf (citrus-floral) is the holy trinity of Thai cooking. Taste and adjust — the exact amounts depend on your brand of paste and fish sauce.' },
    { id: 's5', title: 'Finish with basil', content: "Remove from heat. Stir in Thai basil leaves — they'll wilt from the residual heat. Serve with jasmine rice.", why_note: 'Thai basil loses its anise-clove aroma with prolonged heat. Adding off heat preserves the volatile compounds. Italian basil is a poor substitute — different flavour profile entirely.' },
  ],
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
    video_url: 'https://www.youtube.com/@Parts-Unknown',
  },
  emoji: '🧅',
  hero_fallback: fallback('#8B5A2B'),
  hero_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Yellow onions, thinly sliced', amount: 1.5, unit: 'kg', scales: 'linear', prep: 'They cook down to a quarter of their volume — this amount is correct' },
    { id: 'i2', name: 'Unsalted butter', amount: 60, unit: 'g', scales: 'fixed' },
    { id: 'i3', name: 'Olive oil', amount: 2, unit: 'tbsp', scales: 'fixed' },
    { id: 'i4', name: 'Dry white wine or vermouth', amount: 150, unit: 'ml', scales: 'linear' },
    { id: 'i5', name: 'Good beef stock', amount: 1.2, unit: 'L', scales: 'linear' },
    { id: 'i6', name: 'Gruyère, grated', amount: 200, unit: 'g', scales: 'linear' },
    { id: 'i7', name: 'Sourdough bread, sliced', amount: 4, unit: 'thick slices', scales: 'linear' },
    { id: 'i8', name: 'Fresh thyme', amount: 4, unit: 'sprigs', scales: 'fixed' },
    { id: 'i9', name: 'Bay leaves', amount: 2, unit: '', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Caramelise — the long game', content: 'Melt butter and oil in a heavy pot over medium-low heat. Add all the onions and salt lightly. Cook 60–75 minutes, stirring every 5–10 minutes, until deep amber-brown. If they stick, add a splash of water.', timer_seconds: 3600, why_note: 'True caramelisation requires the Maillard reaction and sugar caramelisation, which only happen when the water has fully evaporated from the onions and the temperature rises above 120°C. This takes a real 60 minutes on low heat — 20-minute versions are cheating and taste like it.' },
    { id: 's2', title: 'Deglaze and build the soup', content: 'Add wine, scraping the bottom. Cook until evaporated. Add stock, thyme, bay leaves. Bring to a simmer, cook 30 minutes.', timer_seconds: 1800, why_note: "Deglazing with wine recovers the fond (caramelised sugars stuck to the pot) — that's where half the flavour is. The subsequent simmer melds the stock with the onion base." },
    { id: 's3', title: 'Toast the bread', content: 'Toast sourdough slices until very firm — they need to stay rigid under the cheese and soup. Rub with a cut garlic clove while hot.', why_note: 'Soft bread sinks and disintegrates into the soup. Toast until dry and hard so it floats on top and stays there. The garlic rubbing penetrates the surface of hot bread in a way it never would on cold bread.' },
    { id: 's4', title: 'Grill and serve', content: 'Ladle soup into oven-safe bowls. Float a bread slice. Cover generously with gruyère — it should overhang the bowl slightly. Grill under a hot broiler 3–5 minutes until bubbling and spotted black in places.', timer_seconds: 300, why_note: 'The slight charring on the cheese is flavour, not failure. Maillard on the cheese creates nutty, bitter notes that balance the sweet onion and rich stock. Pale melted gruyère is aesthetically wrong and flavourwise missed.' },
  ],
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
    video_url: 'https://www.youtube.com/@AndyCooks',
  },
  emoji: '🍜',
  hero_fallback: fallback('#C87020'),
  hero_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Flat rice noodles (5mm)', amount: 160, unit: 'g', scales: 'linear' },
    { id: 'i2', name: 'Prawns or chicken, sliced', amount: 200, unit: 'g', scales: 'linear' },
    { id: 'i3', name: 'Eggs', amount: 2, unit: '', scales: 'linear' },
    { id: 'i4', name: 'Tamarind paste', amount: 3, unit: 'tbsp', scales: 'fixed', prep: 'Ketchup is not a substitute — it changes the dish entirely' },
    { id: 'i5', name: 'Fish sauce', amount: 2, unit: 'tbsp', scales: 'fixed' },
    { id: 'i6', name: 'Palm sugar', amount: 1, unit: 'tbsp', scales: 'fixed' },
    { id: 'i7', name: 'Bean sprouts', amount: 80, unit: 'g', scales: 'linear' },
    { id: 'i8', name: 'Spring onions, sliced', amount: 3, unit: '', scales: 'linear' },
    { id: 'i9', name: 'Crushed peanuts', amount: 40, unit: 'g', scales: 'linear' },
    { id: 'i10', name: 'Tofu, firm, cubed', amount: 100, unit: 'g', scales: 'linear' },
  ],
  steps: [
    { id: 's1', title: 'Soak noodles, mix sauce', content: 'Soak noodles in cold water 20 minutes until pliable but not cooked. Mix tamarind, fish sauce, sugar — taste it. Should be sour, salty, subtly sweet in that order.', timer_seconds: 1200, why_note: 'Cold soak (not boiling) means the noodles still have structural integrity when they hit the wok. Boiled noodles finish as mush. The sauce ratio defines pad Thai — get it right off the heat where you can taste clearly.' },
    { id: 's2', title: 'High heat wok', content: 'Wok on the highest flame you have for 3 minutes. Add oil — it should smoke immediately. This is the right temperature.', timer_seconds: 180, why_note: 'Wok hei — the smoky breath of the wok — only happens above 200°C on a dry wok. Restaurant woks run on industrial flames; home woks need maximum time to accumulate heat. A warm wok makes pad Thai soggy and grey.' },
    { id: 's3', title: 'Protein, then egg', content: 'Add protein to the wok edge, cook 2 minutes. Push to the side. Crack eggs into the hot centre, scramble until almost set, then push to the side with the protein.', timer_seconds: 120, why_note: 'Cooking protein and egg separately in zones keeps both from overcooking while you deal with the noodles. Mixed too early and you end up with one overcooked, broken mess.' },
    { id: 's4', title: 'Noodles and sauce', content: 'Add drained noodles, pour sauce over. Toss everything together using tongs. Cook 2 minutes — the sauce should evaporate and caramelise into the noodles.', timer_seconds: 120, why_note: 'Two minutes of high-heat contact lets the tamarind-sugar mixture caramelise onto the noodles. This creates the characteristic stickiness and complex flavour. Remove from heat the moment it looks slightly dry — residual heat finishes it.' },
    { id: 's5', title: 'Serve immediately', content: 'Top with bean sprouts, spring onions, peanuts. Serve with lime wedge, extra fish sauce, sugar, and chilli flakes on the side for adjusting.', why_note: 'Pad Thai cools fast and goes sticky cold. Serve immediately. The condiment table is traditional — every diner adjusts their own bowl.' },
  ],
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
    video_url: 'https://www.youtube.com/@GordonRamsay',
  },
  emoji: '🥩',
  hero_fallback: fallback('#7A1C1C'),
  hero_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Beef short ribs, bone-in', amount: 1.2, unit: 'kg', scales: 'linear' },
    { id: 'i2', name: 'Red wine (Cabernet or Merlot)', amount: 375, unit: 'ml', scales: 'linear' },
    { id: 'i3', name: 'Beef stock', amount: 500, unit: 'ml', scales: 'linear' },
    { id: 'i4', name: 'Carrot, roughly chopped', amount: 1, unit: 'large', scales: 'fixed' },
    { id: 'i5', name: 'Celery stalks', amount: 2, unit: '', scales: 'fixed' },
    { id: 'i6', name: 'Onion', amount: 1, unit: 'large', scales: 'fixed' },
    { id: 'i7', name: 'Tomato paste', amount: 2, unit: 'tbsp', scales: 'fixed' },
    { id: 'i8', name: 'Garlic cloves', amount: 5, unit: '', scales: 'fixed' },
    { id: 'i9', name: 'Fresh rosemary and thyme', amount: 4, unit: 'sprigs each', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Preheat and season', content: 'Preheat oven to 160°C. Season ribs aggressively — they need more salt than you think. Let them sit 10 minutes.', timer_seconds: 600, why_note: 'Short ribs are thick cuts with a lot of collagen and fat. Heavy seasoning on the outside is needed because the interior is self-seasoning via osmosis only in the hours of braising.' },
    { id: 's2', title: 'Sear every side', content: 'In a heavy oven-safe pan, sear ribs on all sides — including the ends — in batches, until very dark brown. Do not rush this.', why_note: "Every surface that doesn't get browned is flavour left behind. Short ribs have six faces — sear all of them. The exterior Maillard compounds end up in the braising liquid and define the sauce." },
    { id: 's3', title: 'Build aromatics, reduce wine', content: 'Remove ribs, soften vegetables in the same pan. Add tomato paste, cook 2 minutes. Add wine and reduce by half — 8–10 minutes.', timer_seconds: 480, why_note: 'Reducing wine removes harsh alcohol notes and concentrates the flavour. Full bottle of wine added direct gives you a boozy, raw-wine sauce. Reduced wine gives depth without the sharpness.' },
    { id: 's4', title: 'Braise 3 hours', content: 'Return ribs, add stock until liquid comes halfway up the ribs. Add herbs. Cover tightly and braise in oven at 160°C for 3 hours.', timer_seconds: 10800, why_note: '160°C oven heat is even on all sides, unlike stovetop braising which hot-spots at the bottom. Three hours converts the collagen in short rib connective tissue to gelatin — that\'s what makes the meat fall apart and the sauce sticky.' },
    { id: 's5', title: 'Rest and reduce sauce', content: 'Remove ribs, rest 15 minutes. Strain the braising liquid, skim fat, reduce in a pan over high heat to a glossy sauce.', timer_seconds: 900, why_note: 'Straining removes the now-exhausted vegetables. Skimming removes fat that would make the sauce greasy. Reducing concentrates into a glaze — pour it over the ribs and it should coat a spoon.' },
  ],
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
    video_url: 'https://www.youtube.com/@IvanRamen',
  },
  emoji: '🍜',
  hero_fallback: fallback('#4A3520'),
  hero_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Ramen noodles, fresh or dried', amount: 160, unit: 'g', scales: 'linear' },
    { id: 'i2', name: 'Good chicken stock', amount: 800, unit: 'ml', scales: 'linear' },
    { id: 'i3', name: 'Soy sauce (tare)', amount: 3, unit: 'tbsp', scales: 'fixed' },
    { id: 'i4', name: 'Mirin', amount: 1, unit: 'tbsp', scales: 'fixed' },
    { id: 'i5', name: 'Sesame oil', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i6', name: 'Eggs (for soft-boiled)', amount: 2, unit: '', scales: 'linear' },
    { id: 'i7', name: 'Chashu pork belly (or roasted pork)', amount: 100, unit: 'g', scales: 'linear' },
    { id: 'i8', name: 'Spring onions', amount: 3, unit: 'stalks', scales: 'linear' },
    { id: 'i9', name: 'Nori sheets', amount: 2, unit: '', scales: 'linear' },
    { id: 'i10', name: 'Bamboo shoots', amount: 40, unit: 'g', scales: 'linear' },
  ],
  steps: [
    { id: 's1', title: 'Soft-boil the eggs', content: 'Bring water to a rolling boil. Lower eggs in gently. Cook exactly 6.5 minutes. Transfer immediately to iced water for 5 minutes. Peel carefully.', timer_seconds: 390, why_note: '6.5 minutes gives a fully set white with a just-jammy yolk — the ramen standard. Below 6 minutes is too runny, above 7 is too hard. The ice bath stops residual cooking immediately.' },
    { id: 's2', title: 'Make the tare', content: 'Mix soy sauce and mirin in a small pan. Bring to a simmer 2 minutes to cook off the alcohol. This is your seasoning base.', timer_seconds: 120, why_note: "Tare is ramen's seasoning concentrate. Making it separately means you can adjust the saltiness of each bowl individually by adding more or less — rather than trying to season 800ml of stock accurately." },
    { id: 's3', title: 'Heat the broth', content: 'Heat stock to a rolling boil. Add sesame oil. Taste — it should be rich but slightly under-seasoned (the tare finishes it).', why_note: 'The stock provides body; the tare provides the seasoning signature. Separating them is the Japanese technique that makes ramen adjustable. Pre-seasoning the stock makes every bowl identical — not necessarily wrong, but less flexible.' },
    { id: 's4', title: 'Cook noodles separately', content: 'Cook noodles in a separate pan of unsalted water — not in the broth. Fresh: 1–2 minutes. Dried: follow package. Drain and rinse briefly.', timer_seconds: 90, why_note: 'Ramen noodles cook in unsalted water because the broth does all the seasoning. Cooking them in the broth clouds it and makes the bowl starchy. Rinsing removes excess surface starch.' },
    { id: 's5', title: 'Assemble properly', content: 'Tare in the bowl first. Noodles. Hot broth ladled over. Then toppings in distinct sections: halved egg, pork, nori, spring onion, bamboo. Each topping should be visually distinct.', why_note: "Adding tare first ensures it distributes through the broth as it's poured. Keeping toppings visually separate isn't just aesthetic — it lets you eat each element alone or in combination at your own pace." },
  ],
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
    video_url: 'https://www.youtube.com/@GordonRamsay',
  },
  emoji: '🥩',
  hero_fallback: fallback('#7A3A1A'),
  hero_url: 'https://images.unsplash.com/photo-1551183053-bf91798d9cf3?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Beef fillet (centre cut)', amount: 800, unit: 'g', scales: 'fixed', prep: 'Centre cut only — consistent diameter means even cooking' },
    { id: 'i2', name: 'Chestnut mushrooms', amount: 500, unit: 'g', scales: 'fixed' },
    { id: 'i3', name: 'Prosciutto/Parma ham slices', amount: 8, unit: 'slices', scales: 'fixed' },
    { id: 'i4', name: 'Puff pastry, all-butter', amount: 500, unit: 'g', scales: 'fixed' },
    { id: 'i5', name: 'Dijon mustard', amount: 2, unit: 'tbsp', scales: 'fixed' },
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
    video_url: 'https://www.youtube.com/@MadhurJaffrey',
  },
  emoji: '🫘',
  hero_fallback: fallback('#C4843A'),
  hero_url: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&q=80',
  ingredients: [
    { id: 'i1', name: 'Red lentils', amount: 250, unit: 'g', scales: 'linear' },
    { id: 'i2', name: 'Onion, thinly sliced', amount: 1, unit: 'large', scales: 'linear' },
    { id: 'i3', name: 'Tomatoes, chopped', amount: 2, unit: '', scales: 'linear' },
    { id: 'i4', name: 'Garlic cloves', amount: 4, unit: '', scales: 'linear' },
    { id: 'i5', name: 'Fresh ginger, grated', amount: 1, unit: 'tbsp', scales: 'fixed' },
    { id: 'i6', name: 'Turmeric', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i7', name: 'Cumin seeds', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i8', name: 'Mustard seeds', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i9', name: 'Dried red chillies', amount: 2, unit: '', scales: 'fixed' },
    { id: 'i10', name: 'Ghee or clarified butter', amount: 3, unit: 'tbsp', scales: 'fixed' },
    { id: 'i11', name: 'Garam masala', amount: 0.5, unit: 'tsp', scales: 'fixed' },
  ],
  steps: [
    { id: 's1', title: 'Cook the lentils', content: 'Rinse lentils until water runs clear. Cover with cold water (3:1 ratio), add turmeric. Bring to boil, skim foam, simmer 20 minutes until completely soft. They should dissolve into a thick porridge.', timer_seconds: 1200, why_note: 'Red lentils have no outer husk so they disintegrate fully — this is correct and intended. The foam in the first minutes is starch — skim it for a cleaner dal. Turmeric goes in now because fat-soluble curcumin distributes better in the later tarka.' },
    { id: 's2', title: 'Make the tarka', content: "Heat ghee in a small pan until very hot. Add mustard seeds — wait for them to pop. Add cumin seeds, dried chillies, let them sizzle 30 seconds. Add sliced onion, cook until deeply golden-brown.", why_note: "Tarka is the finishing oil — it's made separately and poured over the lentils at the end. The mustard seeds need hot oil to pop; they won't in warm oil. Each spice needs a few seconds to bloom its volatile aromatics into the fat." },
    { id: 's3', title: 'Add garlic, ginger, tomato', content: 'Add garlic and ginger to the tarka pan. Cook 2 minutes. Add tomatoes, cook until they break down into the oil — about 5 minutes.', timer_seconds: 300, why_note: "Garlic and ginger added after the spices don't burn. The tomatoes must cook until their water fully evaporates and they're frying in the ghee — this concentrates flavour and removes the raw acidic edge." },
    { id: 's4', title: 'Combine and finish', content: 'Pour cooked lentils into the tarka pan (or vice versa). Add garam masala. Simmer together 5 minutes, season. The dal should coat a spoon but not be thick like cement.', timer_seconds: 300 },
  ],
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
    { id: 'i2', name: 'Unsalted butter', amount: 15, unit: 'g', scales: 'linear' },
    { id: 'i3', name: 'Crème fraîche', amount: 1, unit: 'tbsp', scales: 'linear' },
    { id: 'i4', name: 'Salt', amount: 1, unit: 'pinch', scales: 'fixed' },
    { id: 'i5', name: 'Chives, chopped', amount: 1, unit: 'tsp', scales: 'linear' },
  ],
  steps: [
    { id: 's1', title: 'Cold eggs, cold pan, cold butter', content: 'Crack eggs directly into a cold pan. Add all the butter. Do not whisk. Put on medium-low heat.', why_note: 'Starting cold means the eggs heat gradually and uniformly. Starting hot shocks them into large, rubbery curds. No whisking now — whisking incorporates air, which makes a fluffy omelette texture, not silky scrambled eggs.' },
    { id: 's2', title: 'Stir continuously, on and off heat', content: 'Stir constantly with a silicone spatula, moving in figure-eights. Every 30 seconds, take the pan off the heat for 10 seconds, continue stirring. Do this for 4–5 minutes.', timer_seconds: 300, why_note: 'The on-off-heat technique keeps the pan temperature oscillating around 65–70°C — just above the egg protein coagulation point. This creates the slow, creamy, uniform texture. Above 80°C, proteins tighten into dry curds.' },
    { id: 's3', title: 'Salt and finish at the last second', content: 'When eggs are 90% set — still slightly glossy and wet — remove from heat. Add crème fraîche, stir once. Season with salt. Serve immediately.', why_note: 'Salt draws water from proteins by osmosis. Added early, it makes the eggs watery. Added at the end, it seasons without affecting texture. The crème fraîche adds richness and stops the cooking instantly by cooling the mass. Residual heat finishes them perfectly.' },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
//  Kept from v0 seed (not in mise.html)
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
    video_url: 'https://www.youtube.com/@AndyCooks',
    notes: "In the spirit of Andy's technique-first approach: soffritto built properly, milk before wine, patience with the brown bits.",
  },
  emoji: '🍝',
  hero_fallback: ['#8B3A2F', '#C44536', '#D4A574'],
  ingredients: [
    { id: 'oil', name: 'Olive oil', amount: 2, unit: 'tbsp', scales: 'linear' },
    { id: 'onion', name: 'Onion, fine dice', amount: 1, unit: 'medium', scales: 'linear' },
    { id: 'carrot', name: 'Carrot, fine dice', amount: 1, unit: 'medium', scales: 'linear' },
    { id: 'celery', name: 'Celery stalk, fine dice', amount: 1, unit: 'stalk', scales: 'linear' },
    { id: 'garlic', name: 'Garlic cloves, minced', amount: 3, unit: 'cloves', scales: 'fixed', cap: 6 },
    { id: 'beef', name: 'Beef mince (80/20)', amount: 400, unit: 'g', scales: 'linear' },
    { id: 'pork', name: 'Pork mince', amount: 200, unit: 'g', scales: 'linear' },
    { id: 'milk', name: 'Whole milk', amount: 200, unit: 'ml', scales: 'linear' },
    { id: 'wine', name: 'Dry red wine', amount: 200, unit: 'ml', scales: 'linear' },
    { id: 'tomatoes', name: 'Tinned whole tomatoes', amount: 400, unit: 'g', scales: 'linear' },
    { id: 'stock', name: 'Beef stock', amount: 300, unit: 'ml', scales: 'linear' },
    { id: 'bay', name: 'Bay leaves', amount: 2, unit: 'leaves', scales: 'fixed', cap: 3 },
    { id: 'pasta', name: 'Pappardelle or tagliatelle', amount: 400, unit: 'g', scales: 'linear' },
    { id: 'parm', name: 'Parmigiano, grated', amount: 60, unit: 'g', scales: 'linear' },
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
};

// ────────────────────────────────────────────────────────────────────────────
//  5 Originals — Simmer Fresh Kitchen
//  Authored in-house in the chef-guide voice. Sourced as "Simmer Fresh Kitchen"
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
    chef: 'Simmer Fresh Kitchen',
    notes: 'Original in-house recipe in the style of a Roman trattoria late-night plate. No chef attribution — this is our own.',
  },
  emoji: '🍝',
  hero_fallback: fallback('#D4900A'),
  ingredients: [
    { id: 'i1', name: 'Spaghetti (bronze-die if you can find it)', amount: 180, unit: 'g', scales: 'linear', prep: 'Bronze die gives a rougher surface — sauce clings to it' },
    { id: 'i2', name: 'Garlic cloves, very thinly sliced', amount: 6, unit: '', scales: 'linear', prep: 'Sliced, not crushed — thin discs cook evenly and look like confetti' },
    { id: 'i3', name: 'Extra virgin olive oil', amount: 80, unit: 'ml', scales: 'linear', prep: 'Use something you like the taste of raw — this is the whole sauce' },
    { id: 'i4', name: 'Dried chilli flakes', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i5', name: 'Flat-leaf parsley, finely chopped', amount: 15, unit: 'g', scales: 'linear' },
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
    chef: 'Simmer Fresh Kitchen',
    notes: 'Original in-house recipe built on the standard Lebanese / Palestinian ratios. No chef attribution — our own.',
  },
  emoji: '🍚',
  hero_fallback: fallback('#6B4A14'),
  ingredients: [
    { id: 'i1', name: 'Green or brown lentils', amount: 200, unit: 'g', scales: 'linear', prep: 'Not red lentils — those fall apart. Green or brown hold shape' },
    { id: 'i2', name: 'Long-grain white rice (basmati)', amount: 200, unit: 'g', scales: 'linear', prep: 'Rinsed until the water runs clear, then drained' },
    { id: 'i3', name: 'Large yellow onions, sliced thin', amount: 3, unit: 'large', scales: 'linear', prep: 'Thin half-moons — uniform thickness is what lets them brown evenly' },
    { id: 'i4', name: 'Olive oil', amount: 100, unit: 'ml', scales: 'linear', prep: 'Generous — some is for frying the onions, some drizzles the final plate' },
    { id: 'i5', name: 'Ground cumin', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i6', name: 'Ground allspice', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i7', name: 'Salt', amount: 1.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i8', name: 'Black pepper', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i9', name: 'Plain yoghurt, to serve', amount: 200, unit: 'g', scales: 'linear' },
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
    chef: 'Simmer Fresh Kitchen',
    notes: 'Original in-house recipe. The rose harissa / honey combination leans Tunisian; the approach is modern sheet-pan. No chef attribution.',
  },
  emoji: '🌶️',
  hero_fallback: fallback('#C4422A'),
  ingredients: [
    { id: 'i1', name: 'Chicken thighs, bone-in and skin-on', amount: 800, unit: 'g', scales: 'linear', prep: 'Thighs — breasts dry out before the chickpeas colour' },
    { id: 'i2', name: 'Tinned chickpeas, drained', amount: 480, unit: 'g', scales: 'linear', prep: '2 × 240g tins, drained and patted dry' },
    { id: 'i3', name: 'Red onion, cut in thick wedges', amount: 1, unit: 'large', scales: 'linear' },
    { id: 'i4', name: 'Rose harissa paste', amount: 3, unit: 'tbsp', scales: 'fixed', prep: "Rose harissa has floral notes plain harissa doesn't — worth tracking down. Otherwise use plain harissa + a pinch of dried rose petals" },
    { id: 'i5', name: 'Honey', amount: 1, unit: 'tbsp', scales: 'fixed', prep: 'Balances the harissa heat — not enough to taste sweet, just to round it' },
    { id: 'i6', name: 'Olive oil', amount: 3, unit: 'tbsp', scales: 'fixed' },
    { id: 'i7', name: 'Lemon (zest and juice)', amount: 1, unit: '', scales: 'fixed' },
    { id: 'i8', name: 'Ground cumin', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i9', name: 'Garlic cloves, crushed', amount: 3, unit: '', scales: 'fixed' },
    { id: 'i10', name: 'Salt', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i11', name: 'Flat-leaf parsley, chopped', amount: 15, unit: 'g', scales: 'linear' },
    { id: 'i12', name: 'Plain yoghurt, to serve', amount: 200, unit: 'g', scales: 'linear' },
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
    chef: 'Simmer Fresh Kitchen',
    notes: 'Original in-house recipe, Cantonese style (egg + spring onion base, no carrots and peas clutter).',
  },
  emoji: '🍳',
  hero_fallback: fallback('#D4A93A'),
  ingredients: [
    { id: 'i1', name: 'Cooked long-grain rice, cold from the fridge', amount: 400, unit: 'g', scales: 'linear', prep: 'Day-old rice, broken up with your hands until no clumps remain. Fresh-cooked rice makes mush — non-negotiable' },
    { id: 'i2', name: 'Eggs', amount: 3, unit: '', scales: 'linear', prep: 'Whisked until the white and yolk are completely blended, with a pinch of salt' },
    { id: 'i3', name: 'Spring onions', amount: 4, unit: '', scales: 'linear', prep: 'Whites and greens separated, both thinly sliced' },
    { id: 'i4', name: 'Neutral oil (sunflower or groundnut)', amount: 3, unit: 'tbsp', scales: 'fixed' },
    { id: 'i5', name: 'Light soy sauce', amount: 1, unit: 'tbsp', scales: 'fixed' },
    { id: 'i6', name: 'Toasted sesame oil', amount: 1, unit: 'tsp', scales: 'fixed', prep: "Off heat at the end — do not cook with it, it's for fragrance not frying" },
    { id: 'i7', name: 'White pepper, freshly ground', amount: 0.5, unit: 'tsp', scales: 'fixed' },
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
    chef: 'Simmer Fresh Kitchen',
    notes: 'Original in-house recipe — a home-oven adaptation of the spit-roasted original. No chef attribution.',
  },
  emoji: '🥩',
  hero_fallback: fallback('#6B3A2A'),
  ingredients: [
    { id: 'i1', name: 'Bone-in lamb shoulder', amount: 2, unit: 'kg', scales: 'fixed', prep: 'Bone-in — the bone keeps it from drying out during the long cook' },
    { id: 'i2', name: 'Yoghurt, full-fat', amount: 200, unit: 'g', scales: 'linear', prep: 'The tenderising base for the marinade' },
    { id: 'i3', name: 'Garlic cloves', amount: 8, unit: '', scales: 'linear' },
    { id: 'i4', name: 'Lemon (juice and zest)', amount: 2, unit: '', scales: 'linear' },
    { id: 'i5', name: 'Olive oil', amount: 4, unit: 'tbsp', scales: 'fixed' },
    { id: 'i6', name: 'Ground cumin', amount: 2, unit: 'tsp', scales: 'fixed' },
    { id: 'i7', name: 'Ground coriander', amount: 2, unit: 'tsp', scales: 'fixed' },
    { id: 'i8', name: 'Smoked paprika', amount: 1, unit: 'tbsp', scales: 'fixed' },
    { id: 'i9', name: 'Ground cinnamon', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i10', name: 'Ground cardamom', amount: 0.5, unit: 'tsp', scales: 'fixed' },
    { id: 'i11', name: 'Ground cloves', amount: 0.25, unit: 'tsp', scales: 'fixed', prep: 'A tiny amount — cloves take over if you push it' },
    { id: 'i12', name: 'Black pepper, freshly ground', amount: 1, unit: 'tsp', scales: 'fixed' },
    { id: 'i13', name: 'Salt', amount: 2, unit: 'tsp', scales: 'fixed' },
    { id: 'i14', name: 'Flatbreads or pitta, to serve', amount: 6, unit: 'large', scales: 'linear' },
    { id: 'i15', name: 'Tahini sauce or garlic sauce, to serve', amount: 150, unit: 'g', scales: 'linear' },
    { id: 'i16', name: 'Pickled turnips or amba, to serve', amount: 100, unit: 'g', scales: 'linear', prep: 'The sharp pickled thing is not optional — it cuts the richness' },
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
};

// ────────────────────────────────────────────────────────────────────────────
//  Export — order reflects mise.html ordering, then kept v0 recipe, then
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
];
