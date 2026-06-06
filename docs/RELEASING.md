# Releasing a new version of Tucker & Spice

Single source of truth for cutting an APK release. Follow top to bottom.

## When to cut a release

- Every meaningful UX change you want to test on your phone
- After every batch of bug fixes
- Before any external user testing (closed alpha, beta, internal track)
- Before each Play Store upload

For day-to-day code changes that aren't testable on a phone yet, just commit
to `main` — no release needed.

## Versioning

We follow [Semantic Versioning](https://semver.org/) once we hit 1.0.0.
Until then, we're in `0.MINOR.PATCH`:

- **MINOR** bumps for any user-visible change (UX, features, schema)
- **PATCH** bumps for fixes that don't change behaviour from the user's POV

`versionCode` (Android integer) auto-increments via `github.run_number` in
the build workflow — never manually edited.

## Steps

### 1. Make sure `main` is clean

```bash
git status                # nothing uncommitted
git log -3 --oneline      # latest commits look right
```

### 2. Bump version in `app.json`

```bash
# example for a UX change → 0.5.0 → 0.6.0
node -e "
const fs = require('fs');
const j = JSON.parse(fs.readFileSync('mobile/app.json'));
j.expo.version = '0.6.0';
fs.writeFileSync('mobile/app.json', JSON.stringify(j, null, 2) + '\n');
"
git add mobile/app.json
git commit -m "release: bump version to 0.6.0"
```

### 3. Update CHANGELOG.md

Move items under `## [Unreleased]` into a new dated heading at the top:

```markdown
## [0.6.0] — 2026-MM-DD — short title (commit hash will go here after the release tag)
```

Edit the link references at the bottom of CHANGELOG.md to add the new
compare URL.

```bash
git add CHANGELOG.md
git commit -m "docs: changelog for 0.6.0"
```

### 4. Tag and push

```bash
git tag -a v0.6.0 -m "v0.6.0 — short title"
git push origin main
git push origin v0.6.0
```

### 5. Trigger the APK build

```bash
gh workflow run "Tucker & Spice Android Build" --field profile=preview --ref v0.6.0
# or via the GitHub UI: Actions → Tucker & Spice Android Build → Run workflow → ref v0.6.0
```

The workflow uses `github.run_number` as `versionCode`, so each push
through CI gets a unique, incrementing integer — Play Store will accept
each upload without complaint.

### 6. Attach the APK to the GitHub Release

When the build completes, the APK lands as a workflow artifact named
`tuckerspice-release.apk`. Download it, then:

```bash
gh release create v0.6.0 \
  --title "v0.6.0 — short title" \
  --notes-file <(awk '/## \[0.6.0\]/,/## \[/' CHANGELOG.md | head -n -1) \
  tuckerspice-release.apk
```

Or via the GitHub UI: Releases → Create release → choose tag `v0.6.0` →
paste CHANGELOG section → drag the APK in → Publish.

GitHub Releases archive the APK permanently, unlike workflow artifacts
which expire after 90 days.

### 7. Install on your phone

Download the APK from the GitHub Release page, install over the previous
version (same package id `com.patricknasr.tuckerspice` — settles in place).

## Hotfix flow

If a bug ships in `v0.6.0` and you need to fix it without a full new minor:

```bash
git checkout v0.6.0
git checkout -b hotfix/0.6.1
# fix the bug, commit
node -e "..."  # bump app.json to 0.6.1
git add CHANGELOG.md mobile/app.json
git commit -m "release: bump to 0.6.1"
git tag -a v0.6.1 -m "v0.6.1 — hotfix description"
git push origin hotfix/0.6.1
git push origin v0.6.1
# trigger build, attach to GitHub Release
# then merge back to main: git checkout main && git merge hotfix/0.6.1
```

## Play Store production releases

When ready for actual Play Store internal/closed/production track:

1. Repeat steps 1-6 above
2. Sign the APK with the **production keystore** (not the CI ephemeral one).
   See `docs/play-store-keystore.md` (TODO — write when needed).
3. Upload to Play Console: Internal testing → Create new release → upload
   APK → Roll out.
4. After 24h smoke-test, promote internal → closed → open → production.

## Pre-flight checklist

Before any release:

- [ ] `npx tsc --noEmit` from `mobile/` passes (or only known module-resolution errors)
- [ ] App boots on at least one phone (no crash on launch)
- [ ] `CLAUDE.md` is up to date with the latest session
- [ ] `CHANGELOG.md` `[Unreleased]` section reflects what's shipping
- [ ] No untracked files left in the project root
- [ ] `mobile/.claude/worktrees/` and `.validate-tmp*` not in git (gitignored)
