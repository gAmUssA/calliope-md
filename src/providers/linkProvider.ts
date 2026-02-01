import * as vscode from 'vscode';
import { getParsedDocument } from '../parser/parseCache';

export class MarkdownLinkProvider implements vscode.DocumentLinkProvider {
  provideDocumentLinks(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DocumentLink[]> {
    const parsed = getParsedDocument(document);
    const links: vscode.DocumentLink[] = [];

    for (const link of parsed.links) {
      // Create a link covering the text portion
      const range = new vscode.Range(
        link.textRange.start.line - 1,
        link.textRange.start.column - 1,
        link.textRange.end.line - 1,
        link.textRange.end.column - 1
      );

      try {
        const uri = vscode.Uri.parse(link.url);
        const docLink = new vscode.DocumentLink(range, uri);
        docLink.tooltip = link.url;
        links.push(docLink);
      } catch {
        // Invalid URL, skip
      }
    }

    return links;
  }
}
