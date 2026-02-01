## ADDED Requirements

### Requirement: Render blockquotes with visual styling
The system SHALL render blockquote lines with a left border and subtle background color.

#### Scenario: Single-line blockquote
- **WHEN** a line starts with `> text`
- **THEN** the line SHALL display with a left border and subtle background tint

#### Scenario: Multi-line blockquote
- **WHEN** multiple consecutive lines start with `>`
- **THEN** all lines SHALL display with consistent left border and background

### Requirement: Dim blockquote markers
The system SHALL display the `>` character at reduced opacity rather than hiding it completely.

#### Scenario: Blockquote marker visibility
- **WHEN** a blockquote is rendered
- **THEN** the `>` character SHALL appear at 40% opacity

#### Scenario: Cursor on blockquote line
- **WHEN** the cursor is on a blockquote line
- **THEN** the `>` character SHALL appear at full opacity

### Requirement: Use theme-compatible colors
The system SHALL use VS Code theme colors for blockquote styling.

#### Scenario: Dark theme blockquote
- **WHEN** VS Code uses a dark theme
- **THEN** the blockquote border and background SHALL use appropriate theme colors

#### Scenario: Light theme blockquote
- **WHEN** VS Code uses a light theme
- **THEN** the blockquote border and background SHALL use appropriate theme colors

### Requirement: Configurable blockquote rendering
The system SHALL allow users to enable/disable blockquote rendering via the `calliope.renderBlockquotes` setting.

#### Scenario: Blockquotes disabled
- **WHEN** `calliope.renderBlockquotes` is set to false
- **THEN** blockquotes SHALL render as plain text with `>` visible
