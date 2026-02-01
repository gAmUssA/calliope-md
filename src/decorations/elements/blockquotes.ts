import * as vscode from 'vscode';
import type { BlockquoteElement } from '../../parser/types';
import type { DecorationTypes } from '../decorationTypes';
import { getVisibilityState, getCursorPositions } from '../visibilityState';

export interface BlockquoteDecorations {
  blockquoteBorder: vscode.DecorationOptions[];
  blockquoteMarkerDim: vscode.DecorationOptions[];
  syntaxGhost: vscode.DecorationOptions[];
}

export function createBlockquoteDecorations(
  blockquotes: BlockquoteElement[],
  editor: vscode.TextEditor
): BlockquoteDecorations {
  const result: BlockquoteDecorations = {
    blockquoteBorder: [],
    blockquoteMarkerDim: [],
    syntaxGhost: [],
  };

  const cursorPositions = getCursorPositions(editor);

  for (const blockquote of blockquotes) {
    // Apply border/background to entire blockquote range
    const blockRange = new vscode.Range(
      blockquote.range.start.line - 1,
      0,
      blockquote.range.end.line - 1,
      editor.document.lineAt(blockquote.range.end.line - 1).text.length
    );
    result.blockquoteBorder.push({ range: blockRange });

    // Handle > markers based on cursor position
    for (const markerRange of blockquote.markerRanges) {
      const visibility = getVisibilityState(
        cursorPositions,
        blockquote.range,
        blockquote.contentRange
      );

      const vscodeMarkerRange = new vscode.Range(
        markerRange.start.line - 1,
        markerRange.start.column - 1,
        markerRange.end.line - 1,
        markerRange.end.column - 1
      );

      // Dim markers at 40% when not editing, full when cursor is on line
      if (visibility === 'rendered') {
        result.blockquoteMarkerDim.push({ range: vscodeMarkerRange });
      } else if (visibility === 'ghost') {
        result.syntaxGhost.push({ range: vscodeMarkerRange });
      }
      // 'raw' state: no decoration, show at full opacity
    }
  }

  return result;
}

export function applyBlockquoteDecorations(
  editor: vscode.TextEditor,
  types: DecorationTypes,
  decorations: BlockquoteDecorations
): void {
  editor.setDecorations(types.blockquoteBorder, decorations.blockquoteBorder);
  editor.setDecorations(types.blockquoteMarkerDim, decorations.blockquoteMarkerDim);
}
