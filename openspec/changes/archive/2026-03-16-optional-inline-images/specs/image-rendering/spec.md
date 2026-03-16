## MODIFIED Requirements

### Requirement: Configurable image rendering
The system SHALL allow users to enable/disable image rendering via the `calliope.renderImages` setting. The setting SHALL default to `false` (disabled).

#### Scenario: Images disabled by default
- **WHEN** the user has not explicitly set `calliope.renderImages`
- **THEN** images SHALL render as plain text syntax with no inline preview

#### Scenario: Images enabled explicitly
- **WHEN** `calliope.renderImages` is set to `true`
- **THEN** inline image previews SHALL be displayed

#### Scenario: Images disabled explicitly
- **WHEN** `calliope.renderImages` is set to `false`
- **THEN** images SHALL render as plain text syntax with no inline preview

### Requirement: Hide image syntax in rendered state
The system SHALL keep the `![alt](path)` syntax fully visible at all times when image rendering is enabled. The image preview SHALL appear as an inline decoration after the syntax text.

#### Scenario: Syntax visible when cursor elsewhere
- **WHEN** image rendering is enabled and the cursor is not on the image line
- **THEN** the full `![alt](path)` syntax SHALL remain visible alongside the image preview

#### Scenario: Syntax visible when editing
- **WHEN** image rendering is enabled and the cursor is on the image line
- **THEN** the full `![alt](path)` syntax SHALL remain visible alongside the image preview
