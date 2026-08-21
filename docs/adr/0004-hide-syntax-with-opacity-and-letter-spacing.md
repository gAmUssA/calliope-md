# 4. Hide syntax markers with zero opacity and collapsed letter-spacing

- **Status:** Accepted. Superseded in part by ADR-0013 and ADR-0014 for tables.
- **Date:** 2026-02-01

## Context

ADR-0001 rules out deleting syntax markers from the buffer, so "hidden" has to be achieved by styling alone. The VS Code decoration API has no `display: none`. Making a marker transparent (`color: transparent`, `opacity: 0`) leaves its glyph advance behind, so `# Heading` renders as two blank columns followed by the text — visibly indented and obviously wrong for a heading.

## Decision

The `syntaxHidden` decoration type combines `opacity: '0'` with `letterSpacing: '-1000px'`. The opacity makes the glyph invisible; the large negative letter-spacing collapses its advance width so following characters pull back to the line start.

`syntaxGhost` uses only `opacity: <ghostOpacity>` and leaves width intact, so the ghost-to-raw transition never moves text.

## Consequences

- Markers genuinely disappear rather than leaving gaps, which is what makes rendered headings and emphasis look like formatted text.
- The technique is not part of the documented decoration API contract. It works because decorations become CSS, and it would break silently if VS Code changed how these properties are applied.
- The rendered-to-ghost transition changes text width, so it shifts layout. On a single heading that is invisible; applied to every pipe in a table it produced a shimmer feedback loop, because the layout shift fired `onDidChangeTextEditorVisibleRanges`, which scheduled another decoration pass. Tables therefore never use `syntaxHidden` for pipes — see ADR-0013 and ADR-0014.
- Column alignment inside monospace tables depends on hidden characters keeping their width, which is the opposite of what this decoration does. That conflict is what drove the separate `tablePipeHidden` type.
