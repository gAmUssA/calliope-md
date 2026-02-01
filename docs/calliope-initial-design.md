# Calliope - Ulysses-Style Hybrid Markdown Editor for VS Code

*Named after Calliope (Καλλιόπη), the Greek Muse of eloquence and epic poetry — "she of the beautiful voice." Inspired by the Ulysses app for Mac.*

## Project Overview

Build a VS Code extension called **Calliope** that provides Ulysses-style hybrid WYSIWYG Markdown editing. The extension renders Markdown inline within VS Code's native text editor using the decoration API - NOT a separate preview pane. Users edit raw Markdown, but it renders in place: headers appear larger, bold text appears bold, completed tasks show strikethrough, and syntax markers (`**`, `#`, etc.) hide until the cursor enters them.

**Core Philosophy**: Never modify the document. All rendering is purely visual via decorations. The underlying Markdown source remains untouched, preserving undo/redo, git diffs, and compatibility with other extensions.

## Technical Foundation

VS Code's April 2025 release added **variable line height support** via the `lineHeight` property in decoration options. This was the missing piece that makes true inline WYSIWYG possible - headers can now render larger without overlapping following lines.

### Key APIs to Use
- `TextEditorDecorationType` - define visual styles
- `DecorationRenderOptions` - configure colors, fonts, before/after content
- `editor.setDecorations()` - apply decorations to ranges
- `lineHeight` property (new) - override line height per decoration
- `before`/`after` pseudo-elements - inject content like checkboxes
- Text hiding technique: `opacity: '0'` + `letterSpacing: '-1000px'`

### Parsing
Use **remark** with **remark-gfm** for Markdown parsing. It provides exact position information (line/column/offset) for every AST node, essential for decoration placement.

```bash
npm install unified remark-parse remark-gfm unist-util-visit
```

## Three-State Visibility Model (Critical UX Feature)

Implement a three-state system for syntax markers:

1. **Rendered** (cursor elsewhere): Syntax completely hidden, content appears formatted
2. **Ghost** (cursor on same line): Syntax at 30% opacity - subtle hint markup exists
3. **Raw** (cursor inside construct): Full syntax visible for editing

Example: For `**bold text**`
- Rendered: Shows "bold text" in bold, no asterisks visible
- Ghost: Shows "**bold text**" with ** at 30% opacity
- Raw: Shows "**bold text**" with ** at full opacity when cursor is between the asterisks

## Markdown Elements to Support

### Phase 1 - Core Elements

#### Headers (H1-H6)
- Render with progressively larger/bolder fonts
- H1: 28px bold, H2: 24px bold, H3: 20px bold, etc.
- Use `lineHeight` decoration property for proper spacing
- Hide `#` markers in rendered/ghost states
- Show `#` markers when cursor is on the header line

#### Bold and Italic
- `**text**` renders as **bold**
- `*text*` or `_text_` renders as *italic*
- `***text***` renders as ***bold italic***
- Hide syntax markers using three-state model

#### Strikethrough
- `~~text~~` renders with line-through
- Hide `~~` markers per visibility model

#### Task Lists (Priority Feature)
```markdown
- [ ] Uncompleted task
- [x] Completed task
```
- Replace `- [ ]` with ☐ checkbox character
- Replace `- [x]` with ☑ checkbox character  
- **Completed tasks get strikethrough on the entire line** and 60% opacity
- Make checkboxes clickable to toggle state (actually edit the document `[ ]` ↔ `[x]`)
- Hide the `- [ ]` / `- [x]` syntax, show checkbox instead

#### Inline Code
- `` `code` `` renders with background highlight and monospace font
- Use theme color `textCodeBlock.background`
- Hide backticks in rendered state

#### Links
- `[text](url)` shows "text" as clickable link
- Hide `](url)` portion in rendered state
- Style link text with underline and `textLink.foreground` color
- Ctrl+click to open URL (implement DocumentLinkProvider)
- Show URL in hover tooltip

### Phase 2 - Extended Elements

#### Blockquotes
- Lines starting with `>` get left border and subtle background
- Dim the `>` character rather than hiding completely

#### Horizontal Rules
- `---`, `***`, `___` render as visual separator line
- Use border-bottom decoration spanning full width

#### Fenced Code Blocks
- Style the opening ``` line distinctly
- Preserve VS Code's native syntax highlighting inside
- Consider dimming the fence markers

#### Images
- `![alt](path)` shows inline preview using `contentIconPath`
- Constrain to reasonable width (200-400px)
- Show full image on hover
- Fall back to placeholder if image not found

#### Lists (Ordered/Unordered)
- Replace `-`, `*`, `+` with proper bullet character •
- Show numbers for ordered lists with proper styling
- Handle nested indentation

### Phase 3 - Advanced (Future)

- Tables with grid styling
- Footnotes
- Math/LaTeX rendering
- Mermaid diagram preview

## Project Structure

```
calliope-md/
├── package.json
├── tsconfig.json
├── src/
│   ├── extension.ts              # Entry point, activation, event subscriptions
│   ├── parser/
│   │   ├── markdownParser.ts     # Remark-based parsing
│   │   ├── parseCache.ts         # Version-keyed AST cache
│   │   └── types.ts              # Parsed element interfaces
│   ├── decorations/
│   │   ├── decorationManager.ts  # Orchestrates all decoration types
│   │   ├── decorationTypes.ts    # TextEditorDecorationType definitions
│   │   ├── visibilityState.ts    # Three-state logic
│   │   └── elements/
│   │       ├── headers.ts
│   │       ├── emphasis.ts       # Bold, italic, strikethrough
│   │       ├── taskLists.ts
│   │       ├── links.ts
│   │       ├── code.ts
│   │       └── images.ts
│   ├── providers/
│   │   ├── linkProvider.ts       # DocumentLinkProvider for Ctrl+click
│   │   ├── hoverProvider.ts      # URL/image previews
│   │   └── codeActionProvider.ts # Quick fixes if needed
│   └── handlers/
│       ├── checkboxToggle.ts     # Click-to-toggle task completion
│       └── cursorTracker.ts      # Selection change handling
├── test/
│   └── suite/
└── .vscodeignore
```

## Implementation Requirements

### package.json Configuration

```json
{
  "name": "calliope-md",
  "displayName": "Calliope - Hybrid Markdown Editor",
  "description": "Ulysses-style inline Markdown rendering. Write in Markdown, see it rendered — syntax hides until you need it.",
  "version": "0.1.0",
  "engines": { "vscode": "^1.96.0" },
  "categories": ["Other", "Formatters"],
  "activationEvents": ["onLanguage:markdown"],
  "main": "./out/extension.js",
  "contributes": {
    "configuration": {
      "title": "Calliope",
      "properties": {
        "calliope.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable Calliope inline rendering"
        },
        "calliope.ghostOpacity": {
          "type": "number",
          "default": 0.3,
          "description": "Opacity for syntax markers in ghost state (0-1)"
        },
        "calliope.renderHeaders": { "type": "boolean", "default": true },
        "calliope.renderEmphasis": { "type": "boolean", "default": true },
        "calliope.renderTaskLists": { "type": "boolean", "default": true },
        "calliope.renderLinks": { "type": "boolean", "default": true },
        "calliope.renderInlineCode": { "type": "boolean", "default": true }
      }
    },
    "commands": [
      {
        "command": "calliope.toggle",
        "title": "Calliope: Toggle Inline Rendering"
      },
      {
        "command": "calliope.toggleCheckbox",
        "title": "Calliope: Toggle Task Checkbox"
      }
    ]
  }
}
```

### Critical Implementation Details

#### Decoration Type Creation (do once at activation)
```typescript
// Create once, reuse always - don't recreate per update
const decorationTypes = {
  h1: vscode.window.createTextEditorDecorationType({
    fontWeight: 'bold',
    textDecoration: 'none; font-size: 28px;',
    lineHeight: 42
  }),
  h1SyntaxHidden: vscode.window.createTextEditorDecorationType({
    opacity: '0',
    letterSpacing: '-1000px'
  }),
  h1SyntaxGhost: vscode.window.createTextEditorDecorationType({
    opacity: '0.3'
  }),
  // ... more types
};
```

#### Debounced Updates
```typescript
// Debounce decoration updates to 150ms
let updateTimeout: NodeJS.Timeout | undefined;

function triggerUpdateDecorations(editor: vscode.TextEditor) {
  if (updateTimeout) clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => updateDecorations(editor), 150);
}
```

#### Viewport-Only Rendering
```typescript
function getVisibleRangeWithBuffer(editor: vscode.TextEditor): vscode.Range {
  const visible = editor.visibleRanges[0];
  const buffer = 50; // lines
  return new vscode.Range(
    Math.max(0, visible.start.line - buffer), 0,
    Math.min(editor.document.lineCount - 1, visible.end.line + buffer),
    Number.MAX_SAFE_INTEGER
  );
}
```

#### Theme-Compatible Colors
```typescript
// Always use ThemeColor, never hardcoded values
color: new vscode.ThemeColor('textLink.foreground')
backgroundColor: new vscode.ThemeColor('textCodeBlock.background')
```

#### Checkbox Toggle Handler
```typescript
// When user clicks a checkbox decoration, toggle the actual document
async function toggleCheckbox(editor: vscode.TextEditor, line: number) {
  const lineText = editor.document.lineAt(line).text;
  const uncheckedMatch = lineText.match(/^(\s*-\s*)\[ \]/);
  const checkedMatch = lineText.match(/^(\s*-\s*)\[x\]/i);
  
  if (uncheckedMatch) {
    // Replace [ ] with [x]
    const start = new vscode.Position(line, uncheckedMatch[1].length);
    const end = new vscode.Position(line, uncheckedMatch[1].length + 3);
    await editor.edit(edit => edit.replace(new vscode.Range(start, end), '[x]'));
  } else if (checkedMatch) {
    // Replace [x] with [ ]
    const start = new vscode.Position(line, checkedMatch[1].length);
    const end = new vscode.Position(line, checkedMatch[1].length + 3);
    await editor.edit(edit => edit.replace(new vscode.Range(start, end), '[ ]'));
  }
}
```

### Event Subscriptions Required

```typescript
export function activate(context: vscode.ExtensionContext) {
  // Initial decoration for active editor
  if (vscode.window.activeTextEditor) {
    triggerUpdateDecorations(vscode.window.activeTextEditor);
  }

  // Document changes - re-parse and re-decorate
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      const editor = vscode.window.activeTextEditor;
      if (editor && event.document === editor.document) {
        triggerUpdateDecorations(editor);
      }
    })
  );

  // Cursor movement - update visibility states
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(event => {
      updateVisibilityStates(event.textEditor);
    })
  );

  // Scroll - update viewport decorations
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorVisibleRanges(event => {
      triggerUpdateDecorations(event.textEditor);
    })
  );

  // Editor switch
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor?.document.languageId === 'markdown') {
        triggerUpdateDecorations(editor);
      }
    })
  );
}
```

## Testing Checklist

Create a test Markdown file with all supported elements:

```markdown
# Heading 1
## Heading 2
### Heading 3

This is **bold text** and this is *italic text* and this is ***bold italic***.

This has ~~strikethrough~~ text.

## Task Lists

- [ ] Uncompleted task should show checkbox
- [x] Completed task should show checked box AND strikethrough
- [ ] Another uncompleted task
- [x] Another completed task with strikethrough

## Links and Code

Here's a [link to Google](https://google.com) that should be clickable.

Here's some `inline code` with background.

## Complex Nesting

- [ ] Task with **bold** and `code` inside
- [x] ~~Completed~~ task that is **also bold**
```

### Test Scenarios

1. **Cursor on header line**: `#` should appear at 30% opacity (ghost)
2. **Cursor inside bold text**: `**` markers should be fully visible
3. **Cursor on different line**: All syntax hidden, content rendered
4. **Click checkbox**: Should toggle between `[ ]` and `[x]`
5. **Completed task**: Entire line should have strikethrough
6. **Ctrl+click link**: Should open URL in browser
7. **Hover link**: Should show URL tooltip
8. **Large file**: Should remain responsive (test with 1000+ lines)
9. **Rapid typing**: No flickering or lag
10. **Theme switch**: Colors should update appropriately

## Development Commands

```bash
# Initialize project
npm init -y
npm install -D typescript @types/vscode @types/node esbuild

# Install parsing dependencies  
npm install unified remark-parse remark-gfm unist-util-visit

# Compile
npm run compile

# Watch mode
npm run watch

# Package extension
npx vsce package
```

## Success Criteria

1. Headers render at larger sizes with proper line height
2. Bold/italic text displays correctly with hidden syntax
3. Task lists show visual checkboxes with strikethrough on completed items
4. Three-state visibility works smoothly (rendered → ghost → raw)
5. No document modifications - purely decorative
6. Performance: <50ms decoration update, smooth scrolling in large files
7. Theme compatibility: respects light/dark themes
8. All standard VS Code features still work (undo, find/replace, snippets, etc.)

## Reference Resources

- **markdown-inline-editor-vscode**: https://github.com/SeardnaSchmid/markdown-inline-editor-vscode - Study their three-state implementation
- **VS Code Decoration API**: https://code.visualstudio.com/api/references/vscode-api#TextEditorDecorationType
- **Variable line height issue**: https://github.com/microsoft/vscode/issues/131274
- **Remark documentation**: https://github.com/remarkjs/remark

## Implementation Order

1. **Setup**: Project scaffolding, TypeScript config, build scripts
2. **Parser**: Remark integration with position extraction
3. **Basic decorations**: Headers only, no hiding yet
4. **Three-state system**: Cursor tracking and visibility states  
5. **Emphasis**: Bold, italic, strikethrough with visibility
6. **Task lists**: Checkboxes, strikethrough for completed, click toggle
7. **Links**: Styling, hiding URL, DocumentLinkProvider
8. **Inline code**: Background, monospace styling
9. **Polish**: Configuration, commands, performance optimization
10. **Extended elements**: Images, blockquotes, code blocks