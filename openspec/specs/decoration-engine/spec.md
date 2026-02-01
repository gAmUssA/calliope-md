## ADDED Requirements

### Requirement: Create decoration types at activation
The decoration engine SHALL create all TextEditorDecorationType instances once during extension activation and reuse them for all subsequent updates.

#### Scenario: Decoration types created on activate
- **WHEN** the extension activates
- **THEN** all required decoration types (headers, emphasis, task lists, code, links) SHALL be created and stored

#### Scenario: Decoration types reused across updates
- **WHEN** decorations are updated multiple times
- **THEN** the same TextEditorDecorationType instances SHALL be reused, not recreated

### Requirement: Debounce decoration updates
The decoration engine SHALL debounce decoration updates to prevent excessive processing during rapid document changes.

#### Scenario: Rapid typing triggers single update
- **WHEN** the user types multiple characters within 150ms
- **THEN** the decoration engine SHALL perform only one decoration update after the debounce period

### Requirement: Render only visible viewport
The decoration engine SHALL only compute and apply decorations for the visible viewport plus a configurable buffer.

#### Scenario: Large file performance
- **WHEN** editing a 1000+ line Markdown file
- **THEN** decorations SHALL only be applied to visible lines plus 50-line buffer above and below

#### Scenario: Scroll triggers decoration update
- **WHEN** the user scrolls to a new viewport position
- **THEN** decorations SHALL be updated to cover the new visible range

### Requirement: Use theme-compatible colors
The decoration engine SHALL use ThemeColor for all color values to ensure compatibility with light, dark, and high-contrast themes.

#### Scenario: Decoration respects dark theme
- **WHEN** VS Code is using a dark theme
- **THEN** decorations SHALL use appropriate theme colors (e.g., textLink.foreground, textCodeBlock.background)

#### Scenario: Decoration respects light theme
- **WHEN** VS Code is using a light theme
- **THEN** decorations SHALL use appropriate theme colors that are readable on light backgrounds

### Requirement: Subscribe to editor events
The decoration engine SHALL subscribe to document changes, selection changes, visible range changes, and active editor changes.

#### Scenario: Document edit triggers update
- **WHEN** the document content changes
- **THEN** the decoration engine SHALL trigger a debounced decoration update

#### Scenario: Editor switch triggers update
- **WHEN** the user switches to a different Markdown editor
- **THEN** the decoration engine SHALL apply decorations to the new editor
