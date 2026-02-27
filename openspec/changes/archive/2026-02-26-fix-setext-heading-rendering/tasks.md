## Tasks

### Parser Changes

- [x] Add `style?: 'atx' | 'setext'` field to `HeaderElement` in `src/parser/types.ts`
- [x] Rewrite `extractHeader()` in `src/parser/markdownParser.ts` to detect setext vs ATX by checking if the line starts with `#`
- [x] For setext headings: compute `contentRange` as the first line (heading text) and `syntaxRange` as the last line (underline `===`/`---`)
- [x] For ATX headings: preserve existing range computation, set `style: 'atx'`

### Decoration Verification

- [x] Verify `src/decorations/elements/headers.ts` works correctly with setext ranges where `syntaxRange` is on a different line than `contentRange` — adjust visibility state check if needed

### Testing

- [x] Manually test with a markdown file containing setext H1 (`===`), setext H2 (`---`), and ATX headings to verify correct rendering and visibility toggling
