## ADDED Requirements

### Requirement: Display inline image previews
The system SHALL display a thumbnail preview for images using `![alt](path)` syntax.

#### Scenario: Local image preview
- **WHEN** an image references a local file path
- **THEN** a thumbnail preview SHALL be displayed inline

#### Scenario: Remote image preview
- **WHEN** an image references a URL
- **THEN** a thumbnail preview SHALL be displayed inline

### Requirement: Constrain image preview dimensions
The system SHALL constrain image previews to a maximum width of 200 pixels, preserving aspect ratio.

#### Scenario: Wide image constrained
- **WHEN** an image is wider than 200 pixels
- **THEN** the preview SHALL be scaled to 200px width with proportional height

#### Scenario: Small image unchanged
- **WHEN** an image is smaller than 200 pixels wide
- **THEN** the preview SHALL display at original size

### Requirement: Show placeholder for missing images
The system SHALL display a placeholder icon when an image cannot be loaded.

#### Scenario: Missing local image
- **WHEN** a local image file does not exist
- **THEN** a placeholder icon SHALL be displayed

#### Scenario: Failed remote image
- **WHEN** a remote image URL fails to load
- **THEN** a placeholder icon SHALL be displayed

### Requirement: Hide image syntax in rendered state
The system SHALL hide the `![alt](path)` syntax when not editing.

#### Scenario: Syntax hidden when cursor elsewhere
- **WHEN** the cursor is not on the image line
- **THEN** only the image preview SHALL be visible

#### Scenario: Syntax visible when editing
- **WHEN** the cursor is on the image line
- **THEN** the full `![alt](path)` syntax SHALL be visible

### Requirement: Show full image on hover
The system SHALL display the full-size image in a hover tooltip.

#### Scenario: Hover shows full image
- **WHEN** user hovers over an image preview
- **THEN** the full-size image SHALL be displayed in a tooltip

### Requirement: Configurable image rendering
The system SHALL allow users to enable/disable image rendering via the `calliope.renderImages` setting.

#### Scenario: Images disabled
- **WHEN** `calliope.renderImages` is set to false
- **THEN** images SHALL render as plain text syntax
