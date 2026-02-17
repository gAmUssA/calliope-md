## Why

Markdown tables written with pipe syntax (`| col | col |`) are hard to read in their raw form — columns don't align, there's no visual distinction between headers and data rows, and alignment markers (`---`, `:---:`) are noise. Calliope already renders every other major markdown element inline but tables are silently ignored despite remark-gfm already parsing them into the AST. Adding styled inline table rendering completes the editing experience.

## What Changes

- Extract table AST nodes from the remark-gfm parser into a new `TableElement` type with row, cell, and column alignment metadata
- Render tables inline with styled decorations: header row styling (bold, background), cell borders/separators, column alignment, and alternating row shading
- Apply three-state visibility (rendered/ghost/raw) consistent with other elements
- Add `calliope.renderTables` configuration setting (default: `true`)

## Capabilities

### New Capabilities
- `table-rendering`: Detection, parsing, styled inline display, three-state visibility, and configuration for GFM tables in the editor

### Modified Capabilities
_(none — the parser already handles GFM table AST nodes; this change adds extraction and rendering on top)_

## Impact

- **Parser**: Add `case 'table'` handler in `src/parser/markdownParser.ts`, new `TableElement` type in `src/parser/types.ts`, `tables` field on `ParsedDocument`
- **Decorations**: New `src/decorations/elements/tables.ts` handler, new decoration types in `decorationTypes.ts`, integration in `decorationManager.ts`
- **Config**: New `renderTables` property in `CalliopeConfig` and `package.json` contributes.configuration
- **Dependencies**: None — uses existing remark-gfm parser and VS Code decoration API
