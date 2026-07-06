/* eslint-disable @typescript-eslint/no-var-requires */
const assert = require('assert').strict;
const { formatAsciidocOspl } = require('../out/formatters/asciidocOspl');

describe('formatAsciidocOspl', () => {
  describe('prose splitting', () => {
    it('splits multiple sentences on a line into one per line', () => {
      const input = 'First sentence. Second sentence. Third one.\n';
      const expected = 'First sentence.\nSecond sentence.\nThird one.\n';
      assert.equal(formatAsciidocOspl(input), expected);
    });

    it('is idempotent on already-formatted text', () => {
      const text = 'First sentence.\nSecond sentence.\n';
      assert.equal(formatAsciidocOspl(text), text);
    });

    it('preserves leading indentation on continuation lines', () => {
      const input = '  Indented one. Indented two.\n';
      const expected = '  Indented one.\n  Indented two.\n';
      assert.equal(formatAsciidocOspl(input), expected);
    });

    it('does not split on abbreviations or decimals', () => {
      const input = 'See Dr. Smith re: version 1.5 of e.g. the spec. Next sentence.\n';
      const expected = 'See Dr. Smith re: version 1.5 of e.g. the spec.\nNext sentence.\n';
      assert.equal(formatAsciidocOspl(input), expected);
    });
  });

  describe('delimited block fencing', () => {
    it('never splits inside a source/listing block', () => {
      const text = [
        '[source,ruby]',
        '----',
        'puts "one. two. three."',
        'x = 1. y = 2.',
        '----',
        '',
      ].join('\n');
      assert.equal(formatAsciidocOspl(text), text);
    });

    it('never splits inside a literal block', () => {
      const text = ['....', 'a. b. c.', '....', ''].join('\n');
      assert.equal(formatAsciidocOspl(text), text);
    });

    it('never splits inside an example block', () => {
      const text = ['====', 'One. Two.', '====', ''].join('\n');
      assert.equal(formatAsciidocOspl(text), text);
    });

    it('splits prose around but not inside a block', () => {
      const input = [
        'Intro one. Intro two.',
        '----',
        'code one. code two.',
        '----',
        'Outro one. Outro two.',
        '',
      ].join('\n');
      const expected = [
        'Intro one.',
        'Intro two.',
        '----',
        'code one. code two.',
        '----',
        'Outro one.',
        'Outro two.',
        '',
      ].join('\n');
      assert.equal(formatAsciidocOspl(input), expected);
    });
  });

  describe('lists', () => {
    it('does not treat an ordered marker as a sentence boundary', () => {
      // "10." must not be mistaken for an abbreviation/sentence end.
      const input = '10. First item. Second clause.\n';
      const expected = ['10. First item.', '    Second clause.', ''].join('\n');
      assert.equal(formatAsciidocOspl(input), expected);
    });

    it('preserves the unordered marker and indents continuations', () => {
      const input = '* First point. Second point.\n';
      const expected = ['* First point.', '  Second point.', ''].join('\n');
      assert.equal(formatAsciidocOspl(input), expected);
    });

    it('leaves single-sentence list items untouched', () => {
      const text = '* Just one point.\n- Another point.\n';
      assert.equal(formatAsciidocOspl(text), text);
    });

    it('does not treat inline *bold* at line start as a list', () => {
      const input = '*Bold lead* in. Next sentence.\n';
      const expected = '*Bold lead* in.\nNext sentence.\n';
      assert.equal(formatAsciidocOspl(input), expected);
    });

    it('passes description list lines through untouched', () => {
      const text = 'Term:: A definition. With two sentences.\n';
      assert.equal(formatAsciidocOspl(text), text);
    });
  });

  describe('structural lines', () => {
    it('does not split section titles', () => {
      const text = '== A title. Not two sentences.\n';
      assert.equal(formatAsciidocOspl(text), text);
    });

    it('does not split attribute entries, comments, block titles, or anchors', () => {
      const text = [
        ':author: Jane. Doe.',
        '// a comment. with periods.',
        '.Block title. here',
        '[source,ruby]',
        '',
      ].join('\n');
      assert.equal(formatAsciidocOspl(text), text);
    });
  });

  describe('line endings', () => {
    it('preserves CRLF line endings', () => {
      const input = 'One. Two.\r\n';
      const expected = 'One.\r\nTwo.\r\n';
      assert.equal(formatAsciidocOspl(input), expected);
    });

    it('does not normalize mixed line endings (idempotent per line)', () => {
      const text = 'Already formatted.\nAnother line.\r\nLast one.\n';
      assert.equal(formatAsciidocOspl(text), text);
    });

    it('uses the split line’s own ending for inserted breaks in mixed files', () => {
      const input = 'One. Two.\nThree. Four.\r\n';
      const expected = 'One.\nTwo.\nThree.\r\nFour.\r\n';
      assert.equal(formatAsciidocOspl(input), expected);
    });
  });

  describe('inline markup atomicity', () => {
    it('never splits inside an inline macro', () => {
      const input = 'See footnote:[First point. Second point.] for details. Next sentence.\n';
      const expected = 'See footnote:[First point. Second point.] for details.\nNext sentence.\n';
      assert.equal(formatAsciidocOspl(input), expected);
    });

    it('never splits inside link macro text', () => {
      const input = 'Read link:guide.html[Intro. Advanced.] first. Then practice.\n';
      const expected = 'Read link:guide.html[Intro. Advanced.] first.\nThen practice.\n';
      assert.equal(formatAsciidocOspl(input), expected);
    });

    it('never splits inside inline code spans', () => {
      const input = 'Run `a. b. c.` now. Done.\n';
      const expected = 'Run `a. b. c.` now.\nDone.\n';
      assert.equal(formatAsciidocOspl(input), expected);
    });

    it('does not split bare URLs', () => {
      const input = 'Visit https://example.com/a.b now. Thanks.\n';
      const expected = 'Visit https://example.com/a.b now.\nThanks.\n';
      assert.equal(formatAsciidocOspl(input), expected);
    });
  });

  describe('prose that looks structural', () => {
    it('does not treat a year-led prose line as an ordered list item', () => {
      const input = '1984. It was a cold day in April. The clocks struck thirteen.\n';
      const expected = '1984.\nIt was a cold day in April.\nThe clocks struck thirteen.\n';
      assert.equal(formatAsciidocOspl(input), expected);
    });

    it('merges a split that would create a list-marker-led line', () => {
      const input = 'The war ended. 1945. was a turning point for everyone.\n';
      const expected = 'The war ended. 1945. was a turning point for everyone.\n';
      assert.equal(formatAsciidocOspl(input), expected);
    });

    it('recognizes indented block attribute lines as structural', () => {
      const text = '  [quote, John. Smith]\n';
      assert.equal(formatAsciidocOspl(text), text);
    });
  });

  describe('unpaired delimiters', () => {
    it('does not latch on a heading underline with no closing delimiter', () => {
      const input = 'Title\n=====\n\nOne. Two. Three.\n';
      const expected = 'Title\n=====\n\nOne.\nTwo.\nThree.\n';
      assert.equal(formatAsciidocOspl(input), expected);
    });

    it('does not latch on a lone signature separator', () => {
      const input = 'Body one. Body two.\n--\nSig line. Stays prose but gets split.\n';
      const expected = 'Body one.\nBody two.\n--\nSig line.\nStays prose but gets split.\n';
      assert.equal(formatAsciidocOspl(input), expected);
    });

    it('still fences a properly paired block', () => {
      const text = '----\nOne. Two.\n----\n';
      assert.equal(formatAsciidocOspl(text), text);
    });
  });
});
