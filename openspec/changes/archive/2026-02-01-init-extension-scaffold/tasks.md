## 1. Project Setup

- [x] 1.1 Initialize package.json with extension metadata (name, displayName, version, engines, activationEvents)
- [x] 1.2 Configure TypeScript (tsconfig.json) for VS Code extension development
- [x] 1.3 Set up esbuild for bundling (esbuild.js or package.json scripts)
- [x] 1.4 Install runtime dependencies (unified, remark-parse, remark-gfm, unist-util-visit)
- [x] 1.5 Install dev dependencies (typescript, @types/vscode, @types/node, esbuild)
- [x] 1.6 Create src/ directory structure per design (parser/, decorations/, providers/, handlers/)
- [x] 1.7 Create .vscodeignore for packaging

## 2. Extension Entry Point

- [x] 2.1 Create src/extension.ts with activate/deactivate functions
- [x] 2.2 Register onDidChangeTextDocument subscription
- [x] 2.3 Register onDidChangeTextEditorSelection subscription
- [x] 2.4 Register onDidChangeTextEditorVisibleRanges subscription
- [x] 2.5 Register onDidChangeActiveTextEditor subscription
- [x] 2.6 Add calliope.toggle command registration
- [x] 2.7 Add calliope.toggleCheckbox command registration

## 3. Configuration

- [x] 3.1 Define calliope.enabled setting in package.json contributes
- [x] 3.2 Define calliope.ghostOpacity setting
- [x] 3.3 Define calliope.renderHeaders setting
- [x] 3.4 Define calliope.renderEmphasis setting
- [x] 3.5 Define calliope.renderTaskLists setting
- [x] 3.6 Define calliope.renderLinks setting
- [x] 3.7 Define calliope.renderInlineCode setting
- [x] 3.8 Create configuration reader utility to access settings

## 4. Markdown Parser

- [x] 4.1 Create src/parser/types.ts with parsed element interfaces
- [x] 4.2 Create src/parser/markdownParser.ts with remark integration
- [x] 4.3 Implement AST traversal with unist-util-visit to extract element positions
- [x] 4.4 Create src/parser/parseCache.ts with version-keyed caching
- [x] 4.5 Implement helper functions to extract header ranges (syntax vs content)
- [x] 4.6 Implement helper functions to extract emphasis ranges
- [x] 4.7 Implement helper functions to extract task list ranges
- [x] 4.8 Implement helper functions to extract link ranges
- [x] 4.9 Implement helper functions to extract inline code ranges

## 5. Decoration Infrastructure

- [x] 5.1 Create src/decorations/decorationTypes.ts with all TextEditorDecorationType definitions
- [x] 5.2 Define header decoration types (h1-h6 content, syntax hidden, syntax ghost)
- [x] 5.3 Define emphasis decoration types (bold, italic, bold-italic, strikethrough)
- [x] 5.4 Define task list decoration types (checkbox, completed line)
- [x] 5.5 Define inline code decoration types (background, monospace)
- [x] 5.6 Define link decoration types (link text styling)
- [x] 5.7 Create src/decorations/decorationManager.ts to orchestrate all decorations
- [x] 5.8 Implement debounced update trigger (150ms)
- [x] 5.9 Implement viewport-aware range calculation (visible + 50 line buffer)

## 6. Visibility State System

- [x] 6.1 Create src/decorations/visibilityState.ts
- [x] 6.2 Implement cursor position tracking for visibility determination
- [x] 6.3 Implement rendered state logic (cursor elsewhere)
- [x] 6.4 Implement ghost state logic (cursor on same line)
- [x] 6.5 Implement raw state logic (cursor inside construct)
- [x] 6.6 Create src/handlers/cursorTracker.ts for selection change handling
- [x] 6.7 Integrate visibility state with decoration application

## 7. Header Rendering

- [x] 7.1 Create src/decorations/elements/headers.ts
- [x] 7.2 Implement H1 styling (28px bold, lineHeight 42)
- [x] 7.3 Implement H2 styling (24px bold)
- [x] 7.4 Implement H3 styling (20px bold)
- [x] 7.5 Implement H4-H6 styling with progressive sizes
- [x] 7.6 Implement hash marker hiding using opacity/letterSpacing technique
- [x] 7.7 Apply three-state visibility to hash markers

## 8. Emphasis Rendering

- [x] 8.1 Create src/decorations/elements/emphasis.ts
- [x] 8.2 Implement bold text decoration (fontWeight: bold)
- [x] 8.3 Implement italic text decoration (fontStyle: italic)
- [x] 8.4 Implement bold-italic text decoration
- [x] 8.5 Implement strikethrough decoration (textDecoration: line-through)
- [x] 8.6 Implement marker hiding for **, *, ~~
- [x] 8.7 Apply three-state visibility to emphasis markers

## 9. Task List Rendering

- [x] 9.1 Create src/decorations/elements/taskLists.ts
- [x] 9.2 Implement unchecked checkbox display (☐ character)
- [x] 9.3 Implement checked checkbox display (☑ character)
- [x] 9.4 Implement completed task line strikethrough and 60% opacity
- [x] 9.5 Implement syntax hiding for `- [ ]` and `- [x]`
- [x] 9.6 Create src/handlers/checkboxToggle.ts
- [x] 9.7 Implement click detection for checkbox toggle
- [x] 9.8 Implement document edit to toggle [ ] ↔ [x]
- [x] 9.9 Wire toggleCheckbox command to handler

## 10. Inline Code Rendering

- [x] 10.1 Create src/decorations/elements/code.ts
- [x] 10.2 Implement background highlight using textCodeBlock.background
- [x] 10.3 Implement monospace font styling
- [x] 10.4 Implement backtick hiding
- [x] 10.5 Apply three-state visibility to backticks

## 11. Link Rendering

- [x] 11.1 Create src/decorations/elements/links.ts
- [x] 11.2 Implement link text styling (underline, textLink.foreground color)
- [x] 11.3 Implement URL portion hiding (`](url)`)
- [x] 11.4 Apply three-state visibility to link syntax
- [x] 11.5 Create src/providers/linkProvider.ts implementing DocumentLinkProvider
- [x] 11.6 Create src/providers/hoverProvider.ts for URL tooltip on hover
- [x] 11.7 Register DocumentLinkProvider for markdown language
- [x] 11.8 Register HoverProvider for markdown language

## 12. Integration and Testing

- [x] 12.1 Wire all decoration element modules into decorationManager
- [x] 12.2 Implement toggle command to enable/disable all rendering
- [x] 12.3 Create test Markdown file with all supported elements
- [x] 12.4 Test cursor movement through various Markdown constructs
- [x] 12.5 Test checkbox click-to-toggle functionality
- [x] 12.6 Test Ctrl+click link opening
- [x] 12.7 Test performance with large (1000+ line) Markdown file
- [x] 12.8 Test theme switching (light/dark)
- [x] 12.9 Verify configuration toggles work for each element type
