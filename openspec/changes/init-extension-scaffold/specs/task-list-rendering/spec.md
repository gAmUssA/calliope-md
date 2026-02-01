## ADDED Requirements

### Requirement: Display checkbox for uncompleted tasks
The system SHALL replace `- [ ]` syntax with a visual unchecked checkbox character (☐).

#### Scenario: Uncompleted task displays checkbox
- **WHEN** a line contains `- [ ] Task text`
- **THEN** the `- [ ]` SHALL be replaced visually with ☐ and the task text displayed normally

### Requirement: Display checked checkbox for completed tasks
The system SHALL replace `- [x]` or `- [X]` syntax with a visual checked checkbox character (☑).

#### Scenario: Completed task displays checked checkbox
- **WHEN** a line contains `- [x] Task text` or `- [X] Task text`
- **THEN** the `- [x]` SHALL be replaced visually with ☑

### Requirement: Apply strikethrough to completed tasks
The system SHALL apply strikethrough decoration and reduced opacity to the entire line of completed tasks.

#### Scenario: Completed task line styling
- **WHEN** a task is marked as completed (`- [x]`)
- **THEN** the entire task line SHALL have line-through decoration and 60% opacity

### Requirement: Toggle checkbox on click
The system SHALL allow users to click on a checkbox to toggle the task state, modifying the actual document.

#### Scenario: Click uncompleted checkbox to complete
- **WHEN** user clicks on an unchecked checkbox (☐)
- **THEN** the document SHALL be edited to change `[ ]` to `[x]`

#### Scenario: Click completed checkbox to uncomplete
- **WHEN** user clicks on a checked checkbox (☑)
- **THEN** the document SHALL be edited to change `[x]` to `[ ]`

### Requirement: Toggle checkbox via command
The system SHALL provide a `calliope.toggleCheckbox` command to toggle the task state at the current cursor position.

#### Scenario: Command toggles task at cursor
- **WHEN** cursor is on a task list line and `calliope.toggleCheckbox` command is executed
- **THEN** the task state SHALL toggle between `[ ]` and `[x]`

### Requirement: Hide task syntax per visibility model
The system SHALL hide the `- [ ]` / `- [x]` syntax according to the three-state visibility model.

#### Scenario: Task syntax hidden in rendered state
- **WHEN** cursor is not on the task line
- **THEN** the checkbox character SHALL be shown and the raw syntax hidden

#### Scenario: Task syntax visible when editing
- **WHEN** cursor is on the task line
- **THEN** the raw `- [ ]` or `- [x]` syntax SHALL be visible

### Requirement: Configurable task list rendering
The system SHALL allow users to enable/disable task list rendering via the `calliope.renderTaskLists` setting.

#### Scenario: Task lists disabled via configuration
- **WHEN** `calliope.renderTaskLists` is set to false
- **THEN** task lists SHALL render as plain text with raw syntax visible
