## Context

The Calliope extension renders inline image previews for `![alt](path)` syntax. Currently, `calliope.renderImages` defaults to `true` and the image decoration handler hides/ghosts the markdown syntax when the cursor is elsewhere. This makes image tags nearly invisible in the editor, which can confuse users who want to see their source.

The change is small and localized to three files: the config default, the image decoration handler, and the decoration manager.

## Goals / Non-Goals

**Goals:**
- Make inline image rendering opt-in by defaulting `calliope.renderImages` to `false`
- When enabled, keep the `![alt](path)` syntax fully visible — the preview appears after the text but does not replace it

**Non-Goals:**
- Changing image preview dimensions or hover behavior
- Adding new configuration options (the existing `renderImages` toggle is sufficient)
- Changing how other element types handle syntax visibility

## Decisions

### Decision 1: Change default only, keep the setting name
The existing `calliope.renderImages` boolean setting stays. Only its default changes from `true` to `false`. Users who already set it explicitly are unaffected.

**Alternative**: Add a new setting like `calliope.imageRenderMode` with `off`/`inline`/`replace` — rejected as over-engineering for a simple toggle.

### Decision 2: Remove syntax hiding entirely for images
When image rendering is on, the `![alt](path)` text stays fully visible. The preview renders as an `after` pseudo-element following the syntax. No `syntaxHidden` or `syntaxGhost` entries are produced by the image handler.

**Alternative**: Make syntax hiding a separate config option — rejected because the user explicitly wants the tag to remain visible and adding another setting adds complexity.

### Decision 3: Keep ImageDecorations interface shape
The `syntaxHidden` and `syntaxGhost` arrays in `ImageDecorations` will still exist but always be empty. This avoids changing the interface contract and the decoration manager code that spreads these arrays. The compiler will optimize away the empty arrays.

**Alternative**: Remove the arrays from the interface — rejected because it would require changes to the decoration manager's spread pattern for no practical benefit.

## Risks / Trade-offs

- [Users upgrading may notice images stop rendering] → This is the intended behavior; the setting is documented and discoverable via VS Code settings search
- [Image syntax always visible may feel noisy when many images exist] → Acceptable trade-off per user request; users who want hiding can request it later as a separate feature
