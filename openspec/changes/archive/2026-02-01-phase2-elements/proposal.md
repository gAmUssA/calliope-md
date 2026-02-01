## Why

Calliope v0.1.0 shipped with core Markdown elements (headers, emphasis, task lists, links, inline code). Users expect a complete hybrid editing experience that covers all common Markdown constructs. Phase 2 adds the remaining frequently-used elements to provide comprehensive Markdown coverage.

## What Changes

- Add blockquote rendering with left border and subtle background
- Add horizontal rule rendering as visual separator lines
- Add fenced code block styling (preserve VS Code syntax highlighting)
- Add image inline preview with constrained dimensions
- Add list rendering (ordered and unordered) with proper bullet/number styling

## Capabilities

### New Capabilities

- `blockquote-rendering`: Render blockquotes with left border, subtle background, and dimmed `>` characters
- `horizontal-rule-rendering`: Render `---`, `***`, `___` as visual separator lines
- `fenced-code-rendering`: Style code block fences while preserving native syntax highlighting
- `image-rendering`: Show inline image previews with size constraints and fallback placeholders
- `list-rendering`: Render ordered/unordered lists with proper bullet characters and number styling

### Modified Capabilities

<!-- None - these are all new capabilities -->

## Impact

- **Parser**: Add extraction functions for blockquotes, horizontal rules, code blocks, images, lists
- **Decoration types**: Add new decoration types for each element
- **Decoration elements**: Add new element modules under `src/decorations/elements/`
- **Configuration**: Add `calliope.renderBlockquotes`, `calliope.renderHorizontalRules`, `calliope.renderCodeBlocks`, `calliope.renderImages`, `calliope.renderLists` settings
- **Package size**: May increase slightly if image handling adds dependencies
