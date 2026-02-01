## ADDED Requirements

### Requirement: Toggle presentation mode command
The system SHALL provide a command `Calliope: Toggle Presentation Mode` that activates or deactivates presentation mode.

#### Scenario: Activate presentation mode
- **WHEN** user executes "Calliope: Toggle Presentation Mode" command while presentation mode is inactive
- **THEN** presentation mode activates and applies all presentation settings

#### Scenario: Deactivate presentation mode
- **WHEN** user executes "Calliope: Toggle Presentation Mode" command while presentation mode is active
- **THEN** presentation mode deactivates and restores all original settings

### Requirement: Store original settings before activation
The system SHALL store the current values of all affected settings before applying presentation mode settings.

#### Scenario: Settings captured on activation
- **WHEN** presentation mode activates
- **THEN** current values of all affected settings are stored for later restoration

#### Scenario: Settings persist across restart
- **WHEN** VS Code restarts while presentation mode is active
- **THEN** stored original settings remain available for restoration

### Requirement: Apply presentation settings on activation
The system SHALL apply the following settings when presentation mode activates:
- Close sidebar
- Hide activity bar
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

### Requirement: Restore original settings on deactivation
The system SHALL restore all settings to their original values when presentation mode deactivates.

#### Scenario: Settings restored exactly
- **WHEN** presentation mode deactivates
- **THEN** all settings return to their values from before activation

#### Scenario: Partial restoration on error
- **WHEN** one setting fails to restore during deactivation
- **THEN** system continues restoring remaining settings and reports the error

### Requirement: Theme-aware background colors
The system SHALL apply theme-appropriate background colors when presentation mode is active.

#### Scenario: Dark theme background
- **WHEN** presentation mode activates with a dark theme active
- **THEN** background colors are set to pure black (#000000)

#### Scenario: Light theme background
- **WHEN** presentation mode activates with a light theme active
- **THEN** background colors are set to pure white (#ffffff)

#### Scenario: Theme change during presentation
- **WHEN** user changes theme while presentation mode is active
- **THEN** background colors update to match the new theme kind

### Requirement: Visual status indicator
The system SHALL display a status bar item indicating when presentation mode is active.

#### Scenario: Indicator shown when active
- **WHEN** presentation mode is active
- **THEN** status bar displays presentation mode indicator

#### Scenario: Indicator hidden when inactive
- **WHEN** presentation mode is inactive
- **THEN** status bar does not display presentation mode indicator

#### Scenario: Click indicator to toggle
- **WHEN** user clicks the presentation mode status bar indicator
- **THEN** presentation mode toggles (activates if inactive, deactivates if active)

### Requirement: Restore on extension activation
The system SHALL check for orphaned presentation mode state on extension activation and offer restoration.

#### Scenario: Clean startup
- **WHEN** extension activates with no stored presentation state
- **THEN** no restoration action is taken

#### Scenario: Orphaned active state detected
- **WHEN** extension activates with stored "active" presentation state but settings don't match
- **THEN** system restores original settings and clears the stored state
