## ADDED Requirements

### Requirement: Render unordered list markers as bullets
The system SHALL replace `-`, `*`, and `+` list markers with a bullet character `•`.

#### Scenario: Dash marker replaced
- **WHEN** a list item starts with `- `
- **THEN** the `-` SHALL be replaced with `•`

#### Scenario: Asterisk marker replaced
- **WHEN** a list item starts with `* `
- **THEN** the `*` SHALL be replaced with `•`

#### Scenario: Plus marker replaced
- **WHEN** a list item starts with `+ `
- **THEN** the `+` SHALL be replaced with `•`

### Requirement: Style ordered list numbers
The system SHALL style ordered list numbers with consistent formatting.

#### Scenario: Ordered list number styling
- **WHEN** a list item starts with `1. `, `2. `, etc.
- **THEN** the number SHALL be styled consistently

### Requirement: Handle nested list indentation
The system SHALL preserve indentation for nested lists.

#### Scenario: Nested unordered list
- **WHEN** a list item is indented under another list item
- **THEN** the bullet SHALL be displayed at the appropriate indentation level

#### Scenario: Nested ordered list
- **WHEN** an ordered list is nested under another list
- **THEN** the numbers SHALL be displayed at the appropriate indentation level

### Requirement: Apply three-state visibility to list markers
The system SHALL apply visibility states to list markers based on cursor position.

#### Scenario: Marker replaced when cursor elsewhere
- **WHEN** the cursor is not on the list item line
- **THEN** the original marker SHALL be hidden and bullet/number shown

#### Scenario: Marker visible when cursor on line
- **WHEN** the cursor is on the list item line
- **THEN** the original `-`, `*`, `+`, or number syntax SHALL be visible

### Requirement: Configurable list rendering
The system SHALL allow users to enable/disable list rendering via the `calliope.renderLists` setting.

#### Scenario: Lists disabled
- **WHEN** `calliope.renderLists` is set to false
- **THEN** lists SHALL render as plain text with original markers
