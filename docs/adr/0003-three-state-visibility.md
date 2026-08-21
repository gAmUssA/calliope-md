# 3. Three-state visibility driven by cursor position

- **Status:** Accepted
- **Date:** 2026-02-01

## Context

A hybrid editor has to answer one question continuously: when does the user see formatted output and when do they see Markdown source? Always showing source defeats the purpose. Always hiding it makes editing guesswork — the user cannot tell whether they are inside `**bold**` or past its closing marker.

Ulysses solves this by progressive disclosure keyed to where the caret is.

## Decision

Every syntax marker is in exactly one of three states, chosen by the cursor's position relative to the construct:

| State | Condition | Appearance |
|---|---|---|
| Rendered | cursor is not on the construct's line | markers hidden, content formatted |
| Ghost | cursor is on the line but outside the markers | markers at `calliope.ghostOpacity` (default 0.3) |
| Raw | cursor is inside the construct | markers at full opacity |

The logic is centralised in `src/decorations/visibilityState.ts` (`getVisibilityState`, `getCursorPositions`) and every element handler calls it rather than reimplementing the rule. Multiple cursors are evaluated independently; a construct is raw if any cursor is inside it.

## Consequences

- The rule is uniform across headings, emphasis, links, code, blockquotes, fences, frontmatter and Mermaid blocks, so new element types get correct behaviour by calling one function.
- Cursor movement must repaint decorations, and it must do so without re-parsing — this is why the AST cache in ADR-0005 is keyed on document version rather than invalidated on every event.
- Selection changes drive both visibility and click handling. Because both ran on every `onDidChangeTextEditorSelection`, keyboard navigation once toggled task checkboxes; the click handlers now filter on `TextEditorSelectionChangeKind.Mouse` while visibility still updates on every kind.
- Granularity is per element, not per document. Tables deliberately apply the rule per row rather than per table, because forcing a 20-row table into raw mode to edit one cell is jarring (ADR-0013).
- Not every element obeys it. Blockquote markers are dimmed rather than hidden at all states so nesting depth stays legible, and image syntax is always visible (ADR-0016).
