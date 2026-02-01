## ADDED Requirements

### Requirement: Render headers with progressive font sizes
The system SHALL render H1-H6 headers with progressively decreasing font sizes and bold weight.

#### Scenario: H1 header styling
- **WHEN** a line contains an H1 header (`# Header`)
- **THEN** the header text SHALL render at 28px bold with appropriate line height

#### Scenario: H2 header styling
- **WHEN** a line contains an H2 header (`## Header`)
- **THEN** the header text SHALL render at 24px bold with appropriate line height

#### Scenario: H3 header styling
- **WHEN** a line contains an H3 header (`### Header`)
- **THEN** the header text SHALL render at 20px bold with appropriate line height

#### Scenario: H4-H6 header styling
- **WHEN** a line contains H4, H5, or H6 headers
- **THEN** the header text SHALL render with progressively smaller sizes while remaining bold

### Requirement: Use variable line height for headers
The system SHALL use the `lineHeight` decoration property to ensure headers have proper spacing without overlapping following lines.

#### Scenario: Header line height prevents overlap
- **WHEN** a header with larger font size is rendered
- **THEN** the line height SHALL be set proportionally (e.g., 42px for H1) to prevent text overlap

### Requirement: Hide hash markers per visibility model
The system SHALL hide the `#` markers according to the three-state visibility model.

#### Scenario: Hash markers hidden in rendered state
- **WHEN** cursor is not on the header line
- **THEN** the `#` characters and trailing space SHALL be hidden

#### Scenario: Hash markers ghosted when cursor on line
- **WHEN** cursor is on the header line but not in the hash markers
- **THEN** the `#` characters SHALL appear at ghost opacity (30%)

#### Scenario: Hash markers visible when cursor in markers
- **WHEN** cursor is positioned within the `#` characters
- **THEN** the `#` characters SHALL appear at full opacity

### Requirement: Configurable header rendering
The system SHALL allow users to enable/disable header rendering via the `calliope.renderHeaders` setting.

#### Scenario: Headers disabled via configuration
- **WHEN** `calliope.renderHeaders` is set to false
- **THEN** headers SHALL render as plain text with syntax markers visible
