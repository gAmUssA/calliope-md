# Calliope - Hybrid Markdown Editor

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/vikgamov.calliope-md?style=flat-square&label=VS%20Code&color=6366f1)](https://marketplace.visualstudio.com/items?itemName=vikgamov.calliope-md)
[![Open VSX](https://img.shields.io/open-vsx/v/vikgamov/calliope-md?style=flat-square&label=Open%20VSX&color=6366f1)](https://open-vsx.org/extension/vikgamov/calliope-md)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/vikgamov.calliope-md?style=flat-square&color=6366f1)](https://marketplace.visualstudio.com/items?itemName=vikgamov.calliope-md)
[![License](https://img.shields.io/github/license/gAmUssA/calliope-md?style=flat-square&color=6366f1)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/gAmUssA/calliope-md?style=flat-square&color=6366f1)](https://github.com/gAmUssA/calliope-md)

*Named after Calliope (Καλλιόπη), the Greek Muse of eloquence and epic poetry — "she of the beautiful voice."*

Calliope brings Ulysses-style hybrid WYSIWYG editing to VS Code. Write in Markdown, see it rendered inline — syntax markers hide until you need them.

![Calliope Demo](images/demo.gif)

## Features

### Distraction-Free Writing

- **Inline rendering** — Headers, bold, italic render in place, not in a separate preview
- **Three-state visibility** — Syntax hides when reading, ghosts when nearby, shows when editing
- **Zero document modification** — Pure visual decorations preserve your source perfectly

### What Gets Rendered

| Element | Rendered As |
|---------|-------------|
| `# Heading` | **Heading** (larger, bold) |
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `~~strike~~` | ~~strike~~ |
| `` `code` `` | `code` with background |
| `` `ts:code` `` | TypeScript-highlighted code |
| `[link](url)` | [link](#) (clickable, URL hidden) |
| `- [ ] task` | ☐ task (clickable checkbox) |
| `- [x] done` | ☑ ~~done~~ (strikethrough) |
| `> blockquote` | Styled with left border and background |
| `---` | Visual horizontal separator |
| `` ```lang `` | Dimmed fence markers, preserved syntax |
| `![alt](img)` | Inline thumbnail preview (200px) |
| `- item` / `1. item` | Styled bullets (•) and numbers |
| `---`/YAML/`---` | Dimmed frontmatter block |
| `` ```mermaid `` | Inline diagram (SVG or ASCII art) |

### Three-State Visibility

1. **Rendered** — Cursor elsewhere: syntax completely hidden
2. **Ghost** — Cursor on line: syntax at 30% opacity (hint it exists)
3. **Raw** — Cursor inside: full syntax visible for editing

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Press `Cmd+Shift+X` (Extensions)
3. Search for "Calliope"
4. Click Install

### From VSIX

```bash
code --install-extension calliope-md-0.4.3.vsix
```

## Commands

| Command | Description |
|---------|-------------|
| `Calliope: Toggle Inline Rendering` | Enable/disable all rendering |
| `Calliope: Toggle Task Checkbox` | Toggle checkbox at cursor |
| `Calliope: Toggle Presentation Mode` | Distraction-free mode for demos |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `calliope.enabled` | `true` | Enable inline rendering |
| `calliope.ghostOpacity` | `0.3` | Opacity for ghost state (0-1) |
| `calliope.renderHeaders` | `true` | Render headers with styling |
| `calliope.renderEmphasis` | `true` | Render bold/italic/strikethrough |
| `calliope.renderTaskLists` | `true` | Render task checkboxes |
| `calliope.renderLinks` | `true` | Render links with hidden URLs |
| `calliope.renderInlineCode` | `true` | Render inline code with background |
| `calliope.renderBlockquotes` | `true` | Render blockquotes with left border |
| `calliope.renderHorizontalRules` | `true` | Render horizontal rules as separators |
| `calliope.renderCodeBlocks` | `true` | Style fenced code block delimiters |
| `calliope.renderImages` | `true` | Render inline image previews |
| `calliope.renderLists` | `true` | Render list markers with bullet styling |
| `calliope.renderMetadata` | `true` | Dim YAML frontmatter blocks |
| `calliope.renderMermaidDiagrams` | `false` | **[EXPERIMENTAL]** Render mermaid diagrams inline |
| `calliope.mermaidRenderMode` | `auto` | Diagram mode: `svg`, `ascii`, or `auto` |

## Tips

- **Click checkboxes** to toggle task completion
- **Ctrl+click links** to open URLs in browser
- **Hover links** to see the URL tooltip
- **Hover images** to see full-size preview
- **Hover mermaid code blocks** in ASCII mode to view the ASCII diagram
- **Presentation mode** — Increases font size, hides UI chrome, applies clean background for demos
- Use `Calliope: Toggle` to quickly switch between rendered and raw view
- **TypeScript highlighting** — Add `ts:` prefix to inline code for language-specific highlighting (e.g., `` `ts:const x: number = 5` ``)
  - Supported prefixes: `ts:`, `typescript:`, `js:`, `javascript:`, `py:`, `python:`

**Note on ASCII mode**: Due to VS Code decoration API limitations, ASCII diagrams cannot be rendered inline. They appear as an indicator with hover tooltip support.

## Requirements

- VS Code 1.96.0 or later (April 2025+)

## Philosophy

> Never modify the document. All rendering is purely visual via decorations.

Calliope preserves:
- Undo/redo history
- Git diffs
- Compatibility with other extensions
- Your exact Markdown source

## Contributing

Issues and PRs welcome at [GitHub](https://github.com/gAmUssA/calliope-md).

## License

MIT

---

*Inspired by [Ulysses](https://ulysses.app) for Mac*
