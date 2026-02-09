import * as vscode from 'vscode';
import type { FencedCodeElement } from '../../parser/types';
import type { DecorationTypes } from '../decorationTypes';
import { getVisibilityState, getCursorPositions } from '../visibilityState';
import { renderMermaidSvg, svgToDataUri, clearMermaidCache } from '../../mermaid';

export interface MermaidDiagramDecorations {
  mermaidRendered: vscode.DecorationOptions[];
  mermaidGhost: vscode.DecorationOptions[];
  mermaidError: vscode.DecorationOptions[];
}

// SVG rendering cache: content hash -> data URI
// Uses a simple Map here; the mermaid-renderer module handles LRU caching of raw SVGs.
// This maps source code -> processed data URI for quick lookup during decoration creation.
const dataUriCache = new Map<string, string>();

// Error cache: source code -> error flag (to avoid repeated render attempts)
const errorCache = new Map<string, boolean>();

// Track active diagram sources for cleanup
const activeSources = new Set<string>();

/**
 * Clear all mermaid caches
 */
export function clearMermaidCaches(): void {
  dataUriCache.clear();
  errorCache.clear();
  activeSources.clear();
  clearMermaidCache();
}

/**
 * Create mermaid diagram decorations with three-state visibility logic
 */
export function createMermaidDiagramDecorations(
  mermaidBlocks: FencedCodeElement[],
  editor: vscode.TextEditor
): MermaidDiagramDecorations {
  const result: MermaidDiagramDecorations = {
    mermaidRendered: [],
    mermaidGhost: [],
    mermaidError: [],
  };

  const cursorPositions = getCursorPositions(editor);
  activeSources.clear();

  for (const block of mermaidBlocks) {
    const visibility = getVisibilityState(cursorPositions, block.range, block.contentRange);

    // Extract code content
    const document = editor.document;
    const startLine = block.contentRange.start.line - 1;
    const endLine = block.contentRange.end.line - 1;

    let code = '';
    for (let i = startLine; i <= endLine; i++) {
      if (i < document.lineCount) {
        code += document.lineAt(i).text + '\n';
      }
    }
    code = code.trim();

    if (!code) {
      continue;
    }

    const totalLines = block.range.end.line - block.range.start.line + 1;
    activeSources.add(code);

    // Detect theme
    const isDarkMode =
      vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ||
      vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast;

    // Start async rendering if not cached
    if (!dataUriCache.has(code) && !errorCache.has(code)) {
      renderMermaidSvg(code, {
        theme: isDarkMode ? 'dark' : 'default',
        numLines: totalLines,
      })
        .then((svg) => {
          const dataUri = svgToDataUri(svg);
          dataUriCache.set(code, dataUri);
          // Trigger decoration update to pick up cached result
          vscode.commands.executeCommand('calliope.internal.updateDecorations');
        })
        .catch((err) => {
          errorCache.set(code, true);
          console.error('Mermaid rendering error:', err);
          vscode.commands.executeCommand('calliope.internal.updateDecorations');
        });
    }

    // Create ranges for fences and content
    const openFenceRange = new vscode.Range(
      block.openFenceRange.start.line - 1,
      block.openFenceRange.start.column - 1,
      block.openFenceRange.end.line - 1,
      block.openFenceRange.end.column - 1
    );

    const closeFenceRange = new vscode.Range(
      block.closeFenceRange.start.line - 1,
      block.closeFenceRange.start.column - 1,
      block.closeFenceRange.end.line - 1,
      block.closeFenceRange.end.column - 1
    );

    const cachedDataUri = dataUriCache.get(code);
    const hasError = errorCache.get(code);

    if (hasError) {
      // Log error, let the code block display normally
      console.warn(
        `[Calliope] Mermaid rendering failed at line ${block.openFenceRange.start.line}`
      );
      continue;
    } else if (cachedDataUri) {
      const svgUri = vscode.Uri.parse(cachedDataUri);

      if (visibility === 'rendered') {
        // Hide fences
        result.mermaidRendered.push({ range: openFenceRange });
        result.mermaidRendered.push({ range: closeFenceRange });

        // Hide each content line individually
        const contentStartLine = block.contentRange.start.line - 1;
        const contentEndLine = block.contentRange.end.line - 1;
        for (let lineNum = contentStartLine; lineNum <= contentEndLine; lineNum++) {
          if (lineNum < editor.document.lineCount) {
            const line = editor.document.lineAt(lineNum);
            result.mermaidRendered.push({
              range: new vscode.Range(lineNum, 0, lineNum, line.text.length),
            });
          }
        }

        // Show SVG above opening fence
        result.mermaidRendered.push({
          range: new vscode.Range(openFenceRange.start, openFenceRange.start),
          renderOptions: {
            before: {
              contentIconPath: svgUri,
            },
          },
        });
      } else if (visibility === 'ghost') {
        // Ghost fences
        result.mermaidGhost.push({ range: openFenceRange });
        result.mermaidGhost.push({ range: closeFenceRange });

        // Ghost each content line individually
        const contentStartLine = block.contentRange.start.line - 1;
        const contentEndLine = block.contentRange.end.line - 1;
        for (let lineNum = contentStartLine; lineNum <= contentEndLine; lineNum++) {
          if (lineNum < editor.document.lineCount) {
            const line = editor.document.lineAt(lineNum);
            result.mermaidGhost.push({
              range: new vscode.Range(lineNum, 0, lineNum, line.text.length),
            });
          }
        }

        // Show SVG with reduced opacity
        result.mermaidGhost.push({
          range: new vscode.Range(openFenceRange.start, openFenceRange.start),
          renderOptions: {
            before: {
              contentIconPath: svgUri,
            },
          },
        });
      }
      // 'raw' state: show code normally
    }
  }

  // Clean up cache entries for diagrams that no longer exist
  for (const source of dataUriCache.keys()) {
    if (!activeSources.has(source)) {
      dataUriCache.delete(source);
    }
  }
  for (const source of errorCache.keys()) {
    if (!activeSources.has(source)) {
      errorCache.delete(source);
    }
  }

  return result;
}

/**
 * Apply mermaid diagram decorations to the editor
 */
export function applyMermaidDiagramDecorations(
  editor: vscode.TextEditor,
  types: DecorationTypes,
  decorations: MermaidDiagramDecorations
): void {
  editor.setDecorations(types.mermaidDiagramRendered, decorations.mermaidRendered);
  editor.setDecorations(types.mermaidDiagramGhost, decorations.mermaidGhost);
  editor.setDecorations(types.mermaidDiagramError, decorations.mermaidError);
}
