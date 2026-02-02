## ADDED Requirements

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
