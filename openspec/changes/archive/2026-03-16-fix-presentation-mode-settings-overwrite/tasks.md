## 1. Remove Color Customization Overrides

- [x] 1.1 Delete `COLOR_KEYS` constant array from `src/presentationMode.ts`
- [x] 1.2 Delete `getThemeColors()` function
- [x] 1.3 Delete `applyPresentationColors()` function
- [x] 1.4 Delete `restoreOriginalColors()` function
- [x] 1.5 Remove `workbench.colorCustomizations` capture from `captureOriginalSettings()`
- [x] 1.6 Remove `workbench.colorCustomizations` restore from `restoreOriginalSettings()`
- [x] 1.7 Remove `applyPresentationColors()` call from `applyPresentationSettings()`

## 2. Remove Theme Change Listener

- [x] 2.1 Remove `themeChangeDisposable` variable and its type import if unused
- [x] 2.2 Remove `onDidChangeActiveColorTheme` listener setup in `togglePresentationMode()` activation branch
- [x] 2.3 Remove `themeChangeDisposable.dispose()` from deactivation branch and `disposePresentationMode()`

## 3. Add Startup Notification

- [x] 3.1 Update `checkOrphanedState()` to show interactive notification instead of silent restore
- [x] 3.2 Add "Presentation Mode is active" info message with "Deactivate" action button on startup when state is active
- [x] 3.3 Handle "Deactivate" action: call deactivation logic (restore settings, clear state, update status bar)
- [x] 3.4 Add "Restore Settings" and "Keep Current" buttons for orphaned state scenario
- [x] 3.5 Handle "Keep Current" action: clear state without modifying settings

## 4. Update Tests

- [x] 4.1 Update `test/presentationMode.test.js` to remove tests for color customization behavior
- [x] 4.2 Add tests for startup notification when Presentation Mode is active
- [x] 4.3 Add tests for interactive orphaned state recovery (Restore Settings / Keep Current)
- [x] 4.4 Verify theme change no longer triggers any Presentation Mode behavior

## 5. Documentation and Cleanup

- [x] 5.1 Update CHANGELOG.md with breaking change note about color customization removal
- [x] 5.2 Remove any dead code or unused imports after deletions
