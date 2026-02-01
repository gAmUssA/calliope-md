## Why

VS Code lacks a true hybrid Markdown editing experience. Users must choose between raw Markdown editing or a separate preview pane. The April 2025 VS Code release added variable line height support via the `lineHeight` decoration property, making inline WYSIWYG rendering finally possible. This scaffold establishes the foundation for Calliope, enabling Ulysses-style Markdown editing where content renders in place while preserving the underlying source.

## What Changes

- Create VS Code extension project structure with TypeScript and esbuild
- Implement remark-based Markdown parser with position tracking
- Build decoration infrastructure for inline rendering
- Establish three-state visibility system (rendered/ghost/raw)
- Implement Phase 1 elements: headers, emphasis (bold/italic/strikethrough), task lists, inline code, links
- Add configuration options for enabling/disabling features
- Register commands for toggling rendering and checkbox interaction

## Capabilities

### New Capabilities

- `markdown-parser`: Remark-based parsing with GFM support, providing AST nodes with exact line/column positions for decoration placement
- `decoration-engine`: Core decoration management including type creation, debounced updates, viewport-aware rendering, and theme-compatible colors
- `visibility-states`: Three-state system for syntax markers (rendered → ghost → raw) based on cursor position
- `header-rendering`: H1-H6 rendering with progressive font sizes and line heights, syntax hiding
- `emphasis-rendering`: Bold, italic, strikethrough with proper styling and syntax hiding
- `task-list-rendering`: Checkbox display with click-to-toggle, strikethrough for completed items
- `inline-code-rendering`: Monospace styling with background highlight
- `link-rendering`: Clickable links with URL hiding, hover tooltips, Ctrl+click to open

### Modified Capabilities
<!-- None - this is a new extension -->

## Impact

- **New files**: Complete extension structure under `src/` with parser, decorations, providers, and handlers
- **Dependencies**: unified, remark-parse, remark-gfm, unist-util-visit
- **Dev dependencies**: typescript, @types/vscode, @types/node, esbuild
- **Configuration**: New `calliope.*` settings in VS Code
- **Commands**: `calliope.toggle`, `calliope.toggleCheckbox`
