## ADDED Requirements

### Requirement: Render bold text
The system SHALL render text wrapped in `**` or `__` markers as bold.

#### Scenario: Double asterisk bold
- **WHEN** text is wrapped in `**bold**`
- **THEN** the text SHALL render in bold weight with markers hidden per visibility model

#### Scenario: Double underscore bold
- **WHEN** text is wrapped in `__bold__`
- **THEN** the text SHALL render in bold weight with markers hidden per visibility model

### Requirement: Render italic text
The system SHALL render text wrapped in `*` or `_` markers as italic.

#### Scenario: Single asterisk italic
- **WHEN** text is wrapped in `*italic*`
- **THEN** the text SHALL render in italic style with markers hidden per visibility model

#### Scenario: Single underscore italic
- **WHEN** text is wrapped in `_italic_`
- **THEN** the text SHALL render in italic style with markers hidden per visibility model

### Requirement: Render bold italic text
The system SHALL render text wrapped in `***` or `___` markers as bold and italic.

#### Scenario: Triple asterisk bold italic
- **WHEN** text is wrapped in `***bold italic***`
- **THEN** the text SHALL render in bold italic style with markers hidden per visibility model

### Requirement: Render strikethrough text
The system SHALL render text wrapped in `~~` markers with a line-through decoration.

#### Scenario: Strikethrough styling
- **WHEN** text is wrapped in `~~strikethrough~~`
- **THEN** the text SHALL render with line-through text decoration and markers hidden per visibility model

### Requirement: Hide emphasis markers per visibility model
The system SHALL hide emphasis markers (`*`, `_`, `~`) according to the three-state visibility model.

#### Scenario: Emphasis markers hidden in rendered state
- **WHEN** cursor is not inside the emphasis construct
- **THEN** the emphasis markers SHALL be hidden

#### Scenario: Emphasis markers visible when editing
- **WHEN** cursor is positioned between the opening and closing markers
- **THEN** the emphasis markers SHALL appear at full opacity

### Requirement: Configurable emphasis rendering
The system SHALL allow users to enable/disable emphasis rendering via the `calliope.renderEmphasis` setting.

#### Scenario: Emphasis disabled via configuration
- **WHEN** `calliope.renderEmphasis` is set to false
- **THEN** emphasis text SHALL render as plain text with markers visible
