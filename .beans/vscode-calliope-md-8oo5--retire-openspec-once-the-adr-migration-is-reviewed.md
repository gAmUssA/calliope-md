---
# vscode-calliope-md-8oo5
title: Retire openspec/ once the ADR migration is reviewed
status: todo
type: task
priority: low
created_at: 2026-08-21T03:24:58Z
updated_at: 2026-08-21T03:24:58Z
---

`openspec/` was migrated to `docs/adr/` additively — nothing was deleted, so the two can be diffed first. `docs/adr/MIGRATION.md` records the full mapping, the three stale specs, and what is lost by deleting.

Once the ADRs have been reviewed, the whole tree can go:

```
openspec/config.yaml
openspec/specs/                 (19 capability specs)
openspec/changes/archive/       (13 archived change proposals)
openspec/.DS_Store
openspec/changes/.DS_Store
```

Nothing under `src/`, `test/`, `Makefile`, `package.json` or `.github/` reads `openspec/`.

The scenario-level acceptance criteria in `openspec/specs/` are the one thing with no home in the ADRs. If they are worth keeping they belong in `test/`, which currently covers the parser, frontmatter, decoration options, presentation mode and selection kind — well short of the 19 specs.

- [ ] Review docs/adr/ against openspec/
- [ ] Decide whether any spec scenarios should become tests before deletion
- [ ] Delete openspec/
- [ ] Drop the openspec entry from .vscodeignore if present, and retire the openspec-* / opsx:* skills for this repo
