## ADDED Requirements

### Requirement: Render horizontal rules as visual separators
The system SHALL render `---`, `***`, and `___` (three or more characters) as visual separator lines.

#### Scenario: Dash horizontal rule
- **WHEN** a line contains only `---` (or more dashes)
- **THEN** a visual horizontal line SHALL be displayed

#### Scenario: Asterisk horizontal rule
- **WHEN** a line contains only `***` (or more asterisks)
- **THEN** a visual horizontal line SHALL be displayed

#### Scenario: Underscore horizontal rule
- **WHEN** a line contains only `___` (or more underscores)
- **THEN** a visual horizontal line SHALL be displayed

### Requirement: Hide horizontal rule syntax in rendered state
The system SHALL hide the raw syntax characters when not editing.

#### Scenario: Syntax hidden when cursor elsewhere
- **WHEN** the cursor is not on the horizontal rule line
- **THEN** the `---`/`***`/`___` characters SHALL be hidden

#### Scenario: Syntax visible when cursor on line
- **WHEN** the cursor is on the horizontal rule line
- **THEN** the raw syntax SHALL be visible for editing

### Requirement: Use theme-compatible border styling
The system SHALL use theme colors for the horizontal rule line.

#### Scenario: Horizontal rule styling
- **WHEN** a horizontal rule is rendered
- **THEN** the line SHALL use a subtle theme-appropriate border color

### Requirement: Configurable horizontal rule rendering
The system SHALL allow users to enable/disable horizontal rule rendering via the `calliope.renderHorizontalRules` setting.

#### Scenario: Horizontal rules disabled
- **WHEN** `calliope.renderHorizontalRules` is set to false
- **THEN** horizontal rules SHALL render as plain text
