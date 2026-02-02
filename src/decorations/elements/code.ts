import * as vscode from 'vscode';
import type { InlineCodeElement } from '../../parser/types';
import type { DecorationTypes } from '../decorationTypes';
import { getVisibilityState, getCursorPositions } from '../visibilityState';

export interface CodeDecorations {
  inlineCode: vscode.DecorationOptions[];
  inlineCodeTypescript: vscode.DecorationOptions[];
  inlineCodeLanguagePrefix: vscode.DecorationOptions[];
  syntaxHidden: vscode.DecorationOptions[];
  syntaxGhost: vscode.DecorationOptions[];
}

export function createCodeDecorations(
  inlineCodes: InlineCodeElement[],
  editor: vscode.TextEditor
): CodeDecorations {
  const result: CodeDecorations = {
    inlineCode: [],
    inlineCodeTypescript: [],
    inlineCodeLanguagePrefix: [],
    syntaxHidden: [],
    syntaxGhost: [],
  };

  const cursorPositions = getCursorPositions(editor);

  for (const code of inlineCodes) {
    const visibility = getVisibilityState(cursorPositions, code.range, code.contentRange);

    // Content decoration (the code text with background)
    const contentRange = new vscode.Range(
      code.contentRange.start.line - 1,
      code.contentRange.start.column - 1,
      code.contentRange.end.line - 1,
      code.contentRange.end.column - 1
    );

    // Apply language-specific highlighting for TypeScript
    if (code.language === 'ts' || code.language === 'typescript') {
      result.inlineCodeTypescript.push({ range: contentRange });
      
      // Add dimmed styling for the language prefix (ts:)
      if (code.language) {
        const prefixRange = new vscode.Range(
          code.range.start.line - 1,
          code.range.start.column,  // After opening backtick
          code.range.start.line - 1,
          code.contentRange.start.column - 1  // Before actual code content
        );
        result.inlineCodeLanguagePrefix.push({ range: prefixRange });
      }
    } else {
      result.inlineCode.push({ range: contentRange });
    }

    // Opening backtick decoration
    const openRange = new vscode.Range(
      code.openMarkerRange.start.line - 1,
      code.openMarkerRange.start.column - 1,
      code.openMarkerRange.end.line - 1,
      code.openMarkerRange.end.column - 1
    );

    // Closing backtick decoration
    const closeRange = new vscode.Range(
      code.closeMarkerRange.start.line - 1,
      code.closeMarkerRange.start.column - 1,
      code.closeMarkerRange.end.line - 1,
      code.closeMarkerRange.end.column - 1
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

export function applyCodeDecorations(
  editor: vscode.TextEditor,
  types: DecorationTypes,
  decorations: CodeDecorations
): void {
  editor.setDecorations(types.inlineCode, decorations.inlineCode);
  editor.setDecorations(types.inlineCodeTypescript, decorations.inlineCodeTypescript);
  editor.setDecorations(types.inlineCodeLanguagePrefix, decorations.inlineCodeLanguagePrefix);
  // Note: syntaxHidden and syntaxGhost are combined with other element types in the manager
}
