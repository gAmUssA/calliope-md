## ADDED Requirements

### Requirement: Render headers with progressive font sizes
The system SHALL render H1-H6 headers with progressively decreasing font sizes using relative em units that scale with the user's configured editor font size.

#### Scenario: H1 header styling
- **WHEN** a line contains an H1 header (`# Header`)
- **THEN** the header text SHALL render at 1.5em bold

#### Scenario: H2 header styling
- **WHEN** a line contains an H2 header (`## Header`)
- **THEN** the header text SHALL render at 1.35em bold

#### Scenario: H3 header styling
- **WHEN** a line contains an H3 header (`### Header`)
- **THEN** the header text SHALL render at 1.2em bold

#### Scenario: H4 header styling
- **WHEN** a line contains an H4 header (`#### Header`)
- **THEN** the header text SHALL render at 1.1em bold

#### Scenario: H5 header styling
- **WHEN** a line contains an H5 header (`##### Header`)
- **THEN** the header text SHALL render at base font size with font-weight 600

#### Scenario: H6 header styling
- **WHEN** a line contains an H6 header (`###### Header`)
- **THEN** the header text SHALL render at base font size with font-weight 600 and 85% opacity

#### Scenario: Adjacent heading levels are visually distinguishable
- **WHEN** an H2 heading appears near an H3 heading in the same document
- **THEN** the size difference SHALL be clearly perceptible without relying on `#` marker visibility

### Requirement: Use variable line height for headers
The system SHALL use the `lineHeight` decoration property to ensure headers have proper spacing without overlapping following lines.

#### Scenario: Header line height prevents overlap
- **WHEN** a header with larger font size is rendered
- **THEN** the line height SHALL be set proportionally (e.g., 42px for H1) to prevent text overlap

### Requirement: Hide syntax markers per visibility model
The system SHALL hide heading syntax markers according to the three-state visibility model, for both ATX (`#`) and setext (`===`/`---`) heading styles.

#### Scenario: Hash markers hidden in rendered state
- **WHEN** cursor is not on the header line
- **THEN** the `#` characters and trailing space SHALL be hidden

#### Scenario: Hash markers ghosted when cursor on line
- **WHEN** cursor is on the header line but not in the hash markers
- **THEN** the `#` characters SHALL appear at ghost opacity (30%)

#### Scenario: Hash markers visible when cursor in markers
- **WHEN** cursor is positioned within the `#` characters
- **THEN** the `#` characters SHALL appear at full opacity

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

### Requirement: Configurable header rendering
The system SHALL allow users to enable/disable header rendering via the `calliope.renderHeaders` setting.

#### Scenario: Headers disabled via configuration
- **WHEN** `calliope.renderHeaders` is set to false
- **THEN** headers SHALL render as plain text with syntax markers visible
