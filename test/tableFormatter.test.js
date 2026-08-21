/* eslint-disable @typescript-eslint/no-var-requires */
const mock = require('mock-require');
const assert = require('assert').strict;

// formatTablesInDocument pads cells so columns line up once pipes are hidden
// with opacity 0 (ADR-0014). It must only ever change whitespace.

function makeVscodeMock() {
  function Range(startLine, startChar, endLine, endChar) {
    this.start = { line: startLine, character: startChar };
    this.end = { line: endLine, character: endChar };
  }
  return {
    Range,
    Position: function Position(line, character) { this.line = line; this.character = character; },
    TextEdit: {
      replace: (range, newText) => ({ range, newText }),
    },
    window: { activeTextEditor: undefined, showInformationMessage: () => {} },
    workspace: { applyEdit: async () => true },
    WorkspaceEdit: function WorkspaceEdit() { this.replace = () => {}; },
  };
}

function loadFormatter() {
  Object.keys(require.cache).forEach((key) => {
    if (key.includes('out/formatters') || key.includes('out\\formatters')) delete require.cache[key];
  });
  mock('vscode', makeVscodeMock());
  return require('../out/formatters/tableFormatter');
}

let docCounter = 0;
function makeDocument(text) {
  const lines = text.split('\n');
  docCounter += 1;
  const uri = `file:///tmp/table-${docCounter}.md`;
  return {
    languageId: 'markdown',
    version: 1,
    lineCount: lines.length,
    uri: { toString: () => uri, fsPath: `/tmp/table-${docCounter}.md`, scheme: 'file' },
    getText: () => text,
    lineAt: (i) => ({ text: lines[typeof i === 'number' ? i : i.line] ?? '' }),
  };
}

/** Applies the returned edits to the source so the result can be asserted on. */
function applyEdits(text, edits) {
  const lines = text.split('\n');
  for (const edit of edits) {
    lines[edit.range.start.line] = edit.newText;
  }
  return lines.join('\n');
}

function format(text) {
  const mod = loadFormatter();
  const doc = makeDocument(text);
  const edits = mod.formatTablesInDocument(doc);
  return { edits, result: applyEdits(text, edits) };
}

describe('formatTablesInDocument', () => {
  after(() => mock.stopAll());

  it('pads cells so every row is the same width', () => {
    const src = ['| a | bbbb |', '| --- | --- |', '| cc | d |'].join('\n');
    const { result } = format(src);
    const widths = result.split('\n').map((l) => l.length);

    assert.equal(new Set(widths).size, 1, `rows should share one width, got ${widths.join(',')}`);
  });

  it('preserves every cell value exactly', () => {
    const src = ['| Name | Qty |', '| --- | --- |', '| Widget | 12 |'].join('\n');
    const { result } = format(src);

    const cellsOf = (line) => line.split('|').slice(1, -1).map((c) => c.trim());
    assert.deepEqual(cellsOf(result.split('\n')[0]), ['Name', 'Qty']);
    assert.deepEqual(cellsOf(result.split('\n')[2]), ['Widget', '12']);
  });

  it('only changes whitespace', () => {
    const src = ['| Name | Qty |', '| --- | --- |', '| Widget | 12 |'].join('\n');
    const { result } = format(src);

    const strip = (s) => s.replace(/[\s-]/g, '');
    assert.equal(strip(result), strip(src), 'non-whitespace content must be untouched');
  });

  it('produces no edits for a table it has already formatted', () => {
    // The formatter pads separators to the column width (|-----|-----|), so the
    // fixture has to be its own output rather than hand-written `| --- |`.
    const formatted = format(['| a | b |', '| --- | --- |', '| c | d |'].join('\n')).result;
    const second = format(formatted);

    assert.equal(second.edits.length, 0, `re-formatting should be a no-op, got:\n${formatted}`);
    assert.equal(second.result, formatted);
  });

  it('is idempotent', () => {
    const src = ['| a | bbbb |', '| --- | --- |', '| cc | d |'].join('\n');
    const once = format(src).result;
    const twice = format(once).result;

    assert.equal(twice, once, 'formatting twice must equal formatting once');
  });

  it('widens narrow columns to fit the longest cell', () => {
    const src = ['| id | description |', '| --- | --- |', '| 1 | a much longer value |'].join('\n');
    const { result } = format(src);

    assert.ok(
      result.split('\n')[0].includes('id'),
      'header retained'
    );
    const widths = result.split('\n').map((l) => l.length);
    assert.equal(new Set(widths).size, 1);
  });

  it('keeps the separator row a separator', () => {
    const src = ['| a | b |', '| --- | --- |', '| c | d |'].join('\n');
    const { result } = format(src);
    const sep = result.split('\n')[1];

    assert.match(sep, /^\|[-:| ]+\|$/, `separator row malformed: ${sep}`);
    assert.ok(!/[a-z]/i.test(sep), 'separator must not pick up content');
  });

  it('enforces a minimum column width of three so --- still fits', () => {
    const src = ['| a | b |', '| --- | --- |', '| c | d |'].join('\n');
    const { result } = format(src);
    const sep = result.split('\n')[1];

    sep
      .split('|')
      .slice(1, -1)
      .forEach((cell) => assert.ok(cell.replace(/[^-]/g, '').length >= 3, `dashes too few in "${cell}"`));
  });

  it('leaves a document with no tables alone', () => {
    const { edits } = format('# Heading\n\nJust prose, no tables here.\n');
    assert.deepEqual(edits, []);
  });

  it('formats multiple tables in one document', () => {
    const src = [
      '| a | bbbb |',
      '| --- | --- |',
      '| cc | d |',
      '',
      'Text between.',
      '',
      '| x | yyyy |',
      '| --- | --- |',
      '| zz | w |',
    ].join('\n');
    const { result } = format(src);
    const lines = result.split('\n');

    assert.equal(new Set([lines[0].length, lines[1].length, lines[2].length]).size, 1, 'first table aligned');
    assert.equal(new Set([lines[6].length, lines[7].length, lines[8].length]).size, 1, 'second table aligned');
    assert.equal(lines[4], 'Text between.', 'prose between tables untouched');
  });

  it('handles a single-column table', () => {
    const src = ['| header |', '| --- |', '| v |'].join('\n');
    const { result } = format(src);
    const widths = result.split('\n').map((l) => l.length);

    assert.equal(new Set(widths).size, 1);
  });

  describe('alignment', () => {
    const cellsOf = (line) => line.split('|').slice(1, -1);

    it('right-aligns content when the separator says so', () => {
      const src = ['| n |', '| ---: |', '| 1 |'].join('\n');
      const body = cellsOf(format(src).result.split('\n')[2])[0];

      assert.match(body, /\s1\s?$/, `expected right-aligned, got "${body}"`);
      assert.ok(body.startsWith(' '), 'padding should be on the left for right alignment');
    });

    it('centres content when the separator says so', () => {
      const src = ['| n |', '| :---: |', '| x |'].join('\n');
      const body = cellsOf(format(src).result.split('\n')[2])[0];
      const trimmedStart = body.length - body.trimStart().length;
      const trimmedEnd = body.length - body.trimEnd().length;

      assert.ok(trimmedStart > 0 && trimmedEnd > 0, `expected padding on both sides, got "${body}"`);
      assert.ok(Math.abs(trimmedStart - trimmedEnd) <= 1, `padding should be even, got "${body}"`);
    });

    it('carries alignment markers through to the separator row', () => {
      const src = ['| a | b | c |', '| :--- | :---: | ---: |', '| 1 | 2 | 3 |'].join('\n');
      const sep = format(src).result.split('\n')[1];

      assert.ok(sep.includes(':'), `alignment markers must survive formatting, got "${sep}"`);
    });

    it('keeps rows aligned regardless of alignment markers', () => {
      const src = ['| a | bbbb | c |', '| :--- | :---: | ---: |', '| dddd | e | ffff |'].join('\n');
      const widths = format(src).result.split('\n').map((l) => l.length);

      assert.equal(new Set(widths).size, 1, `rows should share one width, got ${widths.join(',')}`);
    });
  });

  it('emits one edit per line it actually changes', () => {
    const src = ['| a   | b   |', '| --- | --- |', '| ccccc | d |'].join('\n');
    const { edits } = format(src);

    const changedLines = new Set(edits.map((e) => e.range.start.line));
    assert.equal(changedLines.size, edits.length, 'no duplicate edits for one line');
    edits.forEach((e) => assert.equal(e.range.start.character, 0, 'edits replace whole lines'));
  });
});
