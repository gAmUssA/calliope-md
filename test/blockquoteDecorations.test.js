/* eslint-disable @typescript-eslint/no-var-requires */
const mock = require('mock-require');
const assert = require('assert').strict;

// Rendered blockquotes hide "> " outright — the bar in the margin carries the
// meaning. Only the line the caret is on falls back to visible markup, so the
// rest of a multi-paragraph quote keeps rendering while you type in it.

function makeVscodeMock() {
  function Range(a, b, c, d) {
    this.start = { line: a, character: b };
    this.end = { line: c, character: d };
  }
  return {
    window: { createTextEditorDecorationType: () => ({ dispose() {} }) },
    Range,
    Position: function Position(line, character) { this.line = line; this.character = character; },
    ThemeColor: function ThemeColor(id) { this.id = id; },
  };
}

function loadBlockquotes() {
  Object.keys(require.cache).forEach((key) => {
    if (key.includes('out/decorations') || key.includes('out\\decorations')) delete require.cache[key];
  });
  mock('vscode', makeVscodeMock());
  return require('../out/decorations/blockquotes');
}

const { parseMarkdown } = require('../out/parser/markdownParser');

// A minimal stand-in for TextEditor: the decoration layer only reads the
// document's lines and the caret positions.
function editorFor(text, cursorLines = []) {
  const lines = text.split('\n');
  return {
    document: {
      lineCount: lines.length,
      lineAt: (n) => ({ text: lines[n] }),
      getText: (range) => lines[range.start.line].slice(range.start.character, range.end.character),
    },
    selections: cursorLines.map((line) => ({ active: { line, character: 0 } })),
  };
}

function decorate(text, cursorLines, italic) {
  const mod = loadBlockquotes();
  const parsed = parseMarkdown(text);
  return mod.createBlockquoteDecorations(parsed.blockquotes, editorFor(text, cursorLines), italic);
}

const QUOTE = [
  'intro',
  '',
  '> first line',
  '>',
  '> second line',
  '',
  'outro',
].join('\n');

describe('blockquote decorations', () => {
  it('parses the quote as one block spanning its blank quoted line', () => {
    const parsed = parseMarkdown(QUOTE);
    assert.equal(parsed.blockquotes.length, 1);
    assert.equal(parsed.blockquotes[0].markerRanges.length, 3);
  });

  it('swallows the space after the marker so text is not shoved into the bar', () => {
    const parsed = parseMarkdown(QUOTE);
    const [first, blank] = parsed.blockquotes[0].markerRanges;
    // "> " is two columns wide; a bare ">" is one.
    assert.equal(first.end.column - first.start.column, 2);
    assert.equal(blank.end.column - blank.start.column, 1);
  });

  it('hides every marker when the caret is elsewhere', () => {
    const decos = decorate(QUOTE, [0]);
    assert.equal(decos.syntaxHidden.length, 3);
    assert.equal(decos.blockquoteIndent.length, 3);
    assert.equal(decos.blockquoteMarkerDim.length, 0);
  });

  it('shows the marker only on the caret line, not the whole block', () => {
    const decos = decorate(QUOTE, [2]);
    assert.equal(decos.blockquoteMarkerDim.length, 1);
    assert.equal(decos.blockquoteMarkerDim[0].range.start.line, 2);
    assert.equal(decos.syntaxHidden.length, 2);
    assert.deepEqual(decos.syntaxHidden.map((d) => d.range.start.line), [3, 4]);
  });

  it('pairs an indent with every hidden marker so columns stay put', () => {
    const decos = decorate(QUOTE, [4]);
    assert.deepEqual(
      decos.blockquoteIndent.map((d) => d.range.start.line),
      decos.syntaxHidden.map((d) => d.range.start.line)
    );
  });

  it('draws the bar across the whole block, blank quoted lines included', () => {
    const decos = decorate(QUOTE, []);
    assert.equal(decos.blockquoteBorder.length, 1);
    assert.equal(decos.blockquoteBorder[0].range.start.line, 2);
    assert.equal(decos.blockquoteBorder[0].range.end.line, 4);
  });

  it('handles a quote that ends the document without a trailing newline', () => {
    const decos = decorate('> only line', []);
    assert.equal(decos.blockquoteBorder.length, 1);
    assert.equal(decos.syntaxHidden.length, 1);
  });

  it('leaves documents without quotes undecorated', () => {
    const decos = decorate('just a paragraph\n', []);
    assert.deepEqual(decos.blockquoteBorder, []);
    assert.deepEqual(decos.syntaxHidden, []);
  });

  it('italicises the quote, and only when asked to', () => {
    assert.equal(decorate(QUOTE, [], true).blockquoteItalic.length, 1);
    assert.equal(decorate(QUOTE, [], false).blockquoteItalic.length, 0);
  });

  describe('nested quotes', () => {
    const NESTED = ['> Outer.', '>', '> > Inner.'].join('\n');

    it('hides the whole marker run, not just the outer marker', () => {
      const decos = decorate(NESTED, [], true);
      const inner = decos.syntaxHidden.find((d) => d.range.start.line === 2);
      assert.equal(inner.range.end.character, 4); // "> > " is four columns
    });

    it('decorates each line once even though quotes overlap', () => {
      const decos = decorate(NESTED, [], true);
      const lines = decos.syntaxHidden.map((d) => d.range.start.line);
      assert.deepEqual(lines, [...new Set(lines)]);
      assert.equal(decos.blockquoteIndent.length, lines.length);
    });

    it('steps the indent in one level per nesting level', () => {
      const decos = decorate(NESTED, [], true);
      const margins = decos.blockquoteIndent.map((d) => d.renderOptions.before.margin);
      assert.ok(margins[0].endsWith('0em'), margins[0]);
      assert.ok(margins[2].endsWith('1.2em'), margins[2]);
    });
  });
});
