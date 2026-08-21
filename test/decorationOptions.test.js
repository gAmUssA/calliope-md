/* eslint-disable @typescript-eslint/no-var-requires */
const mock = require('mock-require');
const assert = require('assert').strict;

// VS Code builds decoration CSS from a fixed set of properties. Anything
// outside these sets is silently dropped at runtime — the decoration still
// gets created, it just renders without the property. That failure mode is
// invisible without a type check, which is how borderLeft/borderBottom/
// fontSize shipped for several releases doing nothing at all.
//
// Keys mirror ThemableDecorationRenderOptions / DecorationRenderOptions in
// @types/vscode.
const DECORATION_KEYS = new Set([
  'backgroundColor', 'outline', 'outlineColor', 'outlineStyle', 'outlineWidth',
  'border', 'borderColor', 'borderRadius', 'borderSpacing', 'borderStyle', 'borderWidth',
  'fontStyle', 'fontWeight', 'textDecoration', 'cursor', 'color', 'opacity',
  'letterSpacing', 'gutterIconPath', 'gutterIconSize', 'overviewRulerColor',
  'before', 'after',
  // DecorationRenderOptions adds these on top of the themable set
  'isWholeLine', 'rangeBehavior', 'overviewRulerLane', 'light', 'dark',
]);

// ThemableDecorationAttachmentRenderOptions — the before/after attachments.
// Notably has no fontSize.
const ATTACHMENT_KEYS = new Set([
  'contentText', 'contentIconPath', 'border', 'borderColor', 'fontStyle',
  'fontWeight', 'textDecoration', 'color', 'backgroundColor', 'margin',
  'width', 'height',
]);

function loadDecorationTypes() {
  const captured = [];
  Object.keys(require.cache).forEach(key => {
    if (key.includes('out/decorations') || key.includes('out\\decorations')) {
      delete require.cache[key];
    }
  });
  mock('vscode', {
    window: {
      createTextEditorDecorationType: (options) => {
        captured.push(options);
        return { dispose() {} };
      },
    },
    ThemeColor: function ThemeColor(id) { this.id = id; },
    DecorationRangeBehavior: { ClosedClosed: 1, OpenOpen: 0 },
    OverviewRulerLane: { Left: 1, Center: 2, Right: 4, Full: 7 },
    Uri: { file: p => ({ fsPath: p }) },
  });
  const mod = require('../out/decorations/decorationTypes');
  mod.createDecorationTypes(0.4);
  return captured;
}

function describeKey(optionIndex, key) {
  return `decoration #${optionIndex} uses unsupported property "${key}"`;
}

describe('decoration render options use only supported VS Code properties', () => {
  let allOptions;

  before(() => {
    allOptions = loadDecorationTypes();
  });

  after(() => {
    mock.stopAll();
  });

  it('creates a non-trivial number of decoration types', () => {
    assert.ok(allOptions.length > 20, `expected many decorations, got ${allOptions.length}`);
  });

  it('uses no unsupported top-level properties', () => {
    const bad = [];
    allOptions.forEach((opts, i) => {
      Object.keys(opts || {}).forEach(key => {
        if (!DECORATION_KEYS.has(key)) bad.push(describeKey(i, key));
      });
    });
    assert.deepEqual(bad, [], bad.join('\n'));
  });

  it('uses no unsupported before/after attachment properties', () => {
    const bad = [];
    allOptions.forEach((opts, i) => {
      ['before', 'after'].forEach(slot => {
        const attachment = opts && opts[slot];
        if (!attachment) return;
        Object.keys(attachment).forEach(key => {
          if (!ATTACHMENT_KEYS.has(key)) bad.push(describeKey(i, `${slot}.${key}`));
        });
      });
    });
    assert.deepEqual(bad, [], bad.join('\n'));
  });

  it('rejects the specific shorthand side-borders VS Code drops', () => {
    const bad = [];
    allOptions.forEach((opts, i) => {
      ['borderLeft', 'borderRight', 'borderTop', 'borderBottom'].forEach(key => {
        if (opts && key in opts) bad.push(describeKey(i, key));
      });
    });
    assert.deepEqual(bad, [], `${bad.join('\n')}\nUse borderWidth + borderStyle instead.`);
  });

  it('draws every border it colors', () => {
    // borderColor with no width/style renders nothing — the failure mode that
    // made blockquote bars and horizontal rules invisible.
    const bad = [];
    allOptions.forEach((opts, i) => {
      if (!opts || !opts.borderColor) return;
      const hasGeometry = opts.border || opts.borderWidth || opts.borderStyle;
      if (!hasGeometry) {
        bad.push(`decoration #${i} sets borderColor but no border/borderWidth/borderStyle`);
      }
    });
    assert.deepEqual(bad, [], bad.join('\n'));
  });
});
