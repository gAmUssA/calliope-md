/* eslint-disable @typescript-eslint/no-var-requires */
const mock = require('mock-require');
const sinon = require('sinon');
const assert = require('assert').strict;

// A markdown document open in two editor groups. Editing through one group must
// re-decorate both: decorations are applied per editor and default to OpenOpen,
// so a group that never recomputes keeps ranges that grow over newly typed text.
// A stale syntaxHidden range is zero-width, so that text disappears in the group
// that was skipped.

const DOC_TEXT = ['# Heading', '', 'Some **bold** text.', '', '- [ ] a task', ''].join('\n');

function makeDocument(uriString) {
  const lines = DOC_TEXT.split('\n');
  return {
    languageId: 'markdown',
    version: 1,
    lineCount: lines.length,
    uri: { toString: () => uriString, fsPath: '/tmp/doc.md', scheme: 'file' },
    getText: () => DOC_TEXT,
    lineAt: (i) => ({ text: lines[typeof i === 'number' ? i : i.line] || '' }),
    positionAt: (offset) => ({ line: 0, character: offset }),
    offsetAt: () => 0,
  };
}

function makeEditor(document, name) {
  return {
    name,
    document,
    selection: { active: { line: 0, character: 0 }, isEmpty: true, start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
    selections: [{ active: { line: 0, character: 0 }, isEmpty: true, start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }],
    visibleRanges: [{ start: { line: 0, character: 0 }, end: { line: 5, character: 0 } }],
    setDecorations: sinon.stub(),
    edit: sinon.stub().resolves(true),
  };
}

function makeVscodeMock(state) {
  function Range(a, b, c, d) {
    if (typeof a === 'object') {
      this.start = a;
      this.end = b;
    } else {
      this.start = { line: a, character: b };
      this.end = { line: c, character: d };
    }
  }
  function Position(line, character) {
    this.line = line;
    this.character = character;
  }
  return {
    window: {
      get visibleTextEditors() { return state.visibleTextEditors; },
      get activeTextEditor() { return state.activeTextEditor; },
      createTextEditorDecorationType: () => ({ dispose() {} }),
      createOutputChannel: () => ({ appendLine() {}, debug() {}, info() {}, warn() {}, error() {}, dispose() {} }),
      createStatusBarItem: () => ({ text: '', tooltip: '', command: '', show() {}, hide() {}, dispose() {} }),
      showErrorMessage: sinon.stub(),
      showInformationMessage: sinon.stub().resolves(undefined),
      showWarningMessage: sinon.stub().resolves(undefined),
      activeColorTheme: { kind: 1 },
      onDidChangeTextEditorSelection: (cb) => { state.handlers.selection = cb; return { dispose() {} }; },
      onDidChangeActiveTextEditor: (cb) => { state.handlers.activeEditor = cb; return { dispose() {} }; },
      onDidChangeTextEditorVisibleRanges: (cb) => { state.handlers.visibleRanges = cb; return { dispose() {} }; },
      onDidChangeVisibleTextEditors: (cb) => { state.handlers.visibleEditors = cb; return { dispose() {} }; },
      onDidChangeActiveColorTheme: (cb) => { state.handlers.theme = cb; return { dispose() {} }; },
      registerWebviewViewProvider: () => ({ dispose() {} }),
    },
    workspace: {
      getConfiguration: () => ({ get: (_k, d) => d, update: sinon.stub().resolves() }),
      onDidChangeTextDocument: (cb) => { state.handlers.textChange = cb; return { dispose() {} }; },
      onDidCloseTextDocument: (cb) => { state.handlers.close = cb; return { dispose() {} }; },
      onDidOpenTextDocument: (cb) => { state.handlers.open = cb; return { dispose() {} }; },
      onDidChangeConfiguration: (cb) => { state.handlers.config = cb; return { dispose() {} }; },
      onWillSaveTextDocument: (cb) => { state.handlers.willSave = cb; return { dispose() {} }; },
      onDidSaveTextDocument: (cb) => { state.handlers.save = cb; return { dispose() {} }; },
      applyEdit: sinon.stub().resolves(true),
    },
    commands: {
      registerCommand: (name, cb) => { state.commands[name] = cb; return { dispose() {} }; },
      executeCommand: sinon.stub().resolves(),
    },
    languages: {
      registerHoverProvider: () => ({ dispose() {} }),
      registerDocumentLinkProvider: () => ({ dispose() {} }),
      registerCodeLensProvider: () => ({ dispose() {} }),

    },
    Range,
    Position,
    ThemeColor: function ThemeColor(id) { this.id = id; },
    MarkdownString: function MarkdownString() {
      this.value = '';
      this.isTrusted = false;
      this.supportHtml = false;
      this.appendMarkdown = () => this;
      this.appendText = () => this;
      this.appendCodeblock = () => this;
    },
    Uri: { file: (p) => ({ fsPath: p, toString: () => `file://${p}` }), parse: (u) => ({ toString: () => u }) },
    StatusBarAlignment: { Left: 1, Right: 2 },
    ConfigurationTarget: { Global: 1, Workspace: 2 },
    ColorThemeKind: { Light: 0, Dark: 1, HighContrast: 2 },
    TextEditorSelectionChangeKind: { Keyboard: 1, Mouse: 2, Command: 3 },
    DecorationRangeBehavior: { OpenOpen: 0, ClosedClosed: 1 },
    OverviewRulerLane: { Left: 1, Center: 2, Right: 4, Full: 7 },
    EventEmitter: function EventEmitter() {
      this.event = () => ({ dispose() {} });
      this.fire = () => {};
    },
    Disposable: { from: () => ({ dispose() {} }) },
  };
}

describe('text edits re-decorate every editor showing the document', () => {
  let clock;
  let state;
  let editorA;
  let editorB;
  let doc;

  beforeEach(() => {
    Object.keys(require.cache).forEach((key) => {
      if (key.includes('out/extension') || key.includes('out\\extension')) delete require.cache[key];
    });

    clock = sinon.useFakeTimers();
    doc = makeDocument('file:///tmp/doc.md');
    editorA = makeEditor(doc, 'groupA');
    editorB = makeEditor(doc, 'groupB');
    state = {
      visibleTextEditors: [editorA, editorB],
      activeTextEditor: editorA,
      handlers: {},
      commands: {},
    };

    mock('vscode', makeVscodeMock(state));
    const ext = require('../out/extension');
    ext.activate({
      subscriptions: [],
      globalState: { get: () => undefined, update: async () => {} },
      workspaceState: { get: () => undefined, update: async () => {} },
      extensionUri: { fsPath: '/tmp' },
    });

    // activate() schedules its own initial debounced update; let it fire so a
    // later clock.tick() cannot be mistaken for the change we are testing.
    clock.tick(200);
    editorA.setDecorations.resetHistory();
    editorB.setDecorations.resetHistory();
  });

  afterEach(() => {
    clock.restore();
    mock.stopAll();
    sinon.restore();
  });

  it('registers a text-change handler', () => {
    assert.equal(typeof state.handlers.textChange, 'function');
  });

  it('re-decorates the non-active editor too, not just the focused one', () => {
    state.handlers.textChange({ document: doc, contentChanges: [{}] });
    clock.tick(200);

    assert.ok(editorA.setDecorations.called, 'focused editor should be decorated');
    assert.ok(
      editorB.setDecorations.called,
      'the second group showing the same document must be decorated too — ' +
        'otherwise its stale zero-width syntaxHidden ranges swallow newly typed text'
    );
  });

  it('debounces per document rather than through one shared timer', () => {
    // Two scheduling calls for the same document collapse into one run.
    state.handlers.textChange({ document: doc, contentChanges: [{}] });
    state.handlers.textChange({ document: doc, contentChanges: [{}] });
    clock.tick(200);

    assert.ok(editorB.setDecorations.called, 'second editor still refreshed after a coalesced burst');
  });

  it('does not decorate editors showing a different document', () => {
    const otherDoc = makeDocument('file:///tmp/other.md');
    const editorC = makeEditor(otherDoc, 'groupC');
    state.visibleTextEditors = [editorA, editorB, editorC];

    state.handlers.textChange({ document: doc, contentChanges: [{}] });
    clock.tick(200);

    assert.ok(editorA.setDecorations.called);
    assert.ok(editorB.setDecorations.called);
    assert.equal(editorC.setDecorations.called, false, 'an unrelated document must not be touched');
  });

  it('ignores changes to non-markdown documents', () => {
    const plain = makeDocument('file:///tmp/notes.txt');
    plain.languageId = 'plaintext';

    state.handlers.textChange({ document: plain, contentChanges: [{}] });
    clock.tick(200);

    assert.equal(editorA.setDecorations.called, false);
    assert.equal(editorB.setDecorations.called, false);
  });

  it('drops a pending update when the document closes', () => {
    state.handlers.textChange({ document: doc, contentChanges: [{}] });
    state.handlers.close(doc);
    clock.tick(200);

    assert.equal(
      editorA.setDecorations.called,
      false,
      'a timer must not fire against editors for a closed document'
    );
  });
});
