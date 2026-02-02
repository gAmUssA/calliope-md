## Context

Calliope currently provides inline rendering for various Markdown elements (headers, emphasis, links, task lists, code blocks, etc.) using VS Code's decoration API. All current decorations are synchronous and use simple text styling. The system follows a three-state visibility pattern (rendered, ghost, raw) based on cursor position.

Mermaid diagrams require a different approach: they need to be rendered as SVG graphics asynchronously using the beautiful-mermaid library, not just styled text. This introduces new challenges around async rendering, SVG lifecycle management, and error handling while maintaining consistency with the existing decoration system.

Current constraints:
- VS Code decoration API primarily designed for text styling, not rich content embedding
- Extension package size sensitivity (mermaid library is ~800KB)
- Must maintain existing three-state visibility behavior
- Parser runs synchronously; async rendering must not block it
- Decoration updates are debounced to 150ms to prevent excessive processing

## Goals / Non-Goals

**Goals:**
- Render mermaid diagrams inline as SVG using beautiful-mermaid
- Support all mermaid diagram types (flowchart, sequence, class, state, gantt, pie, etc.)
- Apply three-state visibility to mermaid diagrams (rendered, ghost, raw)
- Enable click-to-edit interaction for diagrams
- Handle syntax errors gracefully without breaking the editor
- Render asynchronously without blocking the UI
- Provide a configuration option to enable/disable mermaid rendering

**Non-Goals:**
- Custom mermaid theme integration (use mermaid defaults initially)
- Interactive diagram features beyond click-to-edit (e.g., clickable nodes)
- Real-time collaborative editing of diagrams
- Diagram export to external files
- Support for other diagram libraries (PlantUML, GraphViz, etc.)

## Decisions

### 1. Use beautiful-mermaid over vanilla mermaid

**Rationale:** Beautiful-mermaid is a wrapper around mermaid that provides better error handling, simpler API, and is designed for programmatic use. It handles edge cases that vanilla mermaid doesn't (e.g., invalid syntax recovery, better SSR support).

**Alternatives considered:**
- Vanilla mermaid: More features but requires more boilerplate for error handling
- VS Code's built-in mermaid preview: Not accessible from extension API for inline rendering

**Decision:** Use beautiful-mermaid as the primary rendering library.

### 2. Render mermaid as inline SVG decorations using data URIs

**Rationale:** VS Code's decoration API supports `contentIconPath` which can accept data URIs when converted using `vscode.Uri.parse()`. This allows us to embed SVG content directly without file system operations. This approach was validated by studying the markdown-inline-editor-vscode extension which successfully uses this pattern.

**Alternatives considered:**
- File system approach: Write SVGs to `.calliope/mermaid/` directory - works but requires file I/O and cleanup
- WebView overlay: Complex to position and synchronize, performance concerns
- Custom editor provider: Would require replacing VS Code's markdown editor entirely

**Decision:** Use data URIs with `Uri.parse()` to embed SVG content inline. The pattern is:
```typescript
const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const svgUri = vscode.Uri.parse(dataUri);
// Use in decoration: contentIconPath: svgUri
```

**Benefits:**

- No file system writes (faster, cleaner)
- No cleanup needed (data lives in memory cache only)
- Simpler implementation

### 3. Async rendering with cache

**Rationale:** Mermaid rendering can take 50-500ms depending on complexity. Rendering synchronously would block the decoration update loop and cause lag.

**Architecture:**
- Detect mermaid blocks during normal parsing (synchronous)
- Queue async rendering tasks for each mermaid block
- Cache rendered SVG by content hash
- Apply cached decorations immediately, render new ones in background
- Update decorations when async rendering completes

**Alternatives considered:**
- Synchronous rendering: Would cause UI lag
- Web worker rendering: Added complexity, mermaid may not work in workers
- Debounce only mermaid rendering: Still blocks when debounce fires

**Decision:** Implement async rendering queue with content-based caching.

### 4. Delegate mermaid detection in codeBlocks.ts

**Rationale:** The existing `codeBlocks.ts` module handles all fenced code blocks. Rather than duplicating fence detection logic, extend it to identify mermaid blocks and delegate to a new `mermaidDiagrams.ts` module.

**Implementation:**
```typescript
// In codeBlocks.ts
export function createCodeBlockDecorations(fencedCodes: FencedCodeElement[], editor) {
  const mermaidBlocks = fencedCodes.filter(c => c.language === 'mermaid');
  const standardBlocks = fencedCodes.filter(c => c.language !== 'mermaid');
  
  // Handle standard blocks as before
  const standardDecos = createStandardCodeBlockDecorations(standardBlocks, editor);
  
  // Delegate mermaid blocks to new module
  const mermaidDecos = createMermaidDiagramDecorations(mermaidBlocks, editor);
  
  return { ...standardDecos, ...mermaidDecos };
}
```

**Decision:** Extend `codeBlocks.ts` to detect and delegate mermaid blocks to a new `mermaidDiagrams.ts` module.

### 5. New decoration types for mermaid

**Rationale:** Mermaid diagrams need different decoration types than existing elements:
- `mermaidDiagramRendered`: Shows SVG, hides code (opacity: 0 on fences and content)
- `mermaidDiagramGhost`: Shows SVG at reduced opacity, ghosts fences
- `mermaidDiagramError`: Shows error indicator (if needed)

**Decision:** Create three new decoration types specifically for mermaid diagrams.

### 6. ASCII fallback mode (Post-Implementation Enhancement)

**Rationale:** During implementation, discovered beautiful-mermaid also supports ASCII/Unicode text art rendering. This provides a lightweight fallback option when SVG rendering fails or for users who prefer text-based diagrams.

**Features:**
- New `mermaidRenderMode` configuration: `svg`, `ascii`, or `auto` (default)
- Auto mode: Try SVG first, fallback to ASCII on error
- ASCII output uses Unicode box-drawing characters for better appearance
- Compact spacing options (paddingX: 2, paddingY: 1) to fit in hover tooltips
- Hover provider shows ASCII preview with "Click to edit" hint

**Decision:** Implement ASCII fallback as enhancement to improve resilience and provide alternative rendering option.

### 7. Error handling via console logging

**Rationale:** Initial design suggested inline error indicators, but during testing discovered this causes visual overlap issues with adjacent diagrams. Console logging provides better debugging experience without UI disruption.

**Implementation:**
- Errors logged to console with line number context
- Invalid mermaid blocks render as normal code blocks (no visual clutter)
- Users can check Developer Console for detailed error messages
- Error cache prevents repeated logging for same content

**Decision:** Log errors to console instead of inline indicators to prevent visual conflicts.

### 8. Resource cleanup mechanism

**Rationale:** Temp file approach requires cleanup to prevent accumulation of unused SVG files in `.calliope/mermaid/` directory.

**Implementation:**
- Track active diagram hashes during each decoration update
- `cleanupUnusedSvgFiles()` removes files not in active set
- Cleanup triggered on document changes and extension deactivation
- Content-based hashing ensures same diagram reuses same file

**Decision:** Implement automatic cleanup to manage temp file lifecycle.
- `mermaidDiagramError`: Shows error indicator when rendering fails

**Decision:** Add new decoration types to `decorationTypes.ts` specifically for mermaid diagrams.

### 6. Error handling strategy

**Rationale:** Invalid mermaid syntax should not break the editor or prevent other decorations from rendering.

**Strategy:**
- Catch rendering errors from beautiful-mermaid
- Display a small inline error indicator (e.g., "⚠️ Invalid mermaid syntax")
- Log full error to console for debugging
- Allow source code to remain editable
- Retry rendering on next content change

**Decision:** Graceful degradation with inline error indicators and console logging.

### 7. Configuration setting

**Setting name:** `calliope.renderMermaidDiagrams`  
**Default:** `true`  
**Type:** `boolean`  
**Description:** "Enable inline rendering of mermaid diagrams"

**Rationale:** Consistent with existing settings like `renderCodeBlocks`, `renderHeaders`, etc.

**Decision:** Add configuration option following existing patterns.

## Risks / Trade-offs

### Bundle size increase
**Risk:** Beautiful-mermaid + mermaid core adds ~800KB to extension bundle  
**Mitigation:** 
- Consider lazy-loading mermaid library only when first mermaid block is detected
- Document bundle size increase in changelog
- Evaluate if size becomes a major concern based on user feedback

### Performance with many diagrams
**Risk:** Document with 20+ mermaid diagrams may experience slowdown  
**Mitigation:**

- Viewport-based rendering (only render visible diagrams)
- Content hash caching prevents re-rendering unchanged diagrams
- Async rendering prevents UI blocking
- Monitor performance with test documents containing many diagrams

### Memory usage with data URIs

**Risk:** Data URIs stored in memory cache could accumulate over time  
**Mitigation:**

- Cache is per-diagram hash - identical diagrams share the same data URI
- Cache is scoped to active editor lifetime
- No persistent storage required
- Consider implementing LRU cache if memory becomes an issue

### Three-state visibility complexity

**Risk:** Mermaid diagrams need both SVG visibility control AND fence/content visibility  
**Trade-off:** More complex decoration logic vs. consistent UX with other elements  
**Decision:** Accept complexity to maintain UX consistency

### Click-to-edit interaction
**Risk:** VS Code decoration API doesn't support click handlers directly  
**Mitigation:**
- Use hover provider to show "Click to edit" hint
- Detect cursor position changes and check if user clicked near diagram
- Alternative: Use CodeLens for explicit "Edit diagram" action above block

### Async rendering race conditions
**Risk:** User edits diagram while async rendering is in progress  
**Mitigation:**
- Use content hash to detect if content changed since render started
- Discard stale render results
- Queue renders and debounce to prevent excessive queuing

## Migration Plan

N/A - This is a new feature with no breaking changes to existing functionality. Users can disable mermaid rendering via configuration if desired.

## Open Questions

1. **Should we support custom mermaid themes?** 
   - Decision deferred: Ship with default theme first, gather user feedback
   
2. **How to handle very large diagrams?**
   - Consider max height/width constraints
   - Add scroll or collapse behavior for oversized diagrams
   - Need to test with real-world complex diagrams

3. **Should click-to-edit be configurable?**
   - May be annoying for users who want to select/copy diagram
   - Consider separate setting: `calliope.mermaidClickToEdit`
   - Defer until we see user feedback

4. **Performance threshold for async rendering?**
   - What diagram size/complexity requires async vs. could be sync?
   - Start with "always async" approach, optimize if needed
