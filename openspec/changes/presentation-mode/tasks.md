## 1. Module Setup

- [x] 1.1 Create src/presentationMode.ts module
- [x] 1.2 Define PresentationModeState interface
- [x] 1.3 Define PRESENTATION_SETTINGS constant with setting keys and values

## 2. State Management

- [x] 2.1 Implement getState function to read from globalState
- [x] 2.2 Implement setState function to write to globalState
- [x] 2.3 Implement captureOriginalSettings function to snapshot current values
- [x] 2.4 Implement clearState function to remove stored state

## 3. Settings Application

- [x] 3.1 Implement applyPresentationSettings function
- [x] 3.2 Apply editor settings (fontSize, minimap, scrollbar, matchBrackets)
- [x] 3.3 Apply workbench settings (statusBar, activityBar visibility)
- [x] 3.4 Apply window settings (zoomLevel)
- [x] 3.5 Execute closeSidebar command

## 4. Settings Restoration

- [x] 4.1 Implement restoreOriginalSettings function
- [x] 4.2 Restore each setting from stored values
- [x] 4.3 Handle restoration errors gracefully (continue on failure)
- [x] 4.4 Clear state after successful restoration

## 5. Theme-Aware Colors

- [x] 5.1 Implement getThemeColors function to detect dark/light theme
- [x] 5.2 Implement applyPresentationColors function for colorCustomizations
- [x] 5.3 Apply colors to editor, sidebar, activityBar, panel, terminal backgrounds
- [x] 5.4 Store original colorCustomizations for restoration
- [x] 5.5 Register onDidChangeActiveColorTheme listener to update colors

## 6. Status Bar Indicator

- [x] 6.1 Create status bar item with presentation mode icon
- [x] 6.2 Register click handler to toggle presentation mode
- [x] 6.3 Show indicator when presentation mode is active
- [x] 6.4 Hide indicator when presentation mode is inactive

## 7. Toggle Command

- [x] 7.1 Implement togglePresentationMode function
- [x] 7.2 Check current state and call activate or deactivate
- [x] 7.3 Update status bar indicator after toggle

## 8. Extension Integration

- [x] 8.1 Register calliope.togglePresentationMode command in extension.ts
- [x] 8.2 Add command to package.json contributes
- [x] 8.3 Initialize presentation mode state check on activation
- [x] 8.4 Implement orphaned state detection and cleanup
- [x] 8.5 Dispose status bar item and listeners on deactivation

## 9. Testing

- [x] 9.1 Test activation applies all settings correctly
- [x] 9.2 Test deactivation restores original settings
- [x] 9.3 Test theme switching updates colors
- [x] 9.4 Test status bar indicator visibility and click
- [x] 9.5 Test orphaned state restoration on startup
