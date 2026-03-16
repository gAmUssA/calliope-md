## Context

VS Code replaced the boolean `workbench.activityBar.visible` setting with `workbench.activityBar.location` (values: `'default'`, `'top'`, `'bottom'`, `'hidden'`). The old setting is no longer registered, causing `configuration.update()` to throw. Presentation mode in `src/presentationMode.ts` uses the old setting at line 17.

## Goals / Non-Goals

**Goals:**
- Replace the deprecated setting so presentation mode works without errors on current VS Code versions
- Maintain correct capture/restore behavior for the activity bar location

**Non-Goals:**
- Reworking other presentation mode settings
- Supporting VS Code versions old enough to only have `workbench.activityBar.visible`

## Decisions

**Replace `workbench.activityBar.visible: false` with `workbench.activityBar.location: 'hidden'`**

Rationale: Direct 1:1 replacement. Setting `location` to `'hidden'` achieves the same visual result. The capture/restore logic already works generically via `PRESENTATION_SETTINGS` keys — changing the key and value is sufficient.

Alternative considered: Wrapping the old setting in a try/catch and silently skipping. Rejected because the setting simply won't work and the activity bar would remain visible.

## Risks / Trade-offs

- [Stored state from old sessions] Users who activated presentation mode on an older version may have `workbench.activityBar.visible` in their stored `originalSettings`. On restore, this will hit the catch block and log an error, but all other settings restore fine. The new `workbench.activityBar.location` won't be in stored settings, so it stays at whatever the user's current value is. → Acceptable: one-time cosmetic error on restore, no data loss.
