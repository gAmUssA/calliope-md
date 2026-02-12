## Context

Headers currently use em-based font sizes with tiny increments: H1=1.15em, H2=1.1em, H3=1.05em, H4-H6=1.0em. The 5% gap between levels is imperceptible, especially once the `#` markers are hidden. User feedback confirms the hierarchy is unreadable.

The existing spec already called for absolute pixel sizes (28px/24px/20px) but the implementation used conservative em values instead. VS Code's decoration API supports font-size via the `textDecoration` CSS hack (`textDecoration: 'none; font-size: 1.5em;'`).

## Goals / Non-Goals

**Goals:**
- Make H1, H2, H3 visually distinct from each other and from body text at a glance
- Maintain a comfortable reading experience (not jarring or overly large)
- Keep relative em units so sizes scale with the user's configured editor font size

**Non-Goals:**
- Adding line-height adjustments (VS Code's decoration API does not reliably support `line-height` via CSS hacks — larger text will naturally occupy its space)
- Changing H5/H6 styling (weight/opacity differentiation is sufficient for rarely-used levels)
- Adding color differentiation for heading levels

## Decisions

### Decision 1: Use larger em-based scale with clear gaps

New values:
| Level | Current | New | Gap from next |
|-------|---------|-----|---------------|
| H1 | 1.15em | 1.5em | +0.15em |
| H2 | 1.1em | 1.35em | +0.15em |
| H3 | 1.05em | 1.2em | +0.1em |
| H4 | 1.0em | 1.1em | — |
| H5 | 1.0em | 1.0em | — |
| H6 | 1.0em | 1.0em | — |

**Rationale**: Consistent 0.15em gaps between H1-H3 make levels clearly distinguishable. H4 gets a small bump (1.1em) so it still reads as a heading vs body text. The scale stays in em units so it respects the user's font size preference. These values are comparable to typical browser heading scales (H1=2em, H2=1.5em, H3=1.17em) but moderated for an editor context where readability over long sessions matters more than document presentation.

**Alternative considered**: Absolute pixel sizes (28px/24px/20px as in spec). Rejected because px values don't scale with the user's configured editor font size, breaking the distraction-free experience for users who prefer larger or smaller fonts.

### Decision 2: Keep the textDecoration CSS hack

Continue using `textDecoration: 'none; font-size: Xem;'` for size changes. This is the only reliable way to set font size via VS Code decoration API. No change to the approach, just the values.

## Risks / Trade-offs

- **[Text overlap at large sizes]** → At 1.5em, H1 text may clip adjacent lines in tight line-height configurations. This is a known VS Code limitation — users can increase `editor.lineHeight` if needed. The sizes chosen are moderate enough to avoid clipping at default settings.
- **[Subjective sizing]** → Font size perception varies by font family. The chosen scale works well with common monospace fonts (Fira Code, JetBrains Mono, Cascadia Code). Edge cases with unusual fonts are acceptable.
