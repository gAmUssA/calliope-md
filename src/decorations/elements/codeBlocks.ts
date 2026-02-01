import * as vscode from 'vscode';
import type { FencedCodeElement } from '../../parser/types';
import type { DecorationTypes } from '../decorationTypes';
import { getVisibilityState, getCursorPositions } from '../visibilityState';

export interface CodeBlockDecorations {
  codeFenceDim: vscode.DecorationOptions[];
  syntaxGhost: vscode.DecorationOptions[];
}

export function createCodeBlockDecorations(
  fencedCodes: FencedCodeElement[],
  editor: vscode.TextEditor
): CodeBlockDecorations {
  const result: CodeBlockDecorations = {
    codeFenceDim: [],
    syntaxGhost: [],
  };

  const cursorPositions = getCursorPositions(editor);

  for (const code of fencedCodes) {
    // Check cursor position relative to entire code block
    const visibility = getVisibilityState(cursorPositions, code.range, code.contentRange);

    // Opening fence range
    const openFenceRange = new vscode.Range(
      code.openFenceRange.start.line - 1,
      code.openFenceRange.start.column - 1,
      code.openFenceRange.end.line - 1,
      code.openFenceRange.end.column - 1
    );

    // Closing fence range
    const closeFenceRange = new vscode.Range(
      code.closeFenceRange.start.line - 1,
      code.closeFenceRange.start.column - 1,
      code.closeFenceRange.end.line - 1,
      code.closeFenceRange.end.column - 1
    );

    // Dim fences when not editing (preserve syntax highlighting in content)
    if (visibility === 'rendered') {
      result.codeFenceDim.push({ range: openFenceRange });
      result.codeFenceDim.push({ range: closeFenceRange });
    } else if (visibility === 'ghost') {
      result.syntaxGhost.push({ range: openFenceRange });
      result.syntaxGhost.push({ range: closeFenceRange });
    }
    // 'raw' state: fences at full opacity
    // Note: We do NOT decorate content lines to preserve VS Code syntax highlighting
  }

  return result;
}

export function applyCodeBlockDecorations(
  editor: vscode.TextEditor,
  types: DecorationTypes,
  decorations: CodeBlockDecorations
): void {
  editor.setDecorations(types.codeFenceDim, decorations.codeFenceDim);
}
