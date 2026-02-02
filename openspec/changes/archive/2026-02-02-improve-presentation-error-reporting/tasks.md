## 1. Code changes

 - [x] 1.1 Replace `console.error()` calls in `src/presentationMode.ts` with `vscode.window.showErrorMessage()` including context (e.g., `Failed to apply setting editor.fontSize: [error message]`)
 - [x] 1.2 In `restoreOriginalSettings`, aggregate individual failures into a single consolidated message and call `vscode.window.showErrorMessage()` (preserve existing continuation behavior)
 - [x] 1.3 Ensure theme-change listener errors call `vscode.window.showErrorMessage()` with context
 - [x] 1.4 Ensure `togglePresentationMode` shows user-visible error messages on activation/deactivation failures (replace or augment current `console.error` usage)

## 2. Tests

 - [x] 2.1 Add unit tests asserting `vscode.window.showErrorMessage()` is called for the scenarios in the `error-notification` spec
 - [x] 2.2 Add a test that simulates multiple restore failures and asserts a single aggregated notification is shown

## 3. Verification

- [x] 3.1 Manual: Trigger a settings-apply failure (mock or temporarily throw) and confirm a notification appears
- [x] 3.2 Manual: Trigger multiple restore failures and confirm a single aggregated notification appears
- [x] 3.3 Manual: Change theme while in presentation mode and confirm theme-apply failures surface as notifications

## 4. Docs / Changelog

- [x] 4.1 Update `CHANGELOG.md` with a short note about improved presentation mode error reporting

## Notes

- Tests may require mocking `vscode.window.showErrorMessage()`; prefer lightweight unit tests over heavy integration tests for quick feedback.
