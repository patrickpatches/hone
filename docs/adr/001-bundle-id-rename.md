# ADR 001 — Bundle ID rename: com.patricknasr.simmerfresh → com.patricknasr.hone

**Date:** 2026-04-30
**Status:** Accepted
**Decider:** Patrick Nasr

---

## Context

The app was originally prototyped under the working title "Simmer Fresh". That name was abandoned early in development — the product shipped as **Hone**. However, the Android package identifier (`android.package` in `app.json`) was never updated and still read `com.patricknasr.simmerfresh`.

The bundle ID is embedded in every AAB/APK, in the Play Console app record, in EAS Build configuration, and in any deep links. Leaving it as `simmerfresh` would mean:

- The Play Console app entry is permanently labelled under the old name in Google's internal records
- Any future deep link scheme (`hone://`) would conflict with the package name expectation
- The public package name (visible in Play Store URLs) would be `com.patricknasr.simmerfresh` — confusing and unprofessional at launch

**Decision window:** Before any AAB is submitted to the Play Store. We are still on internal/preview builds only. This is the lowest-cost moment to rename.

---

## Decision

Rename the bundle identifier in all config files from `com.patricknasr.simmerfresh` to `com.patricknasr.hone`.

**Files changed:**

| File | Field | Before | After |
|---|---|---|---|
| `mobile/app.json` | `android.package` | `com.patricknasr.simmerfresh` | `com.patricknasr.hone` |
| `mobile/app.json` | `ios.bundleIdentifier` | `com.patricknasr.simmerfresh` | `com.patricknasr.hone` |
| `mobile/app.json` | `splash.backgroundColor` | `#FAF7F2` (old light cream) | `#111111` (dark bg, matches v0.7 tokens) |
| `mobile/app.json` | `android.adaptiveIcon.backgroundColor` | `#FAF7F2` | `#111111` |

`mobile/package.json` `name` field was already `"hone"` — no change needed there.

---

## Why now and not later

Every AAB submitted to the Play Console is permanently tied to its package name. Once you submit `com.patricknasr.simmerfresh` to production, Google will never let you change it for that app entry — you would have to create an entirely new Play Store listing and lose all reviews, ratings, and install history. The cost of renaming post-launch is essentially infinite.

Renaming before the first production submission has zero user-visible cost (internal builds are discarded) and eliminates the problem permanently.

---

## Play Console steps for Patrick

The rename means the **next AAB you upload will create a new app entry** in the Play Console automatically (or you may need to create one explicitly). Here is what Patrick needs to do when ready to upload:

1. **Build the release AAB** via GitHub Actions (EAS Build, `production` profile). The AAB will embed `com.patricknasr.hone`.

2. **In Play Console:**
   - Go to `https://play.google.com/console`
   - Click **"Create app"** (top right)
   - App name: **Hone**
   - Default language: English (Australia)
   - App or game: **App**
   - Free or paid: **Free**
   - Accept the declarations → **Create app**

3. **Upload the AAB** to the new app entry under Internal Testing first (safest):
   - Dashboard → Testing → Internal testing → Create new release
   - Upload the `.aab` artifact from GitHub Actions
   - The package name in the console will now show `com.patricknasr.hone`

4. **If an old `com.patricknasr.simmerfresh` app entry exists** in the Play Console (from any earlier test upload), leave it there but do not publish it. It can be archived or deleted later — it will never go live.

5. **EAS Build project:** No changes needed to `eas.json`. The package name is read from `app.json` at build time.

---

## Alternatives considered

**Keep the old ID:** Zero engineer cost but permanent Play Store URL shame and deep link inconsistency. Rejected.

**Use `com.hone.app` or a non-personal namespace:** Would require a company entity. Patrick is sole trader — personal namespace is correct for v1. Revisit if the business is incorporated.

---

## Consequences

- All future AAB/APK builds will use `com.patricknasr.hone`
- New Play Console app entry must be created before the first production upload (see above)
- Any EAS OTA update channel config pointing to the old package ID is now dead — but OTA is not yet wired, so no impact
- `splash.backgroundColor` and `android.adaptiveIcon.backgroundColor` are now `#111111`, consistent with the v0.7 Dark Dramatic palette
