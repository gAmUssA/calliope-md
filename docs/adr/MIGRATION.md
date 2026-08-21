# OpenSpec to ADR migration

Record of how `openspec/` was converted into `docs/adr/` plus beans. This pass is **additive** — nothing under `openspec/` was modified or deleted, so the two can be diffed before anything is removed.

## Archived changes to ADRs

Thirteen archived change proposals, mined mainly for their `design.md` rationale.

| Archived change | Becomes |
|---|---|
| `2026-02-01-init-extension-scaffold` | ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0005 |
| `2026-02-01-phase2-elements` | no ADR — applies the established pattern to five more element types |
| `2026-02-01-presentation-mode` | ADR-0006 |
| `2026-02-02-improve-presentation-error-reporting` | ADR-0008 |
| `2026-02-02-mermaid-diagram-rendering` | ADR-0007 |
| `2026-02-09-metadata-rendering` | ADR-0010 |
| `2026-02-12-header-font-sizes` | ADR-0012 |
| `2026-02-17-inline-table-rendering` | ADR-0013 |
| `2026-02-17-improve-table-rendering` | ADR-0014 |
| `2026-02-26-fix-setext-heading-rendering` | no ADR — parser bugfix |
| `2026-03-16-fix-presentation-mode-deprecated-setting` | no ADR — API rename, covered as a consequence in ADR-0006 |
| `2026-03-16-fix-presentation-mode-settings-overwrite` | ADR-0015 |
| `2026-03-16-optional-inline-images` | ADR-0016 |

The scaffold change carries five ADRs because it bundled five independent decisions (no document mutation, parser choice, visibility model, hiding technique, performance strategy) that have diverged since and are superseded independently.

## ADR with no openspec source

**ADR-0009** — the mermaid.js webview renderer — has no proposal, design or spec anywhere in `openspec/`. It was reconstructed from git:

- `5b1f603` (2026-02-09 14:32, v0.5.0) "Replace beautiful-mermaid with official mermaid.js running in a hidden webview... SVG post-processing via cheerio, LRU cache, and visual error SVGs", adding `src/mermaid/` (964 lines across 8 modules), the `calliope.mermaidRenderer` webview view, a `copy-mermaid` build step vendoring mermaid into `media/mermaid/`, and dependencies on `mermaid@11` and cheerio.
- `f3cafca` (2026-02-09 21:54) reverts all of it seven hours later: `beautiful-mermaid` restored, webview view and build step removed, and the v0.5.0 CHANGELOG entry deleted. The version number went backwards to 0.4.3, so v0.5.0 has no CHANGELOG entry at all.

This is the clearest supersession in the project's history and it was the one thing openspec did not record. ADR-0009 and ADR-0011 restore it.

## Capability specs

The 19 files in `openspec/specs/` are behaviour specifications, not decisions. They are not carried into ADRs. What was extracted from them is the delta against the implementation, which became beans.

Three specs are stale and should not be carried forward in any form:

- **`header-rendering`** — "Requirement: Use variable line height for headers... line height SHALL be set proportionally (e.g., 42px for H1)". The 2026-02-12 design (ADR-0012) explicitly made line-height a non-goal because the decoration API does not honour it reliably. There is no `lineHeight` anywhere in `src/`. The spec was never updated to match; the requirement is obsolete, not unimplemented.
- **`mermaid-diagram-rendering`** — its "Temp File Architecture" and "Resource Cleanup" sections describe SVGs written to `.calliope/mermaid/{hash}.svg` with a cleanup sweep. That architecture was abandoned in v0.4.1 (ADR-0007); no such code exists.
- **`error-notification`** — its "Theme application failure on theme change" scenario describes the `onDidChangeActiveColorTheme` listener that ADR-0015 deleted. It also still carries the `Purpose: TBD - created by archiving change... Update Purpose after archive` placeholder.

## Beans filed

Only gaps that are verifiably open against `main` were filed. See `beans list`.

- `calliope.renderImages` still defaults to `true` in `package.json` and `src/config.ts`, though the archived change and the synced spec both require `false` — the tasks were checked off but never applied.
- Image previews never show a placeholder for a missing or unreachable file, and upscale small images to 200px, both contrary to `image-rendering`.
- Retiring `openspec/` itself, once this migration has been reviewed.

Gaps found during the pass and **already closed on `main` while it was running**, so not filed: the abandoned `src/mermaid/` tree was deleted; Mermaid cache keys became document- and theme-scoped with eviction and a size cap; the no-op `cleanupUnusedSvgFiles()` was removed.

## Paths safe to delete

After diffing this migration, the whole of `openspec/` can go:

```
openspec/config.yaml
openspec/specs/                 (19 capability specs)
openspec/changes/archive/       (13 archived change proposals)
openspec/.DS_Store
openspec/changes/.DS_Store
```

Nothing under `src/`, `test/`, `Makefile`, `package.json` or `.github/` reads `openspec/`. The only references are documentation cross-links.

Two things are lost by deleting it and are not reproduced here:

1. **The `tasks.md` checklists** for each archived change — a record of implementation steps. Their content is in git history; the one checklist item that mattered (the unapplied `renderImages` default) is now a bean.
2. **The scenario-level acceptance criteria** in `openspec/specs/`. ADRs record why the architecture is the way it is; they do not record every `WHEN`/`THEN` pair. If those are wanted as living documentation, they belong in tests rather than in prose — `test/` currently covers the parser, frontmatter, decoration options, presentation mode and selection kind, which is well short of the 19 specs.

Deleting the OpenSpec tooling config (`openspec/config.yaml`) also retires the `openspec-*` and `opsx:*` skills for this repo.
