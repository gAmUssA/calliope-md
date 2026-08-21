# Changelog

All notable changes to the Calliope extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **One Sentence Per Line for AsciiDoc and plain text** — `Calliope: One Sentence Per Line` now works on `.adoc` and `.txt` files, not just Markdown. Inline macros, inline code spans, and bare URLs are treated as atomic so sentence splitting never cuts through them; splits that would leave a line starting with a list marker are merged back, and numeric markers are capped at three digits so year-led prose stays prose. Block delimiters only latch when a matching close exists, so heading underlines and `--` signature separators no longer swallow the rest of the document (`src/formatters/asciidocOspl.ts`)
- **CI workflow** — `.github/workflows/ci.yml` runs the test suite and a `vsce package` smoke test on pull requests and pushes to `main`, uploading the resulting `.vsix` as an artifact

### Fixed

- **Blockquote left bars and horizontal rules now actually render** — both decorations were declared with CSS shorthand properties (`borderLeft`, `borderBottom`) that are not part of VS Code's decoration API. VS Code builds decoration CSS from a fixed property set and silently drops anything outside it, so the blockquote bar never drew (only its background tint showed) and horizontal rules drew nothing at all. Both now use the supported `borderWidth` + `borderStyle` pair (`src/decorations/decorationTypes.ts`)
- **Table labels render at their intended smaller size** — `fontSize` is not a property of `ThemableDecorationAttachmentRenderOptions` and was likewise dropped, so the label rendered at full size. It now goes through `textDecoration`, the same idiom the header decorations already use (`src/decorations/elements/tables.ts`)
- **`make icon` no longer halves the icon resolution** — all four converter branches hardcoded 256×256, while the icon shipped since v0.8.4 is 512×512. Because `make package` depends on the `icon` target, any Makefile-driven release silently downgraded the icon (`Makefile`)
- **OSPL command restricted to prose languages** — an `enablement` clause plus a runtime guard limit the command to markdown, asciidoc, and plaintext, so it can never sentence-split source code
- **Mixed line endings preserved** — each line keeps its own ending instead of being normalized, so a mixed LF/CRLF file no longer churns wholesale on format
- **`applyEdit` failures surfaced** — formatter edits that fail are now reported instead of silently dropped
- **Mermaid cache correctness** — caches are keyed by document + theme + content with per-document eviction and a 300-entry cap, and diagrams fully re-render on a color theme change
- **Parse cache no longer grows for a whole session** — entries are evicted when their document closes
- **Config changes re-decorate every visible editor**, not only the active one
- **Hover injection vector closed** — hovers built from document content are no longer blanket-trusted; the copy-button hover's trust is scoped to its single command

### Changed

- **New extension icon** — the previous mark washed out at the 128px size the Marketplace list renders, with the barbs and ink line too low-contrast to read. Replaced with a new quill mark: a fuller feather with a defined nib and a flowing ink stroke over an indigo gradient, with a soft highlight. The icon is now a raster master (`images/icon-source.png`, 1024×1024 with transparent rounded corners) that `make icon` downscales to the shipped 512×512 `images/icon.png`; the previous `images/icon.svg` source is removed
- **Extension bundle cut by 66%** — `beautiful-mermaid`'s exports map routes `import` and `require` to separate files, so loading it both ways bundled two full copies of the library (396KB of 951KB). Both call sites now use `require()`, which esbuild still initializes lazily on first diagram render. A new `compile:prod` (`--minify`) is wired to `vscode:prepublish`, which also means `vsce package` builds fresh output instead of shipping whatever was left in `out/`. `out/extension.js` 958KB → 329KB; the packaged `.vsix` 257KB → 170KB
- Diagnostics route to a "Calliope" output channel instead of `console.*` (`src/log.ts`)
- Deleted the dead `src/mermaid/` webview module (~1,100 lines) left over from the pre-`beautiful-mermaid` rendering approach, plus unused exports
- The test-only OSPL bundle is excluded from the packaged `.vsix`

### Tests

- Added `test/decorationOptions.test.js` — validates every decoration render option against the properties VS Code actually supports, catching silently-dropped CSS shorthand. Covers top-level options, `before`/`after` attachments, the specific side-border shorthands, and `borderColor` declared without any border geometry

## [0.8.5] - 2026-08-20

### Fixed

- **Keyboard navigation no longer toggles task checkboxes** — `detectCheckboxClick` and `detectMermaidDiagramClick` ran on every `onDidChangeTextEditorSelection` event without inspecting `event.kind`, so any caret landing in the leading `- [ ] ` span of a task line flipped the box — arrow keys, `Home`, `Ctrl+Home`, and the caret VS Code restores when a file is reopened. The span widens with indentation (columns 0-6 at the root, 0-10 two levels in), so walking down a nested list rewrote most of it. Neither `calliope.renderTaskLists` nor `calliope.enabled` gated the handler, so there was no way to switch the behaviour off. Both handlers now take the selection-change kind and return early unless it is `TextEditorSelectionChangeKind.Mouse`, leaving click-to-toggle intact (`src/handlers/checkboxToggle.ts`, `src/handlers/mermaidClick.ts`, `src/extension.ts`). Reported and fixed by [@gregzaal](https://github.com/gregzaal) ([#3](https://github.com/gAmUssA/calliope-md/pull/3))

### Tests

- Added `test/selectionKind.test.js` — guard coverage for both handlers: keyboard, command, and undefined selection kinds are ignored, mouse clicks still toggle `[ ]` ↔ `[x]`, and drags or clicks past the checkbox span stay ignored

## [0.8.4] - 2026-05-20

### Changed

- **Refreshed extension icon** — Same indigo palette (`#6366f1`), redrawn with a fuller swept-barb quill feather, gradient background, soft glow, drop shadow, and a flowing ink line (`images/icon.svg`, `images/icon.png` now 512×512)

## [0.8.3] - 2026-05-20

### Fixed

- **Bare URLs no longer hide downstream content** — A bare URL (GFM autolink, e.g. `https://example.com`) is parsed by remark as a `link` node indistinguishable from a real `[text](url)` link. The link extractor assumed a `](` separator existed and searched the rest of the document for it, matching the next real link far below. This produced a hidden-syntax range spanning everything in between, which `letter-spacing: -1000px` collapsed to zero width — so list items, paragraphs, and other content between a bare URL and the next link silently vanished. The extractor now skips autolink-literals and confines the `](` search to the node's own span (`src/parser/markdownParser.ts`)

### Changed

- **Bumped `mocha` to 11.7.5** — Fixes a test-runner crash on Node 24+/26 (`require is not defined in ES module scope`) from mocha 10's bundled yargs
- **Pinned `@vscode/vsce` 3.9.1 as a devDependency** — `npm run package` now uses a reproducible local copy instead of a global install

### Tests

- Added `test/markdownParser.test.js` — link extraction regression coverage (bare URLs, real links, the mixed bare-then-real scenario that caused the bug)
- Added `test/frontmatter.test.js` — YAML frontmatter detection (valid, empty, mid-document `---`, lone delimiter), converting the former manual `test-*.md` fixtures into automated tests
- Parser now bundles standalone to `out/parser/` via `npm run compile:parser` (wired into `pretest`) so tests can exercise it without the `vscode` dependency

## [0.8.2] - 2026-05-14

### Changed

- **Demo GIF served externally** — Reduced `.vsix` size from 7.3 MB back down to ~205 KB by excluding the 7.2 MB `images/demo.gif` from the package and referencing it via an absolute `raw.githubusercontent.com` URL in `README.md`. The marketplace listing still renders the GIF; users no longer pay the 7 MB download on install. The GIF remains tracked in git for the GitHub README

## [0.8.1] - 2026-05-14

### Added

- **Demo GIF in README** — `images/demo.gif` now showcases inline rendering and the new copy-code button on the GitHub README and the VS Code Marketplace listing page

## [0.8.0] - 2026-05-14

### Added

- **Copy-code hover button on fenced code blocks** — Hovering over any line of a fenced code block surfaces a `$(clippy) Copy` link with the language tag (e.g. `` `typescript` ``) in the tooltip. Clicking copies the code content between the fences (fences excluded) to the clipboard, flashes a green highlight over the copied lines as visual confirmation (~300ms), shows a status-bar message, and suppresses the hover button on the same block for the same 300ms window so the click can't be repeated by accident and the flash isn't covered by the tooltip. Skips mermaid blocks. Configurable via `calliope.codeBlockCopyButton` (default `true`) (`src/providers/copyCodeBlockProvider.ts`, `src/extension.ts`)

## [0.7.2] - 2026-05-14

### Fixed

- **Mermaid feedback loop eliminated** — Documents containing mermaid diagrams no longer flicker continuously at ~150ms intervals. The mermaid renderer was firing `calliope.internal.updateDecorations` on every render call — including cache hits — which scheduled another decoration pass, which fired another mermaid render, ad infinitum. The post-render update command is now only dispatched on real cache misses, where there is actual async work to wait for (`src/decorations/elements/mermaidDiagrams.ts`)

## [0.7.1] - 2026-04-25

### Fixed

- **Scroll-stop flicker eliminated** — Decorations no longer rebuild on every scroll event. The decoration manager now tracks the buffered range it last rendered and skips updates when the viewport is still inside it, preventing the brief flicker that appeared when scrolling stopped (`src/decorations/decorationManager.ts`, `src/extension.ts`)
- **Larger viewport buffer** — Pre-decorated buffer increased from 50 to 200 lines so most scroll gestures stay inside the already-rendered region, removing raw-markdown pop-in for medium-distance scrolls

## [0.7.0] - 2026-04-07

### Added

- **One Sentence Per Line (OSPL) Formatting** — New command to reformat markdown prose with one sentence per line
  - `Calliope: One Sentence Per Line` command (Command Palette)
  - Improves git diffs, makes sentences easier to reorder, and reveals prose structure
  - Uses remark AST for structurally correct paragraph identification
  - **Smart sentence splitting** with protection for abbreviations (Mr., Dr., e.g., i.e., U.S., etc.), decimal numbers, ellipsis, and file extensions
  - **List item support** — continuation lines indented to match content column
  - **Blockquote support** — continuation lines prefixed with `>` markers
  - **Nested structure support** — correctly handles lists inside blockquotes and vice versa
  - **Inline markup preservation** — bold, italic, links, and inline code treated as atomic (never split inside them)
  - Skips headings, code blocks, tables, frontmatter, and horizontal rules
  - Single undo step reverts the entire formatting operation

## [0.6.1] - 2026-03-16

### Changed

- **Image syntax always visible** — `![alt](path)` syntax now stays visible alongside the inline preview instead of being hidden/ghosted based on cursor position

### Fixed

- **Setext heading regression** — Restored setext heading support (`===`/`---` underline style) that was accidentally removed by uncommitted changes

## [0.6.0] - 2026-03-16

### Changed

- **BREAKING: Presentation Mode no longer overrides theme colors** — `workbench.colorCustomizations` is no longer modified by Presentation Mode. Theme switching now works normally while presenting. Users who relied on the pure black/white background can configure their preferred presentation theme independently.
- **Presentation Mode startup notification** — When VS Code starts with Presentation Mode still active, a notification appears with "Deactivate" and "Keep Current" options (the previous silent restore behavior is removed)
- **Interactive orphaned state recovery** — Instead of silently restoring settings from a previous session, Presentation Mode now asks the user what to do
- **Window title indicator** — `[PRESENTING]` is prepended to the window title when Presentation Mode is active, visible even with status bar hidden

### Fixed

- **Deprecated `workbench.activityBar.visible` setting** — Replaced with `workbench.activityBar.location: 'hidden'` to fix "not a registered configuration" error on modern VS Code
- **Legacy color override cleanup** — On startup, automatically removes orphaned `workbench.colorCustomizations` entries left by older versions of the extension

## [0.5.2] - 2026-02-17

### Added

- **[EXPERIMENTAL] Ulysses-Style Table Rendering** — Clean, distraction-free table display
  - **Note**: Disabled by default — enable with `calliope.renderTables` setting
  - Pipe delimiters hidden (opacity: 0) preserving column alignment in the monospace grid
  - Horizontal row borders via CSS injection — 1px for body rows, 2px for header and table frame
  - Header cells rendered bold (no background, compatible with inline formatting)
  - Separator row fully hidden when cursor is outside the table
  - Spread table label: "Table" left-aligned and "N × M" dimensions right-aligned above each table
  - Per-row cursor granularity — only the active row shows raw markdown
  - Inline formatting (code, bold, italic, strikethrough, links) renders naturally inside table cells
- **Table Auto-Format** — Automatic column width alignment
  - `Calliope: Format Tables` command to format all tables in the active document
  - Auto-format on save when `calliope.renderTables` is enabled
  - Preserves column alignment markers (`:---`, `:---:`, `---:`)

### Fixed

- **Inline formatting in table cells** — Parser now visits child nodes of table elements (bold, italic, code, links) instead of skipping them
- **Decoration update stability** — Immediate cursor updates now cancel pending debounced updates, preventing competing decoration re-applications that caused visual flickering
- **Table shimmer/blink fix** — Table decorations use opacity: 0 for pipes and `syntaxHidden`/`syntaxGhost` for separator, eliminating layout-shift-driven feedback loops

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
