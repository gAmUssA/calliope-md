## ADDED Requirements

### Requirement: Detect mermaid code blocks
The system SHALL identify fenced code blocks with language identifier `mermaid` for inline rendering.

#### Scenario: Mermaid block identified
- **WHEN** a fenced code block has the language identifier `mermaid`
- **THEN** the system SHALL mark it for mermaid diagram rendering

#### Scenario: Non-mermaid blocks ignored
- **WHEN** a fenced code block has a different language identifier (e.g., `javascript`, `python`)
- **THEN** the system SHALL NOT apply mermaid diagram rendering

### Requirement: Render mermaid diagrams inline as SVG
The system SHALL render mermaid code blocks as inline SVG diagrams using the beautiful-mermaid library.

#### Scenario: Flowchart diagram rendered
- **WHEN** a mermaid code block contains valid flowchart syntax
- **THEN** the system SHALL render it as an SVG flowchart diagram inline

#### Scenario: Sequence diagram rendered
- **WHEN** a mermaid code block contains valid sequence diagram syntax
- **THEN** the system SHALL render it as an SVG sequence diagram inline

#### Scenario: Multiple diagram types supported
- **WHEN** a document contains mermaid blocks with different diagram types (class, state, gantt, pie, etc.)
- **THEN** each SHALL be rendered with its corresponding diagram visualization

### Requirement: Apply three-state visibility to mermaid diagrams
The system SHALL apply visibility states to mermaid diagrams based on cursor position.

#### Scenario: Diagram rendered when cursor elsewhere
- **WHEN** the cursor is not within the mermaid code block
- **THEN** the diagram SHALL be rendered inline and the source code SHALL be hidden

#### Scenario: Diagram ghosted when cursor nearby
- **WHEN** the cursor is on the same line as a mermaid fence marker
- **THEN** the diagram SHALL be visible with reduced opacity and fence markers SHALL appear ghosted

#### Scenario: Source code shown when cursor inside
- **WHEN** the cursor is inside the mermaid code block (on content lines)
- **THEN** the source code SHALL be fully visible and the diagram SHALL be hidden or ghosted

### Requirement: Support click-to-edit interaction
The system SHALL allow users to click on a rendered mermaid diagram to enter edit mode.

#### Scenario: Click diagram to edit
- **WHEN** a user clicks on a rendered mermaid diagram
- **THEN** the cursor SHALL be moved to the first content line of the mermaid code block and the source code SHALL become fully visible

### Requirement: Handle mermaid rendering errors gracefully
The system SHALL log rendering errors to the console when mermaid syntax is invalid, without breaking the editor experience.

#### Scenario: Invalid syntax logs error
- **WHEN** a mermaid code block contains invalid syntax
- **THEN** the system SHALL log an error to the console with line number context and render the block as a normal code block

#### Scenario: Error allows editing
- **WHEN** a mermaid rendering error occurs
- **THEN** the user SHALL still be able to edit the code block normally without visual clutter

#### Scenario: Error recovery on fix
- **WHEN** invalid mermaid syntax is corrected
- **THEN** the system SHALL automatically render the diagram on the next update cycle

**Implementation Note:** Console logging approach prevents visual overlap issues with adjacent diagrams while still providing debugging information.

### Requirement: Preserve mermaid source code
The system SHALL NOT modify the source markdown content when rendering mermaid diagrams.

#### Scenario: Source unchanged after rendering
- **WHEN** mermaid diagrams are rendered
- **THEN** the underlying markdown source SHALL remain exactly as written

### Requirement: Render asynchronously without blocking
The system SHALL render mermaid diagrams asynchronously to prevent editor lag.

#### Scenario: Rendering does not block typing
- **WHEN** a large or complex mermaid diagram is being rendered
- **THEN** the user SHALL be able to continue typing without interruption

#### Scenario: Multiple diagrams render concurrently
- **WHEN** a document contains multiple mermaid diagrams
- **THEN** they SHALL render asynchronously without blocking each other

### Requirement: Configurable mermaid diagram rendering
The system SHALL allow users to enable/disable mermaid diagram rendering via the `calliope.renderMermaidDiagrams` setting.

#### Scenario: Mermaid rendering disabled
- **WHEN** `calliope.renderMermaidDiagrams` is set to false
- **THEN** mermaid code blocks SHALL render as standard fenced code blocks without diagram visualization

#### Scenario: Mermaid rendering enabled
- **WHEN** `calliope.renderMermaidDiagrams` is set to true
- **THEN** mermaid code blocks SHALL render as inline SVG diagrams

**Configuration Note:** Default is `false` (experimental feature requires opt-in due to VS Code decoration API constraints with complex diagrams).

## ADDED Enhancements (Post-Implementation)

The following features were added during implementation to improve resilience and usability:

### ASCII Fallback Mode
- New `calliope.mermaidRenderMode` configuration: `svg`, `ascii`, or `auto` (default)
- Auto mode tries SVG first, falls back to ASCII on errors
- Unicode box-drawing characters for better appearance
- Compact spacing options for hover tooltips (paddingX: 2, paddingY: 1)
- Hover provider shows ASCII preview with "Click to edit" hint

### Resource Cleanup
- Automatic cleanup of unused SVG temp files
- Content-based hashing (MD5) deduplicates identical diagrams
- `.calliope/mermaid/` directory is gitignored
- Cleanup runs on document changes and extension deactivation

### Temp File Architecture
- SVG files written to `.calliope/mermaid/{hash}.svg` (VS Code contentIconPath requires file URIs, not data URIs)
- Active tracking prevents premature deletion of in-use files
