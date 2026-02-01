## Context

Calliope v0.1.0 established the core architecture: remark-based parsing, decoration management with three-state visibility, and element-specific modules. Phase 2 extends this with five new element types following the same patterns.

Current architecture:
- Parser extracts elements with position info → `src/parser/`
- Decoration types defined once at activation → `src/decorations/decorationTypes.ts`
- Element modules create decorations per element → `src/decorations/elements/`
- DecorationManager orchestrates updates → `src/decorations/decorationManager.ts`

## Goals / Non-Goals

**Goals:**
- Add rendering for blockquotes, horizontal rules, fenced code blocks, images, and lists
- Maintain consistent three-state visibility (rendered/ghost/raw) for new elements
- Preserve VS Code's native syntax highlighting in code blocks
- Keep performance <50ms decoration update
- Follow established module patterns

**Non-Goals:**
- Interactive image resizing or manipulation
- Code block execution or REPL features
- Nested blockquote depth styling (treat all depths the same for v1)
- Table rendering (Phase 3)

## Decisions

### 1. Blockquote Styling

**Decision:** Left border + subtle background, dim `>` character rather than hide.

**Rationale:** Completely hiding `>` may confuse users about nesting depth. Dimming provides visual clarity while keeping the hint.

**Implementation:**
- `border-left: 3px solid` with theme color
- Subtle background tint
- `>` at 40% opacity (slightly more visible than ghost state)

### 2. Horizontal Rule Rendering

**Decision:** Use `border-bottom` decoration spanning the line.

**Rationale:** CSS-based borders render cleanly at any size. The original `---` text will be hidden using the standard technique.

**Implementation:**
- Full-width `border-bottom` decoration
- Hide `---`/`***`/`___` text in rendered state

### 3. Fenced Code Block Handling

**Decision:** Style only the fence markers (``` lines), preserve content untouched.

**Rationale:** VS Code provides excellent syntax highlighting. We shouldn't interfere with it. Only style the fences to integrate with Calliope's aesthetic.

**Implementation:**
- Dim fence markers (``` and optional language tag)
- Add subtle top/bottom border or background to the block
- Do NOT decorate content lines

### 4. Image Rendering

**Decision:** Use `contentIconPath` for thumbnails, constrained to 200px width max.

**Rationale:** `contentIconPath` is the VS Code API for injecting images into decorations. Width constraint prevents layout disruption.

**Implementation:**
- Resolve image path (relative to document or absolute)
- Generate thumbnail decoration
- Show placeholder icon for missing/broken images
- Full image on hover via HoverProvider

**Alternatives considered:**
- WebView: Too heavy for inline preview
- Custom protocol handler: Adds complexity

### 5. List Rendering

**Decision:** Replace `-`, `*`, `+` with bullet character `•`, show ordered numbers with styling.

**Rationale:** Cleaner visual appearance while maintaining list structure visibility.

**Implementation:**
- Unordered: Replace marker with `•` via `before` pseudo-element
- Ordered: Style number with consistent formatting
- Handle nested indentation naturally (VS Code preserves indentation)

### 6. Parser Extensions

**Decision:** Add extraction functions to existing `markdownParser.ts`, extend types in `types.ts`.

**Rationale:** Follows established pattern from Phase 1. Keep all parsing in one place.

## Risks / Trade-offs

**[Image loading performance]** → Lazy load only visible images, use placeholder during load

**[Code block fence detection accuracy]** → Rely on remark's parsing; it handles edge cases

**[Nested list complexity]** → Start with flat list support; nested styling can iterate

**[Image path resolution]** → Handle relative paths, workspace paths, and absolute URLs

## Open Questions

1. Should blockquote background color be configurable? (Start with theme-derived color)
2. Maximum image preview height? (Start with aspect-ratio preserved, max 200px width)
3. Support for image alt text display? (Consider showing on hover)
