import * as vscode from 'vscode';
import type { MetadataElement } from '../../parser/types';
import type { DecorationTypes } from '../decorationTypes';
import { getVisibilityState, getCursorPositions } from '../visibilityState';

export interface MetadataDecorations {
  metadataDim: vscode.DecorationOptions[];
}

export function createMetadataDecorations(
  metadata: MetadataElement[],
  editor: vscode.TextEditor
): MetadataDecorations {
  const result: MetadataDecorations = {
    metadataDim: [],
  };

  const cursorPositions = getCursorPositions(editor);

  for (const meta of metadata) {
    // Check cursor position relative to frontmatter block
    const visibility = getVisibilityState(cursorPositions, meta.range, meta.contentRange);

    // Apply dimming to the entire frontmatter block (including delimiters)
    // Use Number.MAX_SAFE_INTEGER for end character to ensure we cover the entire line width
    const metadataRange = new vscode.Range(
      meta.range.start.line - 1,
      0,
      meta.range.end.line - 1,
      Number.MAX_SAFE_INTEGER
    );

    // Apply dimming when rendered (cursor not on frontmatter lines)
    // Ghost state when cursor is on frontmatter but not editing content
    if (visibility === 'rendered' || visibility === 'ghost') {
      result.metadataDim.push({ range: metadataRange });
    }
    // For 'raw' state (editing content), no decoration to keep it readable
  }

  return result;
}

export function applyMetadataDecorations(
  decorations: MetadataDecorations,
  editor: vscode.TextEditor,
  decorationTypes: DecorationTypes
): void {
  editor.setDecorations(decorationTypes.metadataDim, decorations.metadataDim);
}
