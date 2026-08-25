import * as vscode from 'vscode';
import type { BlockquoteElement } from '../../parser/types';
import type { DecorationTypes } from '../decorationTypes';
import { getCursorPositions } from '../visibilityState';

export interface BlockquoteDecorations {
  blockquoteBorder: vscode.DecorationOptions[];
  blockquoteMarkerDim: vscode.DecorationOptions[];
  blockquoteIndent: vscode.DecorationOptions[];
  blockquoteItalic: vscode.DecorationOptions[];
  syntaxHidden: vscode.DecorationOptions[];
  syntaxGhost: vscode.DecorationOptions[];
}

// Width of the gap that stands in for one hidden "> ", in em. Nested quotes
// step in by this much per level, which is the only depth cue left once the
// markers are gone (whole-line borders all sit at the same x).
const INDENT_PER_LEVEL = 1.2;

export function createBlockquoteDecorations(
  blockquotes: BlockquoteElement[],
  editor: vscode.TextEditor,
  italic = true
): BlockquoteDecorations {
  const result: BlockquoteDecorations = {
    blockquoteBorder: [],
    blockquoteMarkerDim: [],
    blockquoteIndent: [],
    blockquoteItalic: [],
    syntaxHidden: [],
    syntaxGhost: [],
  };

  const cursorLines = new Set(getCursorPositions(editor).map(p => p.line));
  const lastLine = editor.document.lineCount - 1;
  // A nested quote reports the same leading marker run as its parent, so the
  // same line arrives more than once. Decorate it once.
  const decoratedLines = new Set<number>();

  for (const blockquote of blockquotes) {
    // The bar and tint cover the whole block, blank quoted lines included. A
    // nested quote lays its own tint over its parent's, which reads as depth.
    const startLine = clampLine(blockquote.range.start.line - 1, lastLine);
    const endLine = clampLine(blockquote.range.end.line - 1, lastLine);
    const blockRange = new vscode.Range(
      startLine,
      0,
      endLine,
      editor.document.lineAt(endLine).text.length
    );
    result.blockquoteBorder.push({ range: blockRange });
    if (italic) {
      result.blockquoteItalic.push({ range: blockRange });
    }

    // Markers are decided per line, not per block: only the line the caret sits
    // on falls back to raw markup, the rest of the quote stays rendered.
    for (const markerRange of blockquote.markerRanges) {
      const line = markerRange.start.line - 1;
      if (line < 0 || line > lastLine || decoratedLines.has(line)) continue;
      decoratedLines.add(line);

      const vscodeMarkerRange = new vscode.Range(
        line,
        markerRange.start.column - 1,
        line,
        markerRange.end.column - 1
      );

      if (cursorLines.has(line)) {
        // Editing this line: keep the markers in place so columns don't jump,
        // but dim them so the prose still reads as the content.
        result.blockquoteMarkerDim.push({ range: vscodeMarkerRange });
        continue;
      }

      // Rendered: drop the markers entirely, the bar carries the meaning. The
      // indent decoration replaces the width they used to occupy.
      result.syntaxHidden.push({ range: vscodeMarkerRange });
      const depth = countMarkers(editor.document.getText(vscodeMarkerRange));
      result.blockquoteIndent.push({
        range: vscodeMarkerRange,
        renderOptions: {
          before: {
            // A non-breaking space: CSS collapses a plain one, leaving no gap.
            contentText: '\u00a0',
            margin: `0 0.15em 0 ${(depth - 1) * INDENT_PER_LEVEL}em`,
          },
        },
      });
    }
  }

  return result;
}

function clampLine(line: number, lastLine: number): number {
  return Math.min(Math.max(line, 0), lastLine);
}

function countMarkers(markerText: string): number {
  let count = 0;
  for (const char of markerText) {
    if (char === '>') count++;
  }
  return Math.max(count, 1);
}

export function applyBlockquoteDecorations(
  editor: vscode.TextEditor,
  types: DecorationTypes,
  decorations: BlockquoteDecorations
): void {
  editor.setDecorations(types.blockquoteBorder, decorations.blockquoteBorder);
  editor.setDecorations(types.blockquoteMarkerDim, decorations.blockquoteMarkerDim);
  editor.setDecorations(types.blockquoteIndent, decorations.blockquoteIndent);
  editor.setDecorations(types.blockquoteItalic, decorations.blockquoteItalic);
}
