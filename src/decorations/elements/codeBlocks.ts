import * as vscode from 'vscode';
import type { FencedCodeElement } from '../../parser/types';
import type { DecorationTypes } from '../decorationTypes';
import { getVisibilityState, getCursorPositions } from '../visibilityState';
import { getConfig } from '../../config';
import { 
  createMermaidDiagramDecorations, 
  applyMermaidDiagramDecorations,
  type MermaidDiagramDecorations 
} from './mermaidDiagrams';

export interface CodeBlockDecorations {
  codeFenceDim: vscode.DecorationOptions[];
  syntaxGhost: vscode.DecorationOptions[];
  mermaid?: MermaidDiagramDecorations;
}

export function createCodeBlockDecorations(
  fencedCodes: FencedCodeElement[],
  editor: vscode.TextEditor
): CodeBlockDecorations {
  const config = getConfig();
  
  // Separate mermaid blocks from standard code blocks
  // Only process mermaid blocks if the feature is enabled
  const mermaidBlocks = config.renderMermaidDiagrams 
    ? fencedCodes.filter(code => code.language === 'mermaid')
    : [];
  const standardBlocks = config.renderMermaidDiagrams
    ? fencedCodes.filter(code => code.language !== 'mermaid')
    : fencedCodes; // Treat all as standard blocks if mermaid is disabled
  
  const result: CodeBlockDecorations = {
    codeFenceDim: [],
    syntaxGhost: [],
  };

  const cursorPositions = getCursorPositions(editor);

  // Handle standard code blocks
  for (const code of standardBlocks) {
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

  // Handle mermaid blocks separately
  if (mermaidBlocks.length > 0) {
    result.mermaid = createMermaidDiagramDecorations(mermaidBlocks, editor);
  }

  return result;
}

export function applyCodeBlockDecorations(
  editor: vscode.TextEditor,
  types: DecorationTypes,
  decorations: CodeBlockDecorations
): void {
  editor.setDecorations(types.codeFenceDim, decorations.codeFenceDim);
  
  // Apply mermaid decorations if present
  if (decorations.mermaid) {
    applyMermaidDiagramDecorations(editor, types, decorations.mermaid);
  }
}
