/* eslint-disable @typescript-eslint/no-var-requires */
const assert = require('assert').strict;
const { parseMarkdown } = require('../out/parser/markdownParser');

// Helper: assert a range stays inside [startLine, endLine] (1-indexed, inclusive).
function assertRangeWithin(range, startLine, endLine, label) {
  assert.ok(
    range.start.line >= startLine && range.end.line <= endLine,
    `${label} range ${range.start.line}-${range.end.line} should be within lines ${startLine}-${endLine}`
  );
}

describe('parseMarkdown — link extraction', () => {
  describe('bare URL autolinks (GFM)', () => {
    it('does not create a link element for a bare URL', () => {
      // Bare URLs become `link` nodes in remark-gfm AST but have no [text](url)
      // syntax in source. Treating them as inline links produced runaway hidden
      // ranges that swallowed unrelated content downstream.
      const text = 'See https://example.com for details.\n';
      const parsed = parseMarkdown(text);

      assert.equal(parsed.links.length, 0, 'bare URL should not produce a link decoration element');
    });

    it('does not anchor a bare URL to a later real link', () => {
      // Regression: a bare URL on line 1 searched the rest of the doc for `](`
      // and matched the real link on line 3, creating a range spanning lines 1-3.
      const text = [
        'bare URL here https://example.com/apikey',
        '',
        'real link [click](https://other.com/page)',
        '',
      ].join('\n');
      const parsed = parseMarkdown(text);

      assert.equal(parsed.links.length, 1, 'only the real link should be extracted');
      const link = parsed.links[0];
      assertRangeWithin(link.range, 3, 3, 'real link');
      assertRangeWithin(link.urlPartRange, 3, 3, 'real link urlPart');
      assert.equal(link.url, 'https://other.com/page');
    });

    it('handles many bare URLs scattered through a document', () => {
      // None of these should produce link elements, regardless of what follows.
      const text = [
        'one https://a.com',
        'two https://b.com',
        'three https://c.com',
        'real [text](https://real.com)',
      ].join('\n');
      const parsed = parseMarkdown(text);

      assert.equal(parsed.links.length, 1, 'only the real markdown link is a link element');
      assert.equal(parsed.links[0].url, 'https://real.com');
    });
  });

  describe('regular [text](url) links', () => {
    it('extracts a single link with ranges confined to its own span', () => {
      const text = 'Click [here](https://example.com) now.\n';
      const parsed = parseMarkdown(text);

      assert.equal(parsed.links.length, 1);
      const link = parsed.links[0];
      assert.equal(link.url, 'https://example.com');

      // All ranges must live on line 1 within the link's span — no escaping.
      assertRangeWithin(link.range, 1, 1, 'link.range');
      assertRangeWithin(link.openBracketRange, 1, 1, 'openBracketRange');
      assertRangeWithin(link.textRange, 1, 1, 'textRange');
      assertRangeWithin(link.closeBracketRange, 1, 1, 'closeBracketRange');
      assertRangeWithin(link.urlPartRange, 1, 1, 'urlPartRange');

      // Sub-ranges should never extend past the parent link.range.
      assert.ok(link.urlPartRange.end.offset <= link.range.end.offset, 'urlPart must not exceed link.range');
      assert.ok(link.openBracketRange.start.offset >= link.range.start.offset, 'open bracket must start within link.range');
    });

    it('extracts link text as the content between brackets', () => {
      const text = 'Click [here](https://example.com) now.\n';
      const parsed = parseMarkdown(text);
      const link = parsed.links[0];

      // textRange should cover "here" — start after `[`, end before `]`.
      const textValue = text.slice(link.textRange.start.offset, link.textRange.end.offset);
      assert.equal(textValue, 'here');
    });

    it('extracts multiple links independently', () => {
      const text = '[one](https://a.com) and [two](https://b.com).\n';
      const parsed = parseMarkdown(text);

      assert.equal(parsed.links.length, 2);
      assert.equal(parsed.links[0].url, 'https://a.com');
      assert.equal(parsed.links[1].url, 'https://b.com');

      // Each link's urlPartRange must stay within its own link.range.
      for (const link of parsed.links) {
        assert.ok(
          link.urlPartRange.end.offset <= link.range.end.offset,
          `link "${link.url}" urlPart escapes its own range`
        );
      }
    });
  });

  describe('mixed bare + real links (the broken-readme.md scenario)', () => {
    it('a bare URL early in the doc does not corrupt a real link far later', () => {
      // This is the exact pattern from broken-readme.md that caused content
      // between the bare URL and the next real link to disappear.
      const lines = ['Intro paragraph with https://aistudio.google.com/apikey here.'];
      // Pad with content that must remain unaffected.
      for (let i = 0; i < 50; i++) {
        lines.push(`Line ${i + 2}: some content with **bold** and \`code\`.`);
      }
      lines.push('See [Shopify Horizon](https://github.com/Shopify/horizon) for the source.');
      const text = lines.join('\n') + '\n';

      const parsed = parseMarkdown(text);

      assert.equal(parsed.links.length, 1, 'only the real link should be a link element');
      const link = parsed.links[0];
      assert.equal(link.url, 'https://github.com/Shopify/horizon');

      // The real link must be on the last line — nowhere near the bare URL.
      const lastLine = lines.length;
      assertRangeWithin(link.range, lastLine, lastLine, 'real link');
      assertRangeWithin(link.urlPartRange, lastLine, lastLine, 'real link urlPart');
    });
  });
});
