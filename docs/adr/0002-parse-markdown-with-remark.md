# 2. Parse Markdown with unified, remark-parse and remark-gfm

- **Status:** Accepted
- **Date:** 2026-02-01

## Context

Decorations are applied to `vscode.Range` values, so the parser must report the exact line and column of every construct — not just the content, but each individual syntax marker, since markers and content are styled differently (ADR-0003). GitHub Flavored Markdown features (task lists, strikethrough, tables) are in scope.

Options considered:

- `unified` + `remark-parse` + `remark-gfm`: mdast nodes carry `position.start`/`position.end` with line, column and offset for every node.
- `markdown-it`: token stream with coarser position information; recovering exact marker offsets requires re-scanning source text.
- Hand-rolled regex scanning: cheap to start, wrong on nesting, escapes, code spans and reference links.
- VS Code's own Markdown engine: not exposed to extensions.

## Decision

Parse with `unified().use(remarkParse).use(remarkGfm)` and walk the tree with `unist-util-visit` (later also `unist-util-visit-parents`). Extraction lives in `src/parser/markdownParser.ts`; the typed results live in `src/parser/types.ts`.

Every extracted element carries a `range` plus, where relevant, a `syntaxRange` (the part to hide) and a `contentRange` (the part to style). Parser positions are 1-indexed; the decoration layer subtracts 1 to reach VS Code's 0-indexed coordinates.

## Consequences

- Marker-accurate positions make the three-state model straightforward: the parser says where the `#` ends and the heading text begins.
- GFM tables and task lists arrive as first-class AST nodes, so table rendering (ADR-0013) needed no new parser dependency.
- Not everything Calliope renders is in the mdast. YAML frontmatter is detected outside the AST (ADR-0010), and setext headings needed the raw source consulted because remark reports a heading node without saying which syntax produced it.
- Parsing is synchronous and whole-document. That cost is contained by the caching and debouncing in ADR-0005, not by incremental parsing.
- The `syntaxRange` / `contentRange` split became the parser's contract with the decoration layer. Elements whose syntax sits on a different line from their content (setext headings) fit it without changes to the decoration handlers.
