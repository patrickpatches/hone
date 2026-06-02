# HONE-025 — Bug Lord: one source of truth (GitHub Issues), no flash, no revert

```
TYPE:            Task / Bug
SEVERITY:        P2
CATEGORY:        Infra
SCREEN:          Bug Lord
ASSIGNEE:        Engineer
EPIC:            EPIC-launch-ready
FIX ATTEMPTED:   docs/infra commit 129cba8 (dashboard + Worker; no EAS build)
ROOT CAUSE:      Two problems compounded: (1) some tickets (HONE-013..020) were
                 hardcoded in the dashboard's BUGS_SEED, not real records — editing
                 them wrote to a store the read path couldn't reconcile, so they
                 flashed (seed rendered first) and reverted; (2) status lived in
                 Cloudflare KV, which is eventually consistent — a refresh could read
                 the old value. The HONE-024 overlay was a client-side patch over (2).
```

**Reporter:** Patrick · **Filed:** 2026-06-02

## The proper fix (not a patch)
**GitHub Issues is the single source of truth.** No seed array, no KV, no client overlay.

**Worker (`workers/bug-lord/src/index.ts`):**
- `issueToHoneBug` derives st/sev/who from the issue's **state + labels**:
  st = closed→done | `st:<x>` label | legacy fix-attempted→check / being-fixed→fixing | open;
  sev = `sev:<X>` label | body parse; who = `who:<X>` label | assignee | Patrick.
- `POST /update {num, field, value}` writes straight to the GitHub issue
  (close/reopen + `st:`/`sev:`/`who:` labels) — **read-after-write consistent**.
- `/bugs` returns issues with no KV overlay; `/issue` sets `who:` as a label.
- KV removed from the read/write paths entirely.

**Migration (one-time):** filed the 8 hardcoded seed tickets (HONE-013..020) as real
GitHub issues #15–22 with matching state + `sev:`/`who:`/`st:` labels. Set #8 and #13
to `check` (fixed, awaiting Patrick's validation — R-015; the old KV had #8 as "done"
prematurely). Restored #13 severity (Serious).

**Dashboard (`docs/dashboard/index.html`):**
- `BUGS_SEED` deleted; the board renders from a **last-good localStorage cache**
  instantly (stale-while-revalidate) then refreshes live → no loading flash.
- Removed the HONE-024 overlay; edits send the **GitHub issue number** to `/update`.
- Optimistic update on edit, then GitHub confirms (consistent) → never reverts.

## Result
Edit a status → instant → refresh → it holds, every time. One source, consistent reads,
no flash, no revert. The KV eventual-consistency class of bug is gone, not masked.

**Note for Patrick:** #8 and #13 now show **"Fixed — build & check"** (they were
fix-attempted, not validated). If you've already validated them on-device, set them to
**Done ✓** — it now sticks instantly.

Per R-015: not self-closing.
