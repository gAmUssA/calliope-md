# 14. Present tables Ulysses-style, with save-time column alignment

- **Status:** Accepted
- **Date:** 2026-02-17

## Context

ADR-0013 made tables render without shimmer, but the result still looked like Markdown: pipes visible at ghost opacity, a faint separator row, no visual structure between rows. Compared against the Ulysses writing app the target became clear — a table should read as a structured block, not as delimited text.

The blocker was ADR-0013's width-stability rule. Hiding pipes had meant `syntaxHidden`, and `syntaxHidden` collapses width. But the collapse comes from `letterSpacing: -1000px`, not from `opacity: 0` — the two are separable.

## Decision

Introduce `tablePipeHidden`, using `opacity: '0'` alone. The pipe glyph vanishes while its character cell remains, so columns stay aligned and no layout shift occurs. Hide the separator row outright when the cursor is outside the table and ghost it when the cursor is inside, so structure is available while editing.

Draw horizontal rules by injecting CSS through `textDecoration` (the technique of ADR-0012), because the typed `borderBottom` and `borderColor` decoration properties render unevenly or not at all: 1px between body rows, 2px under the header row and under the last body row to frame the table. No vertical borders — Ulysses uses horizontal rules only.

Add a `Table` / `N x M` label on the line above each table, spread across its width by space-padding a single `after` attachment. A `before`/`after` split was tried first and abandoned: decoration pseudo-elements cannot do flexbox or `margin-left: auto`, so true right alignment is impossible, while space-padding in a monospace grid achieves the same look.

Style header cells with `fontWeight: bold` only, and leave body cells unstyled, so inline formatting inside cells renders naturally rather than fighting cell-level CSS. Stop returning `SKIP` for table nodes in the AST visitor so emphasis, inline code and links inside cells are extracted by their own handlers.

Hidden pipes only preserve alignment if cell text is already equal width per column, so add a formatter (`src/formatters/tableFormatter.ts`) that pads cells to the maximum column width, honouring left/center/right alignment. It runs from the `Calliope: Format Tables` command and from an `onWillSaveTextDocument` hook that returns `TextEdit[]` when `renderTables` is enabled.

## Consequences

- Tables read as document-like blocks: no pipes, no separator, bold headers, framed rows.
- This is the one place the extension edits document text as part of rendering, which sits against ADR-0001. It is bounded: whitespace only, never content, and only on explicit save or explicit command. Returning `TextEdit[]` from the will-save hook avoids a save loop.
- Inline formatting composes inside cells because cell decorations carry no CSS of their own.
- The border rendering depends on CSS injection that VS Code does not document. If it stops working the borders vanish and table content is otherwise unaffected.
- Hidden pipes still occupy a character cell, so a small gap remains at each pipe position. The formatter's equal-width padding makes it read as consistent column spacing.
- A table starting on the first line of a document has nowhere to put its label; the label overlaps line 0. Accepted as an edge case.
