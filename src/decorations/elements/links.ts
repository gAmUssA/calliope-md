import * as vscode from 'vscode';
import type { LinkElement } from '../../parser/types';
import type { DecorationTypes } from '../decorationTypes';
import { getVisibilityState, getCursorPositions } from '../visibilityState';

export interface LinkDecorations {
  linkText: vscode.DecorationOptions[];
  syntaxHidden: vscode.DecorationOptions[];
  syntaxGhost: vscode.DecorationOptions[];
}

export function createLinkDecorations(
  links: LinkElement[],
  editor: vscode.TextEditor
): LinkDecorations {
  const result: LinkDecorations = {
    linkText: [],
    syntaxHidden: [],
    syntaxGhost: [],
  };

  const cursorPositions = getCursorPositions(editor);

  for (const link of links) {
    const visibility = getVisibilityState(cursorPositions, link.range, link.textRange);

    // Link text decoration (underline and link color)
    const textRange = new vscode.Range(
      link.textRange.start.line - 1,
      link.textRange.start.column - 1,
      link.textRange.end.line - 1,
      link.textRange.end.column - 1
    );

    result.linkText.push({ range: textRange });

    // Opening bracket [
    const openBracketRange = new vscode.Range(
      link.openBracketRange.start.line - 1,
      link.openBracketRange.start.column - 1,
      link.openBracketRange.end.line - 1,
      link.openBracketRange.end.column - 1
    );

    // Closing part ](url)
    const urlPartRange = new vscode.Range(
      link.closeBracketRange.start.line - 1,
      link.closeBracketRange.start.column - 1,
      link.urlPartRange.end.line - 1,
      link.urlPartRange.end.column - 1
    );

    if (visibility === 'rendered') {
      result.syntaxHidden.push({ range: openBracketRange }, { range: urlPartRange });
    } else if (visibility === 'ghost') {
      result.syntaxGhost.push({ range: openBracketRange }, { range: urlPartRange });
    }
    // 'raw' state: no decoration on syntax
  }

  return result;
}

export function applyLinkDecorations(
  editor: vscode.TextEditor,
  types: DecorationTypes,
  decorations: LinkDecorations
): void {
  editor.setDecorations(types.linkText, decorations.linkText);
  // Note: syntaxHidden and syntaxGhost are combined with other element types in the manager
}
