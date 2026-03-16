## MODIFIED Requirements

### Requirement: Apply presentation settings on activation
The system SHALL apply the following settings when presentation mode activates:
- Close sidebar
- Hide activity bar via `workbench.activityBar.location` set to `'hidden'`
- Set editor font size to 18
- Disable minimap
- Hide vertical scrollbar
- Hide status bar
- Disable bracket matching
- Remove line highlight
- Set window zoom level to 2

#### Scenario: All presentation settings applied
- **WHEN** presentation mode activates
- **THEN** all presentation settings are applied simultaneously

#### Scenario: Activity bar hidden using location setting
- **WHEN** presentation mode activates
- **THEN** `workbench.activityBar.location` is set to `'hidden'` in user settings

#### Scenario: Activity bar location restored on deactivation
- **WHEN** presentation mode deactivates
- **THEN** `workbench.activityBar.location` is restored to its original value
