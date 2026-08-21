# 6. Presentation mode toggles VS Code settings, storing originals in globalState

- **Status:** Accepted. Superseded in part by ADR-0015.
- **Date:** 2026-02-01

## Context

Presenting Markdown during a talk or screencast means hiding the sidebar, activity bar, minimap, scrollbar and status bar, and raising font size and zoom. Doing it by hand before every demo is tedious and error-prone, and restoring afterwards is worse because the user has to remember what their values were.

VS Code exposes no "presentation profile" API. The only levers are `workspace.getConfiguration().update()` and commands such as `workbench.action.closeSidebar`.

## Decision

`src/presentationMode.ts` owns a `PRESENTATION_SETTINGS` map. Activation captures each key's current value, writes the presentation value at `ConfigurationTarget.Global`, and stores the captured originals in `ExtensionContext.globalState` as `{ active, originalSettings }`. Deactivation writes the stored originals back. Settings with no configuration equivalent (the sidebar) are driven by executing commands instead.

`globalState` was chosen over `workspaceState` so that state survives a workspace switch and a crash: if VS Code dies mid-presentation, the originals are still on disk and recoverable at next activation. A status bar item shows the active state and toggles the mode when clicked.

## Consequences

- One command produces a consistent presentation environment and one command undoes it exactly, restoring the user's own values rather than VS Code defaults.
- Writing to the global target changes settings for every window, which is intended — a presenter wants the same environment everywhere — but it means the user's `settings.json` is modified by the extension.
- Restoration is best-effort per key. A single failing key must not abort the rest, so failures are collected and reported together (ADR-0008).
- Because `PRESENTATION_SETTINGS` names VS Code setting keys directly, a key that VS Code retires breaks the feature. This happened when `workbench.activityBar.visible` was removed in favour of `workbench.activityBar.location`, which made `update()` throw.
- Applying colours the same way turned out to be a mistake: overwriting `workbench.colorCustomizations` fought the user's theme and blocked external edits to settings. ADR-0015 removes it.
- The status bar indicator is invisible in presentation mode, because presentation mode hides the status bar. ADR-0015 adds a notification for that reason.
