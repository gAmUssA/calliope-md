# 11. Revert Mermaid rendering to beautiful-mermaid data URIs

- **Status:** Accepted. The load mechanism is superseded by ADR-0018 (single `require` specifier) and the cache key by ADR-0019 (document + theme + content).
- **Date:** 2026-02-09

## Context

ADR-0009's webview renderer shipped as v0.5.0 and the costs became clear immediately.

Rendering now depended on a second execution context that had to be created, focused, loaded and kept alive before any diagram could appear, with timeouts and a "waiting for webview" fallback path for when it was not ready. The extension contributed a view container that existed only to host a renderer. The build vendored the mermaid ESM bundle and its chunks into `media/mermaid/`, inflating the packaged `.vsix`, and pulled in cheerio to repair the SVG the webview returned.

Against that, `beautiful-mermaid` renders synchronously from Node with a function call, needs no DOM, no message protocol, no vendored assets and no post-processing — and it also supplies the ASCII renderer the fallback mode depends on. Its narrower diagram coverage is a real limitation, but the feature is opt-in and experimental, so incomplete coverage is a smaller problem than a fragile render pipeline.

## Decision

Revert to the ADR-0007 architecture: `beautiful-mermaid`, dynamically imported, producing SVG embedded as a data URI in `contentIconPath`, with an MD5-keyed in-memory cache.

The webview view contribution, the `copy-mermaid` build step, the `media/mermaid/` assets, the `mermaid` and cheerio dependencies, and the v0.5.0 changelog entry were all removed. The release was rolled back rather than superseded by a higher version.

## Consequences

- Rendering is a function call again. No webview lifecycle, no message correlation, no readiness timeouts, no vendored assets.
- Diagram type coverage is bounded by `beautiful-mermaid`. This is accepted for an opt-in experimental feature; if coverage becomes the binding constraint the webview design in ADR-0009 is on record with its full cost.
- The revert deleted the call sites but left `src/mermaid/` in the tree. Those 964 lines sat unimported for roughly six months before being removed.
- Caches were reintroduced as plain module-level `Map`s keyed only on content hash. Because theme colours are baked into the SVG at render time, a theme switch served stale-coloured diagrams; keys were later extended to `${documentUri}#${theme}#${md5(code)}` with per-document eviction and a size cap.
