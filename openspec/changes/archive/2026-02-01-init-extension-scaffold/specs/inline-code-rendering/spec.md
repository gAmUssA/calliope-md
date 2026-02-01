## ADDED Requirements

### Requirement: Render inline code with background highlight
The system SHALL render text wrapped in single backticks with a background highlight and monospace font.

#### Scenario: Inline code styling
- **WHEN** text is wrapped in backticks like `` `code` ``
- **THEN** the text SHALL render with `textCodeBlock.background` theme color and monospace font

### Requirement: Hide backticks per visibility model
The system SHALL hide the backtick markers according to the three-state visibility model.

#### Scenario: Backticks hidden in rendered state
- **WHEN** cursor is not inside the inline code construct
- **THEN** the backtick characters SHALL be hidden

#### Scenario: Backticks ghosted when cursor on line
- **WHEN** cursor is on the same line but not inside the backticks
- **THEN** the backtick characters SHALL appear at ghost opacity (30%)

#### Scenario: Backticks visible when cursor inside
- **WHEN** cursor is positioned between the opening and closing backticks
- **THEN** the backtick characters SHALL appear at full opacity

### Requirement: Preserve code content styling
The system SHALL ensure the code content between backticks uses monospace font regardless of visibility state.

#### Scenario: Monospace font maintained
- **WHEN** inline code is rendered
- **THEN** the code content SHALL use monospace font family from the editor settings

### Requirement: Configurable inline code rendering
The system SHALL allow users to enable/disable inline code rendering via the `calliope.renderInlineCode` setting.

#### Scenario: Inline code disabled via configuration
- **WHEN** `calliope.renderInlineCode` is set to false
- **THEN** inline code SHALL render as plain text with backticks visible
