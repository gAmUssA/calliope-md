## Why

Inline image rendering currently defaults to enabled and hides the `![alt](path)` syntax when the cursor is elsewhere. This can be surprising for users who expect to see their markdown source and makes the image tag nearly invisible. The feature should be opt-in (disabled by default) and when enabled, the image syntax should remain visible alongside the preview.

## What Changes

- Change `calliope.renderImages` default from `true` to `false` so image rendering is opt-in
- When image rendering is enabled, stop hiding/ghosting the `![alt](path)` syntax — keep it fully visible alongside the inline preview
- The image preview still appears as an `after` decoration, but the source text remains readable

## Capabilities

### New Capabilities

_None — this modifies an existing capability._

### Modified Capabilities

- `image-rendering`: Change default to disabled; remove syntax hiding/ghosting so image tags stay visible when rendering is on

## Impact

- **Config**: `package.json` setting default changes from `true` to `false`; `src/config.ts` default changes
- **Decorations**: `src/decorations/elements/images.ts` stops producing `syntaxHidden`/`syntaxGhost` entries
- **Decoration manager**: `src/decorations/decorationManager.ts` no longer collects image syntax hiding/ghosting ranges
- **Existing spec**: `openspec/specs/image-rendering/spec.md` requirements for syntax hiding need updating
- **No breaking API changes** — only default behavior changes
