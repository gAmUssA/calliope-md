## 1. Parser - Add frontmatter detection

- [x] 1.1 Add `MetadataElement` interface to `src/parser/types.ts` with frontmatter range
- [x] 1.2 Add `metadata: MetadataElement[]` field to `ParsedDocument` interface
- [x] 1.3 Implement frontmatter detection function in `markdownParser.ts` (check for `---` at position 0)
- [x] 1.4 Extract frontmatter range (start line, end line, offsets) before AST parsing
- [x] 1.5 Add frontmatter elements to parsed document results

## 2. Decorations - Create metadata decoration module

- [x] 2.1 Create `src/decorations/elements/metadata.ts` file
- [x] 2.2 Define decoration type for metadata blocks in `decorationTypes.ts`
- [x] 2.3 Implement `createMetadataDecorations()` function to style frontmatter blocks
- [x] 2.4 Apply opacity/dimming decoration to entire frontmatter range
- [x] 2.5 Export metadata decoration function from module

## 3. Integration - Wire up metadata decorations

- [x] 3.1 Import metadata decoration module in `decorationManager.ts`
- [x] 3.2 Call `createMetadataDecorations()` in decoration update flow
- [x] 3.3 Add metadata decorations to the decoration map/registry
- [x] 3.4 Ensure metadata decorations update when document changes

## 4. Testing - Verify frontmatter rendering

- [x] 4.1 Test frontmatter detection with valid YAML frontmatter at document start
- [x] 4.2 Test that mid-document `---` is not treated as frontmatter
- [x] 4.3 Test empty frontmatter block (back-to-back delimiters)
- [x] 4.4 Test single `---` at start is treated as horizontal rule, not frontmatter
- [x] 4.5 Verify decorations apply to entire frontmatter block including delimiters
- [x] 4.6 Verify decorations update when frontmatter is edited or removed
