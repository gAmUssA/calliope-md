/**
 * Line-based One Sentence Per Line (OSPL) formatting for AsciiDoc and other
 * non-Markdown text. Unlike the Markdown formatter (which parses a remark AST),
 * this works line-by-line in the spirit of the classic semantic-linefeed perl
 * one-liner, but with AsciiDoc-aware fencing so we never split inside delimited
 * blocks (source, literal, example, etc.) and never mangle list markers.
 *
 * Pure function — no VS Code dependency, independently testable.
 */

import { splitSentences } from './sentenceSplitter';

/**
 * AsciiDoc delimited block boundaries. Every delimited block opens and closes
 * with the same delimiter line, so we match the exact (trimmed) line to detect
 * the close. While inside a block, every line is passed through untouched.
 */
const DELIMITER_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'listing', re: /^-{4,}$/ }, // ---- source / listing
  { name: 'literal', re: /^\.{4,}$/ }, // .... literal
  { name: 'example', re: /^={4,}$/ }, // ==== example
  { name: 'sidebar', re: /^\*{4,}$/ }, // **** sidebar
  { name: 'quote', re: /^_{4,}$/ }, // ____ quote / verse
  { name: 'passthrough', re: /^\+{4,}$/ }, // ++++ passthrough
  { name: 'comment', re: /^\/{4,}$/ }, // //// comment block
  { name: 'table', re: /^[|!]={3,}$/ }, // |=== / !=== table
  { name: 'open', re: /^--$/ }, // -- open block
];

function delimiterName(trimmedLine: string): string | null {
  for (const { name, re } of DELIMITER_PATTERNS) {
    if (re.test(trimmedLine)) return name;
  }
  return null;
}

/**
 * Lines that are structural, not prose, and must pass through untouched.
 */
function isNonProseLine(line: string): boolean {
  const t = line.replace(/^\s+/, '');
  const tt = t.replace(/\s+$/, '');
  if (t === '') return true; // blank line (paragraph separator)
  if (/^=+\s/.test(t)) return true; // section title:  == Title
  if (/^#{1,6}\s/.test(t)) return true; // ATX-style heading (plaintext safety)
  if (/^:[^:\s]+:/.test(t)) return true; // attribute entry:  :name: value
  if (/^\[.*\]$/.test(tt)) return true; // block attrs / anchor: [source], [[id]]
  if (/^\.[^.\s]/.test(t)) return true; // block title:  .Title  (not a .... literal block)
  if (/^(image|video|audio|include|toc)::/.test(t)) return true; // block macros
  if (/^\/\//.test(t)) return true; // line comment //
  if (/^<(?:\.|\d+)>\s/.test(t)) return true; // callout list:  <1>  <.>
  return false;
}

/**
 * Description (labeled) lists like `term:: definition` are passed through to
 * avoid breaking the `::` term/definition association. We exclude `://` so we
 * don't false-match URLs.
 */
function isDescriptionList(line: string): boolean {
  const trimmed = line.replace(/\s+$/, '');
  return /(?:^|[^:/])(::|;;|:::|::::)(\s+\S|$)/.test(trimmed);
}

interface ListItem {
  prefix: string; // indent + marker + gap (everything before the content)
  content: string;
}

/**
 * Match an AsciiDoc list item and capture the marker prefix and content.
 * Unordered uses `*`/`-` (repeated for nesting); ordered uses `.`/`..`/`1.`.
 * A marker must be followed by whitespace, so inline `*bold*` is not matched.
 * Numeric markers are capped at 3 digits so a prose line starting with a year
 * ("1984. It was...") is not mistaken for a list item.
 */
function matchListItem(line: string): ListItem | null {
  const m =
    /^(\s*)([*-]+)(\s+)(.*)$/.exec(line) || // unordered: *, **, -
    /^(\s*)(\.+|\d{1,3}\.)(\s+)(.*)$/.exec(line); // ordered: ., .., 1.
  if (!m) return null;
  const [, indent, marker, gap, content] = m;
  return { prefix: indent + marker + gap, content };
}

/**
 * Inline constructs that must never be split across lines: inline macros
 * (footnote:[...], link:url[text], kbd:[...]), inline code spans, and bare
 * URLs. These are masked as atomic placeholders before sentence splitting
 * and restored afterwards, satisfying splitSentences' contract that inline
 * markup be removed or marked as atomic.
 */
const INLINE_ATOMIC_RE =
  /[a-zA-Z][a-zA-Z0-9]*:[^\s[\]]*\[[^\]]*\]|`[^`]+`|https?:\/\/[^\s[\]]*[^\s[\].,;:!?]/g;

/**
 * Split a prose body into sentences while treating inline markup as atomic,
 * then merge back any split whose continuation line would be reinterpreted
 * structurally by AsciiDoc (ordered-list marker or block delimiter lead).
 */
function splitSentencesAtomic(body: string): string[] {
  const atoms: string[] = [];
  const masked = body.replace(INLINE_ATOMIC_RE, match => {
    atoms.push(match);
    return `\u0000${atoms.length - 1}\u0000`;
  });
  const parts = splitSentences(masked).map(p =>
    p.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => atoms[Number(i)])
  );
  return mergeStructuralLeads(parts);
}

/**
 * A continuation line starting with `N. `, `. `, or a delimiter run would be
 * parsed by AsciiDoc as a list item or block boundary instead of prose, so we
 * undo such splits by merging the sentence back into its predecessor.
 */
function mergeStructuralLeads(parts: string[]): string[] {
  if (parts.length <= 1) return parts;
  const merged: string[] = [parts[0]];
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (/^(?:\d+\.|\.+)\s/.test(part) || delimiterName(part.replace(/\s+$/, ''))) {
      merged[merged.length - 1] += ' ' + part;
    } else {
      merged.push(part);
    }
  }
  return merged;
}

/**
 * Split a prose line into one sentence per line, preserving leading indentation
 * on each produced line. Returns the original line unchanged if there is at most
 * one sentence.
 */
function splitProse(line: string): string[] {
  const indent = (/^\s*/.exec(line) || [''])[0];
  const body = line.slice(indent.length);
  const parts = splitSentencesAtomic(body);
  if (parts.length <= 1) return [line];
  return parts.map(p => indent + p);
}

/**
 * Split a list item's content into one sentence per line. Continuation lines are
 * indented to align under the content (marker width of spaces) so they remain
 * part of the same list item and are never mistaken for a new marker.
 */
function splitListItem(item: ListItem): string[] {
  const parts = splitSentencesAtomic(item.content);
  if (parts.length <= 1) return [item.prefix + item.content];
  const cont = ' '.repeat(item.prefix.length);
  return parts.map((p, i) => (i === 0 ? item.prefix : cont) + p);
}

/**
 * Reformat AsciiDoc (or plain) text to one sentence per line. Idempotent for
 * already-formatted input. Each original line keeps its own line ending, so
 * files with mixed LF/CRLF endings are never churned wholesale; newly inserted
 * breaks reuse the ending of the line being split.
 */
export function formatAsciidocOspl(text: string): string {
  // tokens alternate [content, separator, content, separator, ..., content]
  const tokens = text.split(/(\r?\n)/);
  const lines: string[] = [];
  const seps: string[] = [];
  for (let i = 0; i < tokens.length; i += 2) {
    lines.push(tokens[i]);
    seps.push(tokens[i + 1] ?? '');
  }
  const defaultEol = seps.find(s => s !== '') ?? '\n';

  const out: string[] = [];
  let activeDelimiter: string | null = null; // exact trimmed delimiter line we're inside

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sep = seps[i];
    const trimmed = line.replace(/\s+$/, '');
    const emit = (produced: string[]) => {
      out.push(produced.join(sep || defaultEol) + sep);
    };

    if (activeDelimiter !== null) {
      // Inside a delimited block: pass through, close on the matching delimiter.
      emit([line]);
      if (trimmed === activeDelimiter) activeDelimiter = null;
      continue;
    }

    if (delimiterName(trimmed)) {
      // Only enter the block if a matching closing delimiter exists later.
      // Otherwise the line is not a block boundary (plaintext/RST heading
      // underline, `--` signature separator) and must not swallow the rest
      // of the document.
      const hasClose = lines
        .slice(i + 1)
        .some(l => l.replace(/\s+$/, '') === trimmed);
      if (hasClose) {
        activeDelimiter = trimmed;
      }
      emit([line]);
      continue;
    }

    if (isNonProseLine(line) || isDescriptionList(line)) {
      emit([line]);
      continue;
    }

    const listItem = matchListItem(line);
    if (listItem) {
      emit(splitListItem(listItem));
      continue;
    }

    emit(splitProse(line));
  }

  return out.join('');
}
