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

### Requirement: Support asynchronous decoration rendering
The decoration engine SHALL support asynchronous rendering for decorations that require external processing (e.g., mermaid diagrams).

#### Scenario: Async rendering does not block updates
- **WHEN** an asynchronous decoration is being rendered (e.g., mermaid diagram)
- **THEN** the decoration engine SHALL continue processing other decorations without waiting

#### Scenario: Async decorations applied when ready
- **WHEN** an asynchronous decoration completes rendering
- **THEN** the decoration engine SHALL apply the decoration to the editor immediately

### Requirement: Manage SVG decoration lifecycle
The decoration engine SHALL manage the lifecycle of SVG-based decorations, including creation, updates, and disposal.

#### Scenario: SVG decorations created for new diagrams
- **WHEN** a new mermaid diagram is detected
- **THEN** the decoration engine SHALL create an SVG decoration for it

#### Scenario: SVG decorations updated on content change
- **WHEN** the content of a mermaid diagram changes
- **THEN** the decoration engine SHALL update the corresponding SVG decoration

#### Scenario: SVG decorations disposed when removed
- **WHEN** a mermaid diagram is deleted from the document
- **THEN** the decoration engine SHALL dispose of the corresponding SVG decoration to free resources

### Requirement: Handle decoration rendering failures
The decoration engine SHALL gracefully handle failures in decoration rendering without affecting other decorations.

#### Scenario: Failed decoration does not break others
- **WHEN** one decoration fails to render (e.g., mermaid syntax error)
- **THEN** other decorations SHALL continue to render normally

#### Scenario: Failed decoration retries on change
- **WHEN** a decoration fails to render and its content is subsequently modified
- **THEN** the decoration engine SHALL attempt to render it again
