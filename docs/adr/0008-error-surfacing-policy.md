# 8. Surface presentation-mode failures as notifications, keep render failures on the console

- **Status:** Accepted
- **Date:** 2026-02-02

## Context

Two kinds of failure occur in the extension and they need opposite treatment.

Presentation mode failures are consequential and invisible. If `configuration.update()` throws while applying or restoring a setting, the user is left in a half-presenting state with no signal; the original `console.error` calls were only visible with DevTools open.

Render failures are frequent and self-correcting. A Mermaid block is invalid on nearly every keystroke while it is being typed. Surfacing those as notifications would produce a stream of popups during normal editing, and the inline error badges tried first overlapped adjacent diagrams.

## Decision

Route failures by kind:

- **Presentation mode** uses `vscode.window.showErrorMessage()` with the operation as context, formatted `"[operation]: [detail]"`. Where several failures can occur in one operation — restoring many settings — they are aggregated into a single consolidated notification rather than one per key. Messages carry the setting key and the error text, never raw stack traces.
- **Rendering** logs to the console with line-number context and degrades visually: an invalid Mermaid block simply renders as an ordinary code block. A per-content error cache prevents the same failure being logged repeatedly.

Partial failure never aborts an operation. Applying or restoring settings continues past a failing key.

## Consequences

- The user finds out when presentation mode misbehaves, which is exactly when they are least able to debug it.
- Editing stays quiet. Typing an incomplete diagram produces no interruption.
- Render failures are effectively invisible to a user who does not open the developer console, so a diagram that never appears gives no explanation.
- Notifications are fire-and-forget; the returned promise is not awaited, since blocking on dismissal would stall the toggle.
