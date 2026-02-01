## Why

When presenting code or markdown during talks, demos, or screencasts, VS Code's default UI is cluttered with distractions (sidebar, minimap, status bar, activity bar) and text is often too small for audiences. A presentation mode that toggles distraction-free settings with a single command makes live demos more professional and readable.

## What Changes

- Add `Calliope: Toggle Presentation Mode` command
- When activated, presentation mode:
  - Closes sidebar and hides activity bar
  - Increases editor font size for readability
  - Hides minimap, scrollbar, and status bar
  - Applies clean background colors (pure black for dark themes, pure white for light)
  - Increases window zoom level
  - Disables distracting editor features (bracket matching, line highlight)
- When deactivated, all settings restore to previous values
- Persist presentation mode state across VS Code restarts (optional)

## Capabilities

### New Capabilities
- `presentation-mode`: Toggle distraction-free presentation settings for live demos and screencasts

### Modified Capabilities
None

## Impact

- **Code**: New command registration in extension.ts, new presentation mode module
- **Settings**: May store original settings in workspace state for restoration
- **Dependencies**: Uses VS Code configuration API to modify workspace settings
- **User Experience**: Single command toggle, visual indicator when active
