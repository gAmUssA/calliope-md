## Why

Presentation Mode overwrites `settings.json` with hardcoded colors on every theme change and blocks external edits, making it impossible to switch themes or edit settings while active. Additionally, there's no visible startup indicator since the status bar is hidden by Presentation Mode itself, leaving users unaware it's still on after a restart.

## What Changes

- **Stop overriding `workbench.colorCustomizations` with hardcoded colors** — remove the `#000000`/`#ffffff` background override. Instead, only override UI chrome settings (minimap, line numbers, scrollbar, etc.) and leave theme colors to the user's chosen theme.
- **Remove the theme-change listener that re-applies colors** — stop watching for `onDidChangeActiveColorTheme` to re-write color customizations. If the user changes their theme, respect it.
- **Add a startup notification when Presentation Mode is still active** — since the status bar is hidden by Presentation Mode itself, show an information message on activation reminding the user that Presentation Mode is active, with a button to deactivate.
- **Add a failsafe for orphaned settings** — if the extension detects that presentation settings are applied but the extension state is inconsistent, offer to restore original settings via a notification action button instead of silently restoring.

## Capabilities

### New Capabilities

- `presentation-mode-startup-indicator`: Visible notification on VS Code startup when Presentation Mode is still active, with action to deactivate.

### Modified Capabilities

- `presentation-mode`: Stop overriding `workbench.colorCustomizations` with hardcoded colors; remove theme-change listener that re-applies overrides; improve orphan state handling to be interactive rather than silent.

## Impact

- **Code**: `src/presentationMode.ts` — remove `getThemeColors()`, `applyPresentationColors()`, `COLOR_KEYS`, the `onDidChangeActiveColorTheme` listener, and the color-related portions of `captureOriginalSettings()`/`restoreOriginalSettings()`. Update `checkOrphanedState()` to show interactive notification. Add startup notification logic.
- **Settings**: `workbench.colorCustomizations` will no longer be touched by the extension. Only editor/workbench chrome settings will be modified.
- **User experience**: Theme switching works normally during Presentation Mode. Users get a clear notification on restart if Presentation Mode is active.
- **Breaking**: Users who relied on the pure black/white background override will need to configure their preferred presentation theme manually. **BREAKING**
