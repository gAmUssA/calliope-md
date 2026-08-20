/* eslint-disable @typescript-eslint/no-var-requires */
const mock = require('mock-require');
const sinon = require('sinon');
const assert = require('assert').strict;

// Helper to load module with mocked vscode
function loadWithMockedVscode(vscodeMock) {
  Object.keys(require.cache).forEach(key => {
    if (key.includes('out/extension') || key.includes('out\\extension')) {
      delete require.cache[key];
    }
  });
  mock('vscode', vscodeMock);
  return require('../out/extension');
}

function createVscodeMock() {
  return {
    workspace: {
      getConfiguration: sinon.stub().returns({
        get: () => undefined,
        update: sinon.stub().resolves()
      })
    },
    commands: { executeCommand: sinon.stub().resolves() },
    window: {
      showErrorMessage: sinon.stub(),
      showInformationMessage: sinon.stub().resolves(undefined),
      activeColorTheme: { kind: 1 },
      createStatusBarItem: sinon.stub().returns({
        text: '', tooltip: '', command: '',
        show: sinon.stub(), dispose: sinon.stub()
      })
    },
    ConfigurationTarget: { Global: 1 },
    ColorThemeKind: { Dark: 1, HighContrast: 2 },
    StatusBarAlignment: { Right: 2 },
    ThemeColor: function ThemeColor(id) { this.id = id; },
    // The values VS Code actually uses for this enum
    TextEditorSelectionChangeKind: { Keyboard: 1, Mouse: 2, Command: 3 },
    Position: function Position(line, character) { this.line = line; this.character = character; },
    Range: function Range(start, end) { this.start = start; this.end = end; }
  };
}

// Minimal editor stub. `edit` runs its callback against a recording edit
// builder so tests can assert on the replacement text.
function createEditor(lineText, character, { isEmpty = true } = {}) {
  const replacements = [];
  return {
    replacements,
    document: {
      languageId: 'markdown',
      lineAt: () => ({ text: lineText })
    },
    selection: {
      isEmpty,
      active: { line: 0, character }
    },
    edit: sinon.stub().callsFake(cb => {
      cb({ replace: (range, text) => replacements.push({ range, text }) });
      return Promise.resolve(true);
    })
  };
}

describe('detectCheckboxClick selection kind guard', () => {
  let vscodeMock;
  let mod;

  beforeEach(() => {
    vscodeMock = createVscodeMock();
    mod = loadWithMockedVscode(vscodeMock);
  });

  afterEach(() => {
    mock.stopAll();
    sinon.restore();
  });

  const KIND = { Keyboard: 1, Mouse: 2, Command: 3 };

  it('does not toggle on keyboard cursor movement', () => {
    const editor = createEditor('- [ ] a task', 0);
    const result = mod.detectCheckboxClick(editor, KIND.Keyboard);

    assert.equal(result, false);
    assert.equal(editor.edit.called, false, 'arrow keys must not edit the document');
  });

  it('does not toggle on command-driven selection changes', () => {
    const editor = createEditor('- [ ] a task', 3);
    assert.equal(mod.detectCheckboxClick(editor, KIND.Command), false);
    assert.equal(editor.edit.called, false);
  });

  it('does not toggle when the kind is undefined', () => {
    const editor = createEditor('- [ ] a task', 3);
    assert.equal(mod.detectCheckboxClick(editor, undefined), false);
    assert.equal(editor.edit.called, false);
  });

  it('does not toggle for a caret restored inside an indented checkbox span', () => {
    // Nested items have a wider leading span, so reopening a file with the
    // caret parked there used to flip the box.
    const editor = createEditor('    - [ ] nested task', 9);
    assert.equal(mod.detectCheckboxClick(editor, KIND.Keyboard), false);
    assert.equal(editor.edit.called, false);
  });

  it('still toggles an unchecked box on a mouse click', () => {
    const editor = createEditor('- [ ] a task', 3);
    const result = mod.detectCheckboxClick(editor, KIND.Mouse);

    assert.equal(result, true);
    assert.equal(editor.edit.calledOnce, true);
    assert.equal(editor.replacements.length, 1);
    assert.equal(editor.replacements[0].text, '[x]');
  });

  it('still toggles a checked box back on a mouse click', () => {
    const editor = createEditor('- [x] a task', 3);
    const result = mod.detectCheckboxClick(editor, KIND.Mouse);

    assert.equal(result, true);
    assert.equal(editor.replacements[0].text, '[ ]');
  });

  it('ignores a mouse drag that lands on a checkbox', () => {
    const editor = createEditor('- [ ] a task', 3, { isEmpty: false });
    assert.equal(mod.detectCheckboxClick(editor, KIND.Mouse), false);
    assert.equal(editor.edit.called, false);
  });

  it('ignores a mouse click past the checkbox span', () => {
    const editor = createEditor('- [ ] a task', 30);
    assert.equal(mod.detectCheckboxClick(editor, KIND.Mouse), false);
    assert.equal(editor.edit.called, false);
  });
});

describe('detectMermaidDiagramClick selection kind guard', () => {
  let mod;

  beforeEach(() => {
    mod = loadWithMockedVscode(createVscodeMock());
  });

  afterEach(() => {
    mock.stopAll();
    sinon.restore();
  });

  it('does not hijack the cursor on keyboard navigation across a fence', () => {
    const editor = createEditor('```mermaid', 0);
    const before = editor.selection;

    assert.equal(mod.detectMermaidDiagramClick(editor, 1 /* Keyboard */), false);
    assert.equal(editor.selection, before, 'selection must be left alone');
  });
});
