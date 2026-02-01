import * as vscode from 'vscode';
import type { HorizontalRuleElement } from '../../parser/types';
import type { DecorationTypes } from '../decorationTypes';
import { getVisibilityState, getCursorPositions } from '../visibilityState';

export interface HorizontalRuleDecorations {
  horizontalRule: vscode.DecorationOptions[];
  syntaxHidden: vscode.DecorationOptions[];
  syntaxGhost: vscode.DecorationOptions[];
}

export function createHorizontalRuleDecorations(
  horizontalRules: HorizontalRuleElement[],
  editor: vscode.TextEditor
): HorizontalRuleDecorations {
  const result: HorizontalRuleDecorations = {
    horizontalRule: [],
    syntaxHidden: [],
    syntaxGhost: [],
  };

  const cursorPositions = getCursorPositions(editor);

  for (const hr of horizontalRules) {
    const visibility = getVisibilityState(cursorPositions, hr.range);

    // Full line range for the horizontal rule visual
    const lineRange = new vscode.Range(
      hr.range.start.line - 1,
      0,
      hr.range.start.line - 1,
      editor.document.lineAt(hr.range.start.line - 1).text.length
    );

    // Syntax range (the ---, ***, or ___)
    const syntaxRange = new vscode.Range(
      hr.syntaxRange.start.line - 1,
      hr.syntaxRange.start.column - 1,
      hr.syntaxRange.end.line - 1,
      hr.syntaxRange.end.column - 1
    );

    // Apply visual separator
    result.horizontalRule.push({ range: lineRange });

    // Hide/ghost syntax based on cursor position
    if (visibility === 'rendered') {
      result.syntaxHidden.push({ range: syntaxRange });
    } else if (visibility === 'ghost') {
      result.syntaxGhost.push({ range: syntaxRange });
    }
    // 'raw' state: show syntax at full opacity
  }

  return result;
}

export function applyHorizontalRuleDecorations(
  editor: vscode.TextEditor,
  types: DecorationTypes,
  decorations: HorizontalRuleDecorations
): void {
  editor.setDecorations(types.horizontalRule, decorations.horizontalRule);
}
