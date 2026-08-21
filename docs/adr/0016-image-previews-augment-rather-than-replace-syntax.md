# 16. Inline image previews augment the source instead of replacing it

- **Status:** Accepted
- **Date:** 2026-03-16

## Context

Image rendering followed the house rule from ADR-0003: show the preview, hide the `![alt](path)` syntax when the cursor is elsewhere. For images the rule works badly. The preview is an opaque thumbnail rendered by an `after` attachment — unlike bold text or a heading, it carries none of the information the source line had. With the syntax hidden, the alt text and the path are both gone, and there is no visible target to put the cursor in to get them back.

Images are also the only element whose rendering reaches outside the document, resolving paths against the filesystem or the network, so a preview appearing by default is a stronger action than styling text.

## Decision

Image previews augment the line rather than replacing it. When `calliope.renderImages` is enabled, the full `![alt](path)` syntax stays visible in every visibility state and the preview renders as an `after` attachment following it. The image handler produces no `syntaxHidden` or `syntaxGhost` ranges.

The setting becomes opt-in, defaulting to `false`.

The `ImageDecorations` interface keeps its now always-empty `syntaxHidden` and `syntaxGhost` arrays so the decoration manager's spread pattern is unchanged.

A dedicated `imageRenderMode` setting with `off`/`inline`/`replace` was considered and rejected as over-engineering for a binary preference.

## Consequences

- The source line stays readable and editable; alt text and path are never hidden behind a thumbnail.
- Images are the documented exception to the three-state model. Any future element whose rendered form is opaque should reach for this precedent rather than the default rule.
- Users upgrading see previews stop appearing until they opt in. That is the intent.
- Documents with many images show every image tag in full, which is noisier than hiding them. Accepted deliberately.
- The default flip was never actually applied. `calliope.renderImages` still defaults to `true` in both `package.json` and `src/config.ts`, although the syntax-visibility half of this decision did land. Tracked as an open bug.
