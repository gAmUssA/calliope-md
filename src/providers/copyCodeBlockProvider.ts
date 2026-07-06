import * as vscode from 'vscode';
import { getParsedDocument } from '../parser/parseCache';
import { getConfig } from '../config';

const SUPPRESS_DURATION_MS = 300;
let suppressedKey: string | undefined;
let suppressedUntil = 0;

export function markRecentlyCopied(startLine: number, endLine: number): void {
  suppressedKey = `${startLine}:${endLine}`;
  suppressedUntil = Date.now() + SUPPRESS_DURATION_MS;
}

export class CopyCodeBlockHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    if (!getConfig().codeBlockCopyButton) {
      return null;
    }

    const parsed = getParsedDocument(document);

    for (const code of parsed.fencedCodes) {
      if (code.language === 'mermaid') {
        continue;
      }

      const blockRange = new vscode.Range(
        code.range.start.line - 1,
        code.range.start.column - 1,
        code.range.end.line - 1,
        code.range.end.column - 1
      );

      if (!blockRange.contains(position)) {
        continue;
      }

      const contentStartLine = code.contentRange.start.line - 1;
      const contentEndLine = code.contentRange.end.line - 1;

      if (contentStartLine < 0 || contentEndLine < contentStartLine) {
        continue;
      }

      const key = `${contentStartLine}:${contentEndLine}`;
      if (suppressedKey === key && Date.now() < suppressedUntil) {
        return null;
      }

      const args = encodeURIComponent(JSON.stringify([contentStartLine, contentEndLine]));
      const langSuffix = code.language ? `  \`${code.language}\`` : '';
      const md = new vscode.MarkdownString(
        `[$(clippy) Copy](command:calliope.internal.copyCodeBlock?${args} "Copy code block to clipboard")${langSuffix}`,
        true
      );
      // Trust is scoped to the single command this hover needs; anything else
      // that ends up in the markdown stays inert.
      md.isTrusted = { enabledCommands: ['calliope.internal.copyCodeBlock'] };

      return new vscode.Hover(md, blockRange);
    }

    return null;
  }
}
