## Why

The `extractHeader()` function in `markdownParser.ts` assumes all headings use ATX-style syntax (`# Header`). When a document contains setext-style headings (text underlined with `===` for H1 or `---` for H2, per [CommonMark §4.3](https://spec.commonmark.org/0.30/#setext-headings)), the parser calculates incorrect `syntaxRange` and `contentRange` values. This produces corrupted decorations — wrong text gets hidden, wrong text gets styled.

This matters now because users writing presentation-style markdown or pasting content from other editors commonly use setext headings.

## What Changes

- Fix `extractHeader()` to detect setext vs ATX heading style from the source text
- For setext headings: `syntaxRange` covers the underline (`===`/`---`) on the second line; `contentRange` covers the heading text on the first line
- For ATX headings: behavior unchanged (`syntaxRange` = `#` markers, `contentRange` = text after markers)
- Add `style` field to `HeaderElement` type to distinguish `'atx'` from `'setext'`
- Update decoration handler to use the full line as content range for setext headings (no hash markers to hide — hide the underline instead)

## Capabilities

### New Capabilities
_None_

### Modified Capabilities
- `header-rendering`: Add setext heading support — underline syntax (`===`/`---`) treated as the hideable syntax, content is the preceding text line
- `markdown-parser`: `extractHeader()` must detect heading style and compute correct ranges for both ATX and setext headings

## Impact

- **Parser**: `src/parser/markdownParser.ts` — `extractHeader()` function
- **Types**: `src/parser/types.ts` — `HeaderElement` interface (add `style` field)
- **Decorations**: `src/decorations/elements/headers.ts` — may need adjustment for setext syntax range spanning a different line than content
- **No breaking changes**: ATX heading behavior is unchanged; this is additive
