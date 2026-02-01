import * as vscode from 'vscode';
import type { EmphasisElement } from '../../parser/types';
import type { DecorationTypes } from '../decorationTypes';
import { getVisibilityState, getCursorPositions } from '../visibilityState';

export interface EmphasisDecorations {
  bold: vscode.DecorationOptions[];
  italic: vscode.DecorationOptions[];
  boldItalic: vscode.DecorationOptions[];
  strikethrough: vscode.DecorationOptions[];
  syntaxHidden: vscode.DecorationOptions[];
  syntaxGhost: vscode.DecorationOptions[];
}

export function createEmphasisDecorations(
  emphasisElements: EmphasisElement[],
  editor: vscode.TextEditor
): EmphasisDecorations {
  const result: EmphasisDecorations = {
    bold: [],
    italic: [],
    boldItalic: [],
    strikethrough: [],
    syntaxHidden: [],
    syntaxGhost: [],
  };

  const cursorPositions = getCursorPositions(editor);

  for (const element of emphasisElements) {
    const visibility = getVisibilityState(cursorPositions, element.range, element.contentRange);

    // Content decoration
    const contentRange = new vscode.Range(
      element.contentRange.start.line - 1,
      element.contentRange.start.column - 1,
      element.contentRange.end.line - 1,
      element.contentRange.end.column - 1
    );

    const contentDecoration = { range: contentRange };

    switch (element.variant) {
      case 'bold':
        result.bold.push(contentDecoration);
        break;
      case 'italic':
        result.italic.push(contentDecoration);
        break;
      case 'bold-italic':
        result.boldItalic.push(contentDecoration);
        break;
      case 'strikethrough':
        result.strikethrough.push(contentDecoration);
        break;
    }

    // Opening marker decoration
    const openRange = new vscode.Range(
      element.openMarkerRange.start.line - 1,
      element.openMarkerRange.start.column - 1,
      element.openMarkerRange.end.line - 1,
      element.openMarkerRange.end.column - 1
    );

    // Closing marker decoration
    const closeRange = new vscode.Range(
      element.closeMarkerRange.start.line - 1,
      element.closeMarkerRange.start.column - 1,
      element.closeMarkerRange.end.line - 1,
      element.closeMarkerRange.end.column - 1
    );

    if (visibility === 'rendered') {
      result.syntaxHidden.push({ range: openRange }, { range: closeRange });
    } else if (visibility === 'ghost') {
      result.syntaxGhost.push({ range: openRange }, { range: closeRange });
    }
    // 'raw' state: no decoration on syntax
  }

  return result;
}

export function applyEmphasisDecorations(
  editor: vscode.TextEditor,
  types: DecorationTypes,
  decorations: EmphasisDecorations
): void {
  editor.setDecorations(types.bold, decorations.bold);
  editor.setDecorations(types.italic, decorations.italic);
  editor.setDecorations(types.boldItalic, decorations.boldItalic);
  editor.setDecorations(types.strikethrough, decorations.strikethrough);
  // Note: syntaxHidden and syntaxGhost are combined with other element types in the manager
}
