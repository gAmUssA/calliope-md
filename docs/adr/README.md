# Architecture Decision Records

Decisions that shaped Calliope, in the order they were made. Each record states the situation that forced a choice, the choice, and what it cost. Format follows [Michael Nygard's template](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

These were reconstructed from the `openspec/` change archive and verified against the source and git history. See [MIGRATION.md](MIGRATION.md) for what mapped to what.

| # | Decision | Status | Date |
|---|---|---|---|
| [0001](0001-render-inline-with-decorations-not-document-edits.md) | Render Markdown inline with editor decorations, never document edits | Accepted | 2026-02-01 |
| [0002](0002-parse-markdown-with-remark.md) | Parse Markdown with unified, remark-parse and remark-gfm | Accepted | 2026-02-01 |
| [0003](0003-three-state-visibility.md) | Three-state visibility driven by cursor position | Accepted | 2026-02-01 |
| [0004](0004-hide-syntax-with-opacity-and-letter-spacing.md) | Hide syntax markers with zero opacity and collapsed letter-spacing | Accepted, superseded in part by 0013 / 0014 | 2026-02-01 |
| [0005](0005-decoration-performance-budget.md) | Static decoration types, cached AST, debounced and viewport-limited updates | Accepted, amended v0.7.1 (buffer 50 → 200) | 2026-02-01 |
| [0006](0006-presentation-mode-as-settings-toggle.md) | Presentation mode toggles VS Code settings, storing originals in globalState | Accepted, superseded in part by 0015 | 2026-02-01 |
| [0007](0007-mermaid-via-beautiful-mermaid-data-uris.md) | Render Mermaid diagrams with beautiful-mermaid as SVG data URIs | Superseded by 0009, reinstated by 0011; load mechanism by 0018 | 2026-02-02 |
| [0008](0008-error-surfacing-policy.md) | Surface presentation-mode failures as notifications, keep render failures on the console | Accepted, render half superseded by 0017 | 2026-02-02 |
| [0009](0009-mermaid-via-mermaid-js-in-a-webview.md) | Render Mermaid with upstream mermaid.js in a hidden webview | Superseded by 0011 | 2026-02-09 |
| [0010](0010-detect-frontmatter-with-a-text-scan.md) | Detect YAML frontmatter with a text scan, not a remark plugin | Accepted | 2026-02-09 |
| [0011](0011-revert-mermaid-to-beautiful-mermaid.md) | Revert Mermaid rendering to beautiful-mermaid data URIs | Accepted, amended by 0018 and 0019 | 2026-02-09 |
| [0012](0012-heading-sizes-in-em-via-textdecoration.md) | Size headings in em units through the textDecoration CSS hack | Accepted | 2026-02-12 |
| [0013](0013-inline-gfm-tables-without-width-collapsing.md) | Render GFM tables inline with per-row visibility and no width-collapsing decorations | Accepted, superseded in part by 0014 | 2026-02-17 |
| [0014](0014-ulysses-style-table-presentation.md) | Present tables Ulysses-style, with save-time column alignment | Accepted | 2026-02-17 |
| [0015](0015-presentation-mode-stops-writing-color-customizations.md) | Presentation mode stops writing colour customizations and announces itself at startup | Accepted | 2026-03-16 |
| [0016](0016-image-previews-augment-rather-than-replace-syntax.md) | Inline image previews augment the source instead of replacing it | Accepted | 2026-03-16 |
| [0017](0017-route-diagnostics-to-an-output-channel.md) | Route diagnostics to a Calliope output channel instead of the console | Accepted | 2026-07-06 |
| [0019](0019-scope-mermaid-caches-by-document-and-theme.md) | Key mermaid caches by document, theme and content | Accepted | 2026-07-06 |
| [0018](0018-bundle-one-copy-of-beautiful-mermaid.md) | Load beautiful-mermaid through a single specifier and minify on prepublish | Accepted | 2026-08-20 |

## Threads worth following

**The decoration ceiling.** 0001 forbids document edits, so everything downstream is styling. 0004 fakes hiding with CSS, 0012 fakes font size the same way, 0014 fakes borders and right-alignment. Each works; none is a documented API contract.

**Layout shift is the recurring enemy.** 0005 repaints on viewport change; 0004 shifts layout when it hides text. Together they close a loop. It surfaced as table shimmer (0013), was worked around with width-preserving decorations (0014), and appeared again as a Mermaid render loop (0007).

**Mermaid went out and came back.** 0007 chose a Node-only renderer, 0009 traded it for full diagram coverage at the price of a webview, 0011 decided the price was too high and reverted within a day. 0018 and 0019 then fixed what the round trip left behind: two copies of the library in the bundle, and a cache key that ignored the theme.

**Two decisions bent the house rules deliberately.** 0014 edits document text to align columns; 0016 keeps image syntax permanently visible. Both are documented exceptions, not drift.

## Adding a record

Number sequentially, name the file `NNNN-kebab-title.md`, and add a row above. If a record replaces an earlier one, set the old record's status to `Superseded by ADR-NNNN` and leave its text intact — a superseded record is still the reason the current design looks the way it does.
