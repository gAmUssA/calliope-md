# error-notification Specification

## Purpose
TBD - created by archiving change improve-presentation-error-reporting. Update Purpose after archive.
## Requirements
### Requirement: Surface presentation mode errors to users
The system SHALL surface errors encountered during presentation mode operations to the user via VS Code notifications, rather than relying solely on console logging. Error messages SHALL provide concise context (which operation failed) and a short description of the failure; they MUST avoid including raw stack traces or sensitive internal data.

#### Scenario: Failure applying a single setting
- **WHEN** `applyPresentationSettings` attempts to update a workspace setting (e.g., `editor.fontSize`) and the configuration API throws an exception
- **THEN** the extension SHALL call `vscode.window.showErrorMessage()` with a message that includes the setting key and the error message (e.g., `Failed to apply setting editor.fontSize: [error message]`)
- **AND** the operation SHALL continue applying remaining settings (partial failure should not abort the entire application)

#### Scenario: Failure restoring original settings with multiple errors
- **WHEN** `restoreOriginalSettings` encounters one or more failures while restoring individual settings
- **THEN** the extension SHALL aggregate the failures and call `vscode.window.showErrorMessage()` with a consolidated message summarizing which settings failed and a short reason for each (e.g., `Some settings could not be restored: editor.fontSize (permission denied); workbench.activityBar.visible (invalid value)`)
- **AND** the extension SHALL not expose stack traces; detailed error information MAY remain in the developer console for debugging

#### Scenario: Failure closing sidebar or panel
- **WHEN** `applyPresentationSettings` invokes `workbench.action.closeSidebar` or `workbench.action.closePanel` and the command invocation throws an error
- **THEN** the extension SHALL call `vscode.window.showErrorMessage()` with a message like `Failed to close sidebar: [error message]` or `Failed to close panel: [error message]`

#### Scenario: Theme application failure on theme change
- **WHEN** the theme change listener (`onDidChangeActiveColorTheme`) triggers and applying presentation colors fails
- **THEN** the extension SHALL call `vscode.window.showErrorMessage()` with context `Failed to apply presentation colors: [error message]`

