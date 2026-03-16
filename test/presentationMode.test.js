/* eslint-disable @typescript-eslint/no-var-requires */
const mock = require('mock-require');
const sinon = require('sinon');
const assert = require('assert').strict;

// Helper to load module with mocked vscode
function loadWithMockedVscode(vscodeMock) {
  Object.keys(require.cache).forEach(key => {
    if (key.includes('out/extension') || key.includes('presentationMode')) {
      delete require.cache[key];
    }
  });
  mock('vscode', vscodeMock);
  const mod = require('../out/extension');
  return mod;
}

function createVscodeMock(overrides = {}) {
  const statusBarItemMock = {
    text: '',
    tooltip: '',
    command: '',
    backgroundColor: undefined,
    show: sinon.stub(),
    dispose: sinon.stub()
  };

  const windowMock = {
    showErrorMessage: sinon.stub(),
    showInformationMessage: sinon.stub().resolves(undefined),
    activeColorTheme: { kind: 1 },
    createStatusBarItem: sinon.stub().returns(statusBarItemMock),
    ...overrides.window
  };

  const workspaceMock = {
    getConfiguration: sinon.stub().returns({
      get: () => undefined,
      update: sinon.stub().resolves()
    }),
    ...overrides.workspace
  };

  const commandsMock = {
    executeCommand: sinon.stub().resolves(),
    ...overrides.commands
  };

  const globalState = {
    get: sinon.stub().returns(undefined),
    update: sinon.stub().resolves(),
    ...overrides.globalState
  };

  return {
    vscodeMock: {
      workspace: workspaceMock,
      commands: commandsMock,
      window: windowMock,
      ConfigurationTarget: { Global: 1 },
      ColorThemeKind: { Dark: 1, HighContrast: 2 },
      StatusBarAlignment: { Right: 2 },
      ThemeColor: function ThemeColor(id) { this.id = id; }
    },
    contextMock: { globalState, subscriptions: [] },
    statusBarItemMock,
    windowMock,
    workspaceMock,
    globalState
  };
}

describe('presentationMode error notifications', () => {
  afterEach(() => {
    mock.stopAll();
    sinon.restore();
  });

  it('calls showErrorMessage when applying a setting fails', async () => {
    const { vscodeMock, contextMock, windowMock } = createVscodeMock({
      workspace: {
        getConfiguration: sinon.stub().returns({
          get: () => undefined,
          update: sinon.stub().rejects(new Error('update-failed'))
        })
      }
    });

    const mod = loadWithMockedVscode(vscodeMock);
    mod.initializePresentationMode(contextMock);
    await mod.togglePresentationMode();

    assert(windowMock.showErrorMessage.called, 'showErrorMessage should be called on setting update failure');
    const calledWith = windowMock.showErrorMessage.getCall(0).args[0];
    assert(calledWith.includes('Failed to apply setting'), `message should indicate failed setting, got: ${calledWith}`);
  });

  it('aggregates restore failures into a single notification', async () => {
    const originalSettings = {
      'editor.fontSize': 14,
      'editor.minimap.enabled': true,
    };

    const globalState = {
      get: sinon.stub().returns({ active: true, originalSettings }),
      update: sinon.stub().resolves()
    };

    const { vscodeMock, windowMock } = createVscodeMock({
      workspace: {
        getConfiguration: sinon.stub().returns({
          get: () => ({}),
          update: sinon.stub().rejects(new Error('restore-failed'))
        })
      },
      globalState
    });

    const contextMock = { globalState, subscriptions: [] };
    const mod = loadWithMockedVscode(vscodeMock);
    mod.initializePresentationMode(contextMock);
    await mod.togglePresentationMode();

    assert(windowMock.showErrorMessage.called, 'showErrorMessage should be called on restore failures');
    const msg = windowMock.showErrorMessage.getCall(0).args[0];
    assert(
      msg.includes('Some settings could not be restored') || msg.includes('Failed to restore'),
      `aggregated message expected, got: ${msg}`
    );
  });
});

describe('presentationMode startup notification', () => {
  afterEach(() => {
    mock.stopAll();
    sinon.restore();
  });

  it('shows notification with Deactivate button when active on startup', async () => {
    const originalSettings = { 'editor.fontSize': 14 };
    const globalState = {
      get: sinon.stub().returns({ active: true, originalSettings }),
      update: sinon.stub().resolves()
    };

    const showInfoStub = sinon.stub().resolves(undefined);
    const { vscodeMock } = createVscodeMock({
      window: { showInformationMessage: showInfoStub },
      globalState
    });

    const contextMock = { globalState, subscriptions: [] };
    const mod = loadWithMockedVscode(vscodeMock);
    mod.initializePresentationMode(contextMock);

    // Allow async checkStartupState to run
    await new Promise(resolve => setTimeout(resolve, 50));

    assert(showInfoStub.called, 'showInformationMessage should be called on startup');
    const callArgs = showInfoStub.getCall(0).args;
    assert(callArgs[0].includes('Presentation Mode is active'), `expected active message, got: ${callArgs[0]}`);
    assert(callArgs.includes('Deactivate'), 'should include Deactivate action');
    assert(callArgs.includes('Keep Current'), 'should include Keep Current action');
  });

  it('deactivates when user clicks Deactivate on startup notification', async () => {
    const originalSettings = { 'editor.fontSize': 14 };
    const globalState = {
      get: sinon.stub().returns({ active: true, originalSettings }),
      update: sinon.stub().resolves()
    };

    const showInfoStub = sinon.stub().resolves('Deactivate');
    const { vscodeMock, workspaceMock } = createVscodeMock({
      window: { showInformationMessage: showInfoStub },
      globalState
    });

    const contextMock = { globalState, subscriptions: [] };
    const mod = loadWithMockedVscode(vscodeMock);
    mod.initializePresentationMode(contextMock);

    await new Promise(resolve => setTimeout(resolve, 50));

    // Should have called update to clear state (undefined)
    const updateCalls = globalState.update.getCalls();
    const clearCall = updateCalls.find(c => c.args[1] === undefined);
    assert(clearCall, 'state should be cleared after Deactivate');
  });

  it('clears state without restoring settings when user clicks Keep Current', async () => {
    const originalSettings = { 'editor.fontSize': 14 };
    const globalState = {
      get: sinon.stub().returns({ active: true, originalSettings }),
      update: sinon.stub().resolves()
    };

    const updateStub = sinon.stub().resolves();
    const showInfoStub = sinon.stub().resolves('Keep Current');
    const { vscodeMock } = createVscodeMock({
      window: { showInformationMessage: showInfoStub },
      workspace: {
        getConfiguration: sinon.stub().returns({
          get: () => undefined,
          update: updateStub
        })
      },
      globalState
    });

    const contextMock = { globalState, subscriptions: [] };
    const mod = loadWithMockedVscode(vscodeMock);
    mod.initializePresentationMode(contextMock);

    await new Promise(resolve => setTimeout(resolve, 50));

    // State should be cleared
    const clearCall = globalState.update.getCalls().find(c => c.args[1] === undefined);
    assert(clearCall, 'state should be cleared after Keep Current');

    // Settings should NOT be restored (no workspace config update calls for restoring)
    assert(!updateStub.called, 'workspace settings should not be modified for Keep Current');
  });

  it('does not show notification when presentation mode is inactive', () => {
    const { vscodeMock, contextMock, windowMock } = createVscodeMock();

    const mod = loadWithMockedVscode(vscodeMock);
    mod.initializePresentationMode(contextMock);

    // showInformationMessage should not be called (no active state)
    assert(!windowMock.showInformationMessage.called, 'should not show notification when inactive');
  });
});

describe('presentationMode no theme listener', () => {
  afterEach(() => {
    mock.stopAll();
    sinon.restore();
  });

  it('does not register onDidChangeActiveColorTheme listener on activation', async () => {
    const onThemeChangeStub = sinon.stub().returns({ dispose: () => {} });
    const { vscodeMock, contextMock } = createVscodeMock({
      window: { onDidChangeActiveColorTheme: onThemeChangeStub }
    });

    const mod = loadWithMockedVscode(vscodeMock);
    mod.initializePresentationMode(contextMock);
    await mod.togglePresentationMode();

    assert(!onThemeChangeStub.called, 'should not register theme change listener');
  });

  it('does not modify workbench.colorCustomizations on activation', async () => {
    const updateStub = sinon.stub().resolves();
    const { vscodeMock, contextMock } = createVscodeMock({
      workspace: {
        getConfiguration: sinon.stub().returns({
          get: () => undefined,
          update: updateStub
        })
      }
    });

    const mod = loadWithMockedVscode(vscodeMock);
    mod.initializePresentationMode(contextMock);
    await mod.togglePresentationMode();

    const colorCalls = updateStub.getCalls().filter(c => {
      // Check if any call tried to update colorCustomizations
      return c.args[0] === 'colorCustomizations';
    });
    assert.equal(colorCalls.length, 0, 'should not update colorCustomizations');
  });
});
