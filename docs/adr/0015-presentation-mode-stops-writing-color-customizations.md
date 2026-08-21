# 15. Presentation mode stops writing colour customizations and announces itself at startup

- **Status:** Accepted
- **Date:** 2026-03-16

## Context

ADR-0006 treated colours like any other setting: on activation, presentation mode wrote `workbench.colorCustomizations` with hardcoded `#000000` or `#ffffff` backgrounds chosen from the theme kind, and listened to `onDidChangeActiveColorTheme` to re-apply them whenever the theme changed.

Two bugs followed directly. Switching themes during a presentation was impossible — the listener immediately overwrote the new theme's colours. Editing `settings.json` by hand was equally futile, since the extension rewrote the block.

Separately, the status bar indicator was unreachable by design: presentation mode hides the status bar. A user who restarted VS Code while presenting had no visible sign the mode was still on, and the extension silently restored settings on activation, which is surprising in the opposite direction.

## Decision

Remove colour manipulation entirely. `getThemeColors()`, `applyPresentationColors()`, `COLOR_KEYS`, the `onDidChangeActiveColorTheme` listener, and the colour-related paths in capture and restore are all deleted. Presentation mode now touches only editor and workbench chrome — font size, minimap, scrollbar, status bar, activity bar, bracket matching, zoom. `workbench.colorCustomizations` is neither captured nor written.

Replace the invisible indicator with a notification: on activation, if stored state says presentation mode is active, show a non-modal `showInformationMessage('Presentation Mode is active', 'Deactivate')`.

Make orphaned-state recovery interactive rather than silent: offer "Restore Settings" and "Keep Current" so a user who already fixed their settings by hand is not overridden.

## Consequences

- Theme switching and manual settings edits work normally during a presentation. The user's theme is the user's.
- This is a breaking change. Anyone relying on the forced monochrome background loses it and must pick a presentation theme themselves.
- A notification appears on every startup while the mode is active. Acceptable — presentation mode is used in short stretches, and the notification is dismissible and carries the fix.
- Restoration is never silent, so startup can no longer surprise the user by changing their settings.
- Removing the theme listener also removes the failure path the error-notification spec described for it (ADR-0008); that scenario no longer exists.
