# Per-session backups

Each numbered folder is a snapshot of source files captured at the *start*
of the matching session. The session number aligns with the entries in
`CLAUDE.md` and the development log XLSX.

These exist so any session can:

- Recover from accidental file corruption (the file sync issues
  documented in `docs/the file system-fix.md`)
- Diff against the current state to verify what changed
- Restore a known-good source if a redesign turns out to be a regression

Older backups can be deleted once we've shipped past the relevant version
and there's no realistic recovery scenario. Default rule: keep the last
4 sessions on disk; older ones move out of source control.

| Session | Captured before | Notes |
|---|---|---|
| 11 | First Android APK build | Pre-SDK-54 package upgrade |
| 12 | Bug audit + file corruption diagnosis | Pre-pantry-rework |
| 13 | UX wave 2 (calendar→+, chip rail, yield types) | Pre-redesign |
| 14 | Autocomplete + Plan & Shop merge + Pantry tag-cloud | Pre-Mona-Lisa-search |
