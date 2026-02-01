import * as vscode from 'vscode';
import type { SourceRange } from '../parser/types';

export type VisibilityState = 'rendered' | 'ghost' | 'raw';

/**
 * Determines visibility state based on cursor position.
 * - rendered: cursor is not on the same line
 * - ghost: cursor is on the same line but not inside the construct
 * - raw: cursor is inside the construct (between markers)
 */
export function getVisibilityState(
  cursorPositions: vscode.Position[],
  elementRange: SourceRange,
  contentRange?: SourceRange
): VisibilityState {
  // Convert 1-indexed remark positions to 0-indexed vscode positions
  const elementStartLine = elementRange.start.line - 1;
  const elementEndLine = elementRange.end.line - 1;

  for (const cursor of cursorPositions) {
    // Check if cursor is on the same line(s) as the element
    if (cursor.line >= elementStartLine && cursor.line <= elementEndLine) {
      // Cursor is on the element line(s) - check if inside content
      if (contentRange) {
        const contentStartLine = contentRange.start.line - 1;
        const contentEndLine = contentRange.end.line - 1;
        const contentStartCol = contentRange.start.column - 1;
        const contentEndCol = contentRange.end.column - 1;

        // Check if cursor is within the content range
        if (cursor.line > contentStartLine && cursor.line < contentEndLine) {
          // Cursor is on a line fully inside multi-line content
          return 'raw';
        }
        if (cursor.line === contentStartLine && cursor.line === contentEndLine) {
          // Single line content
          if (cursor.character >= contentStartCol && cursor.character <= contentEndCol) {
            return 'raw';
          }
        } else if (cursor.line === contentStartLine) {
          if (cursor.character >= contentStartCol) {
            return 'raw';
          }
        } else if (cursor.line === contentEndLine) {
          if (cursor.character <= contentEndCol) {
            return 'raw';
          }
        }
      }
      // Cursor is on the line but not inside content - ghost state
      return 'ghost';
    }
  }

  // Cursor is not on the element line(s) - rendered state
  return 'rendered';
}

/**
 * Get all cursor positions from editor selections
 */
export function getCursorPositions(editor: vscode.TextEditor): vscode.Position[] {
  return editor.selections.map(sel => sel.active);
}
