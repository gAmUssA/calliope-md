## MODIFIED Requirements

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
