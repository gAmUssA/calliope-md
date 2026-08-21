# 9. Render Mermaid with upstream mermaid.js in a hidden webview

- **Status:** Superseded by ADR-0011
- **Date:** 2026-02-09

## Context

ADR-0007 rendered diagrams with `beautiful-mermaid`, which produces SVG from plain Node. Its coverage of Mermaid's diagram grammar is narrower than upstream `mermaid`, so diagram types users expected either failed or rendered poorly.

Upstream `mermaid` needs a DOM. An extension host is Node, not a browser. The one place an extension can obtain a real DOM is a webview.

## Decision

Replace `beautiful-mermaid` with `mermaid@11`, executed inside a hidden `WebviewView` registered as `calliope.mermaidRenderer`, and treat the webview as an out-of-process render server:

- `MermaidWebviewManager` (`src/mermaid/webview-manager.ts`) owns the webview lifecycle, focuses the view once at startup to force creation, then switches back, and resolves a `webviewLoaded` promise when the page reports ready. `retainContextWhenHidden` keeps it alive.
- Render requests are correlated by id through `postMessage`, with pending renders tracked in a map and a startup timeout.
- Returned SVG is post-processed with cheerio (`svg-processor.ts`) to fix dimensions and viewBox and to strip unused content.
- An LRU cache (`lru-cache.ts`) bounds retained SVGs; failures are turned into visual error SVGs (`error-handler.ts`).
- The mermaid ESM bundle and its chunks are copied into `media/mermaid/` by a `copy-mermaid` npm script wired into `compile` and `watch`.

## Consequences

- Full upstream diagram coverage, at the cost of a second execution context and an asynchronous message protocol between it and the extension host.
- Rendering can no longer fail simply; it can also hang, arrive after the document changed, or never start if the webview does not load. The manager needs timeouts, ready-promises and request correlation to compensate.
- The build gains a pre-step that copies vendored assets, and the packaged extension gains `media/mermaid/` plus the cheerio dependency.
- The extension now contributes a user-visible view container purely as a rendering implementation detail.
- This was released as v0.5.0 and reverted the same day; ADR-0011 records why.
