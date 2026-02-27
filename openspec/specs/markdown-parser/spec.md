## Requirements

### Requirement: Parse Markdown with position information
The parser SHALL use remark with remark-gfm to parse Markdown documents and provide exact line/column/offset positions for every AST node.

#### Scenario: Parse document and extract positions
- **WHEN** a Markdown document is parsed
- **THEN** each AST node SHALL include start and end positions with line, column, and offset values

#### Scenario: Support GFM extensions
- **WHEN** parsing a document containing task lists, strikethrough, or tables
- **THEN** the parser SHALL recognize these as valid GFM nodes with accurate positions

### Requirement: Cache parsed AST by document version
The parser SHALL cache the AST keyed by document URI and version number to avoid redundant parsing.

#### Scenario: Return cached AST for unchanged document
- **WHEN** parsing is requested for a document that has not changed since last parse
- **THEN** the parser SHALL return the cached AST without re-parsing

#### Scenario: Invalidate cache on document change
- **WHEN** a document's version number changes
- **THEN** the parser SHALL discard the cached AST and parse fresh

### Requirement: Extract element ranges for decoration
The parser SHALL provide helper functions to extract ranges for specific Markdown elements (headers, emphasis, links, frontmatter, etc.) suitable for decoration placement.

#### Scenario: Extract ATX header ranges
- **WHEN** extracting an ATX-style header (`# Header`)
- **THEN** `syntaxRange` SHALL cover the `#` characters and trailing space
- **AND** `contentRange` SHALL cover the header text after the markers

#### Scenario: Extract setext H1 header ranges
- **WHEN** extracting a setext-style H1 (text followed by `===` on the next line)
- **THEN** `syntaxRange` SHALL cover the entire `===` underline on the second line
- **AND** `contentRange` SHALL cover the heading text on the first line
- **AND** `range` SHALL span both lines

#### Scenario: Extract setext H2 header ranges
- **WHEN** extracting a setext-style H2 (text followed by `---` on the next line)
- **THEN** `syntaxRange` SHALL cover the entire `---` underline on the second line
- **AND** `contentRange` SHALL cover the heading text on the first line
- **AND** `range` SHALL span both lines

#### Scenario: Header element includes style indicator
- **WHEN** extracting any header element
- **THEN** the `HeaderElement` SHALL include a `style` field with value `'atx'` or `'setext'`

#### Scenario: Extract emphasis ranges
- **WHEN** extracting emphasis elements (bold, italic, strikethrough)
- **THEN** the parser SHALL return separate ranges for opening markers, content, and closing markers

#### Scenario: Extract frontmatter range
- **WHEN** extracting frontmatter from a document that starts with YAML frontmatter
- **THEN** the parser SHALL return the complete range including opening `---`, content, and closing `---` delimiters

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
