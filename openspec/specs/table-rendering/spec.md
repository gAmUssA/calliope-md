## ADDED Requirements

### Requirement: Parser extracts table elements from AST

The parser SHALL extract GFM pipe table nodes from the remark-gfm AST into `TableElement` objects. Each `TableElement` SHALL contain a `rows` array where the first row is the header, a `separatorRange` for the delimiter row, and an `align` array with per-column alignment (`'left' | 'center' | 'right' | null`). Each row SHALL contain a `cells` array where each cell has `content` (trimmed text), `contentRange`, and `pipeRange` (the leading `|` delimiter). The element SHALL be added to a `tables` field on `ParsedDocument`.

#### Scenario: Simple table parsed

- **WHEN** the document contains a GFM pipe table with header, separator, and body rows
- **THEN** the parser produces one `TableElement` with the correct number of rows and cells, each cell's `content` matching the trimmed cell text, and `align` reflecting the separator row's alignment markers

#### Scenario: Table with column alignment

- **WHEN** the separator row contains `:---` (left), `:---:` (center), or `---:` (right) markers
- **THEN** the `align` array on `TableElement` reflects the corresponding alignment for each column position

#### Scenario: No tables in document

- **WHEN** the document contains no GFM pipe tables
- **THEN** `ParsedDocument.tables` is an empty array

#### Scenario: Multiple tables in document

- **WHEN** the document contains two or more separate pipe tables
- **THEN** the parser produces one `TableElement` per table, each with independent rows, cells, and alignment data

### Requirement: Header row styled with bold and background

The decoration handler SHALL apply the `tableHeaderCell` decoration type to header row cells. This decoration type SHALL render cell content with bold font weight and a subtle theme-aware background color (`editorWidget.background`).

#### Scenario: Header cells receive styling

- **WHEN** a table is in rendered or ghost visibility state
- **THEN** each cell in the header row (first row) has bold font weight and a background color distinguishing it from body rows

#### Scenario: Header styling removed in raw state

- **WHEN** the cursor is on the header row
- **THEN** the header row is in raw visibility state and header cell styling is not applied to that row

### Requirement: Separator row dimmed in rendered state

The decoration handler SHALL dim the separator row (the `| --- | --- |` line) using a dedicated `tableSeparatorLine` decoration type (very low opacity, ~8%) when the cursor is outside the table. When the cursor is in the table but not on the separator, the separator SHALL use `syntaxGhost` to appear dimmed. In raw state, the separator row SHALL be fully visible. The separator SHALL NOT use `syntaxHidden` to avoid layout-shift-driven shimmer.

#### Scenario: Separator nearly invisible when cursor is away

- **WHEN** the cursor is not in the table
- **THEN** the separator row content is nearly invisible (8% opacity) but maintains its character width to prevent layout shifts

#### Scenario: Separator ghosted when cursor is in table

- **WHEN** the cursor is on a table row but not on the separator itself
- **THEN** the separator row content is dimmed at ghost opacity (~30%)

#### Scenario: Separator visible when cursor is on it

- **WHEN** the cursor is on the separator row's line
- **THEN** the full separator text (`| --- | :---: | ---: |`) is visible for editing

### Requirement: Pipe delimiters follow 2-state visibility

Each `|` pipe delimiter in table rows SHALL be tracked as a marker range. When the cursor is not on the row, pipes SHALL be dimmed using the shared `syntaxGhost` decoration. When the cursor is on the row, pipes SHALL be fully visible. Pipes SHALL NOT use `syntaxHidden` to avoid layout-shift-driven shimmer caused by `letterSpacing: -1000px` collapsing character widths.

#### Scenario: Pipes dimmed when cursor is away from row

- **WHEN** the cursor is not on a given table row
- **THEN** all pipe delimiters on that row are dimmed at ghost opacity (~30%)

#### Scenario: Pipes dimmed when cursor is on table but different row

- **WHEN** the cursor is on the table but on a different row
- **THEN** the non-cursor row's pipe delimiters are dimmed at ghost opacity (~30%)

#### Scenario: Pipes visible when cursor is on the row

- **WHEN** the cursor is on a specific table row
- **THEN** all pipe delimiters on that row are fully visible

### Requirement: Per-row visibility granularity

The 3-state visibility system SHALL operate at the row level. Each row SHALL independently determine its visibility state based on cursor position. When the cursor is on a row, that row enters raw state while other rows remain in rendered or ghost state.

#### Scenario: Editing one row does not affect others

- **WHEN** the cursor is on the third body row of a five-row table
- **THEN** the third row is in raw state (pipes visible, no styling), while the header and other body rows remain in rendered or ghost state

#### Scenario: Cursor outside table

- **WHEN** the cursor is on a line outside the table entirely
- **THEN** all rows are in rendered state (pipes hidden, header styled, separator hidden)

### Requirement: Configuration toggle

The extension SHALL provide a `calliope.renderTables` boolean configuration setting (default: `false`, experimental). When set to `false`, no table decorations SHALL be applied and all table syntax remains fully visible.

#### Scenario: Table rendering enabled

- **WHEN** `calliope.renderTables` is `true`
- **THEN** table decorations (header styling, pipe dimming, separator dimming) are applied

#### Scenario: Table rendering disabled

- **WHEN** `calliope.renderTables` is `false`
- **THEN** no table-related decorations are applied and all pipe syntax is fully visible

#### Scenario: Setting changed at runtime

- **WHEN** the user changes `calliope.renderTables` while a document with tables is open
- **THEN** decorations are updated immediately to reflect the new setting (applied or cleared)

### Requirement: Viewport-aware processing

The decoration handler SHALL only process tables that overlap with the editor's visible range (plus the standard buffer). Tables entirely outside the visible viewport SHALL be skipped for performance.

#### Scenario: Large document with tables above and below viewport

- **WHEN** the document has tables at lines 10, 200, and 500 and the viewport shows lines 180-220
- **THEN** only the table at line 200 is processed for decorations

#### Scenario: Scrolling reveals new table

- **WHEN** the user scrolls to reveal a previously off-screen table
- **THEN** that table's decorations are computed and applied on the next decoration update cycle
