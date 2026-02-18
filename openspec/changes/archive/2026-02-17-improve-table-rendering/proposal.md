## Why

The current table rendering shows raw Markdown syntax — pipes `|` are visible (dimmed but present), the separator row `|---|---|` clutters the view, and there's no clean visual structure between rows. Tables should render like HTML tables in a writing app (e.g. Ulysses): pipes completely hidden, separator invisible, bold headers, thin horizontal borders between rows, and a "Table N×M" label badge above each table. The goal is a document-like reading experience where tables are visually structured blocks, not raw Markdown.

## What Changes

- Completely hide pipe delimiters (`|`) using `tablePipeHidden` (opacity: 0) for a clean appearance while preserving column alignment
- Completely hide separator rows when cursor is outside the table; dim when editing inside
- Add thin horizontal `border-bottom` lines (via CSS injection through `textDecoration`) between body rows for visual structure
- Add a thicker `2px` bottom border under the header row and last body row (table frame)
- Add a "Table" label with dimensions (e.g. "Table 3 × 4") above each table, spread across the width (Ulysses style)
- Bold header cells; body cells intentionally unstyled so inline formatting (code, bold, italic) renders naturally
- Auto-format tables on save: pad cells to equal column widths for alignment
- Manual `Calliope: Format Tables` command
- Parse inline formatting inside table cells (bold, italic, inline code)
- Raw mode on cursor row: reveal all syntax for editing

## Capabilities

### New Capabilities

- `table-auto-format`: Automatically pad table cells to equal column widths on save (when `renderTables` is enabled) or via manual command. Ensures columns align when pipes are hidden.

### Modified Capabilities

- `table-rendering`: Pipes hidden via opacity:0 (preserves character width); separator hidden/ghosted; horizontal-only borders via CSS injection (`textDecoration: 'none; border-bottom: ...'`); table label spread across width; no cell padding/background; inline formatting parsed inside table cells.

## Impact

- `src/decorations/elements/tables.ts` — pipes → `tablePipeHidden` (opacity:0), separator → `syntaxHidden`/`syntaxGhost`, header/body/last-row borders, table label with spread layout
- `src/decorations/decorationTypes.ts` — new types: `tablePipeHidden` (opacity:0), `tableHeaderBorder` (2px), `tableLastRowBorder` (2px), `tableLabel` (isWholeLine); borders via `textDecoration` CSS injection; `tableBodyCell` intentionally empty
- `src/decorations/decorationManager.ts` — clear all table decoration types including `tableLastRowBorder`
- `src/formatters/tableFormatter.ts` — NEW: auto-format tables (pad cells to equal column widths), manual command, auto-format on save hook
- `src/parser/markdownParser.ts` — removed `SKIP` on table visitor so inline formatting (bold, code, etc.) is parsed inside table cells
- `src/extension.ts` — registered `calliope.formatTables` command and `onWillSaveTextDocument` hook
- `package.json` — added `calliope.formatTables` command
- No API or dependency changes; no breaking changes
