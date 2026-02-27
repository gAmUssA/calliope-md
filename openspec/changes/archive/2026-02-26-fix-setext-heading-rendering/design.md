## Design: Fix Setext Heading Rendering

### Problem Analysis

Remark correctly parses setext headings — the MDAST node has `type: 'heading'`, correct `depth` (1 for `===`, 2 for `---`), and accurate position spanning both lines. The bug is in `extractHeader()` which blindly calculates `syntaxRange` as `level` count of `#` characters at the line start.

For a setext heading like:

```
The Question
===
```

Remark produces a node with:
- `depth: 1`
- `position.start` = start of "The Question" (line 1)
- `position.end` = end of "===" (line 2)

But `extractHeader()` computes `syntaxRange` as 1 character (`#`) + space on line 1, which is wrong.

### Detection Strategy

Check the raw text at the heading node's start position. If it starts with `#`, it's ATX. Otherwise, it's setext. This is reliable because:
- ATX headings always start with `#` per CommonMark
- Setext headings never start with `#` (the first line is the content)
- Remark's position data is accurate for both styles

```typescript
const lineStart = pos.start.offset - (pos.start.column - 1);
const lineText = text.slice(lineStart);
const isSetext = !lineText.startsWith('#');
```

### Range Computation for Setext

For setext headings, the structure is:
```
line N:   The Question     ← contentRange (full line)
line N+1: ===              ← syntaxRange (full underline)
```

The `range` spans both lines. The `syntaxRange` is the entire underline line. The `contentRange` is the text line.

To find the underline: scan from `pos.end` backwards to the start of the last line within the node's range.

### Type Change

Add an optional `style` field to `HeaderElement`:

```typescript
interface HeaderElement extends ParsedElement {
  type: 'header';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  style?: 'atx' | 'setext';  // defaults to 'atx' for backward compat
  syntaxRange: SourceRange;
  contentRange: SourceRange;
}
```

### Decoration Impact

The decoration handler in `headers.ts` already uses `syntaxRange` and `contentRange` generically — it applies font size to `contentRange` and hides/ghosts `syntaxRange`. For setext headings:
- `contentRange` = the text line → gets heading font size (correct)
- `syntaxRange` = the `===`/`---` line → gets hidden/ghosted (correct behavior — the underline disappears when rendered)

The existing decoration logic should work without changes, since it already treats `syntaxRange` as "the part to hide" and `contentRange` as "the part to style". The only consideration is that `syntaxRange` is on a different line from `contentRange` for setext, but `vscode.Range` handles multi-line ranges fine.

### Files Changed

1. `src/parser/types.ts` — Add `style?: 'atx' | 'setext'` to `HeaderElement`
2. `src/parser/markdownParser.ts` — Rewrite `extractHeader()` to detect style and compute ranges accordingly
3. `src/decorations/elements/headers.ts` — No changes expected (verify)

### Edge Cases

- Setext H1 underline can be any length: `=`, `==`, `===`, `==========` — all valid
- Setext H2 uses `---` which could conflict with thematic break (horizontal rule), but remark resolves this ambiguity in the AST
- Leading/trailing whitespace on the underline is allowed per CommonMark
- Only H1 and H2 can be setext; H3-H6 are always ATX
