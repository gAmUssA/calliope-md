/* eslint-disable @typescript-eslint/no-var-requires */
const mock = require('mock-require');
const sinon = require('sinon');
const assert = require('assert').strict;

// Helper to load module with mocked vscode
function loadWithMockedVscode(vscodeMock) {
  // Clear cache to allow re-mocking
  const modPath = require.resolve('../out/extension');
  // Also need to clear presentationMode which is bundled; we need to require in a way
  // that mock-require intercepts. Since esbuild bundles everything into extension.js,
  // we can't easily unit-test internal modules. Instead, we'll just require the extension
  // and assume it initializes correctly.
  // For a true unit test, we would need to refactor or use a different bundling strategy.
  // Let's try requiring the compiled output directly.
  Object.keys(require.cache).forEach(key => {
    if (key.includes('out/extension') || key.includes('presentationMode')) {
      delete require.cache[key];
    }
  });
  mock('vscode', vscodeMock);
  // Since it's bundled, we need to require the bundle
  const mod = require('../out/extension');
  return mod;
}

describe('presentationMode error notifications', () => {
  afterEach(() => {
    mock.stopAll();
    sinon.restore();
  });

  it('calls showErrorMessage when applying a setting fails', async () => {
    const showErrorStub = sinon.stub();
    const showInfoStub = sinon.stub();

    const workspaceMock = {
      getConfiguration: sinon.stub().returns({
        get: () => undefined,
        update: sinon.stub().rejects(new Error('update-failed'))
      })
    };

    const commandsMock = {
      executeCommand: sinon.stub().resolves()
    };

    const statusBarItemMock = {
      text: '',
      tooltip: '',
      command: '',
      backgroundColor: undefined,
      show: sinon.stub(),
      dispose: sinon.stub()
    };

    const windowMock = {
      showErrorMessage: showErrorStub,
      showInformationMessage: showInfoStub,
      activeColorTheme: { kind: 1 },
      createStatusBarItem: sinon.stub().returns(statusBarItemMock),
      onDidChangeActiveColorTheme: sinon.stub().returns({ dispose: () => {} })
    };

    const globalState = {
      get: sinon.stub().returns(undefined),
      update: sinon.stub().resolves()
    };
    const contextMock = { globalState, subscriptions: [] };

    const vscodeMock = {
      workspace: workspaceMock,
      commands: commandsMock,
      window: windowMock,
      ConfigurationTarget: { Global: 1 },
      ColorThemeKind: { Dark: 1, HighContrast: 2 },
      StatusBarAlignment: { Right: 2 },
      ThemeColor: function ThemeColor(id) { this.id = id; }
    };

    const mod = loadWithMockedVscode(vscodeMock);
    mod.initializePresentationMode(contextMock);
    await mod.togglePresentationMode();

    assert(showErrorStub.called, 'showErrorMessage should be called on setting update failure');
    const calledWith = showErrorStub.getCall(0).args[0];
    assert(calledWith.includes('Failed to apply setting'), `message should indicate failed setting, got: ${calledWith}`);
  });

  it('aggregates restore failures into a single notification', async () => {
    const showErrorStub = sinon.stub();
    const showInfoStub = sinon.stub();

    const workspaceMock = {
      getConfiguration: sinon.stub().returns({
        get: () => ({}),
        update: sinon.stub().rejects(new Error('restore-failed'))
      })
    };

    const commandsMock = {
      executeCommand: sinon.stub().resolves()
    };

    const statusBarItemMock = {
      text: '',
      tooltip: '',
      command: '',
      backgroundColor: undefined,
      show: sinon.stub(),
      dispose: sinon.stub()
    };

    const windowMock = {
      showErrorMessage: showErrorStub,
      showInformationMessage: showInfoStub,
      showWarningMessage: sinon.stub(),
      activeColorTheme: { kind: 1 },
      createStatusBarItem: sinon.stub().returns(statusBarItemMock),
      onDidChangeActiveColorTheme: sinon.stub().returns({ dispose: () => {} })
    };

    const originalSettings = {
      'editor.fontSize': 14,
      'editor.minimap.enabled': true,
      'workbench.colorCustomizations': {}
    };

    const globalState = {
      get: sinon.stub().returns({ active: true, originalSettings }),
      update: sinon.stub().resolves()
    };
    const contextMock = { globalState, subscriptions: [] };

    const vscodeMock = {
      workspace: workspaceMock,
      commands: commandsMock,
      window: windowMock,
      ConfigurationTarget: { Global: 1 },
      ColorThemeKind: { Dark: 1, HighContrast: 2 },
      StatusBarAlignment: { Right: 2 },
      ThemeColor: function ThemeColor(id) { this.id = id; }
    };

    const mod = loadWithMockedVscode(vscodeMock);
    mod.initializePresentationMode(contextMock);

    // Call togglePresentationMode to trigger deactivation path which restores settings
    await mod.togglePresentationMode();

    assert(showErrorStub.called, 'showErrorMessage should be called on restore failures');
    const msg = showErrorStub.getCall(0).args[0];
    assert(
      msg.includes('Some settings could not be restored') || msg.includes('Failed to restore'),
      `aggregated message expected, got: ${msg}`
    );
  });
});
