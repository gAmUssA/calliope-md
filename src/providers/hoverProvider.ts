import * as vscode from 'vscode';
import { getParsedDocument } from '../parser/parseCache';

export class MarkdownHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const parsed = getParsedDocument(document);

    // Check if position is within any link
    for (const link of parsed.links) {
      const textRange = new vscode.Range(
        link.textRange.start.line - 1,
        link.textRange.start.column - 1,
        link.textRange.end.line - 1,
        link.textRange.end.column - 1
      );

      if (textRange.contains(position)) {
        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(`**Link:** [${link.url}](${link.url})`);
        markdown.isTrusted = true;

        return new vscode.Hover(markdown, textRange);
      }
    }

    return null;
  }
}
