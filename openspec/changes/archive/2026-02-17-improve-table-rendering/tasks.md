## 1. Ulysses-Style Decoration Types

- [x] 1.1 `tableHeaderCell`: bold only (no padding, no background) in `src/decorations/decorationTypes.ts`
- [x] 1.2 `tableBodyCell`: intentionally empty — body cells inherit normal styling so inline formatting renders naturally
- [x] 1.3 `tableSeparatorLine`: `opacity: 0` (kept for clearing; separator uses `syntaxHidden`)
- [x] 1.4 `tableRowLine`: whole-line `border-bottom: 1px solid` via `textDecoration` CSS injection
- [x] 1.5 `tableHeaderBorder`: whole-line `border-bottom: 2px solid` via `textDecoration` CSS injection
- [x] 1.6 `tableLastRowBorder`: whole-line `border-bottom: 2px solid` — thick border on last body row (table bottom frame)
- [x] 1.7 `tableLabel`: `isWholeLine: true` (uses per-instance `after` renderOptions for spread label text)
- [x] 1.8 `tablePipeHidden`: `opacity: '0'` — hides pipe glyph while preserving character width

## 2. Hide Pipes and Separator

- [x] 2.1 Pipe delimiters → `tablePipeHidden` (opacity:0, preserves width) when cursor not on row
- [x] 2.2 Trailing pipe → `tablePipeHidden` when cursor not on row
- [x] 2.3 Separator row → `syntaxHidden` when cursor outside table, `syntaxGhost` when inside
- [x] 2.4 Add `tablePipeHidden` array to `TableDecorations` interface
- [x] 2.5 `decorationManager.ts`: push `tableDecos.syntaxHidden` to `allSyntaxHidden`

## 3. Row Borders (three-tier via CSS injection)

- [x] 3.1 Header row → `tableHeaderBorder` (2px solid foreground) when cursor not on row
- [x] 3.2 Body rows → `tableRowLine` (1px solid editorWidget.border) when cursor not on row
- [x] 3.3 Last body row → `tableLastRowBorder` (2px solid foreground) when cursor not on row
- [x] 3.4 All borders use `textDecoration: 'none; border-bottom: ...'` CSS injection for crisp lines
- [x] 3.5 Update `applyTableDecorations`, `clearTableDecorations`, `clearAllDecorations` for all types

## 4. Table Label Badge (Ulysses spread layout)

- [x] 4.1 Compute column count from `table.align.length` and total rows (header + body)
- [x] 4.2 Compute table width from header row text length
- [x] 4.3 Render spread label: "Table" left + space padding + "N × M" right in single `after` attachment
- [x] 4.4 Label placed on line above table (`tableStartLine - 1`)
- [x] 4.5 Only show label when cursor is outside the table

## 5. Inline Formatting Inside Tables

- [x] 5.1 Remove `SKIP` from table case in AST visitor (`src/parser/markdownParser.ts`)
- [x] 5.2 Inline code, bold, italic, strikethrough now parsed and decorated inside table cells
- [x] 5.3 Backtick markers hidden inside table cells (same as in regular text)

## 6. Auto-Format Tables for Column Alignment

- [x] 6.1 Create `src/formatters/tableFormatter.ts` — compute max column widths, pad cells with spaces
- [x] 6.2 Handle alignment markers (`:---`, `:---:`, `---:`) in separator formatting
- [x] 6.3 Register `calliope.formatTables` command in `package.json` and `src/extension.ts`
- [x] 6.4 Auto-format on save via `onWillSaveTextDocument` when `renderTables` is enabled
- [x] 6.5 Manual command shows "All tables are already formatted" when no edits needed

## 7. Build and Validate

- [x] 7.1 Run `npm run compile` (esbuild bundle)
- [x] 7.2 TypeScript type-check passes (only pre-existing warnings)
- [x] 7.3 Alignment indicators (◁ ◇ ▷) still appear on header cells
