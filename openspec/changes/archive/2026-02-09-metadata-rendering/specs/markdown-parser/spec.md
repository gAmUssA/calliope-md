## MODIFIED Requirements

### Requirement: Extract element ranges for decoration
The parser SHALL provide helper functions to extract ranges for specific Markdown elements (headers, emphasis, links, frontmatter, etc.) suitable for decoration placement.

#### Scenario: Extract header ranges
- **WHEN** extracting header elements from the AST
- **THEN** the parser SHALL return separate ranges for the syntax markers (`#` characters) and the header content

#### Scenario: Extract emphasis ranges
- **WHEN** extracting emphasis elements (bold, italic, strikethrough)
- **THEN** the parser SHALL return separate ranges for opening markers, content, and closing markers

#### Scenario: Extract frontmatter range
- **WHEN** extracting frontmatter from a document that starts with YAML frontmatter
- **THEN** the parser SHALL return the complete range including opening `---`, content, and closing `---` delimiters

## ADDED Requirements

### Requirement: Detect YAML frontmatter at document start
The parser SHALL detect YAML frontmatter when a document begins with `---` on the first line, followed by content, followed by a closing `---` delimiter.

#### Scenario: Detect frontmatter with content
- **WHEN** a document starts with `---`, contains content lines, and has a closing `---`
- **THEN** the parser SHALL extract this as a frontmatter element with position information

#### Scenario: Detect empty frontmatter
- **WHEN** a document starts with `---` immediately followed by `---` on the next line
- **THEN** the parser SHALL extract this as an empty frontmatter element

#### Scenario: Not detect horizontal rule as frontmatter
- **WHEN** a document starts with a single `---` with no closing delimiter
- **THEN** the parser SHALL treat this as a horizontal rule, not frontmatter

#### Scenario: Not detect mid-document delimiters as frontmatter
- **WHEN** `---` delimiters appear after any other content in the document
- **THEN** the parser SHALL NOT identify this as frontmatter
