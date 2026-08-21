/* eslint-disable @typescript-eslint/no-var-requires */
const mock = require('mock-require');
const sinon = require('sinon');
const assert = require('assert').strict;
const fs = require('fs');
const os = require('os');
const path = require('path');

// createImageDecorations must not upscale small images and must say something
// when a local file is missing, instead of rendering nothing (which is
// indistinguishable from the feature being switched off).

function makeVscodeMock() {
  function Range(a, b, c, d) {
    this.start = { line: a, character: b };
    this.end = { line: c, character: d };
  }
  return {
    window: { createTextEditorDecorationType: () => ({ dispose() {} }) },
    workspace: { getConfiguration: () => ({ get: (_k, d) => d }) },
    Range,
    Position: function Position(line, character) { this.line = line; this.character = character; },
    ThemeColor: function ThemeColor(id) { this.id = id; },
    MarkdownString: function MarkdownString(value) {
      this.value = value || '';
      this.appendMarkdown = (v) => { this.value += v; return this; };
    },
    Uri: {
      file: (p) => ({ scheme: 'file', fsPath: p, toString: () => `file://${p}` }),
      parse: (u) => ({ scheme: u.split(':')[0], fsPath: u, toString: () => u }),
    },
    Hover: function Hover(contents, range) { this.contents = contents; this.range = range; },
  };
}

function loadImages() {
  Object.keys(require.cache).forEach((key) => {
    if (key.includes('out/decorations') || key.includes('out\\decorations')) delete require.cache[key];
  });
  mock('vscode', makeVscodeMock());
  return require('../out/decorations/images');
}

// The parser reports 1-indexed positions; the decoration layer subtracts 1.
function imageElement(url, alt = 'alt') {
  return {
    url,
    alt,
    syntaxRange: { start: { line: 1, column: 1 }, end: { line: 1, column: 20 } },
    range: { start: { line: 1, column: 1 }, end: { line: 1, column: 20 } },
  };
}

function editorFor(docPath) {
  return { document: { uri: { scheme: 'file', fsPath: docPath, toString: () => `file://${docPath}` } } };
}

describe('image preview decorations', () => {
  let mod;
  let tmpDir;
  let existingFile;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'calliope-img-'));
    existingFile = path.join(tmpDir, 'real.png');
    fs.writeFileSync(existingFile, 'not really a png, but it exists');
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    mock.stopAll();
    sinon.restore();
  });

  beforeEach(() => {
    mod = loadImages();
  });

  it('does not force a fixed width, which would upscale small images', () => {
    const out = mod.createImageDecorations([imageElement(existingFile)], editorFor(path.join(tmpDir, 'doc.md')));
    const after = out.imagePreview[0].renderOptions.after;

    assert.equal(after.width, undefined, 'a fixed width upscales images narrower than the cap');
  });

  it('constrains preview width with a maximum instead', () => {
    const out = mod.createImageDecorations([imageElement(existingFile)], editorFor(path.join(tmpDir, 'doc.md')));
    const after = out.imagePreview[0].renderOptions.after;

    assert.match(after.textDecoration || '', /max-width:\s*200px/);
    assert.equal(after.height, 'auto', 'aspect ratio must be preserved');
  });

  it('renders the image when the local file exists', () => {
    const out = mod.createImageDecorations([imageElement(existingFile)], editorFor(path.join(tmpDir, 'doc.md')));
    const after = out.imagePreview[0].renderOptions.after;

    assert.ok(after.contentIconPath, 'an existing file should produce a preview');
    assert.equal(after.contentText, undefined);
  });

  it('shows a placeholder when a local file is missing', () => {
    const missing = path.join(tmpDir, 'nope.png');
    const out = mod.createImageDecorations([imageElement(missing)], editorFor(path.join(tmpDir, 'doc.md')));

    assert.equal(out.imagePreview.length, 1, 'a missing image must still produce a decoration');
    const after = out.imagePreview[0].renderOptions.after;
    assert.ok(after.contentText && after.contentText.length > 0, 'placeholder text expected');
    assert.equal(after.contentIconPath, undefined, 'must not try to render a file that is not there');
  });

  it('resolves relative paths against the document directory', () => {
    const out = mod.createImageDecorations([imageElement('real.png')], editorFor(path.join(tmpDir, 'doc.md')));
    const after = out.imagePreview[0].renderOptions.after;

    assert.ok(after.contentIconPath, 'relative path next to the document should resolve and exist');
  });

  it('flags a relative path that does not resolve to a real file', () => {
    const out = mod.createImageDecorations([imageElement('missing/elsewhere.png')], editorFor(path.join(tmpDir, 'doc.md')));
    const after = out.imagePreview[0].renderOptions.after;

    assert.ok(after.contentText, 'unresolvable relative path should show the placeholder');
  });

  it('still attempts remote URLs, which cannot be checked synchronously', () => {
    const out = mod.createImageDecorations([imageElement('https://example.com/a.png')], editorFor(path.join(tmpDir, 'doc.md')));
    const after = out.imagePreview[0].renderOptions.after;

    assert.ok(after.contentIconPath, 'remote images have no synchronous existence check, so they render');
    assert.equal(after.contentText, undefined);
  });

  it('keeps a hover on both previews and placeholders', () => {
    const out = mod.createImageDecorations(
      [imageElement(existingFile), imageElement(path.join(tmpDir, 'gone.png'))],
      editorFor(path.join(tmpDir, 'doc.md'))
    );

    assert.equal(out.imagePreview.length, 2);
    out.imagePreview.forEach((d) => assert.ok(d.hoverMessage, 'every image decoration keeps its hover'));
  });

  it('never hides image syntax', () => {
    const out = mod.createImageDecorations([imageElement(existingFile)], editorFor(path.join(tmpDir, 'doc.md')));

    assert.deepEqual(out.syntaxHidden, [], 'image syntax stays visible (ADR-0016)');
    assert.deepEqual(out.syntaxGhost, []);
  });
});
