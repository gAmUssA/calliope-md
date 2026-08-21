# 1. Render Markdown inline with editor decorations, never document edits

- **Status:** Accepted
- **Date:** 2026-02-01

## Context

Calliope's goal is a Ulysses-style hybrid Markdown editor: content renders in place while the file on disk stays plain Markdown. VS Code offers no API for a WYSIWYG text buffer, so the rendering has to be layered on top of a normal `TextDocument`. Two families of approach were available:

- Mutate the document (replace `# ` with nothing, substitute glyphs, fold ranges) and reverse the edit when the cursor arrives.
- Leave the buffer untouched and change only how it is painted, via `TextEditorDecorationType`.

Anything that writes to the buffer pollutes undo/redo history, produces spurious `git diff` output, fights other extensions and formatters, and risks corrupting the user's file if the extension crashes mid-transform.

## Decision

All rendering is purely visual and applied through the VS Code decoration API. The extension never edits document text in order to render it.

Text is edited only in response to explicit user actions: toggling a task checkbox (`[ ]` <-> `[x]`), the `Calliope: Format Tables` command and its save hook, and `Calliope: One Sentence Per Line`. These are user-invoked commands, not rendering.

## Consequences

- Undo/redo, git diffs, and interoperability with other extensions are unaffected by rendering.
- The rendered view is bounded by what decorations can express. There is no reflow, no true block layout, and no way to remove a line from the flow — only styling, opacity, spacing, and `before`/`after` attachments. Every later rendering decision is constrained by this ceiling.
- Hiding syntax has to be faked with CSS-ish tricks rather than removal; see ADR-0004.
- Rich content (images, Mermaid diagrams) can only be injected through `contentIconPath` on a pseudo-element; see ADR-0007.
- Because the source is always intact, the three-state visibility model of ADR-0003 is possible at all: raw text is always there to reveal.
