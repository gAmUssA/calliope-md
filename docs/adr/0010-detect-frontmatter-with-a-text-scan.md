# 10. Detect YAML frontmatter with a text scan, not a remark plugin

- **Status:** Accepted
- **Date:** 2026-02-09

## Context

Markdown files routinely open with YAML frontmatter delimited by `---`. Without special handling it is indistinguishable from body text, and its opening `---` is ambiguous with a thematic break.

Calliope needs one thing from frontmatter: the range it occupies, so the block can be dimmed. It does not need the parsed keys — nothing in the extension reads `title` or `tags`.

`remark-frontmatter` would add a dependency and produce a parsed YAML structure that would go unused.

## Decision

Detect frontmatter in `src/parser/markdownParser.ts` with a text check rather than a plugin: the document must begin at offset 0 with `---`, and a closing `---` must appear on a later line. The block is treated as opaque text; only its range is recorded, covering both delimiters and the content between them. Rendering is a single block decoration (`src/decorations/elements/metadata.ts`, `metadataDim`) rather than per-line decorations, gated by `calliope.renderMetadata` (default `true`).

## Consequences

- No new dependency, and no YAML parsing on every keystroke.
- The horizontal-rule ambiguity resolves correctly by construction: frontmatter requires a matched pair of delimiters starting at position 0, so a lone `---` remains a thematic break.
- Frontmatter is dimmed as a whole and cannot be styled per field. Syntax-highlighting the YAML would require the parse this decision avoids.
- Only YAML frontmatter is recognised. TOML (`+++`) and JSON frontmatter are not.
- Detection sits outside the mdast, so frontmatter is the one element whose position does not come from remark. It still flows through the same parse cache and viewport filtering as everything else.
