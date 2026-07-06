import * as vscode from 'vscode';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visitParents } from 'unist-util-visit-parents';
import type { Node, Parent } from 'unist';
import { splitSentences } from './sentenceSplitter';
import { formatAsciidocOspl } from './asciidocOspl';

interface MdastNode extends Node {
  position?: {
    start: { line: number; column: number; offset: number };
    end: { line: number; column: number; offset: number };
  };
  children?: MdastNode[];
  value?: string;
  checked?: boolean | null;
}

const markdownParser = unified().use(remarkParse).use(remarkGfm);

interface ParagraphTarget {
  node: MdastNode;
  ancestors: MdastNode[];
}

/**
 * Collect all paragraph nodes from the AST with their ancestor chain.
 */
function collectParagraphTargets(tree: MdastNode, frontmatterEndLine: number): ParagraphTarget[] {
  const targets: ParagraphTarget[] = [];

  visitParents(tree, 'paragraph', (node: Node, ancestors: Parent[]) => {
    const mdNode = node as MdastNode;
    if (!mdNode.position) return;

    // Skip paragraphs inside frontmatter
    if (mdNode.position.start.line <= frontmatterEndLine) return;

    targets.push({
      node: mdNode,
      ancestors: ancestors as MdastNode[],
    });
  });

  return targets;
}

/**
 * Detect frontmatter end line (1-indexed). Returns 0 if no frontmatter.
 */
function detectFrontmatterEndLine(text: string): number {
  if (!text.startsWith('---')) return 0;
  const lines = text.split('\n');
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      return i + 1; // 1-indexed
    }
  }
  return 0;
}

/**
 * Compute the continuation-line prefix for a paragraph based on its source line.
 * Extracts the prefix from the first line, then replaces list markers with spaces.
 */
function computeContinuationPrefix(
  document: vscode.TextDocument,
  paragraphNode: MdastNode,
): string {
  const startLine = paragraphNode.position!.start.line - 1; // 0-indexed
  const contentColumn = paragraphNode.position!.start.column - 1; // 0-indexed
  const lineText = document.lineAt(startLine).text;
  const firstLinePrefix = lineText.substring(0, contentColumn);

  // Replace list markers (-, *, +, or digits.) with spaces, keeping blockquote markers
  // Pattern: optional whitespace, optional blockquote markers (> ), then list marker
  const continuationPrefix = firstLinePrefix.replace(
    /((?:\s*>\s*)*)(?:[-*+]|\d+\.)\s*/,
    (_match, blockquotePart: string) => {
      const totalLen = firstLinePrefix.length;
      return blockquotePart + ' '.repeat(totalLen - blockquotePart.length);
    }
  );

  return continuationPrefix;
}

/**
 * Extract the plain text content from a paragraph node, treating inline markup as atomic.
 * Returns the flattened text and a mapping of which ranges are "atomic" (non-splittable).
 */
function extractParagraphText(
  sourceText: string,
  paragraphNode: MdastNode,
  document: vscode.TextDocument,
): string {
  const startLine = paragraphNode.position!.start.line - 1;
  const endLine = paragraphNode.position!.end.line - 1;

  // For single-line paragraphs, just return the content
  if (startLine === endLine) {
    const contentCol = paragraphNode.position!.start.column - 1;
    const endCol = paragraphNode.position!.end.column - 1;
    return document.lineAt(startLine).text.substring(contentCol, endCol);
  }

  // For multi-line paragraphs, strip continuation prefixes and join
  const contentColumn = paragraphNode.position!.start.column - 1;
  const lines: string[] = [];

  for (let i = startLine; i <= endLine; i++) {
    const lineText = document.lineAt(i).text;
    if (i === startLine) {
      lines.push(lineText.substring(contentColumn));
    } else {
      // Strip the continuation prefix — everything up to the content column
      // But we need to be smart about blockquote markers
      const stripped = stripContinuationPrefix(lineText, contentColumn);
      lines.push(stripped);
    }
  }

  return lines.join(' ');
}

/**
 * Strip continuation prefix from a line to get the content.
 * Handles blockquote markers and indentation.
 */
function stripContinuationPrefix(lineText: string, contentColumn: number): string {
  // Try stripping exactly contentColumn characters worth of prefix
  // But blockquote markers might shift things, so we also try stripping
  // common prefix patterns

  // First attempt: strip based on content column
  if (lineText.length >= contentColumn) {
    const prefix = lineText.substring(0, contentColumn);
    // Verify this looks like a prefix (whitespace, >, list markers)
    if (/^[\s>*+\-\d.]*$/.test(prefix)) {
      return lineText.substring(contentColumn);
    }
  }

  // Fallback: strip blockquote markers and leading whitespace
  return lineText.replace(/^(?:\s*>\s*)+/, '').replace(/^\s+/, '');
}

/**
 * Format a single paragraph using OSPL.
 * Returns null if no change is needed.
 */
function formatParagraph(
  document: vscode.TextDocument,
  sourceText: string,
  target: ParagraphTarget,
): vscode.TextEdit | null {
  const { node } = target;
  if (!node.position) return null;

  // Skip paragraphs that have no text children (e.g., image-only)
  const hasText = node.children?.some(
    child => child.type === 'text' || child.type === 'strong' || child.type === 'emphasis' ||
             child.type === 'delete' || child.type === 'link' || child.type === 'inlineCode'
  );
  if (!hasText) return null;

  const continuationPrefix = computeContinuationPrefix(document, node);
  const paragraphText = extractParagraphText(sourceText, node, document);

  // Build text with inline markup tracked as atomic segments
  const flatText = flattenParagraphWithAtomicMarkup(sourceText, node);
  const sentences = splitSentencesWithMarkup(flatText);

  if (sentences.length <= 1) return null;

  // Reconstruct with one sentence per line
  const formatted = sentences.join('\n' + continuationPrefix);

  // Build the original content for comparison
  const startLine = node.position.start.line - 1;
  const endLine = node.position.end.line - 1;
  const contentColumn = node.position.start.column - 1;

  let originalContent = '';
  for (let i = startLine; i <= endLine; i++) {
    const lineText = document.lineAt(i).text;
    if (i === startLine) {
      originalContent += lineText.substring(contentColumn);
    } else {
      originalContent += '\n' + lineText;
    }
  }

  // Compare: build the full replacement (including continuation lines with prefixes)
  const fullFormatted = buildFullFormattedText(sentences, continuationPrefix);

  if (fullFormatted === originalContent) return null;

  // Create edit: replace from content start to paragraph end
  const range = new vscode.Range(
    startLine, contentColumn,
    endLine, document.lineAt(endLine).text.length
  );

  return vscode.TextEdit.replace(range, fullFormatted);
}

/**
 * Build the full formatted text including continuation prefixes for multi-line comparison.
 */
function buildFullFormattedText(sentences: string[], continuationPrefix: string): string {
  if (sentences.length === 0) return '';
  let result = sentences[0];
  for (let i = 1; i < sentences.length; i++) {
    result += '\n' + continuationPrefix + sentences[i];
  }
  return result;
}

/**
 * Segment types for tracking atomic vs splittable content.
 */
interface TextSegment {
  type: 'text';
  content: string;
}

interface AtomicSegment {
  type: 'atomic';
  content: string;
}

type Segment = TextSegment | AtomicSegment;

/**
 * Flatten a paragraph into segments, marking inline markup as atomic.
 */
function flattenParagraphWithAtomicMarkup(
  sourceText: string,
  paragraphNode: MdastNode,
): Segment[] {
  const segments: Segment[] = [];
  const children = paragraphNode.children || [];

  for (const child of children) {
    if (!child.position) continue;

    const rawContent = sourceText.slice(
      child.position.start.offset,
      child.position.end.offset
    );

    if (child.type === 'text') {
      // Text nodes are splittable — normalize newlines to spaces
      segments.push({ type: 'text', content: rawContent.replace(/\n\s*/g, ' ') });
    } else {
      // Inline markup (strong, emphasis, link, inlineCode, image, etc.) is atomic
      segments.push({ type: 'atomic', content: rawContent.replace(/\n\s*/g, ' ') });
    }
  }

  return segments;
}

/**
 * Split sentences across segments, respecting atomic boundaries.
 */
function splitSentencesWithMarkup(segments: Segment[]): string[] {
  if (segments.length === 0) return [];

  // Build the full text by concatenating all segment contents
  // Track segment boundaries so we know which parts are atomic
  const fullText = segments.map(s => s.content).join('');

  // Build a map of which character positions are in atomic segments
  const atomicRanges: Array<{ start: number; end: number }> = [];
  let offset = 0;
  for (const seg of segments) {
    if (seg.type === 'atomic') {
      atomicRanges.push({ start: offset, end: offset + seg.content.length });
    }
    offset += seg.content.length;
  }

  // Find sentence boundaries in the full text
  const rawSentences = splitSentences(fullText);

  if (rawSentences.length <= 1) return rawSentences;

  // Verify none of the split points fall inside an atomic range
  // If they do, merge those sentences back together
  const sentences: string[] = [];
  let currentAccum = rawSentences[0];
  let currentEnd = rawSentences[0].length;

  for (let i = 1; i < rawSentences.length; i++) {
    // The split point is at currentEnd (approximately)
    // Check if this split falls inside an atomic segment
    const splitPoint = currentEnd;

    // Find if any atomic range spans across this split point
    // (i.e., an atomic segment that started before the split and ends after)
    const splitInsideAtomic = atomicRanges.some(
      r => r.start < splitPoint && r.end > splitPoint
    );

    if (splitInsideAtomic) {
      // Merge: don't split here
      currentAccum += ' ' + rawSentences[i];
    } else {
      sentences.push(currentAccum);
      currentAccum = rawSentences[i];
    }

    // Track the cumulative end position (add 1 for the space between sentences)
    currentEnd += 1 + rawSentences[i].length;
  }
  sentences.push(currentAccum);

  return sentences;
}

/**
 * Format all paragraphs in the document using OSPL.
 */
export function formatOsplInDocument(document: vscode.TextDocument): vscode.TextEdit[] {
  const sourceText = document.getText();
  const tree = markdownParser.parse(sourceText) as MdastNode;
  const frontmatterEndLine = detectFrontmatterEndLine(sourceText);

  const targets = collectParagraphTargets(tree, frontmatterEndLine);

  // Process in reverse order to preserve offsets
  targets.reverse();

  const edits: vscode.TextEdit[] = [];
  for (const target of targets) {
    const edit = formatParagraph(document, sourceText, target);
    if (edit) {
      edits.push(edit);
    }
  }

  return edits;
}

/**
 * Languages the OSPL command may touch. Sentence-splitting arbitrary files
 * (source code, JSON, ...) is destructive, so anything else is refused.
 */
const OSPL_LANGUAGES = new Set(['markdown', 'asciidoc', 'plaintext']);

/**
 * Command handler: format the active document using OSPL.
 */
export async function formatOsplCommand(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('No active editor.');
    return;
  }

  const document = editor.document;
  if (!OSPL_LANGUAGES.has(document.languageId)) {
    vscode.window.showInformationMessage(
      'One Sentence Per Line works on Markdown, AsciiDoc, and plain text files.'
    );
    return;
  }

  const alreadyFormatted = 'Document is already formatted (one sentence per line).';

  // Markdown uses the remark-based formatter, which understands inline markup
  // as atomic. AsciiDoc and plain text use the line-based formatter with
  // AsciiDoc-aware block fencing.
  if (document.languageId === 'markdown') {
    const edits = formatOsplInDocument(document);
    if (edits.length === 0) {
      vscode.window.showInformationMessage(alreadyFormatted);
      return;
    }

    const wsEdit = new vscode.WorkspaceEdit();
    for (const edit of edits) {
      wsEdit.replace(document.uri, edit.range, edit.newText);
    }
    if (!(await vscode.workspace.applyEdit(wsEdit))) {
      vscode.window.showErrorMessage('Could not apply One Sentence Per Line formatting.');
    }
    return;
  }

  const original = document.getText();
  const formatted = formatAsciidocOspl(original);
  if (formatted === original) {
    vscode.window.showInformationMessage(alreadyFormatted);
    return;
  }

  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(original.length)
  );
  const wsEdit = new vscode.WorkspaceEdit();
  wsEdit.replace(document.uri, fullRange, formatted);
  if (!(await vscode.workspace.applyEdit(wsEdit))) {
    vscode.window.showErrorMessage('Could not apply One Sentence Per Line formatting.');
  }
}
