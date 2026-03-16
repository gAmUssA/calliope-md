## Context

Presentation Mode in Calliope currently overrides `workbench.colorCustomizations` with hardcoded `#000000` (dark) or `#ffffff` (light) backgrounds. It also listens to `onDidChangeActiveColorTheme` and re-applies these overrides whenever the theme changes. This effectively blocks theme switching and external settings edits while active.

The status bar indicator ("Presenting") is invisible because Presentation Mode hides the status bar itself. On restart, the extension silently restores settings without user interaction, which can be confusing.

Current code: `src/presentationMode.ts` (262 lines). Key functions: `getThemeColors()`, `applyPresentationColors()`, `captureOriginalSettings()`, `restoreOriginalSettings()`, `checkOrphanedState()`.

## Goals / Non-Goals

**Goals:**
- Remove all `workbench.colorCustomizations` manipulation from Presentation Mode
- Remove the theme-change listener that re-applies color overrides
- Add a visible notification on startup when Presentation Mode is still active
- Make orphaned state recovery interactive (user clicks to deactivate)

**Non-Goals:**
- Providing a replacement "presentation theme" feature — users should pick their own theme
- Changing which editor/workbench chrome settings are overridden (font size, minimap, etc.)
- Adding a custom CSS injection mechanism for presentation styling

## Decisions

### Decision 1: Remove color customization overrides entirely

**Choice**: Delete `getThemeColors()`, `applyPresentationColors()`, `restoreOriginalColors()`, `COLOR_KEYS`, and all color-related code paths.

**Rationale**: The root cause of both reported bugs (theme switching broken, settings blocked) is that the extension writes to `workbench.colorCustomizations`. Removing this entirely is the cleanest fix. Users who want a specific presentation background can configure their theme or color customizations independently.

**Alternative considered**: Only apply color overrides once (on activation) without the theme-change listener. Rejected because it still overwrites the user's color customizations and creates the same restoration complexity.

### Decision 2: Use information message with action button for startup indicator

**Choice**: On extension activation, if Presentation Mode state is active, show `vscode.window.showInformationMessage('Presentation Mode is active', 'Deactivate')` with an action button.

**Rationale**: This is visible regardless of status bar visibility. It uses standard VS Code notification UX. The action button lets users deactivate immediately without needing to remember the command.

**Alternative considered**: Show a modal dialog. Rejected because it's too intrusive on every startup.

### Decision 3: Keep orphaned state detection but make it interactive

**Choice**: Replace the current silent `checkOrphanedState()` with an interactive notification: "Presentation Mode was active in a previous session. Settings may need restoration." with "Restore Settings" and "Keep Current" buttons.

**Rationale**: Silent restoration can be surprising (settings suddenly change on startup). Interactive restoration gives the user control. "Keep Current" allows users who manually fixed their settings to skip restoration.

## Risks / Trade-offs

- **[Breaking change]** Users relying on the pure black/white background override will lose it → Document in CHANGELOG; the feature caused more harm than benefit based on the bug reports.
- **[Reduced feature set]** Presentation Mode no longer provides a "clean" monochrome background → Users can achieve this with a dedicated presentation theme (e.g., install a minimal dark theme). Mention this in the notification/docs.
- **[Startup notification fatigue]** Notification shows on every startup while Presentation Mode is active → Acceptable because Presentation Mode is typically used for short periods. The notification is non-modal and dismissible.
