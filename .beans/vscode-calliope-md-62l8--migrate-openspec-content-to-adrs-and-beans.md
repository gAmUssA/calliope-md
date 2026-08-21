---
# vscode-calliope-md-62l8
title: Migrate OpenSpec content to ADRs and beans
status: completed
type: task
priority: normal
created_at: 2026-08-21T03:19:58Z
updated_at: 2026-08-21T03:25:08Z
---

Convert the `openspec/` corpus (19 capability specs + 13 archived change proposals) into Architecture Decision Records under `docs/adr/`, and file beans for work that is genuinely still open.

Additive pass only — `openspec/` is left untouched so it can be diffed before deletion. `docs/adr/MIGRATION.md` records the mapping and the paths that become safe to delete.

- [x] Read every archived proposal.md/design.md and the 19 current specs
- [x] Verify each candidate decision against `src/` and git history
- [x] Write ADRs 0001-0016 in chronological order
- [x] Write docs/adr/README.md index
- [x] Write docs/adr/MIGRATION.md mapping + safe-to-delete list
- [x] File beans for verified spec-vs-implementation gaps

## Summary of Changes

16 ADRs in `docs/adr/`, Nygard format, chronological, plus `README.md` (index) and `MIGRATION.md` (mapping + safe-to-delete list). `openspec/` untouched.

ADR-0009 (the mermaid.js webview renderer) has no openspec source at all — reconstructed from commits `5b1f603` and `f3cafca`, which introduced and reverted it seven hours apart on 2026-02-09. That supersession chain (0007 -> 0009 -> 0011) is the main thing openspec failed to record.

Three beans filed for verified open gaps. Several other gaps found during the pass closed on `main` while it was running (the abandoned `src/mermaid/` tree deleted, mermaid cache keys made document- and theme-scoped, `cleanupUnusedSvgFiles()` removed), so they were not filed.
