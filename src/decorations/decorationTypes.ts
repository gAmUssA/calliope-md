import * as vscode from 'vscode';

export interface DecorationTypes {
  // Headers
  h1Content: vscode.TextEditorDecorationType;
  h2Content: vscode.TextEditorDecorationType;
  h3Content: vscode.TextEditorDecorationType;
  h4Content: vscode.TextEditorDecorationType;
  h5Content: vscode.TextEditorDecorationType;
  h6Content: vscode.TextEditorDecorationType;
  syntaxHidden: vscode.TextEditorDecorationType;
  syntaxGhost: vscode.TextEditorDecorationType;

  // Emphasis
  bold: vscode.TextEditorDecorationType;
  italic: vscode.TextEditorDecorationType;
  boldItalic: vscode.TextEditorDecorationType;
  strikethrough: vscode.TextEditorDecorationType;

  // Task lists
  taskCheckbox: vscode.TextEditorDecorationType;
  taskCompletedLine: vscode.TextEditorDecorationType;

  // Inline code
  inlineCode: vscode.TextEditorDecorationType;

  // Links
  linkText: vscode.TextEditorDecorationType;

  // Phase 2: Blockquotes
  blockquoteBorder: vscode.TextEditorDecorationType;
  blockquoteMarkerDim: vscode.TextEditorDecorationType;

  // Phase 2: Horizontal rules
  horizontalRule: vscode.TextEditorDecorationType;

  // Phase 2: Fenced code blocks
  codeFenceDim: vscode.TextEditorDecorationType;

  // Phase 2: Images
  imagePreview: vscode.TextEditorDecorationType;

  // Phase 2: Lists
  listBullet: vscode.TextEditorDecorationType;
  listNumber: vscode.TextEditorDecorationType;
}

export function createDecorationTypes(ghostOpacity: number): DecorationTypes {
  return {
    // Headers - subtle size increases for distraction-free writing
    // Goal: noticeable hierarchy without being jarring
    h1Content: vscode.window.createTextEditorDecorationType({
      fontWeight: 'bold',
      textDecoration: 'none; font-size: 1.15em;',
    }),
    h2Content: vscode.window.createTextEditorDecorationType({
      fontWeight: 'bold',
      textDecoration: 'none; font-size: 1.1em;',
    }),
    h3Content: vscode.window.createTextEditorDecorationType({
      fontWeight: 'bold',
      textDecoration: 'none; font-size: 1.05em;',
    }),
    h4Content: vscode.window.createTextEditorDecorationType({
      fontWeight: 'bold',
      // No size increase, just bold
    }),
    h5Content: vscode.window.createTextEditorDecorationType({
      fontWeight: '600',
      // Slightly lighter bold
    }),
    h6Content: vscode.window.createTextEditorDecorationType({
      fontWeight: '600',
      opacity: '0.85',
      // Subtle dimming for lowest level
    }),

    // Syntax hiding: makes text invisible and collapses width
    syntaxHidden: vscode.window.createTextEditorDecorationType({
      opacity: '0',
      letterSpacing: '-1000px',
    }),

    // Syntax ghost: subtle hint that markup exists
    syntaxGhost: vscode.window.createTextEditorDecorationType({
      opacity: ghostOpacity.toString(),
    }),

    // Emphasis styles
    bold: vscode.window.createTextEditorDecorationType({
      fontWeight: 'bold',
    }),
    italic: vscode.window.createTextEditorDecorationType({
      fontStyle: 'italic',
    }),
    boldItalic: vscode.window.createTextEditorDecorationType({
      fontWeight: 'bold',
      fontStyle: 'italic',
    }),
    strikethrough: vscode.window.createTextEditorDecorationType({
      textDecoration: 'line-through',
    }),

    // Task list styles
    taskCheckbox: vscode.window.createTextEditorDecorationType({
      // Checkbox replacement handled via before pseudo-element in decoration options
    }),
    taskCompletedLine: vscode.window.createTextEditorDecorationType({
      textDecoration: 'line-through',
      opacity: '0.6',
    }),

    // Inline code style
    inlineCode: vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('textCodeBlock.background'),
      borderRadius: '3px',
    }),

    // Link text style
    linkText: vscode.window.createTextEditorDecorationType({
      color: new vscode.ThemeColor('textLink.foreground'),
      textDecoration: 'underline',
    }),

    // Phase 2: Blockquotes
    blockquoteBorder: vscode.window.createTextEditorDecorationType({
      borderLeft: '3px solid',
      borderColor: new vscode.ThemeColor('textBlockQuote.border'),
      backgroundColor: new vscode.ThemeColor('textBlockQuote.background'),
      isWholeLine: true,
    }),
    blockquoteMarkerDim: vscode.window.createTextEditorDecorationType({
      opacity: '0.4',
    }),

    // Phase 2: Horizontal rules
    horizontalRule: vscode.window.createTextEditorDecorationType({
      borderBottom: '1px solid',
      borderColor: new vscode.ThemeColor('editorLineNumber.foreground'),
      isWholeLine: true,
    }),

    // Phase 2: Fenced code blocks
    codeFenceDim: vscode.window.createTextEditorDecorationType({
      opacity: ghostOpacity.toString(),
    }),

    // Phase 2: Images
    imagePreview: vscode.window.createTextEditorDecorationType({
      // Image preview handled via before/after pseudo-elements
    }),

    // Phase 2: Lists
    listBullet: vscode.window.createTextEditorDecorationType({
      // Bullet replacement handled via before pseudo-element
    }),
    listNumber: vscode.window.createTextEditorDecorationType({
      fontWeight: '600',
    }),
  };
}

export function disposeDecorationTypes(types: DecorationTypes): void {
  Object.values(types).forEach(type => type.dispose());
}
