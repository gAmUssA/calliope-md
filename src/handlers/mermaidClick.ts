import * as vscode from 'vscode';
import { getParsedDocument } from '../parser/parseCache';

/**
 * Detects if a click occurred on or near a rendered mermaid diagram
 * and moves cursor to the first content line to enable editing.
 */
export function detectMermaidDiagramClick(
  editor: vscode.TextEditor,
  previousSelection: vscode.Selection | undefined
): boolean {
  // Only trigger on single-click selections (not drag selections)
  if (!editor.selection.isEmpty) {
    return false;
  }

  const currentLine = editor.selection.active.line;
  const lineText = editor.document.lineAt(currentLine).text;

  // Check if click is on or near a mermaid fence
  const isMermaidFence = lineText.trim().startsWith('```mermaid') || 
                         (lineText.trim() === '```' && isPreviousLineMermaidBlock(editor, currentLine));

  if (!isMermaidFence) {
    return false;
  }

  // Find the mermaid block containing this line
  const parsed = getParsedDocument(editor.document);
  const mermaidBlock = parsed.fencedCodes.find(
    block => block.language === 'mermaid' &&
             currentLine >= block.openFenceRange.start.line - 1 &&
             currentLine <= block.closeFenceRange.end.line - 1
  );

  if (!mermaidBlock) {
    return false;
  }

  // Move cursor to the first content line
  const firstContentLine = mermaidBlock.contentRange.start.line - 1;
  const firstContentCol = mermaidBlock.contentRange.start.column - 1;

  const newPosition = new vscode.Position(firstContentLine, firstContentCol);
  editor.selection = new vscode.Selection(newPosition, newPosition);

  return true;
}

/**
 * Helper to check if the previous line starts a mermaid block
 */
function isPreviousLineMermaidBlock(editor: vscode.TextEditor, currentLine: number): boolean {
  if (currentLine === 0) {
    return false;
  }

  let checkLine = currentLine - 1;
  
  // Walk backwards to find the opening fence
  while (checkLine >= 0) {
    const text = editor.document.lineAt(checkLine).text.trim();
    
    if (text.startsWith('```mermaid')) {
      return true;
    }
    
    if (text.startsWith('```')) {
      return false; // Hit a different code block
    }
    
    checkLine--;
  }

  return false;
}
