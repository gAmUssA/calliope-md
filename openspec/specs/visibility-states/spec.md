## ADDED Requirements

### Requirement: Implement three visibility states for syntax markers
The system SHALL implement three visibility states for Markdown syntax markers based on cursor position: rendered, ghost, and raw.

#### Scenario: Rendered state when cursor elsewhere
- **WHEN** the cursor is not on the same line as a Markdown construct
- **THEN** syntax markers SHALL be hidden (opacity 0, collapsed width) and content SHALL appear formatted

#### Scenario: Ghost state when cursor on same line
- **WHEN** the cursor is on the same line as a Markdown construct but not inside the syntax markers
- **THEN** syntax markers SHALL appear at 30% opacity as a subtle hint

#### Scenario: Raw state when cursor inside construct
- **WHEN** the cursor is positioned inside a Markdown construct (between opening and closing markers)
- **THEN** syntax markers SHALL appear at full opacity for editing

### Requirement: Track cursor position for visibility updates
The system SHALL track cursor position changes and update visibility states accordingly without triggering full re-parsing.

#### Scenario: Cursor movement updates visibility
- **WHEN** the cursor moves from one line to another
- **THEN** visibility states SHALL update for affected constructs on both the old and new lines

#### Scenario: Multiple cursors supported
- **WHEN** multiple cursors are active
- **THEN** visibility states SHALL be calculated for each cursor position independently

### Requirement: Configurable ghost opacity
The system SHALL allow users to configure the ghost state opacity via the `calliope.ghostOpacity` setting.

#### Scenario: Custom ghost opacity applied
- **WHEN** the user sets `calliope.ghostOpacity` to 0.5
- **THEN** syntax markers in ghost state SHALL render at 50% opacity
