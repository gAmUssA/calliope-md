## ADDED Requirements

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
The parser SHALL provide helper functions to extract ranges for specific Markdown elements (headers, emphasis, links, etc.) suitable for decoration placement.

#### Scenario: Extract header ranges
- **WHEN** extracting header elements from the AST
- **THEN** the parser SHALL return separate ranges for the syntax markers (`#` characters) and the header content

#### Scenario: Extract emphasis ranges
- **WHEN** extracting emphasis elements (bold, italic, strikethrough)
- **THEN** the parser SHALL return separate ranges for opening markers, content, and closing markers
