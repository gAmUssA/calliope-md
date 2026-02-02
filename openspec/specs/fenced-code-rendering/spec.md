## ADDED Requirements

### Requirement: Style fenced code block delimiters
The system SHALL style the opening and closing fence markers (```) with reduced opacity.

#### Scenario: Opening fence styling
- **WHEN** a line contains ``` (with optional language identifier)
- **THEN** the fence line SHALL appear at reduced opacity

#### Scenario: Closing fence styling
- **WHEN** a line contains ``` closing a code block
- **THEN** the fence line SHALL appear at reduced opacity

### Requirement: Preserve native syntax highlighting
The system SHALL NOT apply decorations to code block content lines, preserving VS Code's syntax highlighting.

#### Scenario: Code content unchanged
- **WHEN** lines are inside a fenced code block
- **THEN** the content SHALL retain VS Code's native syntax highlighting

### Requirement: Apply three-state visibility to fences
The system SHALL apply visibility states to fence markers based on cursor position.

#### Scenario: Fences dimmed when cursor elsewhere
- **WHEN** the cursor is not on a fence line
- **THEN** the fence markers SHALL appear at ghost opacity

#### Scenario: Fences visible when cursor on fence
- **WHEN** the cursor is on a fence line
- **THEN** the fence markers SHALL appear at full opacity

### Requirement: Configurable code block rendering
The system SHALL allow users to enable/disable fenced code block styling via the `calliope.renderCodeBlocks` setting.

#### Scenario: Code block styling disabled
- **WHEN** `calliope.renderCodeBlocks` is set to false
- **THEN** fenced code blocks SHALL render with full fence visibility

### Requirement: Delegate mermaid blocks to mermaid renderer
The system SHALL identify mermaid code blocks and delegate them to the mermaid diagram renderer instead of applying standard code block styling.

#### Scenario: Mermaid block delegated
- **WHEN** a fenced code block has language identifier `mermaid`
- **THEN** the system SHALL skip standard code block decoration and delegate to the mermaid renderer

#### Scenario: Non-mermaid blocks styled normally
- **WHEN** a fenced code block has a non-mermaid language identifier
- **THEN** the system SHALL apply standard fenced code block styling

### Requirement: Preserve fenced code rendering for non-delegated blocks
The system SHALL continue to apply standard fenced code block styling to all non-mermaid code blocks.

#### Scenario: Standard code blocks unaffected
- **WHEN** a document contains both mermaid and non-mermaid code blocks
- **THEN** non-mermaid blocks SHALL render with fence dimming and preserved syntax highlighting as before
