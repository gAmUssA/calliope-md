import * as vscode from 'vscode';
import type { ListItemElement } from '../../parser/types';
import type { DecorationTypes } from '../decorationTypes';
import { getVisibilityState, getCursorPositions } from '../visibilityState';

export interface ListDecorations {
  listBullet: vscode.DecorationOptions[];
  listNumber: vscode.DecorationOptions[];
  syntaxHidden: vscode.DecorationOptions[];
  syntaxGhost: vscode.DecorationOptions[];
}

export function createListDecorations(
  listItems: ListItemElement[],
  editor: vscode.TextEditor
): ListDecorations {
  const result: ListDecorations = {
    listBullet: [],
    listNumber: [],
    syntaxHidden: [],
    syntaxGhost: [],
  };

  const cursorPositions = getCursorPositions(editor);

  for (const item of listItems) {
    const visibility = getVisibilityState(cursorPositions, item.range, item.contentRange);

    const markerRange = new vscode.Range(
      item.markerRange.start.line - 1,
      item.markerRange.start.column - 1,
      item.markerRange.end.line - 1,
      item.markerRange.end.column - 1
    );

    if (visibility === 'rendered' || visibility === 'ghost') {
      if (item.ordered) {
        // Ordered list: style the number
        const numberDecoration: vscode.DecorationOptions = {
          range: markerRange,
          renderOptions: {
            before: {
              contentText: `${item.index ?? '•'}. `,
              fontWeight: '600',
            },
          },
        };
        result.listNumber.push(numberDecoration);
      } else {
        // Unordered list: replace marker with bullet
        const bulletDecoration: vscode.DecorationOptions = {
          range: markerRange,
          renderOptions: {
            before: {
              contentText: '• ',
            },
          },
        };
        result.listBullet.push(bulletDecoration);
      }

      // Hide original marker
      if (visibility === 'rendered') {
        result.syntaxHidden.push({ range: markerRange });
      } else {
        result.syntaxGhost.push({ range: markerRange });
      }
    }
    // 'raw' state: show original marker
  }

  return result;
}

export function applyListDecorations(
  editor: vscode.TextEditor,
  types: DecorationTypes,
  decorations: ListDecorations
): void {
  editor.setDecorations(types.listBullet, decorations.listBullet);
  editor.setDecorations(types.listNumber, decorations.listNumber);
}
