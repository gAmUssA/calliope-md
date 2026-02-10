## Requirements

### Requirement: Detect YAML frontmatter blocks
The parser SHALL detect YAML frontmatter blocks at the beginning of markdown documents, defined as content between opening and closing `---` delimiters starting at position 0.

#### Scenario: Detect valid frontmatter
- **WHEN** a document starts with `---` on line 1, followed by content, followed by `---` on a subsequent line
- **THEN** the parser SHALL identify this as a frontmatter block and extract its position range

#### Scenario: Ignore frontmatter not at document start
- **WHEN** `---` delimiters appear after other content in the document
- **THEN** the parser SHALL NOT treat this as frontmatter

#### Scenario: Handle single delimiter at start
- **WHEN** a document starts with `---` but has no closing `---` delimiter
- **THEN** the parser SHALL treat the `---` as a horizontal rule, not frontmatter

#### Scenario: Handle empty frontmatter
- **WHEN** a document starts with `---` immediately followed by `---` on the next line with no content between
- **THEN** the parser SHALL identify this as valid (empty) frontmatter

### Requirement: Extract frontmatter position information
The parser SHALL provide position information for the entire frontmatter block including both delimiters.

#### Scenario: Return complete frontmatter range
- **WHEN** frontmatter is detected
- **THEN** the parser SHALL return a range that includes the opening `---`, all content lines, and the closing `---`

#### Scenario: Provide line and offset positions
- **WHEN** frontmatter range is extracted
- **THEN** the range SHALL include start line, start offset, end line, and end offset

### Requirement: Apply frontmatter decorations
The system SHALL apply visual decorations to frontmatter blocks to distinguish them from regular content.

#### Scenario: Style frontmatter with reduced opacity
- **WHEN** frontmatter is detected in a document
- **THEN** the system SHALL apply a decoration with reduced opacity (dimmed appearance)

#### Scenario: Apply decoration to entire block
- **WHEN** rendering frontmatter decorations
- **THEN** the decoration SHALL cover the entire frontmatter range including both delimiters

#### Scenario: Update decorations when frontmatter changes
- **WHEN** the user edits the frontmatter block (adds/removes lines)
- **THEN** the decoration SHALL update to match the new frontmatter range

#### Scenario: Remove decorations when frontmatter is deleted
- **WHEN** the user removes frontmatter delimiters or content
- **THEN** the frontmatter decoration SHALL be removed
