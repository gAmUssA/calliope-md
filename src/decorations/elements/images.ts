import * as vscode from 'vscode';
import * as path from 'path';
import type { ImageElement } from '../../parser/types';
import type { DecorationTypes } from '../decorationTypes';
import { getVisibilityState, getCursorPositions } from '../visibilityState';

export interface ImageDecorations {
  imagePreview: vscode.DecorationOptions[];
  syntaxHidden: vscode.DecorationOptions[];
  syntaxGhost: vscode.DecorationOptions[];
}

export function createImageDecorations(
  images: ImageElement[],
  editor: vscode.TextEditor
): ImageDecorations {
  const result: ImageDecorations = {
    imagePreview: [],
    syntaxHidden: [],
    syntaxGhost: [],
  };

  const cursorPositions = getCursorPositions(editor);
  const documentUri = editor.document.uri;

  for (const image of images) {
    const visibility = getVisibilityState(cursorPositions, image.range);

    const syntaxRange = new vscode.Range(
      image.syntaxRange.start.line - 1,
      image.syntaxRange.start.column - 1,
      image.syntaxRange.end.line - 1,
      image.syntaxRange.end.column - 1
    );

    // Resolve image path
    const imageUri = resolveImagePath(image.url, documentUri);

    // Create preview decoration with image
    if (imageUri && visibility !== 'raw') {
      const previewDecoration: vscode.DecorationOptions = {
        range: syntaxRange,
        renderOptions: {
          after: {
            contentIconPath: imageUri,
            width: '200px',
            height: 'auto',
          },
        },
        hoverMessage: new vscode.MarkdownString(`![${image.alt}](${image.url})`),
      };
      result.imagePreview.push(previewDecoration);
    }

    // Hide/ghost syntax based on cursor position
    if (visibility === 'rendered') {
      result.syntaxHidden.push({ range: syntaxRange });
    } else if (visibility === 'ghost') {
      result.syntaxGhost.push({ range: syntaxRange });
    }
    // 'raw' state: show full syntax
  }

  return result;
}

function resolveImagePath(url: string, documentUri: vscode.Uri): vscode.Uri | null {
  // Handle remote URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      return vscode.Uri.parse(url);
    } catch {
      return null;
    }
  }

  // Handle absolute paths
  if (path.isAbsolute(url)) {
    return vscode.Uri.file(url);
  }

  // Handle relative paths - resolve relative to document
  try {
    const documentDir = path.dirname(documentUri.fsPath);
    const absolutePath = path.resolve(documentDir, url);
    return vscode.Uri.file(absolutePath);
  } catch {
    return null;
  }
}

export function applyImageDecorations(
  editor: vscode.TextEditor,
  types: DecorationTypes,
  decorations: ImageDecorations
): void {
  editor.setDecorations(types.imagePreview, decorations.imagePreview);
}

// Image hover provider for full-size preview
export class ImageHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const line = document.lineAt(position.line).text;

    // Match image syntax: ![alt](url)
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;

    while ((match = imageRegex.exec(line)) !== null) {
      const startCol = match.index;
      const endCol = match.index + match[0].length;

      if (position.character >= startCol && position.character <= endCol) {
        const alt = match[1];
        const url = match[2];

        const imageUri = resolveImagePath(url, document.uri);
        if (imageUri) {
          const markdown = new vscode.MarkdownString();
          markdown.isTrusted = true;
          markdown.supportHtml = true;

          // Show full image in hover
          markdown.appendMarkdown(`**${alt || 'Image'}**\n\n`);
          markdown.appendMarkdown(`![${alt}](${imageUri.toString()})`);

          const range = new vscode.Range(
            position.line,
            startCol,
            position.line,
            endCol
          );

          return new vscode.Hover(markdown, range);
        }
      }
    }

    return null;
  }
}
