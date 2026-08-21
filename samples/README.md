# Sample documents

Markdown files for exercising the extension by hand in the Extension Development
Host. They are not used by the automated suite — `npm test` runs entirely on
inline fixtures — and they are excluded from the packaged `.vsix`.

| File | What it exercises |
|---|---|
| `test-calliope.md` | General inline rendering across every element type |
| `test-mermaid.md` | Mermaid diagram rendering and the ASCII fallback |
| `test-tables.md` | GFM tables, alignment and the save-time column formatter |
| `test-typescript-highlighting.md` | Fenced code blocks and the copy-code hover |
| `broken-readme.md` | The v0.8.3 repro: a bare URL followed later by a real link, which used to collapse everything between them to zero width |
