## Context

Calliope renders Markdown tables in-editor using VS Code's decoration API. The original implementation dimmed pipe delimiters to ghost opacity (~30%), made separator rows nearly invisible at 8% opacity, and kept body cells unstyled. This looked too much like raw Markdown.

After user feedback referencing the Ulysses writing app, the approach was reworked: tables should render like HTML tables with completely hidden pipes, hidden separator rows, bold headers, thin horizontal rules between rows, a thicker border under the header, and a "Table N×M" label badge — a clean, document-like appearance.

## Goals / Non-Goals

**Goals:**
- Completely hide pipe delimiters using opacity:0 (preserves character width for alignment)
- Hide separator rows when cursor is outside the table; dim when cursor is inside
- Add thin horizontal border-bottom lines between body rows via CSS injection
- Add thicker (2px) bottom border under header row and last body row (table frame)
- Add a spread "Table ... N × M" label above each table (Ulysses style)
- Bold header cells with no padding or background
- Body cells intentionally unstyled so inline formatting (code, bold, italic) renders naturally
- Auto-format tables to equal column widths on save and via manual command
- Parse inline formatting (bold, code, italic) inside table cells
- Raw editing mode: reveal all syntax when cursor is on a row

**Non-Goals:**
- Full HTML-table rendering with grid borders on every cell
- Vertical column borders (Ulysses uses horizontal-only lines)
- Table editing features (column resize, add/remove rows)
- Exposing individual table styling settings to users

## Decisions

### 1. Hide pipes using `tablePipeHidden` with opacity:0

**Rationale**: For Ulysses-style rendering, pipes must disappear. Using a dedicated `tablePipeHidden` decoration type with `opacity: '0'` hides the glyph while preserving its character width in the monospace grid. This keeps columns aligned — unlike `syntaxHidden` (letterSpacing collapse) which causes column misalignment.

**Alternatives considered**:
- `syntaxHidden` (letterSpacing: -1000px): Collapses pipe width, breaking column alignment.
- `color` matching background: Theme-dependent and fragile.

### 2. Hide separator row, show as ghost when cursor is in table

**Rationale**: The separator row (`|------|-----|------|`) is purely structural syntax with no content value. When the cursor is outside the table, it's completely hidden via `syntaxHidden`. When the cursor is inside the table (but not on the separator), it's shown as `syntaxGhost` so the user has structural context for editing.

### 3. Horizontal borders via `textDecoration` CSS injection

**Rationale**: VS Code's typed `borderBottom`/`borderColor` properties are unreliable (can render unevenly or not at all). Using `textDecoration: 'none; border-bottom: Npx solid var(--vscode-theme-color)'` injects the CSS directly, which renders as crisp pixel-aligned lines.

- Body rows: `1px solid var(--vscode-editorWidget-border)` — thin separator
- Header row: `2px solid var(--vscode-foreground)` — thick top frame
- Last body row: `2px solid var(--vscode-foreground)` — thick bottom frame

### 4. Table label with spread layout

**Rationale**: Each table gets a "Table" label at the left and "N × M" dimensions at the right on the line above the table, spread across the table width using space-padding in a single `after` attachment. This matches Ulysses' compact metadata style. The label uses `editorLineNumber.foreground` color, italic, 0.85em for subtlety and only appears when cursor is outside the table.

**Previous approach**: `before`/`after` split — abandoned because VS Code (pseudo-elements) cannot do flexbox/margin-left:auto for true right-alignment. Space-padding in monospace achieves the same visual.

### 5. No cell padding or background — minimal styling

**Rationale**: Removing all `textDecoration` CSS injection from cell decorations avoids conflicts with inline formatting (bold markers hidden, inline code backgrounds, italic). `tableHeaderCell` uses only `fontWeight: 'bold'`. `tableBodyCell` is intentionally empty. The auto-formatter pads source text with spaces for readability.

### 6. Auto-format tables for column alignment

**Rationale**: When pipes are hidden, columns only align if cell content has equal width per column across all rows. The formatter computes max column width and pads cells with spaces. Supports left/center/right alignment. Runs on save (via `onWillSaveTextDocument` returning `TextEdit[]`) and via manual command (`Calliope: Format Tables`).

### 7. Parse inline formatting inside table cells

**Rationale**: The AST visitor previously returned `SKIP` for table nodes, preventing inline formatting (bold, italic, code) from being extracted inside cells. Changed to `break` so the visitor continues into table children. This allows backtick hiding, bold rendering, etc. to work inside tables identically to regular text.

## Risks / Trade-offs

- **[opacity:0 pipes still occupy space]** → Hidden pipe characters still take one character width. Combined with the auto-formatter's equal-width padding, this creates consistent column spacing. The visual gap at pipe positions is minimal.
- **[Auto-format modifies source text]** → Adds/removes whitespace in cells. Only changes spacing, never content. Only triggers on save (when `renderTables` enabled) or manual command. Uses `onWillSaveTextDocument` with `TextEdit[]` return (no infinite loop risk).
- **[CSS injection via textDecoration]** → Not officially supported by VS Code API but widely used and stable. If VS Code changes CSS injection behavior, borders would stop rendering (graceful degradation — table content unaffected).
- **[Separator visibility when editing]** → When cursor is inside the table but not on the separator, it shows as ghost text. This provides editing context without full clutter.
- **[Label line positioning]** → The label is placed on `tableStartLine - 1`. If the table starts on line 1, the label overlaps line 0 content. Acceptable edge case.
