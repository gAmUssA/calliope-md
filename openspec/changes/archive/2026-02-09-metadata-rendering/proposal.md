## Why

Markdown files commonly use YAML frontmatter (metadata/preamble) to store document metadata like title, description, tags, and other properties. The extension currently does not render this frontmatter in a visually distinct way, making it harder to distinguish metadata from content. Supporting frontmatter rendering will improve readability and provide a better editing experience for markdown files that use this convention.

## What Changes

- Add visual rendering for YAML frontmatter blocks (content between `---` delimiters at the start of a file)
- Style metadata blocks to visually distinguish them from regular content
- Parse and detect frontmatter at document start
- Render metadata with appropriate decorations (dimming, distinctive styling)

## Capabilities

### New Capabilities
- `metadata-rendering`: Parse and render YAML frontmatter blocks at the beginning of markdown files with visual decorations to distinguish metadata from content

### Modified Capabilities
- `markdown-parser`: Extend parser to detect and extract YAML frontmatter blocks (content between `---` delimiters at file start)

## Impact

- **Parser**: The markdown parser (`src/parser/markdownParser.ts`) needs to detect frontmatter blocks
- **Decorations**: New decoration type for metadata blocks in `src/decorations/elements/`
- **Decoration Manager**: Integration with the existing decoration system
- **No breaking changes**: This is a new visual feature that doesn't affect existing functionality
