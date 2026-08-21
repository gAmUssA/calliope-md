import * as vscode from 'vscode';
import { getParsedDocument } from '../parser/parseCache';
import { getConfig } from '../config';
import {
  DecorationTypes,
  createDecorationTypes,
  disposeDecorationTypes,
} from './decorationTypes';
import { createHeaderDecorations, applyHeaderDecorations } from './elements/headers';
import { createEmphasisDecorations, applyEmphasisDecorations } from './elements/emphasis';
import { createTaskListDecorations, applyTaskListDecorations } from './elements/taskLists';
import { createCodeDecorations, applyCodeDecorations } from './elements/code';
import { createLinkDecorations, applyLinkDecorations } from './elements/links';
import { createBlockquoteDecorations, applyBlockquoteDecorations } from './elements/blockquotes';
import { createHorizontalRuleDecorations, applyHorizontalRuleDecorations } from './elements/horizontalRules';
import { createCodeBlockDecorations, applyCodeBlockDecorations } from './elements/codeBlocks';
import { createImageDecorations, applyImageDecorations } from './elements/images';
import { createListDecorations, applyListDecorations } from './elements/lists';
import { createMetadataDecorations, applyMetadataDecorations } from './elements/metadata';
import { createTableDecorations, applyTableDecorations, clearTableDecorations } from './elements/tables';

let decorationTypes: DecorationTypes | undefined;

// Debounce timers, one per document URI rather than one global. A single
// shared timer meant that scheduling an update for a second editor cancelled
// the first, so a loop over visible editors only ever refreshed the last one.
const updateTimeouts = new Map<string, NodeJS.Timeout>();

const DEBOUNCE_MS = 150;
let isEnabled = true;
let lastBufferedRange: vscode.Range | undefined;
let lastBufferedDocUri: string | undefined;

export function initializeDecorations(): DecorationTypes {
  const config = getConfig();
  decorationTypes = createDecorationTypes(config.ghostOpacity);
  isEnabled = config.enabled;
  return decorationTypes;
}

export function getDecorationTypes(): DecorationTypes | undefined {
  return decorationTypes;
}

export function disposeDecorations(): void {
  if (decorationTypes) {
    disposeDecorationTypes(decorationTypes);
    decorationTypes = undefined;
  }
  for (const timer of updateTimeouts.values()) {
    clearTimeout(timer);
  }
  updateTimeouts.clear();
  lastBufferedRange = undefined;
  lastBufferedDocUri = undefined;
}

export function toggleEnabled(): boolean {
  isEnabled = !isEnabled;
  return isEnabled;
}

export function setEnabled(enabled: boolean): void {
  isEnabled = enabled;
}

export function isDecorationEnabled(): boolean {
  return isEnabled;
}

/**
 * Triggers a debounced decoration update.
 */
export function triggerUpdateDecorations(editor: vscode.TextEditor): void {
  const uri = editor.document.uri.toString();
  cancelPendingUpdate(uri);

  updateTimeouts.set(
    uri,
    setTimeout(() => {
      updateTimeouts.delete(uri);
      updateEditorsForDocument(uri, editor);
    }, DEBOUNCE_MS)
  );
}

/**
 * Debounced update for every editor currently showing `document`.
 *
 * The same document can be open in several editor groups. Decorations are
 * applied per editor, so refreshing only the active one leaves the other
 * groups holding ranges that were never recomputed — and because decorations
 * default to `OpenOpen`, those stale ranges grow over text typed next to them.
 * A stale `syntaxHidden` range is both invisible and zero-width, so the text
 * swallowed by it disappears in that group until it is refreshed.
 */
export function triggerUpdateDecorationsForDocument(document: vscode.TextDocument): void {
  const uri = document.uri.toString();
  cancelPendingUpdate(uri);

  updateTimeouts.set(
    uri,
    setTimeout(() => {
      updateTimeouts.delete(uri);
      updateEditorsForDocument(uri);
    }, DEBOUNCE_MS)
  );
}

function cancelPendingUpdate(uri: string): void {
  const pending = updateTimeouts.get(uri);
  if (pending) {
    clearTimeout(pending);
    updateTimeouts.delete(uri);
  }
}

/**
 * Applies decorations to every visible editor showing `uri`. `fallback` covers
 * the case where the editor is not in `visibleTextEditors` yet, which happens
 * on the very first update after activation.
 */
function updateEditorsForDocument(uri: string, fallback?: vscode.TextEditor): void {
  let updated = false;

  for (const editor of vscode.window.visibleTextEditors) {
    if (editor.document.uri.toString() === uri) {
      updateDecorations(editor);
      updated = true;
    }
  }

  if (!updated && fallback) {
    updateDecorations(fallback);
  }
}

/**
 * Cancels any pending update for a document and forgets its timer. Called when
 * a document closes so timers do not fire against editors that are gone.
 */
export function cancelUpdatesForDocument(uri: string): void {
  cancelPendingUpdate(uri);
}

/**
 * Triggers a decoration update only if the editor's visible range has moved
 * outside the previously rendered buffered range. Used for scroll events to
 * avoid flicker from rebuilding decorations that are already in place.
 */
export function triggerUpdateDecorationsIfViewportChanged(editor: vscode.TextEditor): void {
  if (editor.visibleRanges.length === 0) {
    triggerUpdateDecorations(editor);
    return;
  }

  if (lastBufferedDocUri !== editor.document.uri.toString()) {
    triggerUpdateDecorations(editor);
    return;
  }

  if (lastBufferedRange) {
    const visible = editor.visibleRanges[0];
    const margin = 10;
    const viewportInsideBuffer =
      visible.start.line >= lastBufferedRange.start.line + margin &&
      visible.end.line <= lastBufferedRange.end.line - margin;

    if (viewportInsideBuffer) {
      return;
    }
  }

  triggerUpdateDecorations(editor);
}

/**
 * Updates decorations immediately (for cursor movement).
 * Also cancels any pending debounced update to prevent double-application.
 */
export function updateDecorationsImmediate(editor: vscode.TextEditor): void {
  cancelPendingUpdate(editor.document.uri.toString());
  updateDecorations(editor);
}

/**
 * Main decoration update function.
 */
function updateDecorations(editor: vscode.TextEditor): void {
  if (!decorationTypes) {
    return;
  }

  if (!isEnabled || editor.document.languageId !== 'markdown') {
    clearAllDecorations(editor);
    lastBufferedRange = undefined;
    lastBufferedDocUri = undefined;
    return;
  }

  const config = getConfig();
  const visibleRange = getVisibleRangeWithBuffer(editor);

  // Get parsed document (from cache if available)
  const parsed = getParsedDocument(editor.document);

  // Collect all syntax decorations to combine them
  const allSyntaxHidden: vscode.DecorationOptions[] = [];
  const allSyntaxGhost: vscode.DecorationOptions[] = [];

  // Headers
  if (config.renderHeaders) {
    const headerDecos = createHeaderDecorations(
      filterByVisibleRange(parsed.headers, visibleRange),
      editor
    );
    applyHeaderDecorations(editor, decorationTypes, headerDecos);
    allSyntaxHidden.push(...headerDecos.syntaxHidden);
    allSyntaxGhost.push(...headerDecos.syntaxGhost);
  } else {
    clearHeaderDecorations(editor);
  }

  // Emphasis
  if (config.renderEmphasis) {
    const emphasisDecos = createEmphasisDecorations(
      filterByVisibleRange(parsed.emphasis, visibleRange),
      editor
    );
    applyEmphasisDecorations(editor, decorationTypes, emphasisDecos);
    allSyntaxHidden.push(...emphasisDecos.syntaxHidden);
    allSyntaxGhost.push(...emphasisDecos.syntaxGhost);
  } else {
    clearEmphasisDecorations(editor);
  }

  // Task Lists
  if (config.renderTaskLists) {
    const taskDecos = createTaskListDecorations(
      filterByVisibleRange(parsed.taskLists, visibleRange),
      editor
    );
    applyTaskListDecorations(editor, decorationTypes, taskDecos);
    allSyntaxHidden.push(...taskDecos.syntaxHidden);
    allSyntaxGhost.push(...taskDecos.syntaxGhost);
  } else {
    clearTaskListDecorations(editor);
  }

  // Inline Code
  if (config.renderInlineCode) {
    const codeDecos = createCodeDecorations(
      filterByVisibleRange(parsed.inlineCodes, visibleRange),
      editor
    );
    applyCodeDecorations(editor, decorationTypes, codeDecos);
    allSyntaxHidden.push(...codeDecos.syntaxHidden);
    allSyntaxGhost.push(...codeDecos.syntaxGhost);
  } else {
    clearCodeDecorations(editor);
  }

  // Links
  if (config.renderLinks) {
    const linkDecos = createLinkDecorations(
      filterByVisibleRange(parsed.links, visibleRange),
      editor
    );
    applyLinkDecorations(editor, decorationTypes, linkDecos);
    allSyntaxHidden.push(...linkDecos.syntaxHidden);
    allSyntaxGhost.push(...linkDecos.syntaxGhost);
  } else {
    clearLinkDecorations(editor);
  }

  // Blockquotes
  if (config.renderBlockquotes) {
    const blockquoteDecos = createBlockquoteDecorations(
      filterByVisibleRange(parsed.blockquotes, visibleRange),
      editor
    );
    applyBlockquoteDecorations(editor, decorationTypes, blockquoteDecos);
    allSyntaxGhost.push(...blockquoteDecos.syntaxGhost);
  } else {
    clearBlockquoteDecorations(editor);
  }

  // Horizontal Rules
  if (config.renderHorizontalRules) {
    const hrDecos = createHorizontalRuleDecorations(
      filterByVisibleRange(parsed.horizontalRules, visibleRange),
      editor
    );
    applyHorizontalRuleDecorations(editor, decorationTypes, hrDecos);
    allSyntaxHidden.push(...hrDecos.syntaxHidden);
    allSyntaxGhost.push(...hrDecos.syntaxGhost);
  } else {
    clearHorizontalRuleDecorations(editor);
  }

  // Fenced Code Blocks
  if (config.renderCodeBlocks) {
    const codeBlockDecos = createCodeBlockDecorations(
      filterByVisibleRange(parsed.fencedCodes, visibleRange),
      editor
    );
    applyCodeBlockDecorations(editor, decorationTypes, codeBlockDecos);
    allSyntaxGhost.push(...codeBlockDecos.syntaxGhost);
  } else {
    clearCodeBlockDecorations(editor);
  }

  // Images
  if (config.renderImages) {
    const imageDecos = createImageDecorations(
      filterByVisibleRange(parsed.images, visibleRange),
      editor
    );
    applyImageDecorations(editor, decorationTypes, imageDecos);
    allSyntaxHidden.push(...imageDecos.syntaxHidden);
    allSyntaxGhost.push(...imageDecos.syntaxGhost);
  } else {
    clearImageDecorations(editor);
  }

  // Lists
  if (config.renderLists) {
    const listDecos = createListDecorations(
      filterByVisibleRange(parsed.listItems, visibleRange),
      editor
    );
    applyListDecorations(editor, decorationTypes, listDecos);
    allSyntaxHidden.push(...listDecos.syntaxHidden);
    allSyntaxGhost.push(...listDecos.syntaxGhost);
  } else {
    clearListDecorations(editor);
  }

  // Tables
  if (config.renderTables && parsed.tables.length > 0) {
    try {
      const tableDecos = createTableDecorations(
        filterByVisibleRange(parsed.tables, visibleRange),
        editor
      );
      applyTableDecorations(editor, decorationTypes, tableDecos);
      // Tables use syntaxHidden for pipes/separator and syntaxGhost for dimmed hints
      allSyntaxHidden.push(...tableDecos.syntaxHidden);
      allSyntaxGhost.push(...tableDecos.syntaxGhost);
    } catch {
      // Safety: never let table errors crash the decoration pipeline
      clearTableDecorations(editor, decorationTypes);
    }
  } else {
    clearTableDecorations(editor, decorationTypes);
  }

  // Metadata (YAML frontmatter)
  if (config.renderMetadata) {
    const metadataDecos = createMetadataDecorations(
      filterByVisibleRange(parsed.metadata, visibleRange),
      editor
    );
    applyMetadataDecorations(metadataDecos, editor, decorationTypes);
  } else {
    clearMetadataDecorations(editor);
  }

  // Apply combined syntax decorations
  editor.setDecorations(decorationTypes.syntaxHidden, allSyntaxHidden);
  editor.setDecorations(decorationTypes.syntaxGhost, allSyntaxGhost);

  // Record what we just decorated so scroll events can skip redundant rebuilds.
  lastBufferedRange = visibleRange;
  lastBufferedDocUri = editor.document.uri.toString();
}

/**
 * Gets visible range with a buffer of lines above and below.
 */
function getVisibleRangeWithBuffer(editor: vscode.TextEditor): vscode.Range {
  if (editor.visibleRanges.length === 0) {
    return new vscode.Range(0, 0, editor.document.lineCount - 1, 0);
  }

  const visible = editor.visibleRanges[0];
  const buffer = 200;

  return new vscode.Range(
    Math.max(0, visible.start.line - buffer),
    0,
    Math.min(editor.document.lineCount - 1, visible.end.line + buffer),
    Number.MAX_SAFE_INTEGER
  );
}

/**
 * Filters parsed elements to only those within the visible range.
 */
function filterByVisibleRange<T extends { range: { start: { line: number }; end: { line: number } } }>(
  elements: T[],
  visibleRange: vscode.Range
): T[] {
  return elements.filter(el => {
    const startLine = el.range.start.line - 1; // Convert to 0-indexed
    const endLine = el.range.end.line - 1;
    return endLine >= visibleRange.start.line && startLine <= visibleRange.end.line;
  });
}

function clearAllDecorations(editor: vscode.TextEditor): void {
  if (!decorationTypes) return;

  const emptyArray: vscode.DecorationOptions[] = [];

  // Phase 1 elements
  editor.setDecorations(decorationTypes.h1Content, emptyArray);
  editor.setDecorations(decorationTypes.h2Content, emptyArray);
  editor.setDecorations(decorationTypes.h3Content, emptyArray);
  editor.setDecorations(decorationTypes.h4Content, emptyArray);
  editor.setDecorations(decorationTypes.h5Content, emptyArray);
  editor.setDecorations(decorationTypes.h6Content, emptyArray);
  editor.setDecorations(decorationTypes.bold, emptyArray);
  editor.setDecorations(decorationTypes.italic, emptyArray);
  editor.setDecorations(decorationTypes.boldItalic, emptyArray);
  editor.setDecorations(decorationTypes.strikethrough, emptyArray);
  editor.setDecorations(decorationTypes.taskCheckbox, emptyArray);
  editor.setDecorations(decorationTypes.taskCompletedLine, emptyArray);
  editor.setDecorations(decorationTypes.inlineCode, emptyArray);
  editor.setDecorations(decorationTypes.linkText, emptyArray);

  // Phase 2 elements
  editor.setDecorations(decorationTypes.blockquoteBorder, emptyArray);
  editor.setDecorations(decorationTypes.blockquoteMarkerDim, emptyArray);
  editor.setDecorations(decorationTypes.horizontalRule, emptyArray);
  editor.setDecorations(decorationTypes.codeFenceDim, emptyArray);
  editor.setDecorations(decorationTypes.imagePreview, emptyArray);
  editor.setDecorations(decorationTypes.listBullet, emptyArray);
  editor.setDecorations(decorationTypes.listNumber, emptyArray);
  editor.setDecorations(decorationTypes.metadataDim, emptyArray);

  // Tables
  editor.setDecorations(decorationTypes.tableHeaderCell, emptyArray);
  editor.setDecorations(decorationTypes.tableBodyCell, emptyArray);
  editor.setDecorations(decorationTypes.tableSeparatorLine, emptyArray);
  editor.setDecorations(decorationTypes.tableRowLine, emptyArray);
  editor.setDecorations(decorationTypes.tableHeaderBorder, emptyArray);
  editor.setDecorations(decorationTypes.tableLabel, emptyArray);
  editor.setDecorations(decorationTypes.tableLastRowBorder, emptyArray);
  editor.setDecorations(decorationTypes.tablePipeHidden, emptyArray);

  // Shared syntax decorations
  editor.setDecorations(decorationTypes.syntaxHidden, emptyArray);
  editor.setDecorations(decorationTypes.syntaxGhost, emptyArray);
}

function clearHeaderDecorations(editor: vscode.TextEditor): void {
  if (!decorationTypes) return;
  const emptyArray: vscode.DecorationOptions[] = [];
  editor.setDecorations(decorationTypes.h1Content, emptyArray);
  editor.setDecorations(decorationTypes.h2Content, emptyArray);
  editor.setDecorations(decorationTypes.h3Content, emptyArray);
  editor.setDecorations(decorationTypes.h4Content, emptyArray);
  editor.setDecorations(decorationTypes.h5Content, emptyArray);
  editor.setDecorations(decorationTypes.h6Content, emptyArray);
}

function clearEmphasisDecorations(editor: vscode.TextEditor): void {
  if (!decorationTypes) return;
  const emptyArray: vscode.DecorationOptions[] = [];
  editor.setDecorations(decorationTypes.bold, emptyArray);
  editor.setDecorations(decorationTypes.italic, emptyArray);
  editor.setDecorations(decorationTypes.boldItalic, emptyArray);
  editor.setDecorations(decorationTypes.strikethrough, emptyArray);
}

function clearTaskListDecorations(editor: vscode.TextEditor): void {
  if (!decorationTypes) return;
  const emptyArray: vscode.DecorationOptions[] = [];
  editor.setDecorations(decorationTypes.taskCheckbox, emptyArray);
  editor.setDecorations(decorationTypes.taskCompletedLine, emptyArray);
}

function clearCodeDecorations(editor: vscode.TextEditor): void {
  if (!decorationTypes) return;
  editor.setDecorations(decorationTypes.inlineCode, []);
}

function clearLinkDecorations(editor: vscode.TextEditor): void {
  if (!decorationTypes) return;
  editor.setDecorations(decorationTypes.linkText, []);
}

function clearBlockquoteDecorations(editor: vscode.TextEditor): void {
  if (!decorationTypes) return;
  editor.setDecorations(decorationTypes.blockquoteBorder, []);
  editor.setDecorations(decorationTypes.blockquoteMarkerDim, []);
}

function clearHorizontalRuleDecorations(editor: vscode.TextEditor): void {
  if (!decorationTypes) return;
  editor.setDecorations(decorationTypes.horizontalRule, []);
}

function clearCodeBlockDecorations(editor: vscode.TextEditor): void {
  if (!decorationTypes) return;
  editor.setDecorations(decorationTypes.codeFenceDim, []);
}

function clearImageDecorations(editor: vscode.TextEditor): void {
  if (!decorationTypes) return;
  editor.setDecorations(decorationTypes.imagePreview, []);
}

function clearListDecorations(editor: vscode.TextEditor): void {
  if (!decorationTypes) return;
  editor.setDecorations(decorationTypes.listBullet, []);
  editor.setDecorations(decorationTypes.listNumber, []);
}

function clearMetadataDecorations(editor: vscode.TextEditor): void {
  if (!decorationTypes) return;
  editor.setDecorations(decorationTypes.metadataDim, []);
}
