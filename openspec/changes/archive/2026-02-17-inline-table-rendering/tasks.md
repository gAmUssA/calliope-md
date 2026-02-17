## 1. Types and Parser

- [x]1.1 Add `TableElement`, `TableRowElement`, `TableCellElement` interfaces and `AlignType` to `src/parser/types.ts` with fields: `rows[]`, `separatorRange`, `align[]`, per-row `cells[]`, per-cell `content`, `contentRange`, `pipeRange`, `isHeader`
- [x]1.2 Add `tables: TableElement[]` field to `ParsedDocument` interface in `src/parser/types.ts`
- [x]1.3 Add `TableElement` to the `AnyParsedElement` union type in `src/parser/types.ts`
- [x]1.4 Add `case 'table'` handler in `src/parser/markdownParser.ts` that calls a new `extractTable` function to walk `table` → `tableRow` → `tableCell` AST nodes and populate `TableElement` objects
- [x]1.5 In `extractTable`, compute `separatorRange` from the document text (the line between header row and first body row), and populate `align` from the remark-gfm `node.align` array
- [x]1.6 In `extractTable`, for each cell compute `pipeRange` by locating the leading `|` delimiter character in the source text relative to the cell position

## 2. Decoration Types

- [x]2.1 Add `tableHeaderCell` decoration type to `src/decorations/decorationTypes.ts` with bold font weight and `editorWidget.background` background color
- [x]2.2 Add `tableBodyCell` decoration type (initially unstyled, for clearing when disabled)
- [x]2.3 Add `tableSeparatorLine` decoration type for separator row handling

## 3. Decoration Handler

- [x]3.1 Create `src/decorations/elements/tables.ts` with `TableDecorations` interface containing arrays for `tableHeaderCell`, `tableBodyCell`, `tableSeparatorLine`, and `syntaxGhost`
- [x]3.2 Implement `createTableDecorations(tables, editor)` function that iterates rows and cells, calls `getVisibilityState` per-row, and populates header cell, body cell, pipe marker, and separator row decoration arrays based on visibility
- [x]3.3 In `createTableDecorations`, handle separator row visibility: hidden when cursor is away, ghost when on adjacent row, visible when cursor is directly on it
- [x]3.4 In `createTableDecorations`, track each pipe `|` as a marker range per cell and apply `syntaxGhost` based on per-row visibility state (no `syntaxHidden` to avoid layout-shift shimmer)
- [x]3.5 Implement `applyTableDecorations(editor, types, decorations)` function that calls `editor.setDecorations` for each table decoration type
- [x]3.6 Export a `clearTableDecorations(editor, types)` helper that sets empty arrays for all table decoration types

## 4. Manager Integration

- [x]4.1 Import `createTableDecorations` and `applyTableDecorations` in `src/decorations/decorationManager.ts`
- [x]4.2 Add `renderTables` config check block in the decoration update function: filter tables by visible range, call `createTableDecorations`, call `applyTableDecorations`, and push syntax decorations to the shared `syntaxGhost` array (tables do not use `syntaxHidden`)
- [x]4.3 When `renderTables` is `false`, call `clearTableDecorations` to remove all table decorations

## 5. Configuration

- [x]5.1 Add `renderTables: boolean` to `CalliopeConfig` interface in `src/config.ts` and read it from `calliope.renderTables` (default: `false`, experimental)
- [x]5.2 Add `calliope.renderTables` property to `contributes.configuration` in `package.json` with type boolean, default false, and [EXPERIMENTAL] description

## 6. Verification

- [x]6.1 Build the project with `npm run build` and verify no compilation errors
- [x]6.2 Test with a markdown file containing a simple table (header + separator + 2 body rows) — verify header styling, separator hiding, and pipe hiding in rendered state
- [x]6.3 Test cursor movement: verify per-row visibility transitions (raw on cursor row, ghost on adjacent, rendered on distant)
- [x]6.4 Test with `calliope.renderTables: false` — verify all table decorations are cleared
- [x]6.5 Test with a table containing column alignment markers (`:---:`, `---:`) — verify alignment metadata is parsed correctly
