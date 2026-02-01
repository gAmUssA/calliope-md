## Context

This is a new VS Code extension project. The codebase is currently empty. VS Code's April 2025 release introduced variable line height support via the `lineHeight` property in decoration options, which was the missing piece for true inline WYSIWYG Markdown rendering.

**Constraints:**
- Must never modify the document - all rendering is purely visual via decorations
- Must preserve undo/redo, git diffs, and compatibility with other extensions
- Must remain performant with large files (1000+ lines)
- Must respect VS Code themes (light/dark)

## Goals / Non-Goals

**Goals:**
- Establish a well-structured, maintainable extension architecture
- Implement core parsing infrastructure with position-accurate AST
- Build reusable decoration system with three-state visibility
- Deliver Phase 1 elements: headers, emphasis, task lists, inline code, links
- Achieve <50ms decoration update time

**Non-Goals:**
- Phase 2 elements (blockquotes, horizontal rules, fenced code blocks, images, lists)
- Phase 3 elements (tables, footnotes, math/LaTeX, Mermaid diagrams)
- Custom themes or font settings beyond VS Code defaults
- Markdown language server features (completion, diagnostics)

## Decisions

### 1. Project Structure

```
src/
├── extension.ts              # Entry point, activation, event subscriptions
├── parser/
│   ├── markdownParser.ts     # Remark-based parsing
│   ├── parseCache.ts         # Version-keyed AST cache
│   └── types.ts              # Parsed element interfaces
├── decorations/
│   ├── decorationManager.ts  # Orchestrates all decoration types
│   ├── decorationTypes.ts    # TextEditorDecorationType definitions
│   ├── visibilityState.ts    # Three-state logic
│   └── elements/
│       ├── headers.ts
│       ├── emphasis.ts
│       ├── taskLists.ts
│       ├── links.ts
│       └── code.ts
├── providers/
│   ├── linkProvider.ts       # DocumentLinkProvider for Ctrl+click
│   └── hoverProvider.ts      # URL/image previews
└── handlers/
    ├── checkboxToggle.ts     # Click-to-toggle task completion
    └── cursorTracker.ts      # Selection change handling
```

**Rationale:** Separation by concern (parsing, decorations, providers, handlers) enables independent testing and future extensibility. Each element type gets its own module for isolation.

**Alternatives considered:**
- Single-file approach: Rejected due to maintainability concerns
- Feature-based folders: Rejected because cross-cutting concerns (visibility, caching) span features

### 2. Parser: Remark with remark-gfm

**Decision:** Use `unified` + `remark-parse` + `remark-gfm` + `unist-util-visit`

**Rationale:**
- Provides exact position information (line/column/offset) for every AST node
- GFM plugin adds task lists, strikethrough, tables support
- Well-maintained, widely used in the ecosystem
- Tree traversal via unist-util-visit is clean and performant

**Alternatives considered:**
- markdown-it: Less precise position info, harder to get exact marker positions
- Custom regex parsing: Error-prone, doesn't handle edge cases
- VS Code's built-in Markdown parsing: Not exposed in extension API

### 3. Decoration Strategy: Create Once, Apply Many

**Decision:** Create all `TextEditorDecorationType` instances at activation, reuse them across updates.

```typescript
const decorationTypes = {
  h1: vscode.window.createTextEditorDecorationType({...}),
  h1SyntaxHidden: vscode.window.createTextEditorDecorationType({...}),
  h1SyntaxGhost: vscode.window.createTextEditorDecorationType({...}),
  // ... more types
};
```

**Rationale:** Creating decoration types is expensive. Reusing them and only updating ranges via `editor.setDecorations()` is the performant pattern.

### 4. Text Hiding Technique

**Decision:** Use `opacity: '0'` + `letterSpacing: '-1000px'` to hide syntax markers.

**Rationale:** This makes text invisible and collapses its width to zero, effectively hiding it without removing it from the document. The negative letter-spacing pulls subsequent characters back.

**Alternatives considered:**
- `display: none`: Not available in VS Code decorations
- `color: transparent`: Leaves empty space where text was

### 5. Three-State Visibility

**Decision:** Implement three states based on cursor position:
1. **Rendered** (cursor elsewhere): Syntax hidden, content formatted
2. **Ghost** (cursor on same line): Syntax at 30% opacity
3. **Raw** (cursor inside construct): Syntax fully visible

**Rationale:** Provides progressive disclosure - users see formatting when reading, hints when on the line, full syntax when editing. This matches Ulysses behavior.

### 6. Update Strategy: Debounced + Viewport-Aware

**Decision:**
- Debounce decoration updates to 150ms
- Only render decorations within visible range + 50 line buffer
- Cache parsed AST keyed by document version

**Rationale:** Balances responsiveness with performance. Large files won't lag because we skip off-screen content. Caching avoids re-parsing on cursor moves.

### 7. Theme Colors

**Decision:** Always use `ThemeColor` for styling, never hardcoded values.

```typescript
color: new vscode.ThemeColor('textLink.foreground')
backgroundColor: new vscode.ThemeColor('textCodeBlock.background')
```

**Rationale:** Ensures extension works correctly in light, dark, and high-contrast themes.

### 8. Checkbox Toggle Implementation

**Decision:** Use a command bound to mouse click that performs a document edit.

**Rationale:** VS Code decorations aren't natively clickable. We detect clicks via selection change, check if the position is on a checkbox decoration, and execute the toggle command. The edit modifies `[ ]` ↔ `[x]` in the actual document.

### 9. Build System: esbuild

**Decision:** Use esbuild for fast compilation and bundling.

**Rationale:** Much faster than webpack, simpler configuration, sufficient for extension bundling.

## Risks / Trade-offs

**[Decoration flickering during rapid edits]** → Mitigated by debouncing updates and efficient range diffing

**[Performance degradation on very large files]** → Mitigated by viewport-only rendering and AST caching

**[Cursor tracking edge cases]** → May need refinement for multi-cursor and selection scenarios

**[Variable line height browser support]** → Requires VS Code 1.96+ (April 2025); document minimum version requirement

**[Checkbox click detection reliability]** → Selection-based detection may have edge cases; may need to explore CodeLens or other approaches if issues arise

## Open Questions

1. Should we support multiple editors with the same document? (Currently: yes, each editor tracks its own cursor state)
2. How to handle Markdown inside HTML blocks? (Currently: skip rendering inside HTML)
3. Should ghost state apply to the entire construct or just the syntax markers? (Currently: just markers)
