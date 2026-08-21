# 5. Static decoration types, cached AST, debounced and viewport-limited updates

- **Status:** Accepted
- **Date:** 2026-02-01

## Context

Decorations are recomputed on document changes, cursor movement, scrolling and editor switches. A 1000-line document contains thousands of decorable ranges. Three costs dominate: creating `TextEditorDecorationType` instances, parsing the document, and building range arrays for content that is not on screen. The stated budget was under 50 ms per decoration update.

## Decision

Four measures, applied together:

1. **Create decoration types once.** All `TextEditorDecorationType` instances are built at activation in `src/decorations/decorationTypes.ts` (`createDecorationTypes(ghostOpacity)`) and reused; updates only call `editor.setDecorations()` with new ranges. Per-element variation that cannot be expressed by a shared type is carried in per-range `renderOptions` instead of new types.
2. **Cache the AST by document version.** `src/parser/parseCache.ts` keys parsed documents on `uri` + `document.version`, so cursor movement and scrolling reuse the parse and only re-derive visibility.
3. **Debounce text-driven updates to 150 ms.** `src/decorations/decorationManager.ts` schedules updates through a single timer. Cursor movement bypasses the debounce and updates immediately, because visibility must track the caret without lag.
4. **Render only the viewport plus a 50-line buffer.** (Widened to 200 lines in v0.7.1 — see the amendment below.) `filterByVisibleRange` drops every element outside `getVisibleRangeWithBuffer(editor)` before decorations are constructed.

## Consequences

- Cost scales with what is on screen rather than with file size, so large documents stay responsive.
- Scrolling has to trigger an update, since off-screen elements were never decorated. This is what makes layout-shifting decorations dangerous: a shift changes visible ranges, which schedules another update. The table shimmer (ADR-0013) and the Mermaid render loop were both instances of this.
- The debounce timer is a single module-level variable rather than per-editor, so rapid switching between editors can coalesce updates that belonged to different editors.
- The parse cache is keyed by version and never bounded, so entries for closed documents persist until `clearCache()` is called.
- Static types plus dynamic `renderOptions` is now the house pattern; `lists.ts`, `images.ts` and `tables.ts` all use it rather than multiplying decoration types per variant.

## Amendment — 2026-05-14 (v0.7.1)

The viewport buffer was widened from 50 lines to 200 (`getVisibleRangeWithBuffer`, `src/decorations/decorationManager.ts`).

At 50 lines, scrolling faster than the buffer could be refilled exposed undecorated text at the leading edge, which then popped into rendered form when the update landed — visible as a flicker each time scrolling stopped. Widening the buffer keeps decorations ahead of the scroll at normal speeds. The cost is decorating up to 400 lines of off-screen text per pass, which measured as acceptable against the AST cache of point 2.
