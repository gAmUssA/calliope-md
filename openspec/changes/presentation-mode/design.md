## Context

Calliope is a VS Code extension for distraction-free Markdown writing. Users often present their markdown content or code during talks, demos, and screencasts. Currently, they must manually adjust multiple VS Code settings to create a clean presentation environment, then restore them afterward.

Other extensions (like "Presentation Mode" extensions) solve this by storing settings profiles. We will implement a similar approach integrated into Calliope.

## Goals / Non-Goals

**Goals:**
- Single command to toggle all presentation settings at once
- Automatic restoration of original settings when deactivated
- Theme-aware background colors (black for dark themes, white for light)
- Visual indicator showing presentation mode is active
- Settings persist if VS Code restarts while in presentation mode

**Non-Goals:**
- Custom keybinding configuration (use VS Code's keybinding system)
- Multiple presentation profiles
- Presentation timer or slide features
- Recording/streaming integration

## Decisions

### 1. Settings Storage Strategy

**Decision:** Use VS Code's `ExtensionContext.globalState` to store original settings before applying presentation mode.

**Rationale:**
- `globalState` persists across VS Code restarts
- Allows restoration even if VS Code crashes during presentation
- Alternative (workspaceState) would lose settings on workspace switch

**Stored data:**
```typescript
interface PresentationModeState {
  active: boolean;
  originalSettings: Record<string, unknown>;
}
```

### 2. Settings Modification Approach

**Decision:** Use `vscode.workspace.getConfiguration().update()` with `ConfigurationTarget.Global` for most settings, execute commands for UI actions.

**Settings to modify:**
| Setting | Presentation Value | Method |
|---------|-------------------|--------|
| `editor.fontSize` | 18 | config update |
| `editor.minimap.enabled` | false | config update |
| `editor.scrollbar.verticalScrollbarSize` | 0 | config update |
| `editor.matchBrackets` | "never" | config update |
| `editor.lineHighlightBackground` | transparent | colorCustomizations |
| `workbench.statusBar.visible` | false | config update |
| `workbench.activityBar.visible` | false | config update |
| `window.zoomLevel` | 2 | config update |
| Sidebar | closed | command: `workbench.action.closeSidebar` |

**Rationale:** Direct config updates are reliable and reversible. Commands needed for sidebar since there's no setting equivalent.

### 3. Theme-Aware Colors

**Decision:** Detect current theme kind (dark/light) and apply matching background colors via `workbench.colorCustomizations`.

**Implementation:**
```typescript
const themeKind = vscode.window.activeColorTheme.kind;
const bgColor = themeKind === vscode.ColorThemeKind.Dark ? '#000000' : '#ffffff';
```

**Color customizations applied:**
- `editor.background`
- `sideBar.background`
- `activityBar.background`
- `panel.background`
- `terminal.background`

### 4. Visual Indicator

**Decision:** Use VS Code status bar item to show presentation mode status.

**Rationale:**
- Status bar is standard location for mode indicators
- Can be clicked to toggle mode
- Shows even when status bar is hidden (we'll keep our item visible)

**Alternative considered:** Notification on toggle - rejected as too intrusive during presentations.

## Risks / Trade-offs

**[Risk] Settings conflict with user customizations**
→ Mitigation: Store and restore exact original values, not defaults. Test restoration thoroughly.

**[Risk] Theme changes during presentation mode**
→ Mitigation: Listen to `onDidChangeActiveColorTheme` and update colors if theme changes.

**[Risk] Extension deactivation before restoration**
→ Mitigation: Persist state in globalState; check and restore on extension activation.

**[Trade-off] Global vs Workspace settings**
→ Decision: Use Global to affect all workspaces during presentation. Users presenting typically want consistent experience.

**[Trade-off] Fixed vs Configurable presentation settings**
→ Decision: Start with fixed, well-tested defaults. Add configuration in future if requested.
