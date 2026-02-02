import * as vscode from 'vscode';

// State interface for presentation mode
export interface PresentationModeState {
  active: boolean;
  originalSettings: Record<string, unknown>;
}

// Settings to apply in presentation mode
const PRESENTATION_SETTINGS: Record<string, unknown> = {
  'editor.fontSize': 18,
  'editor.minimap.enabled': false,
  'editor.scrollbar.verticalScrollbarSize': 0,
  'editor.matchBrackets': 'never',
  'editor.lineNumbers': 'off',
  'workbench.statusBar.visible': false,
  'workbench.activityBar.visible': false,
  'window.zoomLevel': 2,
};

// Color customization keys for presentation mode
const COLOR_KEYS = [
  'editor.background',
  'editor.lineHighlightBackground',
  'editor.lineHighlightBorder',
  'sideBar.background',
  'activityBar.background',
  'panel.background',
  'terminal.background',
];

const STATE_KEY = 'calliope.presentationMode';

let extensionContext: vscode.ExtensionContext;
let statusBarItem: vscode.StatusBarItem;
let themeChangeDisposable: vscode.Disposable | undefined;

// State management
function getState(): PresentationModeState | undefined {
  return extensionContext.globalState.get<PresentationModeState>(STATE_KEY);
}

async function setState(state: PresentationModeState): Promise<void> {
  await extensionContext.globalState.update(STATE_KEY, state);
}

async function clearState(): Promise<void> {
  await extensionContext.globalState.update(STATE_KEY, undefined);
}

function captureOriginalSettings(): Record<string, unknown> {
  const original: Record<string, unknown> = {};

  for (const key of Object.keys(PRESENTATION_SETTINGS)) {
    // Split key to get section and setting name
    const [section, ...rest] = key.split('.');
    const settingName = rest.join('.');
    const sectionConfig = vscode.workspace.getConfiguration(section);
    original[key] = sectionConfig.get(settingName);
  }

  // Capture color customizations
  const workbenchConfig = vscode.workspace.getConfiguration('workbench');
  const colorCustomizations = workbenchConfig.get<Record<string, unknown>>('colorCustomizations') || {};
  original['workbench.colorCustomizations'] = { ...colorCustomizations };

  return original;
}

// Theme detection
function getThemeColors(): { bg: string; lineHighlight: string } {
  const themeKind = vscode.window.activeColorTheme.kind;
  const isDark = themeKind === vscode.ColorThemeKind.Dark || themeKind === vscode.ColorThemeKind.HighContrast;

  return {
    bg: isDark ? '#000000' : '#ffffff',
    lineHighlight: isDark ? '#00000000' : '#ffffff00',
  };
}

async function applyPresentationColors(): Promise<void> {
  const colors = getThemeColors();
  const config = vscode.workspace.getConfiguration();
  const currentCustomizations = config.get<Record<string, unknown>>('workbench.colorCustomizations') || {};

  const newCustomizations: Record<string, unknown> = {
    ...currentCustomizations,
    'editor.background': colors.bg,
    'editor.lineHighlightBackground': colors.lineHighlight,
    'editor.lineHighlightBorder': colors.lineHighlight,
    'sideBar.background': colors.bg,
    'activityBar.background': colors.bg,
    'panel.background': colors.bg,
    'terminal.background': colors.bg,
  };

  await config.update('workbench.colorCustomizations', newCustomizations, vscode.ConfigurationTarget.Global);
}

async function restoreOriginalColors(originalCustomizations: Record<string, unknown>): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  await config.update('workbench.colorCustomizations', originalCustomizations, vscode.ConfigurationTarget.Global);
}

// Settings application
async function applyPresentationSettings(): Promise<void> {
  for (const [key, value] of Object.entries(PRESENTATION_SETTINGS)) {
    try {
      const [section, ...rest] = key.split('.');
      const settingName = rest.join('.');
      await vscode.workspace.getConfiguration(section).update(settingName, value, vscode.ConfigurationTarget.Global);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`Failed to apply setting ${key}: ${msg}`);
    }
  }

  // Apply theme-aware colors
  await applyPresentationColors();

  // Close sidebar
  try {
    await vscode.commands.executeCommand('workbench.action.closeSidebar');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`Failed to close sidebar: ${msg}`);
  }

  // Close panel (terminal, output, etc.)
  try {
    await vscode.commands.executeCommand('workbench.action.closePanel');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`Failed to close panel: ${msg}`);
  }
}

async function restoreOriginalSettings(originalSettings: Record<string, unknown>): Promise<void> {
  const errors: string[] = [];

  for (const [key, value] of Object.entries(originalSettings)) {
    if (key === 'workbench.colorCustomizations') {
      continue; // Handle separately
    }

    try {
      const [section, ...rest] = key.split('.');
      const settingName = rest.join('.');
      await vscode.workspace.getConfiguration(section).update(settingName, value, vscode.ConfigurationTarget.Global);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to restore ${key}: ${msg}`);
    }
  }

  // Restore color customizations
  try {
    const originalColors = originalSettings['workbench.colorCustomizations'] as Record<string, unknown> || {};
    await restoreOriginalColors(originalColors);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Failed to restore color customizations: ${msg}`);
  }

  if (errors.length > 0) {
    vscode.window.showErrorMessage(`Some settings could not be restored: ${errors.join(', ')}`);
  }
}

// Status bar indicator
function createStatusBarItem(): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.command = 'calliope.togglePresentationMode';
  item.show();
  return item;
}

function updateStatusBarState(active: boolean): void {
  if (active) {
    statusBarItem.text = '$(screen-full) Presenting';
    statusBarItem.tooltip = 'Click to exit presentation mode';
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
  } else {
    statusBarItem.text = '$(screen-normal)';
    statusBarItem.tooltip = 'Click to enter presentation mode';
    statusBarItem.backgroundColor = undefined;
  }
}

// Main toggle function
export async function togglePresentationMode(): Promise<void> {
  try {
    const state = getState();

    if (state?.active) {
      // Deactivate
      await restoreOriginalSettings(state.originalSettings);
      await clearState();
      updateStatusBarState(false);

      // Dispose theme listener
      if (themeChangeDisposable) {
        themeChangeDisposable.dispose();
        themeChangeDisposable = undefined;
      }

      vscode.window.showInformationMessage('Presentation mode deactivated');
    } else {
      // Activate
      const originalSettings = captureOriginalSettings();
      await setState({ active: true, originalSettings });
      await applyPresentationSettings();
      updateStatusBarState(true);

      // Listen for theme changes
      themeChangeDisposable = vscode.window.onDidChangeActiveColorTheme(async () => {
        const currentState = getState();
        if (currentState?.active) {
          await applyPresentationColors();
        }
      });

      vscode.window.showInformationMessage('Presentation mode activated');
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Presentation mode error: ${error}`);
  }
}

// Check for orphaned state on startup
async function checkOrphanedState(): Promise<void> {
  const state = getState();
  if (state?.active) {
    // Restore original settings if we find an orphaned active state
    await restoreOriginalSettings(state.originalSettings);
    await clearState();
    vscode.window.showInformationMessage('Presentation mode state restored from previous session');
  }
}

// Initialization
export function initializePresentationMode(context: vscode.ExtensionContext): void {
  extensionContext = context;
  statusBarItem = createStatusBarItem();
  context.subscriptions.push(statusBarItem);

  // Check for orphaned state
  checkOrphanedState();

  // Update visibility based on current state
  const state = getState();
  updateStatusBarState(state?.active ?? false);
}

// Cleanup
export function disposePresentationMode(): void {
  if (themeChangeDisposable) {
    themeChangeDisposable.dispose();
  }
  statusBarItem?.dispose();
}
