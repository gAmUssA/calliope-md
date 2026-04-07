/**
 * Pure-function sentence splitting for One Sentence Per Line (OSPL) formatting.
 * No VS Code dependency — independently testable.
 */

const ABBREVIATIONS = new Set([
  // Titles
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'rev', 'gen', 'gov', 'sgt', 'cpl', 'pvt', 'capt', 'lt', 'col', 'maj',
  // Common abbreviations
  'vs', 'etc', 'approx', 'dept', 'est', 'vol', 'govt', 'inc', 'corp', 'ltd', 'co',
  // Academic/professional
  'no', 'fig', 'eq', 'ref', 'sec', 'ch', 'pp', 'ed', 'trans',
]);

const MULTI_PERIOD_ABBREVIATIONS = [
  'e.g.', 'i.e.', 'a.m.', 'p.m.', 'etc.',
  'ph.d.', 'm.d.', 'b.a.', 'm.a.', 'b.s.', 'm.s.',
  'u.s.', 'u.k.', 'u.n.',
];

interface ProtectedRange {
  start: number;
  end: number;
}

function findProtectedRanges(text: string): ProtectedRange[] {
  const ranges: ProtectedRange[] = [];

  // Multi-period abbreviations (case-insensitive)
  const lowerText = text.toLowerCase();
  for (const abbr of MULTI_PERIOD_ABBREVIATIONS) {
    let idx = 0;
    while ((idx = lowerText.indexOf(abbr, idx)) !== -1) {
      ranges.push({ start: idx, end: idx + abbr.length });
      idx += abbr.length;
    }
  }

  // Decimal numbers: digits.digits
  for (const match of text.matchAll(/\d+\.\d+/g)) {
    ranges.push({ start: match.index!, end: match.index! + match[0].length });
  }

  // Ellipsis: two or more dots
  for (const match of text.matchAll(/\.{2,}/g)) {
    ranges.push({ start: match.index!, end: match.index! + match[0].length });
  }

  // Domain-like / file extension patterns: word.word (2-4 char extension)
  for (const match of text.matchAll(/[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,4}(?=[^a-zA-Z]|$)/g)) {
    ranges.push({ start: match.index!, end: match.index! + match[0].length });
  }

  return ranges;
}

function isInProtectedRange(index: number, ranges: ProtectedRange[]): boolean {
  return ranges.some(r => index >= r.start && index < r.end);
}

function isAbbreviation(text: string, periodIndex: number): boolean {
  // Extract the word ending at periodIndex
  let wordStart = periodIndex - 1;
  while (wordStart >= 0 && /[a-zA-Z]/.test(text[wordStart])) {
    wordStart--;
  }
  wordStart++;

  const word = text.slice(wordStart, periodIndex).toLowerCase();
  if (word.length === 0) return false;

  // Single letter abbreviation (e.g., "A." in "A. Smith")
  if (word.length === 1) return true;

  return ABBREVIATIONS.has(word);
}

/**
 * Split a plain text string into sentences.
 * Text should already have inline markup removed or marked as atomic.
 */
export function splitSentences(text: string): string[] {
  if (!text.trim()) return [text];

  const protectedRanges = findProtectedRanges(text);
  const boundaries: number[] = [];

  // Find potential sentence endings: .!? followed by optional closing punctuation, then whitespace
  const pattern = /([.!?])(['""\u201d\u2019\u00bb)}\]]*)\s+/g;

  let match;
  while ((match = pattern.exec(text)) !== null) {
    const punctIndex = match.index;
    const afterPunctAndClosing = match.index + 1 + match[2].length;
    const afterFullMatch = match.index + match[0].length;

    // Skip if in a protected range
    if (isInProtectedRange(punctIndex, protectedRanges)) continue;

    // For periods, check if it's an abbreviation
    if (match[1] === '.' && isAbbreviation(text, punctIndex)) continue;

    // Check what follows the whitespace — should suggest a new sentence
    const nextChar = text.charAt(afterFullMatch);
    if (!nextChar) continue; // whitespace at end of text, no split needed

    // Accept: uppercase letter, opening quote/bracket, number at sentence start
    if (/[A-Z\u00C0-\u024F"'\u201c\u2018\u00ab(\[0-9]/.test(nextChar)) {
      // The boundary is after punctuation + closing quotes, at the start of whitespace
      boundaries.push(afterPunctAndClosing);
    }
  }

  if (boundaries.length === 0) return [text];

  // Split text at boundaries
  const sentences: string[] = [];
  let lastIdx = 0;
  for (const boundary of boundaries) {
    sentences.push(text.slice(lastIdx, boundary).trimEnd());
    // Skip whitespace to find the start of the next sentence
    let nextStart = boundary;
    while (nextStart < text.length && /\s/.test(text[nextStart])) {
      nextStart++;
    }
    lastIdx = nextStart;
  }
  // Add remaining text
  if (lastIdx < text.length) {
    sentences.push(text.slice(lastIdx));
  }

  return sentences;
}
