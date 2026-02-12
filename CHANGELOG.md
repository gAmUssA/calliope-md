# Changelog

All notable changes to the Calliope extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.4] - 2026-02-12

### Changed

- **Larger Header Font Sizes** — Increased heading sizes for a clearly visible hierarchy
  - H1: 1.15em → 1.5em, H2: 1.1em → 1.35em, H3: 1.05em → 1.2em, H4: 1.0em → 1.1em
  - Adjacent heading levels are now visually distinguishable when `#` markers are hidden

### Added

- **Metadata/Frontmatter Rendering** — YAML frontmatter blocks are dimmed to visually separate them from content
  - Detects `---` delimited frontmatter at document start
  - Applies three-state visibility (rendered/ghost/raw) like other elements
  - Configurable via `calliope.renderMetadata` setting (default: true)

- **Updated README** — Added all Phase 2 elements, presentation mode, and complete settings table

## [0.4.1] - 2026-02-02

### Added

- **TypeScript Code Highlighting** — Language-specific syntax highlighting for inline code
  - Use `ts:code` or `typescript:code` prefix for TypeScript highlighting
  - Supports TypeScript-specific color theme tokens
  - Language prefix displays with dimmed, italic styling
  - Also supports `js:`, `javascript:`, `py:`, and `python:` prefixes
  - Example: `ts:const message: string = "Hello"` renders with TypeScript colors

### Changed

- **Mermaid Rendering Optimization** — Switched from temp file approach to data URIs for improved performance
  - SVG diagrams now rendered using data URIs with `vscode.Uri.parse()` pattern
  - No file system writes required (faster, cleaner)
  - No cleanup mechanism needed (data lives in memory cache only)
  - Pattern inspired by markdown-inline-editor-vscode extension
  - Diagrams render at natural size with generous spacing for readability

## [0.4.0] - 2026-02-02

### Added

- **[EXPERIMENTAL] Mermaid Diagram Rendering** — Inline rendering of mermaid diagrams with ASCII fallback
  - **Note**: Disabled by default due to VS Code decoration API limitations with complex diagrams
  - Supports all mermaid diagram types (flowchart, sequence, class, state, gantt, pie, etc.)
  - Three rendering modes: SVG (visual), ASCII (hover tooltip), or Auto (SVG with ASCII fallback)
  - Applies three-state visibility (rendered, ghost, raw) like other markdown elements
  - Asynchronous rendering with content-based caching for performance
  - Graceful error handling logged to console
  - ASCII mode shows indicator with hover tooltip (VS Code decoration API limitation prevents inline multiline text)
  - Configurable via `calliope.renderMermaidDiagrams` setting (default: false)
  - Configurable rendering mode via `calliope.mermaidRenderMode` setting (default: auto)
  - Uses beautiful-mermaid library for high-quality SVG and Unicode/ASCII output
  - Known limitation: Complex diagrams may render incorrectly due to VS Code decoration constraints

## [0.3.1] - 2026-02-02

### Changed

- **Improved presentation mode error reporting** — Errors during presentation mode activation/deactivation are now shown via VS Code notifications instead of only being logged to the developer console. Users will see actionable error messages when settings fail to apply or restore.

## [0.3.0] - 2026-02-01

### Added

- **Presentation Mode** — distraction-free mode for demos and screencasts
  - Toggle with `Calliope: Toggle Presentation Mode` command
  - Increases font size (18px) and zoom level (2x)
  - Hides sidebar, activity bar, status bar, minimap, line numbers, terminal
  - Applies clean background colors (black for dark themes, white for light)
  - Theme-aware: updates colors automatically when switching themes
  - Status bar button to toggle presentation mode
  - Persists state across VS Code restarts
  - Automatic restoration of original settings on deactivation

## [0.2.0] - 2026-02-01

### Added

- **Blockquote rendering** — left border, subtle background, dimmed `>` markers
- **Horizontal rule rendering** — visual separator with hidden syntax (`---`, `***`, `___`)
- **Fenced code block rendering** — dimmed fence markers, preserved syntax highlighting
- **Image rendering** — inline thumbnail previews (200px), hover for full-size, path resolution
- **List rendering** — bullet replacement (`-`, `*`, `+` → `•`), styled ordered numbers
- Image hover provider for full-size preview on hover
- New configuration settings for each Phase 2 element type

## [0.1.0] - 2025-01-30

### Added

- Initial release of Calliope
- **Header rendering** (H1-H6) with subtle size progression
- **Emphasis rendering** — bold, italic, bold-italic, strikethrough
- **Task list rendering** — clickable checkboxes with completion styling
- **Inline code rendering** — background highlight with theme colors
- **Link rendering** — styled text with hidden URLs, Ctrl+click to open
- **Three-state visibility system** — rendered, ghost, raw states
- **Configurable settings** — toggle individual features on/off
- **Performance optimizations** — debounced updates, viewport-aware rendering, AST caching
- `Calliope: Toggle Inline Rendering` command
- `Calliope: Toggle Task Checkbox` command

### Technical

- Remark-based Markdown parsing with GFM support
- VS Code decoration API for all visual rendering
- Zero document modification — purely decorative
- Theme-compatible colors throughout
