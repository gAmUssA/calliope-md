## ADDED Requirements

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
