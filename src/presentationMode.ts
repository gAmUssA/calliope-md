import * as vscode from 'vscode';

// State interface for presentation mode
export interface PresentationModeState {
  active: boolean;
  originalSettings: Record<string, unknown>;
}

// Settings to apply in presentation mode (UI chrome only — no color overrides)
const PRESENTATION_SETTINGS: Record<string, unknown> = {
  'editor.fontSize': 18,
  'editor.minimap.enabled': false,
  'editor.scrollbar.verticalScrollbarSize': 0,
  'editor.matchBrackets': 'never',
  'editor.lineNumbers': 'off',
  'workbench.statusBar.visible': false,
  'workbench.activityBar.location': 'hidden',
  'window.zoomLevel': 2,
};

const STATE_KEY = 'calliope.presentationMode';

let extensionContext: vscode.ExtensionContext;
let statusBarItem: vscode.StatusBarItem;

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
    const [section, ...rest] = key.split('.');
    const settingName = rest.join('.');
    const sectionConfig = vscode.workspace.getConfiguration(section);
    original[key] = sectionConfig.get(settingName);
  }

  // Capture window.title so we can prepend the presenting indicator
  original['window.title'] = vscode.workspace.getConfiguration('window').get<string>('title');

  return original;
}

const PRESENTING_PREFIX = '[PRESENTING] ';

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

  // Set window title indicator
  try {
    const currentTitle = vscode.workspace.getConfiguration('window').get<string>('title') || '';
    if (!currentTitle.startsWith(PRESENTING_PREFIX)) {
      await vscode.workspace.getConfiguration('window').update(
        'title', PRESENTING_PREFIX + currentTitle, vscode.ConfigurationTarget.Global
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`Failed to set window title: ${msg}`);
  }

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
    try {
      const [section, ...rest] = key.split('.');
      const settingName = rest.join('.');
      await vscode.workspace.getConfiguration(section).update(settingName, value, vscode.ConfigurationTarget.Global);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to restore ${key}: ${msg}`);
    }
  }

  if (errors.length > 0) {
    vscode.window.showErrorMessage(`Some settings could not be restored: ${errors.join(', ')}`);
  }
}

// Deactivation helper (shared by toggle, startup notification, and orphaned state recovery)
async function deactivatePresentationMode(originalSettings: Record<string, unknown>): Promise<void> {
  await restoreOriginalSettings(originalSettings);

  // Ensure window title prefix is removed even if original wasn't captured
  if (!('window.title' in originalSettings)) {
    const currentTitle = vscode.workspace.getConfiguration('window').get<string>('title') || '';
    if (currentTitle.startsWith(PRESENTING_PREFIX)) {
      await vscode.workspace.getConfiguration('window').update(
        'title', currentTitle.slice(PRESENTING_PREFIX.length) || undefined, vscode.ConfigurationTarget.Global
      );
    }
  }

  await clearState();
  updateStatusBarState(false);
  vscode.window.showInformationMessage('Presentation mode deactivated');
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
      await deactivatePresentationMode(state.originalSettings);
    } else {
      // Activate
      const originalSettings = captureOriginalSettings();
      await setState({ active: true, originalSettings });
      await applyPresentationSettings();
      updateStatusBarState(true);

      vscode.window.showInformationMessage('Presentation mode activated');
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Presentation mode error: ${error}`);
  }
}

// Color keys that the old version wrote into workbench.colorCustomizations.
// Used only for one-time cleanup migration.
const LEGACY_COLOR_KEYS = [
  'editor.background',
  'editor.lineHighlightBackground',
  'editor.lineHighlightBorder',
  'sideBar.background',
  'activityBar.background',
  'panel.background',
  'terminal.background',
];

// Remove color customization overrides left by older versions of presentation mode
async function cleanupLegacyColorOverrides(): Promise<void> {
  const config = vscode.workspace.getConfiguration('workbench');
  const colorCustomizations = config.get<Record<string, unknown>>('colorCustomizations');
  if (!colorCustomizations) {
    return;
  }

  const cleaned: Record<string, unknown> = {};
  let removedAny = false;
  for (const [key, value] of Object.entries(colorCustomizations)) {
    if (LEGACY_COLOR_KEYS.includes(key)) {
      removedAny = true;
    } else {
      cleaned[key] = value;
    }
  }

  if (removedAny) {
    await vscode.workspace.getConfiguration().update(
      'workbench.colorCustomizations',
      Object.keys(cleaned).length > 0 ? cleaned : undefined,
      vscode.ConfigurationTarget.Global
    );
  }
}

// Check for orphaned/active state on startup and show interactive notification
async function checkStartupState(): Promise<void> {
  // Always clean up legacy color overrides from older versions
  await cleanupLegacyColorOverrides();

  const state = getState();
  if (!state?.active) {
    return;
  }

  // Also clean up legacy colorCustomizations key from stored original settings
  const cleanedOriginal = { ...state.originalSettings };
  delete cleanedOriginal['workbench.colorCustomizations'];

  const action = await vscode.window.showInformationMessage(
    'Presentation Mode is active',
    'Deactivate',
    'Keep Current'
  );

  if (action === 'Deactivate') {
    await deactivatePresentationMode(cleanedOriginal);
  } else if (action === 'Keep Current') {
    await clearState();
  }
  // If dismissed (action is undefined), Presentation Mode remains active
}

// Initialization
export function initializePresentationMode(context: vscode.ExtensionContext): void {
  extensionContext = context;
  statusBarItem = createStatusBarItem();
  context.subscriptions.push(statusBarItem);

  // Update status bar based on current state
  const state = getState();
  updateStatusBarState(state?.active ?? false);

  // Check for active/orphaned state and show interactive notification
  checkStartupState();
}

// Cleanup
export function disposePresentationMode(): void {
  statusBarItem?.dispose();
}
