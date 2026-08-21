# 7. Render Mermaid diagrams with beautiful-mermaid as SVG data URIs

- **Status:** Superseded by ADR-0009, then reinstated by ADR-0011. The "dynamically imported" load mechanism is superseded by ADR-0018.
- **Date:** 2026-02-02

## Context

Mermaid code fences should render as diagrams inline, like every other element, instead of forcing the user into a preview pane. This is the first Calliope element that needs real graphics rather than text styling, and the first whose rendering is asynchronous — a diagram takes roughly 50-500 ms to lay out, while the parse and decoration path is synchronous.

The decoration API can display an image only through `contentIconPath` on a `before`/`after` attachment, which takes a `vscode.Uri`. Options for producing that URI were a file on disk, a data URI, or abandoning decorations for a webview overlay.

Vanilla `mermaid` expects a DOM. `beautiful-mermaid` renders to an SVG string from plain Node with no browser, and additionally offers `renderMermaidAscii` for Unicode text art.

## Decision

Render with `beautiful-mermaid`, dynamically imported on first use so the library is not loaded for documents without diagrams. Hand the resulting SVG to the decoration as a data URI:

```ts
const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
contentIconPath: vscode.Uri.parse(dataUri)
```

Rendering is asynchronous and keyed by an MD5 hash of the diagram source. Cache hits decorate immediately; misses render in the background and then request a decoration refresh. Detection stays in `codeBlocks.ts`, which filters fences with language `mermaid` and delegates to `mermaidDiagrams.ts`.

The first cut wrote SVGs to `.calliope/mermaid/{hash}.svg` and needed a `cleanupUnusedSvgFiles()` sweep to stop the directory growing. Data URIs replaced that within days: no file I/O, no cleanup, no gitignore entry.

The feature ships behind `calliope.renderMermaidDiagrams`, default `false`, because the decoration API overlays diagrams at natural size and complex ones overflow. `calliope.mermaidRenderMode` selects `svg`, `ascii` or `auto`.

## Consequences

- Diagrams render inline with no webview, no file system writes and no cleanup lifecycle.
- Asynchronous rendering has to reach back into the decoration pass when it completes. Firing that refresh unconditionally — including on cache hits — later produced a permanent ~150 ms flicker loop, since each refresh triggered another render request. The refresh is now dispatched only on real cache misses.
- Errors are logged to the console rather than shown inline, because inline error badges visually collided with adjacent diagrams.
- `beautiful-mermaid` does not cover every diagram type that upstream `mermaid` supports. That gap is what motivated ADR-0009.
