import * as vscode from 'vscode';
import { getParsedDocument } from '../parser/parseCache';
import type { TableElement } from '../parser/types';

/**
 * Formats all markdown tables in the given document so that columns
 * are padded to equal widths. This ensures that when pipes are hidden
 * via opacity:0, columns align perfectly like HTML tables.
 *
 * Only modifies whitespace (adds/removes spaces around cell content).
 * Does not change cell content or table structure.
 */
export function formatTablesInDocument(document: vscode.TextDocument): vscode.TextEdit[] {
  const parsed = getParsedDocument(document);
  const edits: vscode.TextEdit[] = [];

  for (const table of parsed.tables) {
    const tableEdits = formatSingleTable(document, table);
    edits.push(...tableEdits);
  }

  return edits;
}

/**
 * Formats a single table: pads all cells to equal column widths.
 */
function formatSingleTable(document: vscode.TextDocument, table: TableElement): vscode.TextEdit[] {
  const startLine = table.range.start.line - 1; // 0-indexed
  const endLine = table.range.end.line - 1;

  // Parse each row from source text
  const rows: string[][] = [];
  const lineIndices: number[] = [];

  for (let line = startLine; line <= endLine; line++) {
    const text = document.lineAt(line).text;
    const cells = parseTableRow(text);
    if (cells !== null) {
      rows.push(cells);
      lineIndices.push(line);
    }
  }

  if (rows.length < 2) return []; // Need at least header + separator

  // Determine number of columns
  const numCols = Math.max(...rows.map(r => r.length));

  // Calculate max content width per column (excluding separator row)
  const colWidths: number[] = new Array(numCols).fill(0);
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    // Skip separator row for width calculation but enforce minimum of 3
    if (isSeparatorRow(row)) continue;
    for (let col = 0; col < row.length; col++) {
      const contentWidth = row[col].trim().length;
      colWidths[col] = Math.max(colWidths[col], contentWidth);
    }
  }

  // Enforce minimum column width of 3 (for separator `---`)
  for (let col = 0; col < numCols; col++) {
    colWidths[col] = Math.max(colWidths[col], 3);
  }

  // Build formatted lines and create edits
  const edits: vscode.TextEdit[] = [];
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    const line = lineIndices[rowIdx];
    const originalText = document.lineAt(line).text;
    const isSep = isSeparatorRow(row);
    const align = table.align;

    let formatted = '|';
    for (let col = 0; col < numCols; col++) {
      const width = colWidths[col];
      if (isSep) {
        // Format separator with alignment markers
        const a = align[col];
        if (a === 'center') {
          formatted += ':' + '-'.repeat(width) + ':';
        } else if (a === 'right') {
          formatted += '-'.repeat(width + 1) + ':';
        } else if (a === 'left') {
          formatted += ':' + '-'.repeat(width + 1);
        } else {
          formatted += '-'.repeat(width + 2);
        }
      } else {
        const content = col < row.length ? row[col].trim() : '';
        const padded = padCell(content, width, align[col]);
        formatted += ' ' + padded + ' ';
      }
      formatted += '|';
    }

    if (formatted !== originalText) {
      const range = new vscode.Range(line, 0, line, originalText.length);
      edits.push(vscode.TextEdit.replace(range, formatted));
    }
  }

  return edits;
}

/**
 * Parse a markdown table row into cell strings.
 * Returns null if the line doesn't look like a table row.
 */
function parseTableRow(text: string): string[] | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('|')) return null;

  // Split by pipe, ignoring first empty element from leading |
  const parts = trimmed.split('|');
  // Remove first (empty before leading |) and last (empty after trailing |)
  const cells = parts.slice(1, parts.length - 1);
  return cells;
}

/**
 * Check if a row is a separator row (contains only dashes, colons, spaces).
 */
function isSeparatorRow(cells: string[]): boolean {
  return cells.every(cell => /^\s*:?-+:?\s*$/.test(cell));
}

/**
 * Pad a cell's content to the specified width, respecting alignment.
 */
function padCell(content: string, width: number, align: string | null): string {
  const padNeeded = width - content.length;
  if (padNeeded <= 0) return content;

  if (align === 'right') {
    return ' '.repeat(padNeeded) + content;
  } else if (align === 'center') {
    const leftPad = Math.floor(padNeeded / 2);
    const rightPad = padNeeded - leftPad;
    return ' '.repeat(leftPad) + content + ' '.repeat(rightPad);
  } else {
    // Default: left-aligned
    return content + ' '.repeat(padNeeded);
  }
}

/**
 * Format all tables in the active editor.
 */
export async function formatTablesCommand(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    vscode.window.showInformationMessage('No markdown file is active.');
    return;
  }

  const edits = formatTablesInDocument(editor.document);
  if (edits.length === 0) {
    vscode.window.showInformationMessage('All tables are already formatted.');
    return;
  }

  const wsEdit = new vscode.WorkspaceEdit();
  for (const edit of edits) {
    wsEdit.replace(editor.document.uri, edit.range, edit.newText);
  }
  await vscode.workspace.applyEdit(wsEdit);
}

/**
 * Auto-format tables when the document changes (debounced).
 * Only runs when renderTables is enabled.
 */
let autoFormatTimeout: NodeJS.Timeout | undefined;

export function triggerAutoFormatTables(document: vscode.TextDocument): void {
  if (autoFormatTimeout) {
    clearTimeout(autoFormatTimeout);
  }
  autoFormatTimeout = setTimeout(async () => {
    const edits = formatTablesInDocument(document);
    if (edits.length > 0) {
      const wsEdit = new vscode.WorkspaceEdit();
      for (const edit of edits) {
        wsEdit.replace(document.uri, edit.range, edit.newText);
      }
      await vscode.workspace.applyEdit(wsEdit);
    }
  }, 1000); // 1 second debounce to avoid reformatting while user is typing
}

export function disposeAutoFormat(): void {
  if (autoFormatTimeout) {
    clearTimeout(autoFormatTimeout);
    autoFormatTimeout = undefined;
  }
}
