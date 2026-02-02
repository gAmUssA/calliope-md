## Why

The presentation mode feature currently logs errors using `console.error`, which are only visible in the developer console. Users experiencing issues (e.g., failed setting restoration, theme application failures) receive no actionable feedback, creating a poor user experience and making debugging difficult.

## What Changes

- Replace `console.error()` calls with VS Code's `window.showErrorMessage()` API for user-visible error notifications
- Preserve error details in messages to aid user troubleshooting
- Maintain graceful degradation when partial failures occur (e.g., some settings fail to restore)

## Capabilities

### New Capabilities
- `error-notification`: Surface presentation mode errors to users through VS Code's notification system instead of silent console logging

### Modified Capabilities
<!-- No existing capabilities are being modified -->

## Impact

- **Code**: `src/presentationMode.ts` - All error handling blocks (~6 catch statements)
- **UX**: Users will now see error notifications when presentation mode operations fail
- **Debugging**: Error messages visible to users without requiring DevTools access
