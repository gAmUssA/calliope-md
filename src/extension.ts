import * as vscode from 'vscode';
import {
  initializeDecorations,
  disposeDecorations,
  triggerUpdateDecorations,
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
import { ImageHoverProvider } from './decorations/elements/images';
import { clearCache } from './parser/parseCache';
import { initializePresentationMode, disposePresentationMode, togglePresentationMode } from './presentationMode';
import { clearMermaidCaches } from './decorations/elements/mermaidDiagrams';
import { initMermaidRenderer, disposeMermaidRenderer } from './mermaid';

// Re-export for testing
export { initializePresentationMode, togglePresentationMode } from './presentationMode';

let previousSelection: vscode.Selection | undefined;

export function activate(context: vscode.ExtensionContext): void {
  // Initialize decoration types
  initializeDecorations();

  // Initialize mermaid webview renderer
  initMermaidRenderer(context);

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
      }
    })
  );

  // Cursor movement - update visibility states
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((event) => {
      if (event.textEditor.document.languageId === 'markdown') {
        // Check for checkbox click
        detectCheckboxClick(event.textEditor, previousSelection);
        
        // Check for mermaid diagram click
        detectMermaidDiagramClick(event.textEditor, previousSelection);
        
        previousSelection = event.selections[0];

        // Handle visibility state changes
        handleSelectionChange(event);
      }
    })
  );

  // Scroll - update viewport decorations
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
      if (event.textEditor.document.languageId === 'markdown') {
        triggerUpdateDecorations(event.textEditor);
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

  // Re-render mermaid diagrams on theme change
  context.subscriptions.push(
    vscode.window.onDidChangeActiveColorTheme(() => {
      clearMermaidCaches();
      if (vscode.window.activeTextEditor?.document.languageId === 'markdown') {
        triggerUpdateDecorations(vscode.window.activeTextEditor);
      }
    })
  );

  // Register presentation mode toggle command
  context.subscriptions.push(
    vscode.commands.registerCommand('calliope.togglePresentationMode', async () => {
      await togglePresentationMode();
    })
  );
}

export function deactivate(): void {
  disposeMermaidRenderer();
  disposeDecorations();
  disposePresentationMode();
  clearCache();
}
