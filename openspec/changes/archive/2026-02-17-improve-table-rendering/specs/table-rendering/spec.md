## MODIFIED Requirements

### Requirement: Pipe delimiters hidden in rendered state (Ulysses-style)

The decoration handler SHALL hide pipe delimiters using `tablePipeHidden` (opacity: 0) when the cursor is not on the pipe's row. Using opacity:0 instead of letterSpacing collapse preserves the character width, keeping columns aligned in the monospace grid. When the cursor is on the row, all pipes are fully visible for editing (raw state).

#### Scenario: Pipes hidden when cursor is away

- **WHEN** the cursor is not on a table row containing pipes
- **THEN** all pipe characters (`|`) on that row are hidden via `tablePipeHidden` (opacity: 0, preserving character width)

#### Scenario: Pipes visible when cursor is on the row

- **WHEN** the cursor is on a table row
- **THEN** all pipe characters are fully visible for editing

### Requirement: Separator row hidden (Ulysses-style)

The decoration handler SHALL completely hide the separator row (`| --- | --- |`) using `syntaxHidden` when the cursor is outside the table. When the cursor is inside the table but not on the separator, the separator SHALL appear dimmed via `syntaxGhost`. When the cursor is on the separator, it SHALL be fully visible.

#### Scenario: Separator hidden when cursor is outside table

- **WHEN** the cursor is not in the table
- **THEN** the separator row is completely hidden via `syntaxHidden`

#### Scenario: Separator ghosted when cursor is in table

- **WHEN** the cursor is on a table row but not on the separator itself
- **THEN** the separator row content is dimmed at ghost opacity (~30%)

#### Scenario: Separator visible when cursor is on it

- **WHEN** the cursor is on the separator row's line
- **THEN** the full separator text (`| --- | :---: | ---: |`) is visible for editing

### Requirement: Header row styled with bold only

The decoration handler SHALL apply the `tableHeaderCell` decoration type to header row cells. This decoration type SHALL render cell content with bold font weight only — no padding or background. This avoids CSS injection that interferes with inline formatting decorations inside header cells.

#### Scenario: Header cells receive bold styling

- **WHEN** a table row is in rendered state and the row is a header
- **THEN** each cell in the header row has bold font weight

#### Scenario: Header styling removed in raw state

- **WHEN** the cursor is on the header row
- **THEN** the header row is in raw visibility state and header cell styling is not applied to that row

## ADDED Requirements

### Requirement: Horizontal row borders via CSS injection

The decoration handler SHALL apply horizontal borders between rows using `textDecoration` CSS injection (`'none; border-bottom: ...'`) for reliable rendering. Body rows get 1px solid borders (editorWidget.border color). The header row gets a 2px solid border (foreground color). The last body row gets a 2px solid border (foreground color) to close the table frame.

#### Scenario: Body rows have thin bottom border when rendered

- **WHEN** the cursor is not on a body row (and it is not the last body row)
- **THEN** that row has a thin (1px) horizontal bottom border via `textDecoration: 'none; border-bottom: 1px solid var(--vscode-editorWidget-border)'`

#### Scenario: Header row has thick bottom border when rendered

- **WHEN** the cursor is not on the header row
- **THEN** the header row has a thick (2px) horizontal bottom border via `textDecoration: 'none; border-bottom: 2px solid var(--vscode-foreground)'`

#### Scenario: Last body row has thick bottom border (table frame)

- **WHEN** the cursor is not on the last body row
- **THEN** the last body row has a thick (2px) bottom border matching the header, closing the table frame

#### Scenario: Row border removed in raw state

- **WHEN** the cursor is on a specific row
- **THEN** that row has no bottom border (raw state for editing)

### Requirement: Table label with spread layout (Ulysses-style)

The decoration handler SHALL render a "Table" label and "N × M" dimensions on a line above the table when the cursor is outside the table. "Table" appears at the left and the dimensions appear at the right, spread across the table's character width using space-padding. Both use `editorLineNumber.foreground` color, italic style, and 0.85em font size.

#### Scenario: Table label shown when cursor is outside table

- **WHEN** the cursor is not inside a table
- **THEN** the line above the table shows "Table" left-aligned and "N × M" right-aligned, spread across the table width

#### Scenario: Table label hidden when cursor is in table

- **WHEN** the cursor is inside the table (on any row)
- **THEN** the "Table" label and dimensions are not displayed

#### Scenario: Dimensions reflect actual table size

- **WHEN** a table has 3 columns and 4 rows (1 header + 3 body)
- **THEN** the dimensions show "3 × 4"

### Requirement: Body cells intentionally unstyled

The `tableBodyCell` decoration type SHALL be intentionally empty (no padding, no background, no text-decoration). This ensures inline formatting decorations (inline code backgrounds, bold, italic, strikethrough) render naturally inside table cells without CSS conflicts.

#### Scenario: Inline code renders with background inside table cells

- **WHEN** a body cell contains backtick-delimited inline code
- **THEN** the inline code renders with its normal background color and the backticks are hidden

#### Scenario: Bold/italic renders inside table cells

- **WHEN** a body cell contains bold or italic text
- **THEN** the bold/italic styling is applied and marker characters are hidden

### Requirement: Inline formatting parsed inside table cells

The Markdown parser SHALL visit child nodes of table elements so that inline formatting (bold, italic, inline code, strikethrough, links) inside table cells is extracted and decorated. The AST visitor SHALL NOT skip table children.

#### Scenario: Inline code inside table cell is parsed

- **WHEN** a table cell contains `` `code` ``
- **THEN** the parser extracts an `InlineCodeElement` with the correct range

#### Scenario: Bold inside table cell is parsed

- **WHEN** a table cell contains `**bold**`
- **THEN** the parser extracts an `EmphasisElement` with variant 'bold'

### Requirement: Auto-format tables for column alignment

The extension SHALL provide automatic table formatting that pads all cells to equal column widths per column. This ensures columns align when pipes are hidden. Formatting respects column alignment markers (`:---`, `:---:`, `---:`).

#### Scenario: Auto-format on save when renderTables is enabled

- **WHEN** a markdown document is saved and `calliope.renderTables` is `true`
- **THEN** all tables in the document are formatted with equal column widths via `onWillSaveTextDocument`

#### Scenario: Manual format command

- **WHEN** the user invokes `Calliope: Format Tables` from the command palette
- **THEN** all tables in the active markdown document are formatted with equal column widths

#### Scenario: Already-formatted tables produce no edits

- **WHEN** all tables already have equal column widths
- **THEN** the formatter produces no edits and shows "All tables are already formatted"

#### Scenario: Alignment markers preserved during formatting

- **WHEN** a table has alignment markers (`:---`, `:---:`, `---:`)
- **THEN** the formatter preserves the alignment markers and pads separator cells accordingly
