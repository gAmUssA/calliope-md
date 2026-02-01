import * as vscode from 'vscode';
import type { HeaderElement } from '../../parser/types';
import type { DecorationTypes } from '../decorationTypes';
import { getVisibilityState, getCursorPositions } from '../visibilityState';

export interface HeaderDecorations {
  h1Content: vscode.DecorationOptions[];
  h2Content: vscode.DecorationOptions[];
  h3Content: vscode.DecorationOptions[];
  h4Content: vscode.DecorationOptions[];
  h5Content: vscode.DecorationOptions[];
  h6Content: vscode.DecorationOptions[];
  syntaxHidden: vscode.DecorationOptions[];
  syntaxGhost: vscode.DecorationOptions[];
}

export function createHeaderDecorations(
  headers: HeaderElement[],
  editor: vscode.TextEditor
): HeaderDecorations {
  const result: HeaderDecorations = {
    h1Content: [],
    h2Content: [],
    h3Content: [],
    h4Content: [],
    h5Content: [],
    h6Content: [],
    syntaxHidden: [],
    syntaxGhost: [],
  };

  const cursorPositions = getCursorPositions(editor);

  for (const header of headers) {
    const visibility = getVisibilityState(cursorPositions, header.range, header.contentRange);

    // Content decoration (the actual header text)
    const contentRange = new vscode.Range(
      header.contentRange.start.line - 1,
      header.contentRange.start.column - 1,
      header.contentRange.end.line - 1,
      header.contentRange.end.column - 1
    );

    const contentDecoration = { range: contentRange };

    switch (header.level) {
      case 1:
        result.h1Content.push(contentDecoration);
        break;
      case 2:
        result.h2Content.push(contentDecoration);
        break;
      case 3:
        result.h3Content.push(contentDecoration);
        break;
      case 4:
        result.h4Content.push(contentDecoration);
        break;
      case 5:
        result.h5Content.push(contentDecoration);
        break;
      case 6:
        result.h6Content.push(contentDecoration);
        break;
    }

    // Syntax decoration (the # markers)
    const syntaxRange = new vscode.Range(
      header.syntaxRange.start.line - 1,
      header.syntaxRange.start.column - 1,
      header.syntaxRange.end.line - 1,
      header.syntaxRange.end.column - 1
    );

    const syntaxDecoration = { range: syntaxRange };

    if (visibility === 'rendered') {
      result.syntaxHidden.push(syntaxDecoration);
    } else if (visibility === 'ghost') {
      result.syntaxGhost.push(syntaxDecoration);
    }
    // 'raw' state: no decoration on syntax, shows at full opacity
  }

  return result;
}

export function applyHeaderDecorations(
  editor: vscode.TextEditor,
  types: DecorationTypes,
  decorations: HeaderDecorations
): void {
  editor.setDecorations(types.h1Content, decorations.h1Content);
  editor.setDecorations(types.h2Content, decorations.h2Content);
  editor.setDecorations(types.h3Content, decorations.h3Content);
  editor.setDecorations(types.h4Content, decorations.h4Content);
  editor.setDecorations(types.h5Content, decorations.h5Content);
  editor.setDecorations(types.h6Content, decorations.h6Content);
  editor.setDecorations(types.syntaxHidden, decorations.syntaxHidden);
  editor.setDecorations(types.syntaxGhost, decorations.syntaxGhost);
}
