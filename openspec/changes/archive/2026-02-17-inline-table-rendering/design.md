## Context

Calliope renders markdown elements inline using VS Code's TextEditorDecorationType API. Each element type follows a consistent pattern: a parser extracts AST nodes into typed elements, a decoration handler maps those elements to styled ranges based on 3-state visibility (rendered/ghost/raw), and the decoration manager orchestrates per-element handlers into a combined update cycle.

Tables are the last major GFM element without inline rendering. The remark-gfm parser already produces `table`, `tableRow`, and `tableCell` AST nodes with position data and column alignment metadata. This design covers how to extract, model, and render those nodes using the existing decoration architecture.

## Goals / Non-Goals

**Goals:**
- Render GFM pipe tables with styled header rows, visible cell boundaries, and column alignment
- Hide separator rows and pipe delimiters using the existing 3-state visibility system
- Follow the established element handler pattern (types → parser → handler → manager)
- Support per-element configuration via `calliope.renderTables`

**Non-Goals:**
- Column width equalization or auto-formatting (would require modifying document text)
- Rendering tables as HTML/webview overlays (stay within decoration API)
- Supporting non-GFM table syntaxes (e.g., grid tables, simple tables)
- Alternating row shading (VS Code decoration backgrounds don't reliably cover full cell widths without `isWholeLine`, and per-cell backgrounds create visual gaps between cells)

## Decisions

### 1. Element Model: Flat rows with cell metadata

**Decision**: Model `TableElement` with a flat `rows[]` array. Each row contains `cells[]` with content text, alignment, and ranges. The first row is always the header. Track the separator row range separately for visibility handling.

**Rationale**: The remark-gfm AST already structures tables as table → tableRow → tableCell. A flat row/cell model maps directly to this and keeps the decoration handler simple — iterate rows, iterate cells, apply styles. No need for a more complex hierarchical model since decorations are range-based anyway.

**Alternative considered**: Modeling columns as first-class objects. Rejected because decorations are applied per-range (row-oriented), not per-column, so column objects would add indirection without benefit. Column alignment is stored as a per-table array and indexed by cell position.

### 2. Visibility Granularity: Per-row

**Decision**: Apply 3-state visibility at the row level, not the whole table.

**Rationale**: Tables can span many lines. Per-table visibility would force the entire table into raw mode when editing a single cell, which is jarring. Per-row visibility matches how blockquotes handle multi-line elements — each line's markers transition independently based on cursor proximity. When the cursor is on a table row, that row's pipes go raw; other rows stay rendered or ghost.

The separator row uses the table-level range for its visibility check: it only goes raw when the cursor is directly on it, otherwise it stays hidden/ghost.

### 3. Separator Row: Very dim with stable layout

**Decision**: In rendered state, dim the separator row using a dedicated `tableSeparatorLine` decoration type with very low opacity (8%). In ghost state, use `syntaxGhost` (30% opacity). Never use `syntaxHidden` for the separator.

**Rationale**: The separator row (`| --- | :---: | ---: |`) is noise for reading. Initially we used `syntaxHidden` (opacity 0 + letterSpacing -1000px) to collapse it, but this caused layout shifts that triggered `onDidChangeTextEditorVisibleRanges` events, creating a decoration feedback loop (shimmer). Using a dedicated low-opacity type keeps the characters at their natural width — no layout shift, no feedback loop. The 8% opacity makes the separator nearly invisible while maintaining stable layout.

**Alternative considered**: Using `syntaxHidden` to fully collapse the separator. Rejected after implementation testing revealed it causes a shimmer feedback loop via visible-range-change events.

### 4. Pipe Delimiters: Per-cell marker ranges, ghost only

**Decision**: Track each `|` delimiter as a marker range on the cell. When the cursor is not on the row, dim pipes using `syntaxGhost`. When the cursor is on the row, show pipes fully (raw). Never use `syntaxHidden` for pipes.

**Rationale**: Pipes are the table equivalent of `#` markers for headers or `*` for emphasis. Initially we used `syntaxHidden` (opacity 0 + letterSpacing -1000px) to collapse pipes when away from the table, but this caused per-character layout shifts when transitioning between hidden and ghost states on cursor movement — every pipe simultaneously snapping between zero-width and full-width produced visible shimmer. Using `syntaxGhost` for all non-raw states keeps pipes at their natural width with consistent dimming. Each cell tracks its own leading pipe range for independent visibility control.

### 5. Styling Approach: Theme-aware backgrounds and borders

**Decision**: Use VS Code ThemeColor references for all styling:
- **Header cells**: Bold font weight + `editorWidget.background` background
- **Body cells**: No special background (inherit editor background)
- **Column alignment**: `textDecoration` CSS on cell content — left (default/none), center (subtle centered indicator), right (right-aligned indicator)

Use `renderOptions` on DecorationOptions for per-cell dynamic styling (alignment varies per column).

**Rationale**: ThemeColor references ensure the table looks correct in any theme (light, dark, high contrast). Using `renderOptions` for dynamic per-cell styling avoids creating O(columns × alignment-variants) static decoration types — the existing pattern in lists.ts and images.ts demonstrates this approach.

### 6. Decoration Types: Minimal static types

**Decision**: Add three static decoration types:
- `tableHeaderCell` — bold font weight, subtle background
- `tableBodyCell` — no styling (reserved for future use, keeps apply function symmetric)
- `tableSeparatorLine` — whole-line type for separator row hiding

Pipe visibility uses the shared `syntaxGhost` type. Unlike other elements, tables do not use `syntaxHidden` — pipes and separator use ghost/dedicated-dim styles to avoid layout-shift-driven shimmer.

**Rationale**: Minimizes the number of new decoration types. Per-cell styling differences (alignment) are handled via `renderOptions` rather than separate types. The `tableBodyCell` type exists for structural completeness even if initially unstyled — it ensures the apply function can clear decorations properly when toggling `renderTables` off.

## Risks / Trade-offs

**[Pipes dimmed instead of hidden]** → Pipes remain visible at ghost opacity (~30%) rather than being fully hidden. This is an intentional trade-off: full hiding via `syntaxHidden` caused shimmer due to layout shifts. Dimmed pipes provide a subtle table structure cue while maintaining stable layout.

**[Multi-line cell content unsupported]** → GFM pipe tables don't support multi-line cells in the spec, so this is not a real limitation. Remark-gfm will never produce multi-line cell nodes.

**[Large tables may generate many decoration ranges]** → A 20-row × 5-column table creates ~100 cell ranges plus ~120 pipe marker ranges. Mitigation: The existing viewport filtering (±50 lines buffer) already limits processing to visible tables. Tables beyond the viewport are skipped entirely.

**[Cell content with inline formatting]** → Cells can contain emphasis, code, links. The table handler only styles the cell background/alignment; inline formatting within cells is handled by the existing emphasis/code/link handlers since those operate on the same document ranges. No special integration needed — the handlers compose naturally via independent decoration layers.
