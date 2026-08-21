import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import type { ImageElement } from '../../parser/types';
import type { DecorationTypes } from '../decorationTypes';
export interface ImageDecorations {
  imagePreview: vscode.DecorationOptions[];
  syntaxHidden: vscode.DecorationOptions[];
  syntaxGhost: vscode.DecorationOptions[];
}

/** Widest a preview may render. Narrower images keep their natural size. */
const MAX_PREVIEW_WIDTH_PX = 200;

const PLACEHOLDER_GLYPH = '⚠ image not found';

export function createImageDecorations(
  images: ImageElement[],
  editor: vscode.TextEditor
): ImageDecorations {
  const result: ImageDecorations = {
    imagePreview: [],
    syntaxHidden: [],
    syntaxGhost: [],
  };

  const documentUri = editor.document.uri;

  for (const image of images) {
    const syntaxRange = new vscode.Range(
      image.syntaxRange.start.line - 1,
      image.syntaxRange.start.column - 1,
      image.syntaxRange.end.line - 1,
      image.syntaxRange.end.column - 1
    );

    // Resolve image path
    const imageUri = resolveImagePath(image.url, documentUri);
    const hoverMessage = new vscode.MarkdownString(`![${image.alt}](${image.url})`);

    if (!imageUri || isMissingLocalFile(imageUri)) {
      // A preview that cannot load renders as nothing at all, which is
      // indistinguishable from the feature being switched off. Say so instead.
      result.imagePreview.push({
        range: syntaxRange,
        renderOptions: {
          after: {
            contentText: ` ${PLACEHOLDER_GLYPH}`,
            color: new vscode.ThemeColor('editorWarning.foreground'),
            fontStyle: 'italic',
          },
        },
        hoverMessage,
      });
      continue;
    }

    result.imagePreview.push({
      range: syntaxRange,
      renderOptions: {
        after: {
          contentIconPath: imageUri,
          // `width` would force every image to exactly this size, upscaling a
          // 32px icon to 200px. Attachment render options have no max-width
          // property, so inject it as CSS through textDecoration — the same
          // idiom the heading sizes and table rules use.
          textDecoration: `none; max-width: ${MAX_PREVIEW_WIDTH_PX}px;`,
          height: 'auto',
        },
      },
      hoverMessage,
    });
  }

  return result;
}

/**
 * True when the URI names a local file that is not there.
 *
 * Only local files can be checked synchronously. A remote URL that 404s cannot
 * be detected from here — the decoration API gives no load-failure callback —
 * so remote images fall through and render as nothing if they fail.
 */
function isMissingLocalFile(uri: vscode.Uri): boolean {
  if (uri.scheme !== 'file') {
    return false;
  }

  try {
    return !fs.existsSync(uri.fsPath);
  } catch {
    // A path we cannot even stat (permissions, an invalid name) is treated as
    // present, so a preview is attempted rather than a placeholder asserted.
    return false;
  }
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
          // Deliberately NOT trusted and no HTML support: alt/url come from
          // document content, and trusting them would let a crafted file
          // smuggle executable command: links into the hover. Plain markdown
          // image syntax renders fine without either flag.
          const markdown = new vscode.MarkdownString();

          const range = new vscode.Range(
            position.line,
            startCol,
            position.line,
            endCol
          );

          if (isMissingLocalFile(imageUri)) {
            markdown.appendMarkdown(`**${alt || 'Image'}**\n\n`);
            markdown.appendMarkdown(`${PLACEHOLDER_GLYPH}: \`${url}\``);
            return new vscode.Hover(markdown, range);
          }

          // Show full image in hover
          markdown.appendMarkdown(`**${alt || 'Image'}**\n\n`);
          markdown.appendMarkdown(`![${alt}](${imageUri.toString()})`);

          return new vscode.Hover(markdown, range);
        }
      }
    }

    return null;
  }
}
