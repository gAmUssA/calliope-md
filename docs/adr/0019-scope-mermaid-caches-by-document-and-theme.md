# 19. Key mermaid caches by document, theme and content

- **Status:** Accepted
- **Date:** 2026-07-06

## Context

ADR-0011 specified "an MD5-keyed in-memory cache" — the key was the MD5 of the diagram source alone.

Rendered SVG has theme colors baked into it, because `beautiful-mermaid` is handed explicit `bg`/`fg`/`line`/`accent`/`muted` values derived from the active color theme at render time. A key made only of the diagram source cannot distinguish a light-theme render from a dark-theme one, so switching theme served stale SVG with the previous theme's colors until the content changed.

The cache also had no eviction. Entries accumulated for every diagram in every document opened, for the lifetime of the extension host.

## Decision

Key all mermaid caches by `${documentUri}#${theme}#${md5(code)}`.

Evict per document when a document closes, cap the caches at 300 entries, and clear them entirely on `onDidChangeActiveColorTheme`, forcing a re-render at the new theme.

## Consequences

Switching between light and dark themes re-renders diagrams at the new colors instead of showing the previous theme's.

Cache memory is bounded and released when documents close, rather than growing for the whole session.

The same diagram source appearing in two documents is now rendered and stored twice. That is accepted: the duplication is bounded by the entry cap, and document-scoped eviction is only possible with the document in the key.
