---
# vscode-calliope-md-amin
title: Text edits only re-decorate the active editor
status: completed
type: bug
priority: high
created_at: 2026-08-21T03:34:34Z
updated_at: 2026-08-21T03:41:12Z
---

`onDidChangeTextDocument` (src/extension.ts:71-77) re-decorates only
`vscode.window.activeTextEditor`:

    const editor = vscode.window.activeTextEditor;
    if (editor && event.document === editor.document && ...) {
      triggerUpdateDecorations(editor);
    }

It is the only text-change handler in src/, and decorations are applied per
editor (`editor.setDecorations`), so any other visible editor showing the same
document never recomputes.

**Why it is visible, not just stale.** No decoration sets `rangeBehavior`, so
they use the VS Code default `OpenOpen` — ranges *grow* when text is inserted at
their edges. `syntaxHidden` is `opacity: '0'` plus `letterSpacing: '-1000px'`,
i.e. invisible and zero-width. In a split view of the same markdown file, typing
next to a hidden marker in the focused pane extends that hidden range in the
unfocused pane, where nothing recomputes it — so the newly typed text is
rendered invisible and zero-width there until that pane regains focus.

This is the same failure mode as the v0.8.3 bare-URL bug (658b810), where an
over-wide `syntaxHidden` range collapsed real content to zero width.

Also affected: a document edited while it is not the active editor at all — a
save-hook table format on another file, a source-control revert, or any
programmatic edit — re-decorates nothing.

**The fix is not just a loop.** `updateTimeout` in
src/decorations/decorationManager.ts:23 is a single module-level global, so
`for (const e of visibleTextEditors) triggerUpdateDecorations(e)` would have each
iteration clear the previous one's timer and only the last editor would refresh.
Two existing call sites (theme change, config change) already avoid this by
calling `updateDecorationsImmediate` in the loop, with comments saying why.

Either debounce per editor (a Map keyed by document URI) or follow the existing
convention and use immediate updates in the loop.

[ ] Re-decorate every visible editor whose document changed, not just the active one
[ ] Make the debounce per-editor, or use updateDecorationsImmediate in the loop
[ ] Regression test: two editors on one document, edit via one, assert the other re-decorates
