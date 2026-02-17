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
    syntaxGhost: [],
  };

  const cursorPositions = getCursorPositions(editor);

  for (const table of tables) {
    const tableStartLine = table.range.start.line - 1;
    const tableEndLine = table.range.end.line - 1;
    const cursorInTable = cursorPositions.some(
      c => c.line >= tableStartLine && c.line <= tableEndLine
    );

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
        result.syntaxGhost.push({ range: sepRange });
      } else {
        // Use dedicated tableSeparatorLine (very dim, ~8% opacity) instead of
        // syntaxHidden. syntaxHidden's letterSpacing:-1000px collapses character
        // widths, causing layout shifts that trigger visible-range events and
        // create a decoration feedback loop (shimmer).
        result.tableSeparatorLine.push({ range: sepRange });
      }
    }

    // Data rows
    for (const row of table.rows) {
      const rowLine = row.range.start.line - 1;
      const cursorOnRow = cursorPositions.some(c => c.line === rowLine);

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
          // raw: pipes fully visible
        } else {
          // Always use ghost (dimmed) for pipes — never collapse width.
          // Using syntaxHidden would cause layout shifts (shimmer) because
          // letterSpacing:-1000px collapses pipe width to zero, then going
          // back to full width when the cursor enters the table.
          result.syntaxGhost.push({ range: pipeRange });
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
            // raw
          } else {
            // Same as leading pipes: always ghost, never collapse width
            result.syntaxGhost.push({ range: trailingRange });
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
}

export function clearTableDecorations(
  editor: vscode.TextEditor,
  types: DecorationTypes
): void {
  editor.setDecorations(types.tableHeaderCell, []);
  editor.setDecorations(types.tableBodyCell, []);
  editor.setDecorations(types.tableSeparatorLine, []);
}
