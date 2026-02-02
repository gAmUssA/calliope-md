## Why

Mermaid diagrams are widely used in documentation for creating flowcharts, sequence diagrams, class diagrams, and other visualizations. Currently, users must switch to preview mode to see their mermaid diagrams rendered, breaking the hybrid editing experience that Calliope provides. By integrating beautiful-mermaid for inline rendering, users can visualize their diagrams directly in the editor alongside other rendered markdown elements, maintaining focus and workflow continuity.

## What Changes

- Add beautiful-mermaid library integration for rendering mermaid code blocks inline
- Implement mermaid diagram decorations that render mermaid code blocks as SVG diagrams
- Support three-state visibility for mermaid blocks (rendered, ghost, raw)
- Add click-to-edit interaction for mermaid diagrams
- Integrate with existing decoration engine and visibility state management
- Handle mermaid rendering errors gracefully with fallback display

## Capabilities

### New Capabilities

- `mermaid-diagram-rendering`: Inline rendering of mermaid code blocks using beautiful-mermaid library, supporting multiple diagram types (flowchart, sequence, class, state, etc.) with three-state visibility and click-to-edit interaction

### Modified Capabilities

- `fenced-code-rendering`: Extend to detect and delegate mermaid code blocks to the mermaid renderer instead of rendering them as standard code blocks
- `decoration-engine`: Enhance to support asynchronous rendering for mermaid diagrams and manage SVG decoration lifecycle

## Impact

**Code affected:**

- `src/decorations/elements/codeBlocks.ts` - needs to identify and delegate mermaid blocks
- `src/decorations/decorationManager.ts` - may need updates for async decoration handling
- `src/decorations/decorationTypes.ts` - new decoration type for mermaid diagrams

**New dependencies:**

- `beautiful-mermaid` package for mermaid rendering
- May require `mermaid` as a peer dependency

**APIs:**

- Beautiful-mermaid rendering API integration
- VS Code decoration API for SVG/HTML content rendering

**Systems:**

- Build configuration to bundle mermaid libraries
- Extension package size may increase due to mermaid library
