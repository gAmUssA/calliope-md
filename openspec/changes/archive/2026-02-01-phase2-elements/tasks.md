## 1. Parser Extensions

- [x] 1.1 Add blockquote element type to src/parser/types.ts
- [x] 1.2 Add horizontal rule element type to src/parser/types.ts
- [x] 1.3 Add fenced code block element type to src/parser/types.ts
- [x] 1.4 Add image element type to src/parser/types.ts
- [x] 1.5 Add list/list item element types to src/parser/types.ts
- [x] 1.6 Implement blockquote extraction in markdownParser.ts
- [x] 1.7 Implement horizontal rule extraction in markdownParser.ts
- [x] 1.8 Implement fenced code block extraction in markdownParser.ts
- [x] 1.9 Implement image extraction in markdownParser.ts
- [x] 1.10 Implement list extraction in markdownParser.ts

## 2. Configuration

- [x] 2.1 Add calliope.renderBlockquotes setting to package.json
- [x] 2.2 Add calliope.renderHorizontalRules setting to package.json
- [x] 2.3 Add calliope.renderCodeBlocks setting to package.json
- [x] 2.4 Add calliope.renderImages setting to package.json
- [x] 2.5 Add calliope.renderLists setting to package.json
- [x] 2.6 Update src/config.ts to read new settings

## 3. Decoration Types

- [x] 3.1 Add blockquote decoration types (border, background, marker dim)
- [x] 3.2 Add horizontal rule decoration type (border-bottom)
- [x] 3.3 Add fenced code decoration types (fence dim)
- [x] 3.4 Add image decoration types (preview, placeholder)
- [x] 3.5 Add list decoration types (bullet replacement, number styling)

## 4. Blockquote Rendering

- [x] 4.1 Create src/decorations/elements/blockquotes.ts
- [x] 4.2 Implement left border decoration
- [x] 4.3 Implement subtle background tint
- [x] 4.4 Implement > marker dimming at 40% opacity
- [x] 4.5 Apply visibility state for marker (dim/full based on cursor)

## 5. Horizontal Rule Rendering

- [x] 5.1 Create src/decorations/elements/horizontalRules.ts
- [x] 5.2 Implement border-bottom visual separator
- [x] 5.3 Implement syntax hiding for ---/***/___
- [x] 5.4 Apply three-state visibility

## 6. Fenced Code Block Rendering

- [x] 6.1 Create src/decorations/elements/codeBlocks.ts
- [x] 6.2 Implement fence marker dimming (opening ```)
- [x] 6.3 Implement fence marker dimming (closing ```)
- [x] 6.4 Apply visibility state to fences
- [x] 6.5 Verify native syntax highlighting is preserved (no content decorations)

## 7. Image Rendering

- [x] 7.1 Create src/decorations/elements/images.ts
- [x] 7.2 Implement image path resolution (relative/absolute/URL)
- [x] 7.3 Implement thumbnail preview using contentIconPath
- [x] 7.4 Implement 200px max width constraint
- [x] 7.5 Implement placeholder icon for missing/broken images
- [x] 7.6 Implement syntax hiding for ![alt](path)
- [x] 7.7 Apply three-state visibility
- [x] 7.8 Add image hover provider for full-size preview

## 8. List Rendering

- [x] 8.1 Create src/decorations/elements/lists.ts
- [x] 8.2 Implement unordered marker replacement (-, *, + → •)
- [x] 8.3 Implement ordered list number styling
- [x] 8.4 Handle nested list indentation
- [x] 8.5 Apply three-state visibility to markers

## 9. Integration

- [x] 9.1 Wire blockquote module into decorationManager.ts
- [x] 9.2 Wire horizontal rule module into decorationManager.ts
- [x] 9.3 Wire code block module into decorationManager.ts
- [x] 9.4 Wire image module into decorationManager.ts
- [x] 9.5 Wire list module into decorationManager.ts
- [x] 9.6 Register image hover provider in extension.ts

## 10. Testing

- [x] 10.1 Add Phase 2 elements to test-calliope.md
- [x] 10.2 Test blockquote rendering and cursor visibility
- [x] 10.3 Test horizontal rule rendering
- [x] 10.4 Test fenced code blocks with syntax highlighting
- [x] 10.5 Test image previews (local and remote)
- [x] 10.6 Test list rendering (unordered, ordered, nested)
- [x] 10.7 Test configuration toggles for each element type
- [x] 10.8 Test theme switching for new decorations
