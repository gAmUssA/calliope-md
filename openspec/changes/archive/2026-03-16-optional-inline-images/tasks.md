## 1. Change Default Setting

- [x] 1.1 Update `package.json` — change `calliope.renderImages` default from `true` to `false`
- [x] 1.2 Update `src/config.ts` — change `renderImages` default from `true` to `false`

## 2. Remove Syntax Hiding for Images

- [x] 2.1 Update `src/decorations/elements/images.ts` — remove the syntax hiding/ghosting logic so `syntaxHidden` and `syntaxGhost` arrays are always empty
- [x] 2.2 Update `src/decorations/decorationManager.ts` — remove the lines that spread image `syntaxHidden`/`syntaxGhost` into the aggregate arrays (since they will always be empty)

## 3. Update Spec

- [x] 3.1 Archive the modified `image-rendering` spec to reflect the new default and visible-syntax behavior

## 4. Verify

- [x] 4.1 Build the extension (`npm run compile`) and confirm no errors
- [ ] 4.2 Manual test: open a markdown file with images, confirm no inline preview by default
- [ ] 4.3 Manual test: enable `calliope.renderImages`, confirm preview appears after visible `![alt](path)` syntax
