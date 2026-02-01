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

let decorationTypes: DecorationTypes | undefined;
let updateTimeout: NodeJS.Timeout | undefined;
let isEnabled = true;

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
  if (updateTimeout) {
    clearTimeout(updateTimeout);
    updateTimeout = undefined;
  }
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
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
  updateTimeout = setTimeout(() => updateDecorations(editor), 150);
}

/**
 * Updates decorations immediately (for cursor movement).
 */
export function updateDecorationsImmediate(editor: vscode.TextEditor): void {
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

  // Apply combined syntax decorations
  editor.setDecorations(decorationTypes.syntaxHidden, allSyntaxHidden);
  editor.setDecorations(decorationTypes.syntaxGhost, allSyntaxGhost);
}

/**
 * Gets visible range with a buffer of lines above and below.
 */
function getVisibleRangeWithBuffer(editor: vscode.TextEditor): vscode.Range {
  if (editor.visibleRanges.length === 0) {
    return new vscode.Range(0, 0, editor.document.lineCount - 1, 0);
  }

  const visible = editor.visibleRanges[0];
  const buffer = 50;

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
