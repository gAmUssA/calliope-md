/* eslint-disable @typescript-eslint/no-var-requires */
const assert = require('assert').strict;

const { splitSentences } = require('../out/formatters/sentenceSplitter');

describe('splitSentences', () => {
  describe('basic splitting', () => {
    it('splits on a period followed by a capital', () => {
      assert.deepEqual(splitSentences('One thing. Another thing.'), ['One thing.', 'Another thing.']);
    });

    it('splits on question and exclamation marks', () => {
      assert.deepEqual(splitSentences('Really? Yes! Truly.'), ['Really?', 'Yes!', 'Truly.']);
    });

    it('returns single-sentence text unchanged', () => {
      assert.deepEqual(splitSentences('Just the one sentence.'), ['Just the one sentence.']);
    });

    it('leaves text with no terminator alone', () => {
      assert.deepEqual(splitSentences('no punctuation here'), ['no punctuation here']);
    });

    it('preserves empty and whitespace-only input verbatim', () => {
      assert.deepEqual(splitSentences(''), ['']);
      assert.deepEqual(splitSentences('   '), ['   ']);
    });

    it('does not split on a terminator at the very end', () => {
      assert.deepEqual(splitSentences('Ends here. '), ['Ends here. ']);
    });
  });

  describe('abbreviations must not end a sentence', () => {
    it('handles titles', () => {
      assert.deepEqual(splitSentences('Dr. Smith arrived.'), ['Dr. Smith arrived.']);
      assert.deepEqual(splitSentences('Ask Mrs. Patel about it.'), ['Ask Mrs. Patel about it.']);
    });

    it('handles common abbreviations', () => {
      assert.deepEqual(splitSentences('Cats vs. Dogs is the topic.'), ['Cats vs. Dogs is the topic.']);
      assert.deepEqual(splitSentences('Bring pens, paper, etc. Then start.'), ['Bring pens, paper, etc. Then start.']);
    });

    it('handles multi-period abbreviations', () => {
      assert.deepEqual(splitSentences('Use a tool, e.g. Vim, to edit.'), ['Use a tool, e.g. Vim, to edit.']);
      assert.deepEqual(splitSentences('That is, i.e. Precisely this.'), ['That is, i.e. Precisely this.']);
    });

    it('handles single-letter initials', () => {
      assert.deepEqual(splitSentences('A. Smith wrote it.'), ['A. Smith wrote it.']);
    });

    it('is case-insensitive about multi-period abbreviations', () => {
      assert.deepEqual(splitSentences('The U.S. Government agreed.'), ['The U.S. Government agreed.']);
    });
  });

  describe('numbers, domains and ellipses are atomic', () => {
    it('does not split inside a decimal', () => {
      assert.deepEqual(splitSentences('Version 1.5 shipped.'), ['Version 1.5 shipped.']);
    });

    it('does not split inside a domain name', () => {
      assert.deepEqual(splitSentences('Visit example.com Today is fine.'), ['Visit example.com Today is fine.']);
    });

    it('does not split inside a file name', () => {
      assert.deepEqual(splitSentences('Open README.md Then read it.'), ['Open README.md Then read it.']);
    });

    it('does not split on an ellipsis', () => {
      assert.deepEqual(splitSentences('Wait... Something happened.'), ['Wait... Something happened.']);
    });
  });

  describe('closing punctuation stays with its sentence', () => {
    it('keeps a closing double quote', () => {
      assert.deepEqual(splitSentences('He said "stop." Then he left.'), ['He said "stop."', 'Then he left.']);
    });

    it('keeps a closing parenthesis', () => {
      assert.deepEqual(splitSentences('(An aside.) The main point.'), ['(An aside.)', 'The main point.']);
    });

    it('splits when the next sentence opens with a quote', () => {
      assert.deepEqual(splitSentences('He paused. "Then spoke."'), ['He paused.', '"Then spoke."']);
    });
  });

  describe('boundary conditions', () => {
    it('does not split before a lowercase word', () => {
      assert.deepEqual(splitSentences('Ends. then continues lowercase.'), ['Ends. then continues lowercase.']);
    });

    it('splits before a number starting a sentence', () => {
      assert.deepEqual(splitSentences('Count them. 3 remain.'), ['Count them.', '3 remain.']);
    });

    it('collapses the whitespace between sentences', () => {
      assert.deepEqual(splitSentences('First.     Second.'), ['First.', 'Second.']);
    });

    it('splits across a newline used as sentence whitespace', () => {
      assert.deepEqual(splitSentences('First.\nSecond.'), ['First.', 'Second.']);
    });

    it('handles many sentences in one pass', () => {
      const out = splitSentences('A one. B two. C three. D four.');
      assert.deepEqual(out, ['A one.', 'B two.', 'C three.', 'D four.']);
    });

    it('reassembles to the original content ignoring inter-sentence whitespace', () => {
      const input = 'Alpha beta. Gamma delta! Epsilon?';
      const joined = splitSentences(input).join(' ');
      assert.equal(joined, input, 'splitting must not lose or alter sentence text');
    });
  });
});
