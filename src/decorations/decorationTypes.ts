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
  inlineCodeTypescript: vscode.TextEditorDecorationType;
  inlineCodeLanguagePrefix: vscode.TextEditorDecorationType;

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

  // Mermaid diagrams
  mermaidDiagramRendered: vscode.TextEditorDecorationType;
  mermaidDiagramGhost: vscode.TextEditorDecorationType;
  mermaidDiagramError: vscode.TextEditorDecorationType;

  // Metadata/frontmatter
  metadataDim: vscode.TextEditorDecorationType;

  // Tables
  tableHeaderCell: vscode.TextEditorDecorationType;
  tableBodyCell: vscode.TextEditorDecorationType;
  tableSeparatorLine: vscode.TextEditorDecorationType;
}

export function createDecorationTypes(ghostOpacity: number): DecorationTypes {
  return {
    // Headers - clear size progression for readable hierarchy
    h1Content: vscode.window.createTextEditorDecorationType({
      fontWeight: 'bold',
      textDecoration: 'none; font-size: 1.5em;',
    }),
    h2Content: vscode.window.createTextEditorDecorationType({
      fontWeight: 'bold',
      textDecoration: 'none; font-size: 1.35em;',
    }),
    h3Content: vscode.window.createTextEditorDecorationType({
      fontWeight: 'bold',
      textDecoration: 'none; font-size: 1.2em;',
    }),
    h4Content: vscode.window.createTextEditorDecorationType({
      fontWeight: 'bold',
      textDecoration: 'none; font-size: 1.1em;',
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
    inlineCodeTypescript: vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('textCodeBlock.background'),
      color: new vscode.ThemeColor('variable.other.readwrite.ts'),
      borderRadius: '3px',
    }),
    inlineCodeLanguagePrefix: vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('textCodeBlock.background'),
      opacity: '0.5',
      fontStyle: 'italic',
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

    // Mermaid diagrams
    mermaidDiagramRendered: vscode.window.createTextEditorDecorationType({
      opacity: '0',
      letterSpacing: '-1000px',
    }),
    mermaidDiagramGhost: vscode.window.createTextEditorDecorationType({
      opacity: ghostOpacity.toString(),
    }),
    mermaidDiagramError: vscode.window.createTextEditorDecorationType({
      color: new vscode.ThemeColor('errorForeground'),
    }),

    // Metadata/frontmatter - dim to distinguish from content
    metadataDim: vscode.window.createTextEditorDecorationType({
      opacity: '0.6',
      isWholeLine: true,
    }),

    // Tables
    tableHeaderCell: vscode.window.createTextEditorDecorationType({
      fontWeight: 'bold',
      backgroundColor: new vscode.ThemeColor('editorWidget.background'),
    }),
    tableBodyCell: vscode.window.createTextEditorDecorationType({
      // Unstyled — exists for clearing when renderTables is disabled
    }),
    tableSeparatorLine: vscode.window.createTextEditorDecorationType({
      // Very dim separator — avoids syntaxHidden's letterSpacing:-1000px
      // which causes layout shifts and shimmer
      opacity: '0.08',
    }),
  };
}

export function disposeDecorationTypes(types: DecorationTypes): void {
  Object.values(types).forEach(type => type.dispose());
}
