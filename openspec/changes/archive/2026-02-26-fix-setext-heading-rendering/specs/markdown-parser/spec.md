## MODIFIED Requirements

### Requirement: Extract header ranges for decoration (UPDATED)
The parser SHALL extract correct `syntaxRange` and `contentRange` for both ATX and setext heading styles.

#### Scenario: Extract ATX header ranges (unchanged)
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
