# Changelog

All notable changes to the Calliope extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
