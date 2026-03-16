## ADDED Requirements

### Requirement: Startup notification when Presentation Mode is active
The system SHALL display a non-modal information notification on extension activation when Presentation Mode state indicates it is active.

#### Scenario: Notification shown on startup with active state
- **WHEN** VS Code starts and Presentation Mode global state indicates active
- **THEN** system displays an information message "Presentation Mode is active" with a "Deactivate" action button

#### Scenario: User clicks Deactivate
- **WHEN** user clicks the "Deactivate" action on the startup notification
- **THEN** Presentation Mode deactivates, original settings are restored, and state is cleared

#### Scenario: User dismisses notification
- **WHEN** user dismisses the startup notification without clicking an action
- **THEN** Presentation Mode remains active with current settings

#### Scenario: No notification when inactive
- **WHEN** VS Code starts and Presentation Mode global state indicates inactive or is absent
- **THEN** no startup notification is displayed

### Requirement: Interactive orphaned state recovery
The system SHALL provide an interactive notification when orphaned Presentation Mode state is detected, instead of silently restoring settings.

#### Scenario: Orphaned state detected
- **WHEN** extension activates and detects stored active Presentation Mode state from a previous session
- **THEN** system displays a notification "Presentation Mode was active in a previous session" with "Restore Settings" and "Keep Current" action buttons

#### Scenario: User clicks Restore Settings
- **WHEN** user clicks "Restore Settings" on the orphaned state notification
- **THEN** system restores all original settings from the stored state and clears the Presentation Mode state

#### Scenario: User clicks Keep Current
- **WHEN** user clicks "Keep Current" on the orphaned state notification
- **THEN** system clears the stored Presentation Mode state without modifying any settings
