# 13. Render GFM tables inline with per-row visibility and no width-collapsing decorations

- **Status:** Accepted. Superseded in part by ADR-0014 (pipe and separator styling).
- **Date:** 2026-02-17

## Context

Tables were the last major GFM element with no inline rendering, even though `remark-gfm` already produced `table`, `tableRow` and `tableCell` nodes with position data and column alignment.

Applying the house pattern naively did not work. Two attempts failed during implementation, both for the same underlying reason:

- Hiding pipes with `syntaxHidden` (ADR-0004) collapsed each pipe's width. Moving the cursor onto the table made every pipe on every row snap from zero-width to full-width at once. The resulting layout shift changed the editor's visible ranges, which fired `onDidChangeTextEditorVisibleRanges`, which scheduled another decoration pass — a shimmer feedback loop against the viewport-driven update cycle of ADR-0005.
- Hiding the separator row the same way produced the same loop.

## Decision

Model a table as a flat `rows[]` array of cells carrying content, alignment and ranges, with the first row as the header and the separator row's range tracked separately. Column alignment is a per-table array indexed by cell position rather than a column object, because decorations are applied per range, not per column.

Apply three-state visibility per row rather than per table, so editing one cell does not force a 20-row table into raw mode. The separator row's visibility keys off the table-level range: raw only when the cursor is directly on it.

Never use `syntaxHidden` inside tables. Pipes are dimmed with `syntaxGhost` and keep their natural width; the separator row uses a dedicated `tableSeparatorLine` type at 8% opacity — nearly invisible, but width-stable.

Keep the number of static decoration types minimal (`tableHeaderCell`, `tableBodyCell`, `tableSeparatorLine`) and express per-cell alignment through `renderOptions`, per ADR-0005. Gate on `calliope.renderTables`. Filter tables by viewport before building ranges, since a 20x5 table is over 200 ranges on its own.

## Consequences

- Tables render inline with stable layout and no shimmer.
- Pipes stay visible at ghost opacity rather than disappearing, which reads as styled Markdown rather than as a table. ADR-0014 revisits exactly this, having found a width-preserving way to hide them.
- Per-row visibility became the precedent for multi-line constructs generally.
- The width-stability constraint is now a standing rule for tables: any decoration applied inside a table must preserve character width.
- `tableBodyCell` is deliberately empty, existing so the apply function stays symmetric and can clear decorations when `renderTables` is switched off.
