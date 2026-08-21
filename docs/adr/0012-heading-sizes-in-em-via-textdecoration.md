# 12. Size headings in em units through the textDecoration CSS hack

- **Status:** Accepted
- **Date:** 2026-02-12

## Context

Once ADR-0004 hides the `#` markers, font size is the only remaining cue for heading level. The shipped scale was H1 1.15em, H2 1.1em, H3 1.05em — 5% between adjacent levels, imperceptible in practice. Users reported they could not make visual sense of the rendered document.

The original spec had called for absolute sizes (28px/24px/20px). The decoration API has no `fontSize` property; size can only be set by injecting CSS through `textDecoration: 'none; font-size: Xem;'`.

## Decision

Keep the `textDecoration` injection technique and widen the scale, in `em` rather than `px`:

| Level | Before | After |
|---|---|---|
| H1 | 1.15em | 1.5em |
| H2 | 1.1em | 1.35em |
| H3 | 1.05em | 1.2em |
| H4 | 1.0em | 1.1em |
| H5, H6 | 1.0em | 1.0em (weight and opacity only) |

`em` was chosen over the spec's `px` so headings scale with the user's configured editor font size; fixed pixels would break for anyone who prefers larger or smaller text.

Line height is explicitly not adjusted. The decoration API does not reliably honour `line-height` through this channel, so larger text is left to occupy its natural space and the chosen sizes are moderate enough to avoid clipping at default settings.

## Consequences

- Heading hierarchy is legible at a glance without the `#` markers.
- Sizes track the user's font size preference, so the distraction-free experience survives a font size change.
- The `textDecoration` injection is not a supported API contract. It is used widely and is stable in practice, but a change in how VS Code applies decoration CSS would silently flatten all heading sizes.
- At 1.5em with a tight `editor.lineHeight`, H1 text can crowd adjacent lines. This is a known VS Code limitation and the accepted remedy is for the user to raise `editor.lineHeight`.
- Perceived size varies with font family; the scale was tuned against common monospace fonts.
