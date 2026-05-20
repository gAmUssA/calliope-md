/* eslint-disable @typescript-eslint/no-var-requires */
const assert = require('assert').strict;
const { parseMarkdown } = require('../out/parser/markdownParser');

// These cases were previously verified by hand via test-*.md fixtures and a
// debug-frontmatter.js script. They are now exercised as unit tests against
// detectFrontmatter (exposed through parseMarkdown's `metadata` output).

describe('parseMarkdown — YAML frontmatter detection', () => {
  it('detects valid frontmatter delimited by --- ... ---', () => {
    const text = [
      '---',
      'name: Test Document',
      'description: Testing YAML frontmatter rendering',
      'tags: [test, frontmatter, yaml]',
      '---',
      '',
      '# Test Header',
      '',
    ].join('\n');

    const parsed = parseMarkdown(text);

    assert.equal(parsed.metadata.length, 1, 'should detect one metadata block');
    const meta = parsed.metadata[0];
    assert.equal(meta.range.start.line, 1, 'frontmatter starts on line 1');
    assert.equal(meta.range.end.line, 5, 'frontmatter ends on the closing --- (line 5)');

    // The opening/closing delimiters must not be mistaken for horizontal rules.
    assert.equal(parsed.horizontalRules.length, 0, 'frontmatter delimiters are not horizontal rules');

    // The header after the frontmatter is still parsed.
    assert.equal(parsed.headers.length, 1);
    assert.equal(parsed.headers[0].range.start.line, 7);
  });

  it('detects empty frontmatter (--- immediately followed by ---)', () => {
    const text = ['---', '---', '', '# Empty Frontmatter Test', ''].join('\n');

    const parsed = parseMarkdown(text);

    assert.equal(parsed.metadata.length, 1, 'empty frontmatter should still be detected');
    assert.equal(parsed.metadata[0].range.end.line, 2, 'empty frontmatter ends on line 2');
    assert.equal(parsed.horizontalRules.length, 0, 'should not be treated as a horizontal rule');
  });

  it('does not treat a --- after body content as frontmatter', () => {
    const text = [
      '# Document Without Frontmatter',
      '',
      'Some content here.',
      '',
      '---',
      '',
      'This is a horizontal rule above, not frontmatter.',
      '',
    ].join('\n');

    const parsed = parseMarkdown(text);

    assert.equal(parsed.metadata.length, 0, 'frontmatter must start on line 1, not mid-document');
    assert.ok(parsed.horizontalRules.length >= 1, 'the --- after content is a horizontal rule');
  });

  it('treats a lone opening --- with no closing delimiter as a horizontal rule', () => {
    const text = [
      '---',
      '',
      '# Just a Horizontal Rule',
      '',
      'No closing delimiter, so this is not frontmatter.',
      '',
    ].join('\n');

    const parsed = parseMarkdown(text);

    assert.equal(parsed.metadata.length, 0, 'no closing --- means no frontmatter');
    assert.ok(parsed.horizontalRules.length >= 1, 'the opening --- falls back to a horizontal rule');
  });
});
