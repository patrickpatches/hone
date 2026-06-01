# HONE-017 — Items added from a recipe were tagged wrong in the shopping list

TYPE: Bug · SEVERITY: P2 · SCREEN: Shop · ASSIGNEE: Engineer · FIX ATTEMPTED: #135 · STATUS: awaiting Patrick on-device (R-015)

Recipe-added shopping items carried the wrong source kind, so Shop's reconcile could sweep them. Fixed: correct source kind on recipe-add (2026-06-01, build #135). Sibling of HONE-007.
