import * as vscode from 'vscode';
import {
  initializeDecorations,
  disposeDecorations,
  triggerUpdateDecorations,
  triggerUpdateDecorationsIfViewportChanged,
  updateDecorationsImmediate,
  toggleEnabled,
  setEnabled,
  isDecorationEnabled,
} from './decorations/decorationManager';
import { handleSelectionChange, setCursorChangeCallback } from './handlers/cursorTracker';
import { toggleCheckbox, detectCheckboxClick } from './handlers/checkboxToggle';
import { detectMermaidDiagramClick } from './handlers/mermaidClick';
import { MarkdownLinkProvider } from './providers/linkProvider';
import { MarkdownHoverProvider } from './providers/hoverProvider';
import { CopyCodeBlockHoverProvider, markRecentlyCopied } from './providers/copyCodeBlockProvider';
import { ImageHoverProvider } from './decorations/elements/images';
import { clearCache } from './parser/parseCache';
import { initializePresentationMode, disposePresentationMode, togglePresentationMode } from './presentationMode';
import { cleanupUnusedSvgFiles, clearMermaidCaches, MermaidHoverProvider } from './decorations/elements/mermaidDiagrams';
import { formatTablesCommand, formatTablesInDocument, triggerAutoFormatTables, disposeAutoFormat } from './formatters/tableFormatter';
import { formatOsplCommand } from './formatters/osplFormatter';
import { getConfig } from './config';

// Re-export for testing
export { initializePresentationMode, togglePresentationMode } from './presentationMode';
export { detectCheckboxClick } from './handlers/checkboxToggle';
export { detectMermaidDiagramClick } from './handlers/mermaidClick';

let copyFlashDecoration: vscode.TextEditorDecorationType | undefined;
let copyFlashTimer: NodeJS.Timeout | undefined;

function flashCopyFeedback(editor: vscode.TextEditor, range: vscode.Range): void {
  if (!copyFlashDecoration) {
    copyFlashDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(80, 200, 120, 0.25)',
      isWholeLine: true,
    });
  }
  editor.setDecorations(copyFlashDecoration, [range]);
  if (copyFlashTimer) {
    clearTimeout(copyFlashTimer);
  }
  copyFlashTimer = setTimeout(() => {
    if (copyFlashDecoration) {
      editor.setDecorations(copyFlashDecoration, []);
    }
    copyFlashTimer = undefined;
  }, 300);
}

export function activate(context: vscode.ExtensionContext): void {
  // Initialize decoration types
  initializeDecorations();

  // Initialize presentation mode
  initializePresentationMode(context);

  // Set up cursor change callback for visibility updates
  setCursorChangeCallback((editor) => {
    updateDecorationsImmediate(editor);
  });

  // Initial decoration for active editor
  if (vscode.window.activeTextEditor?.document.languageId === 'markdown') {
    triggerUpdateDecorations(vscode.window.activeTextEditor);
  }

  // Document changes - re-parse and re-decorate
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && event.document === editor.document && event.document.languageId === 'markdown') {
        triggerUpdateDecorations(editor);
        // Cleanup unused mermaid SVG files periodically
        cleanupUnusedSvgFiles();
      }
    })
  );

  // Cursor movement - update visibility states
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((event) => {
      if (event.textEditor.document.languageId === 'markdown') {
        // Check for checkbox click (mouse only)
        detectCheckboxClick(event.textEditor, event.kind);

        // Check for mermaid diagram click (mouse only)
        detectMermaidDiagramClick(event.textEditor, event.kind);

        // Handle visibility state changes
        handleSelectionChange(event);
      }
    })
  );

  // Scroll - update viewport decorations only when scrolling outside the
  // already-rendered buffered range (prevents flicker on scroll-stop).
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
      if (event.textEditor.document.languageId === 'markdown') {
        triggerUpdateDecorationsIfViewportChanged(event.textEditor);
      }
    })
  );

  // Editor switch
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor?.document.languageId === 'markdown') {
        triggerUpdateDecorations(editor);
      }
    })
  );

  // Configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('calliope')) {
        // Reinitialize decorations with new config
        disposeDecorations();
        initializeDecorations();

        // Re-apply to active editor
        if (vscode.window.activeTextEditor?.document.languageId === 'markdown') {
          triggerUpdateDecorations(vscode.window.activeTextEditor);
        }
      }
    })
  );

  // Register internal command for async decoration updates (used by mermaid rendering)
  context.subscriptions.push(
    vscode.commands.registerCommand('calliope.internal.updateDecorations', () => {
      if (vscode.window.activeTextEditor?.document.languageId === 'markdown') {
        triggerUpdateDecorations(vscode.window.activeTextEditor);
      }
    })
  );

  // Register toggle command
  context.subscriptions.push(
    vscode.commands.registerCommand('calliope.toggle', () => {
      const newState = toggleEnabled();
      vscode.window.showInformationMessage(
        `Calliope inline rendering ${newState ? 'enabled' : 'disabled'}`
      );

      // Update active editor
      if (vscode.window.activeTextEditor?.document.languageId === 'markdown') {
        triggerUpdateDecorations(vscode.window.activeTextEditor);
      }
    })
  );

  // Register checkbox toggle command
  context.subscriptions.push(
    vscode.commands.registerCommand('calliope.toggleCheckbox', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor?.document.languageId === 'markdown') {
        toggleCheckbox(editor);
      }
    })
  );

  // Register DocumentLinkProvider for Ctrl+click links
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      { language: 'markdown' },
      new MarkdownLinkProvider()
    )
  );

  // Register HoverProvider for link URL tooltips
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { language: 'markdown' },
      new MarkdownHoverProvider()
    )
  );

  // Register HoverProvider for image previews
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { language: 'markdown' },
      new ImageHoverProvider()
    )
  );

  // Register HoverProvider for mermaid ASCII diagrams
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { language: 'markdown' },
      new MermaidHoverProvider()
    )
  );

  // Register HoverProvider for code block copy button
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { language: 'markdown' },
      new CopyCodeBlockHoverProvider()
    )
  );

  // Register internal command for copying a code block range to clipboard
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'calliope.internal.copyCodeBlock',
      async (startLine: number, endLine: number) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
          return;
        }
        const doc = editor.document;
        if (
          typeof startLine !== 'number' ||
          typeof endLine !== 'number' ||
          startLine < 0 ||
          endLine < startLine ||
          endLine >= doc.lineCount
        ) {
          return;
        }
        const start = new vscode.Position(startLine, 0);
        const end = new vscode.Position(endLine, doc.lineAt(endLine).text.length);
        const range = new vscode.Range(start, end);
        const text = doc.getText(range);
        await vscode.env.clipboard.writeText(text);
        flashCopyFeedback(editor, range);
        markRecentlyCopied(startLine, endLine);
        vscode.window.setStatusBarMessage('$(check) Code copied to clipboard', 2000);
      }
    )
  );

  // Register presentation mode toggle command
  context.subscriptions.push(
    vscode.commands.registerCommand('calliope.togglePresentationMode', async () => {
      await togglePresentationMode();
    })
  );

  // Register format tables command
  context.subscriptions.push(
    vscode.commands.registerCommand('calliope.formatTables', async () => {
      await formatTablesCommand();
    })
  );

  // Register OSPL (One Sentence Per Line) command
  context.subscriptions.push(
    vscode.commands.registerCommand('calliope.formatOSPL', async () => {
      await formatOsplCommand();
    })
  );

  // Auto-format tables on save when renderTables is enabled
  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument((event) => {
      if (event.document.languageId === 'markdown') {
        const config = getConfig();
        if (config.renderTables) {
          event.waitUntil(
            Promise.resolve(formatTablesInDocument(event.document))
          );
        }
      }
    })
  );
}

export function deactivate(): void {
  disposeDecorations();
  disposePresentationMode();
  disposeAutoFormat();
  clearCache();
  cleanupUnusedSvgFiles();
  if (copyFlashTimer) {
    clearTimeout(copyFlashTimer);
    copyFlashTimer = undefined;
  }
  if (copyFlashDecoration) {
    copyFlashDecoration.dispose();
    copyFlashDecoration = undefined;
  }
}
