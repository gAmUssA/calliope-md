## MODIFIED Requirements

### Requirement: Theme-aware background colors
The system SHALL NOT override `workbench.colorCustomizations` when Presentation Mode is active. Theme colors SHALL be left entirely to the user's chosen VS Code theme.

#### Scenario: Activation does not modify color customizations
- **WHEN** Presentation Mode activates
- **THEN** `workbench.colorCustomizations` in settings.json is NOT modified

#### Scenario: Theme change during presentation
- **WHEN** user changes theme while Presentation Mode is active
- **THEN** theme colors apply normally without any override from the extension

#### Scenario: Deactivation does not touch color customizations
- **WHEN** Presentation Mode deactivates
- **THEN** `workbench.colorCustomizations` is NOT modified by the extension

### Requirement: Store original settings before activation
The system SHALL store the current values of all affected settings before applying presentation mode settings. Color customization settings SHALL NOT be captured or stored.

#### Scenario: Settings captured on activation
- **WHEN** presentation mode activates
- **THEN** current values of all affected editor/workbench chrome settings are stored for later restoration

#### Scenario: Color customizations not captured
- **WHEN** presentation mode activates
- **THEN** `workbench.colorCustomizations` is NOT included in captured original settings

#### Scenario: Settings persist across restart
- **WHEN** VS Code restarts while presentation mode is active
- **THEN** stored original settings remain available for restoration

### Requirement: Restore on extension activation
The system SHALL check for orphaned presentation mode state on extension activation and offer interactive restoration instead of silently restoring.

#### Scenario: Clean startup
- **WHEN** extension activates with no stored presentation state
- **THEN** no restoration action is taken

#### Scenario: Orphaned active state detected
- **WHEN** extension activates with stored "active" presentation state
- **THEN** system shows interactive notification with options to restore or keep current settings

## REMOVED Requirements

### Requirement: Theme change listener for color re-application
**Reason**: The `onDidChangeActiveColorTheme` listener that re-applies hardcoded colors is the root cause of theme switching being broken and external edits being blocked during Presentation Mode.
**Migration**: No migration needed. Theme colors are now managed entirely by the user's chosen VS Code theme.
