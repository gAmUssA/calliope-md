## Why

VS Code removed the `workbench.activityBar.visible` setting, replacing it with `workbench.activityBar.location`. Users toggling presentation mode see the error: "Unable to write to User Settings because workbench.activityBar.visible is not a registered configuration." This breaks the presentation mode experience on current VS Code versions.

## What Changes

- Replace deprecated `workbench.activityBar.visible: false` with `workbench.activityBar.location: 'hidden'` in `PRESENTATION_SETTINGS`
- Ensure restore logic correctly handles the new setting (restoring original location value, not a boolean)

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `presentation-mode`: The "Hide activity bar" requirement now uses `workbench.activityBar.location` set to `'hidden'` instead of the removed `workbench.activityBar.visible` boolean.

## Impact

- `src/presentationMode.ts` — update `PRESENTATION_SETTINGS` constant
- No API or dependency changes
- Backward-compatible: users with stored original settings from old format will get a harmless no-op on restore for the old key
