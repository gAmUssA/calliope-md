import type { TextDocument } from 'vscode';
import type { ParsedDocument } from './types';
import { parseMarkdown } from './markdownParser';

interface CacheEntry {
  version: number;
  parsed: ParsedDocument;
}

const cache = new Map<string, CacheEntry>();

export function getParsedDocument(document: TextDocument): ParsedDocument {
  const uri = document.uri.toString();
  const version = document.version;

  const cached = cache.get(uri);
  if (cached && cached.version === version) {
    return cached.parsed;
  }

  const parsed = parseMarkdown(document.getText());
  cache.set(uri, { version, parsed });

  return parsed;
}

export function invalidateCache(uri: string): void {
  cache.delete(uri);
}

export function clearCache(): void {
  cache.clear();
}
