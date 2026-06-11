# Patrick's action list — things only you can do

_Last updated: 2026-04-19. Target launch: **June 2026** (~6–8 weeks)._

These block June launch regardless of code velocity. Every week they slip pushes the launch by the same amount. Treat this doc as the critical path.

---

## This week — hard deadlines on your end

### 0. Add the ANTHROPIC_API_KEY repo secret (5 minutes — unblocks the usability tester)
   - The new agentic usability tester (`tester/`, runs weekly via the
     "Usability test (agentic)" workflow) needs a Claude API key to drive
     the app on the CI emulator.
   - Create a key at https://platform.claude.com → API Keys (use a key
     dedicated to CI, not your personal one — Secrets rule: separate
     tokens for separate jobs).
   - GitHub → tucker-spice → Settings → Secrets and variables → Actions →
     New repository secret → name `ANTHROPIC_API_KEY`, paste the key.
   - Cost: roughly US$5–15 per full run, once a week. You can also trigger
     it manually from the Actions tab against any build.

### 1. Install the dev toolchain and see the app on your phone (tonight)
   - Install Node.js 18 or newer: https://nodejs.org
   - Run: `cd mobile && npm install && npx expo start --web`
   - Open `http://<your-PC's-IP>:8081` on your Android phone's Chrome
     (same wi-fi). The Kitchen screen should load with "What are you
     cooking tonight?" in italic.
   - Tap Chrome's menu → "Add to Home Screen." You now have the app as
     a PWA on your phone's home screen. No Play Store, no Expo Go,
     nothing installed.
   - Day-to-day: every edit I push hot-reloads on your phone in ~1 second.
   - The native Android build (Expo Go + QR) is still available for
     testing haptics / wake-lock as those land — covered later.

### 2. Google Play Console signup (start TODAY — this is the hidden long pole)
   - https://play.google.com/console/signup
   - $25 one-time fee
   - Decision: **personal** account (not organisation). Unless you have a
     registered company, personal is simpler. You can move to org later.
   - Identity verification requires:
     - Government-issued ID (passport or driver's licence)
     - Selfie
     - Address verification (Google will mail a postcard or request a
       utility bill)
   - **Timeline:** Google commits to "within a few days" but realistically
     takes 3–14 days. If there's any friction (ID scan rejected, address
     mismatch) add another 5–7 days per round.
   - **If this isn't started by end of week, June launch is at risk.**

### 3. Pick the 10 launch recipes (this weekend)
   - From the 32 in the HTML prototype, or from your own list.
   - Criteria: cover the cooking-move spectrum (one braise, one fast sauté,
     one bake, one knife-heavy prep, one dessert, one weeknight pasta,
     two weekend dishes, one one-pot, one breakfast).
   - Each must have a chef source you can credit with a link (Rule #2).
   - Put the list in `docs/launch-recipes.md`.

### 4. Photo shoot plan (this weekend)
   - Each recipe has ~5–7 stages. 10 recipes × 6 stages avg = 60 shots.
   - Gear minimum: a modern phone camera (Pixel 6+ or iPhone 12+), a
     tripod or phone stand, natural light near a window, one sheet of white
     foam-core for fill.
   - **Schedule: 5 cook-and-shoot weekends between now and late May.**
     Two recipes per weekend, each cook taking 2–3 hours including
     deliberate pauses at each stage for the shot.
   - Don't wait until the code is done. The photos ARE the product
     per Rule #5. Start this weekend or next at the latest.

---

## Weeks 2–3 — I'll do the code, you do the content

Claude's lane:
- Recipe Detail screen with scaling, adjustments, ingredient-to-step highlight
- Cook Mode (wake lock, step-by-step, **knuckle-tap to advance** — no voice,
  full-screen step, tap anywhere to move forward, swipe up for back,
  haptics on step transitions)
- Markdown recipe authoring pipeline (`/recipes/*.md` → SQLite seed at
  build time, same schema as user-added)
- Migrate the remaining 30 recipes from the HTML prototype into `.md` files
- **Pantry → Recipe** — the kill feature. Two stages:
  - Client-side match scoring against the recipe library (free, instant)
  - Optional "invent me something" → Cloudflare Worker → Claude API →
    structured recipe in a named chef's style with explicit attribution
- Plan + derived shopping list (aisle-ordered)

Patrick's lane:
- Finish the 10 photo shoots (one weekend slips = June slips)
- Draft the Play Store assets:
  - **App icon** 512×512 PNG
  - **Feature graphic** 1024×500 PNG (shown at top of Play listing)
  - **Phone screenshots** — 4–8 of them, 1080×1920 minimum, showing the
    real app on a real device (Play's automated review dislikes marketing
    mockups)
  - **Short description** (80 chars) — I'll draft three, you pick
  - **Long description** (4000 chars) — I'll draft
- Draft the **Privacy Policy**. Even though v1 collects zero user data,
  Play Store requires a public URL with a privacy policy. A single page
  on your domain that says "This app stores all data locally on your
  device. It does not transmit, collect, or share any personal information"
  is sufficient. Host it somewhere stable — GitHub Pages works.

---

## Week 4 — first build, closed testing

Claude's lane:
- EAS Build configuration (`eas.json`)
- First Android App Bundle (AAB) built and uploaded to Play Console
- Internal testing track live
- Beta channel smoke tests on your device

Patrick's lane:
- Invite 12–20 testers to the **Closed Testing** track (Google requires
  at least 12 testers active for 14 days before you can graduate to
  Production, if you're on a personal account registered after November
  2023).
- Testers: family, close friends, one or two cooks whose feedback you
  trust. Not random internet beta groups — the feedback quality is bad.

---

## Week 5 — closed testing feedback loop

- Testers report bugs and UX friction via a shared feedback form (or Slack,
  or anywhere with low friction — if reporting takes more than 60 seconds
  they won't do it).
- Ship fixes via EAS Updates (JS-only) so testers get patches without
  reinstalling.
- Photo final-pass: replace any stage photo that the feedback flags as
  unclear.

---

## Week 6 — production submission

- Final AAB build, signed, uploaded to Production track.
- Submit for Play Store review.
- Review time: typically 3–7 days for a first submission. Can be longer
  if Google flags the data-safety declarations or needs clarification.
- While waiting: write the launch post (if you're doing one — Reddit
  r/Android? A Twitter thread? None of these drive real installs. An
  HN Show-HN post does better but has to be honest and short).

---

## Things you do NOT need to do, despite the internet telling you to

- **Register a trademark** — not for v1. Costs $250–$750, takes 8 months,
  blocks nothing. Revisit if the app gets traction.
- **Form an LLC** — not needed unless you're processing payments. The app
  is free; personal account is fine.
- **Set up analytics / Mixpanel / Amplitude** — not for v1. Zero-data-
  collection is simpler for the privacy policy and Play data-safety
  declarations. Add after launch once you have a specific question only
  analytics can answer.
- **Build an iOS version** — deferred per CLAUDE.md. Expo makes this
  nearly free later; don't split focus now.
- **Social / marketing presence** — the app is the marketing. Better to
  launch an app that works than tweet about one you're still building.

---

## Questions that are worth an early decision

Not blocking June 1. But sooner is better than later:

- **Monetisation strategy long-term.** Current v1 plan: free, no ads ever.
  Natural pro-tier line if ever needed: unlimited "invent me a recipe"
  generations (Claude API calls). Free users get, say, 5/week. This
  costs you ~$0.01 per generation so it's bounded either way.
- **Anthropic API key.** The pantry-generation feature needs one. Sign
  up at console.anthropic.com — you get $5 free credit to start.
  A Cloudflare Worker ($0 for first 100k requests/day) holds the key
  and calls the API. No charge until you actually use it.
- **Domain name.** `mealmaster.app`? `cook.patricknasr.com`? You'll need
  one for the Privacy Policy URL regardless. Register now — GoDaddy or
  Cloudflare Registrar, ~$10/year.
- **App name.** "Meal Master" is the placeholder from the HTML. The Play
  Store has ~30 apps called "Meal Master." Pick something that can trademark
  and that you won't cringe at in 2 years.
