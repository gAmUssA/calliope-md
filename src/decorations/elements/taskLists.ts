import * as vscode from 'vscode';
import type { TaskListElement } from '../../parser/types';
import type { DecorationTypes } from '../decorationTypes';
import { getVisibilityState, getCursorPositions } from '../visibilityState';

export interface TaskListDecorations {
  uncheckedCheckbox: vscode.DecorationOptions[];
  checkedCheckbox: vscode.DecorationOptions[];
  completedLine: vscode.DecorationOptions[];
  syntaxHidden: vscode.DecorationOptions[];
  syntaxGhost: vscode.DecorationOptions[];
}

export function createTaskListDecorations(
  taskLists: TaskListElement[],
  editor: vscode.TextEditor
): TaskListDecorations {
  const result: TaskListDecorations = {
    uncheckedCheckbox: [],
    checkedCheckbox: [],
    completedLine: [],
    syntaxHidden: [],
    syntaxGhost: [],
  };

  const cursorPositions = getCursorPositions(editor);

  for (const task of taskLists) {
    const visibility = getVisibilityState(cursorPositions, task.range, task.contentRange);

    // Checkbox range (the `- [ ]` or `- [x]` part)
    const checkboxRange = new vscode.Range(
      task.checkboxRange.start.line - 1,
      task.checkboxRange.start.column - 1,
      task.checkboxRange.end.line - 1,
      task.checkboxRange.end.column - 1
    );

    // Content range (the task text)
    const contentRange = new vscode.Range(
      task.contentRange.start.line - 1,
      task.contentRange.start.column - 1,
      task.contentRange.end.line - 1,
      task.contentRange.end.column - 1
    );

    // Full line range for completed tasks
    const lineRange = new vscode.Range(
      task.range.start.line - 1,
      0,
      task.range.end.line - 1,
      editor.document.lineAt(task.range.end.line - 1).text.length
    );

    if (visibility === 'rendered' || visibility === 'ghost') {
      // Show checkbox character
      const checkboxDecoration: vscode.DecorationOptions = {
        range: checkboxRange,
        renderOptions: {
          before: {
            contentText: task.checked ? '☑ ' : '☐ ',
            color: new vscode.ThemeColor(task.checked ? 'terminal.ansiGreen' : 'foreground'),
          },
        },
      };

      if (task.checked) {
        result.checkedCheckbox.push(checkboxDecoration);
        // Apply strikethrough and reduced opacity to completed task content
        result.completedLine.push({ range: contentRange });
      } else {
        result.uncheckedCheckbox.push(checkboxDecoration);
      }

      // Hide the original checkbox syntax
      if (visibility === 'rendered') {
        result.syntaxHidden.push({ range: checkboxRange });
      } else {
        result.syntaxGhost.push({ range: checkboxRange });
      }
    }
    // 'raw' state: show original syntax, no checkbox replacement
  }

  return result;
}

export function applyTaskListDecorations(
  editor: vscode.TextEditor,
  types: DecorationTypes,
  decorations: TaskListDecorations
): void {
  // Combine checkbox decorations
  const allCheckboxes = [...decorations.uncheckedCheckbox, ...decorations.checkedCheckbox];
  editor.setDecorations(types.taskCheckbox, allCheckboxes);
  editor.setDecorations(types.taskCompletedLine, decorations.completedLine);
  // Note: syntaxHidden and syntaxGhost are combined with other element types in the manager
}
