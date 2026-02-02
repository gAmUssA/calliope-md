## Context

The presentation mode feature in `src/presentationMode.ts` currently uses `console.error()` for error logging across 6 catch blocks. These errors are invisible to users unless they open the DevTools console, creating a poor debugging experience when operations fail (settings application, restoration, sidebar/panel closing).

## Goals / Non-Goals

**Goals:**
- Replace all `console.error()` calls with `vscode.window.showErrorMessage()` for user visibility
- Preserve error details in notification messages to aid troubleshooting
- Maintain graceful degradation behavior (partial failures don't block the entire operation)

**Non-Goals:**
- Adding retry logic or error recovery mechanisms (beyond what exists today)
- Creating a centralized error handling utility (out of scope for this focused change)
- Changing the error handling strategy for non-critical operations

## Decisions

### Decision 1: Use `showErrorMessage` for all user-facing errors

**Rationale:** VS Code's `window.showErrorMessage()` provides a consistent, native notification experience. It's non-blocking, appears in the notification tray, and allows users to dismiss or act on errors.

**Alternatives considered:**
- `showWarningMessage`: Less severe, but presentation mode failures warrant error-level visibility
- Custom notification panel: Over-engineered for simple error surfacing
- Status bar error indicator: Too subtle, easy to miss

### Decision 2: Include error details in message strings

**Rationale:** Users need actionable information to report issues or understand failures. Including the original error message or key context (e.g., which setting failed) enables better bug reports.

**Format:** `"[Operation context]: [error details]"`  
**Example:** `"Failed to apply setting editor.fontSize: [error message]"`

**Alternatives considered:**
- Generic messages only: Simpler but less useful for debugging
- Separate "Show Details" button: Extra complexity, users might miss the details

### Decision 3: Preserve existing error collection behavior

**Rationale:** The current code collects multiple errors (e.g., in `restoreOriginalSettings`) and shows a single consolidated warning. We'll upgrade this to `showErrorMessage` but maintain the aggregation pattern.

**Implementation:** Continue building error arrays, then show one notification with all failures listed.

## Risks / Trade-offs

**Risk:** Error messages might expose internal implementation details  
→ **Mitigation:** Use clear, user-friendly context strings; avoid raw stack traces

**Risk:** Too many notifications could overwhelm users during cascading failures  
→ **Mitigation:** Existing error aggregation (multiple failures → one message) prevents notification spam

**Trade-off:** `showErrorMessage` is async but we're not awaiting it in all cases  
→ **Acceptable:** Fire-and-forget notifications are standard for non-critical UX feedback; blocking on user dismissal would degrade responsiveness
