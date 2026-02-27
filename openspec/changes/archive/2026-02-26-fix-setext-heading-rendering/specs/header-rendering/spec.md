## MODIFIED Requirements

### Requirement: Hide syntax markers per visibility model (UPDATED)
The system SHALL hide heading syntax markers according to the three-state visibility model, for both ATX (`#`) and setext (`===`/`---`) heading styles.

#### Scenario: Setext underline hidden in rendered state
- **WHEN** cursor is not on the heading lines (content line or underline)
- **THEN** the setext underline (`===` or `---`) SHALL be hidden

#### Scenario: Setext underline ghosted when cursor on heading
- **WHEN** cursor is on the heading content line or underline but not within the underline characters
- **THEN** the setext underline SHALL appear at ghost opacity (30%)

#### Scenario: Setext underline visible when cursor in underline
- **WHEN** cursor is positioned within the setext underline characters
- **THEN** the underline SHALL appear at full opacity

#### Scenario: Setext heading content styled correctly
- **WHEN** a setext H1 heading is present (text followed by `===`)
- **THEN** the text line SHALL render at 1.5em bold (same as ATX H1)

#### Scenario: Setext H2 styled correctly
- **WHEN** a setext H2 heading is present (text followed by `---`)
- **THEN** the text line SHALL render at 1.35em bold (same as ATX H2)
