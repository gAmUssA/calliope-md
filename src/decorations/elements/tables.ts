import * as vscode from 'vscode';
import type { TableElement, TableAlignType } from '../../parser/types';
import type { DecorationTypes } from '../decorationTypes';
import { getCursorPositions } from '../visibilityState';

// Subtle alignment indicator characters shown on header cells
const ALIGN_INDICATORS: Record<string, string> = {
  left: ' ◁',
  center: ' ◇',
  right: ' ▷',
};

export interface TableDecorations {
  tableHeaderCell: vscode.DecorationOptions[];
  tableBodyCell: vscode.DecorationOptions[];
  tableSeparatorLine: vscode.DecorationOptions[];
  tableRowLine: vscode.DecorationOptions[];
  tableHeaderBorder: vscode.DecorationOptions[];
  tableLabel: vscode.DecorationOptions[];
  tableLastRowBorder: vscode.DecorationOptions[];
  tablePipeHidden: vscode.DecorationOptions[];
  syntaxHidden: vscode.DecorationOptions[];
  syntaxGhost: vscode.DecorationOptions[];
}

export function createTableDecorations(
  tables: TableElement[],
  editor: vscode.TextEditor
): TableDecorations {
  const result: TableDecorations = {
    tableHeaderCell: [],
    tableBodyCell: [],
    tableSeparatorLine: [],
    tableRowLine: [],
    tableHeaderBorder: [],
    tableLabel: [],
    tableLastRowBorder: [],
    tablePipeHidden: [],
    syntaxHidden: [],
    syntaxGhost: [],
  };

  const cursorPositions = getCursorPositions(editor);

  for (const table of tables) {
    const tableStartLine = table.range.start.line - 1;
    const tableEndLine = table.range.end.line - 1;
    const cursorInTable = cursorPositions.some(
      c => c.line >= tableStartLine && c.line <= tableEndLine
    );

    // Table label badge: "Table" on the left, "cols × rows" on the right
    // Placed on the blank line above the table for clean separation
    if (!cursorInTable) {
      const numCols = table.align.length;
      const numBodyRows = table.rows.filter(r => !r.isHeader).length;
      const labelLine = tableStartLine > 0 ? tableStartLine - 1 : tableStartLine;
      const labelRange = new vscode.Range(labelLine, 0, labelLine, 0);
      // Compute table width in characters for spacing
      const headerRow = table.rows.find(r => r.isHeader);
      const tableLineText = headerRow 
        ? editor.document.lineAt(headerRow.range.start.line - 1).text 
        : '';
      const tableWidth = tableLineText.length;
      const leftText = 'Table';
      const rightText = `${numCols} × ${numBodyRows + 1}`;
      // Fill middle with spaces so dimensions appear right-aligned
      const middleSpaces = Math.max(2, tableWidth - leftText.length - rightText.length);
      const labelText = leftText + ' '.repeat(middleSpaces) + rightText;

      result.tableLabel.push({
        range: labelRange,
        renderOptions: {
          after: {
            contentText: labelText,
            color: new vscode.ThemeColor('editorLineNumber.foreground'),
            fontStyle: 'italic',
            fontWeight: 'normal',
            fontSize: '0.85em',
          },
        },
      });
    }

    // Separator row
    const sepLine = table.separatorRange.start.line - 1;
    const cursorOnSep = cursorPositions.some(c => c.line === sepLine);

    if (!cursorOnSep) {
      const sepRange = new vscode.Range(
        table.separatorRange.start.line - 1,
        table.separatorRange.start.column - 1,
        table.separatorRange.end.line - 1,
        table.separatorRange.end.column - 1
      );
      if (cursorInTable) {
        // Dimmed hint when cursor is in the table but not on separator
        result.syntaxGhost.push({ range: sepRange });
      } else {
        // Completely hidden when cursor is outside the table
        result.syntaxHidden.push({ range: sepRange });
      }
    }

    // Data rows
    for (const row of table.rows) {
      const rowLine = row.range.start.line - 1;
      const cursorOnRow = cursorPositions.some(c => c.line === rowLine);

      // Whole-line bottom border for clean row separation
      // Header gets a thicker border, last body row gets thick bottom frame, others get thin
      if (!cursorOnRow) {
        const lineRange = new vscode.Range(rowLine, 0, rowLine, 0);
        if (row.isHeader) {
          result.tableHeaderBorder.push({ range: lineRange });
        } else {
          // Check if this is the last data row in the table
          const bodyRows = table.rows.filter(r => !r.isHeader);
          const lastBodyRow = bodyRows[bodyRows.length - 1];
          if (lastBodyRow && row.range.start.line === lastBodyRow.range.start.line) {
            result.tableLastRowBorder.push({ range: lineRange });
          } else {
            result.tableRowLine.push({ range: lineRange });
          }
        }
      }

      for (let cellIdx = 0; cellIdx < row.cells.length; cellIdx++) {
        const cell = row.cells[cellIdx];
        const cellAlign = table.align[cellIdx] || null;

        const contentRange = new vscode.Range(
          cell.contentRange.start.line - 1,
          cell.contentRange.start.column - 1,
          cell.contentRange.end.line - 1,
          cell.contentRange.end.column - 1
        );

        // Style cells when cursor is not on this row
        if (!cursorOnRow) {
          if (row.isHeader) {
            const decoration: vscode.DecorationOptions = {
              range: contentRange,
            };

            // Add alignment indicator on header cells (only for non-default alignment)
            if (cellAlign && ALIGN_INDICATORS[cellAlign]) {
              decoration.renderOptions = {
                after: {
                  contentText: ALIGN_INDICATORS[cellAlign],
                  color: new vscode.ThemeColor('editorLineNumber.foreground'),
                  fontStyle: 'normal',
                  fontWeight: 'normal',
                },
              };
            }

            result.tableHeaderCell.push(decoration);
          } else {
            result.tableBodyCell.push({ range: contentRange });
          }
        }

        // Pipe delimiter visibility
        const pipeRange = new vscode.Range(
          cell.pipeRange.start.line - 1,
          cell.pipeRange.start.column - 1,
          cell.pipeRange.end.line - 1,
          cell.pipeRange.end.column - 1
        );

        if (cursorOnRow) {
          // raw: pipes fully visible for editing
        } else {
          // Hide pipes with opacity:0 — preserves character width for column alignment
          result.tablePipeHidden.push({ range: pipeRange });
        }
      }

      // Trailing pipe
      if (rowLine < editor.document.lineCount) {
        const lineText = editor.document.lineAt(rowLine).text;
        const trimmed = lineText.trimEnd();
        if (trimmed.endsWith('|')) {
          const pipeCol = trimmed.length - 1;
          const trailingRange = new vscode.Range(rowLine, pipeCol, rowLine, pipeCol + 1);

          if (cursorOnRow) {
            // raw: visible for editing
          } else {
            // Hide trailing pipe with opacity:0
            result.tablePipeHidden.push({ range: trailingRange });
          }
        }
      }
    }
  }

  return result;
}

export function applyTableDecorations(
  editor: vscode.TextEditor,
  types: DecorationTypes,
  decorations: TableDecorations
): void {
  editor.setDecorations(types.tableHeaderCell, decorations.tableHeaderCell);
  editor.setDecorations(types.tableBodyCell, decorations.tableBodyCell);
  editor.setDecorations(types.tableSeparatorLine, decorations.tableSeparatorLine);
  editor.setDecorations(types.tableRowLine, decorations.tableRowLine);
  editor.setDecorations(types.tableHeaderBorder, decorations.tableHeaderBorder);
  editor.setDecorations(types.tableLabel, decorations.tableLabel);
  editor.setDecorations(types.tableLastRowBorder, decorations.tableLastRowBorder);
  editor.setDecorations(types.tablePipeHidden, decorations.tablePipeHidden);
}

export function clearTableDecorations(
  editor: vscode.TextEditor,
  types: DecorationTypes
): void {
  editor.setDecorations(types.tableHeaderCell, []);
  editor.setDecorations(types.tableBodyCell, []);
  editor.setDecorations(types.tableSeparatorLine, []);
  editor.setDecorations(types.tableRowLine, []);
  editor.setDecorations(types.tableHeaderBorder, []);
  editor.setDecorations(types.tableLabel, []);
  editor.setDecorations(types.tableLastRowBorder, []);
  editor.setDecorations(types.tablePipeHidden, []);
}
