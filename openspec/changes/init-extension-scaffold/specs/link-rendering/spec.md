## ADDED Requirements

### Requirement: Render link text with link styling
The system SHALL render the text portion of Markdown links with underline and the `textLink.foreground` theme color.

#### Scenario: Link text styling
- **WHEN** a link like `[text](url)` is present
- **THEN** the "text" portion SHALL render with underline and link color

### Requirement: Hide URL portion in rendered state
The system SHALL hide the `](url)` portion of links according to the three-state visibility model.

#### Scenario: URL hidden in rendered state
- **WHEN** cursor is not on the link line
- **THEN** only the link text SHALL be visible; `[`, `](`, URL, and `)` SHALL be hidden

#### Scenario: URL visible when editing
- **WHEN** cursor is positioned inside the link construct
- **THEN** the full `[text](url)` syntax SHALL be visible

### Requirement: Open URL on Ctrl+click
The system SHALL open the link URL in the default browser when the user Ctrl+clicks (Cmd+click on macOS) on the link text.

#### Scenario: Ctrl+click opens link
- **WHEN** user Ctrl+clicks on a rendered link
- **THEN** the URL SHALL open in the default browser

### Requirement: Show URL in hover tooltip
The system SHALL display the URL in a hover tooltip when the user hovers over link text.

#### Scenario: Hover shows URL
- **WHEN** user hovers over a rendered link
- **THEN** a tooltip SHALL appear showing the full URL

### Requirement: Implement DocumentLinkProvider
The system SHALL implement a DocumentLinkProvider to enable VS Code's built-in link handling features.

#### Scenario: Links detected in document
- **WHEN** VS Code requests document links
- **THEN** the provider SHALL return Link objects for all Markdown links with their target URLs

### Requirement: Configurable link rendering
The system SHALL allow users to enable/disable link rendering via the `calliope.renderLinks` setting.

#### Scenario: Links disabled via configuration
- **WHEN** `calliope.renderLinks` is set to false
- **THEN** links SHALL render as plain text with full syntax visible
