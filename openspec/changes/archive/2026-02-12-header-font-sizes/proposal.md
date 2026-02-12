## Why

When Calliope hides the `#` markers, users lose the primary visual cue for heading hierarchy. The current replacement font sizes (H1: 1.15em, H2: 1.1em, H3: 1.05em) are too subtle — a 5% difference between adjacent levels is barely perceptible. Users report they "can't make visual sense of the preview" because heading levels all look the same size. The existing spec already calls for 28px/24px/20px but the implementation drifted to near-identical em values.

## What Changes

- Increase H1–H3 font sizes to create a clearly visible hierarchy (e.g., H1: 1.5em, H2: 1.3em, H3: 1.15em)
- Add proportional line-height values to prevent text overlap at larger sizes
- Give H4 a modest size increase (currently 1.0em) so it remains distinguishable from body text
- Keep H5/H6 at base size with weight/opacity differentiation (current behavior is adequate)

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `header-rendering`: Font size values for H1–H4 increase significantly to establish a readable visual hierarchy when `#` markers are hidden

## Impact

- `src/decorations/decorationTypes.ts` — Update font size and line-height values in header decoration type definitions
- No dependency changes, no API changes, no new files
