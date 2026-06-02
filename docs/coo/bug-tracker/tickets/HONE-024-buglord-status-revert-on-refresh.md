# HONE-024 — Bug Lord status edits revert on refresh (KV read-after-write lag)

```
TYPE:            Bug
SEVERITY:        P2
CATEGORY:        Infra / UX
SCREEN:          Bug Lord (Bugs page)
ASSIGNEE:        Engineer
EPIC:            EPIC-launch-ready
FIX ATTEMPTED:   docs/infra commit <tbd> (dashboard-only, no EAS build)
REPRODUCIBLE:    Always (within ~60s of an edit)
ROOT CAUSE:      Cloudflare KV is eventually consistent. /update writes the
                 override to KV; /bugs reads it back via KV.get which edge-caches
                 ≥60s and propagates writes lazily — so a refresh seconds after an
                 edit reads the OLD value and the change appears to revert until KV
                 catches up.
```

**Reporter:** Patrick · **Filed:** 2026-06-02

## Repro
1. On the Bugs page, change a job's status — it updates instantly (optimistic UI).
2. Refresh the page ~5s later → the job reverts to the old status.
3. It only sticks after staying on the page a while (KV finally propagates).

## Expected
An edit is instant and stays put across refresh — no waiting on KV.

## FIX ATTEMPTED — docs/infra commit `<tbd>` — 2026-06-02

_Senior Engineer. Dashboard-only; no Worker change; no EAS build._

**Fix: a persistent optimistic overlay** in `docs/dashboard/index.html`.
- Every confirmed edit (`/update` → 200) is recorded in `localStorage`
  (`buglord_pending_overrides_v1`) as `{id:{fields:{st,sev,who,build}, ts}}`.
- Both fetch paths (`initBugLord`, the 15s `refreshBugs` poll) run `applyOverrides()`
  on the freshly-fetched bugs: it overlays held edits, **drops any field the server
  already matches** (KV caught up → self-healing), and expires entries after 10 min
  (safety valve against divergence).
- Net effect: edits are instant AND survive refresh; once KV propagates (≤~60s) the
  overlay silently clears and the server becomes the source of truth again.

**Why not a server fix:** KV cannot give read-after-write consistency (Cloudflare
recommends Durable Objects for that). The overlay fixes the UX completely with zero
infra/cost. If we ever want pure server-side consistency across devices, the upgrade
is a Durable Object (SQLite-backed, free tier) holding the overrides — noted for later.

**Tradeoff (documented):** for up to 10 min, a held edit wins over an external change
to the same field (e.g. someone else editing on GitHub). Single-user tool → negligible;
the 10-min expiry bounds it.

Per R-015: not self-closing.
