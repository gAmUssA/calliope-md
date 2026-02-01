import * as vscode from 'vscode';

/**
 * Toggles the checkbox state at the given line or current cursor position.
 */
export async function toggleCheckbox(
  editor: vscode.TextEditor,
  line?: number
): Promise<boolean> {
  const targetLine = line ?? editor.selection.active.line;
  const lineText = editor.document.lineAt(targetLine).text;

  // Match unchecked checkbox: - [ ]
  const uncheckedMatch = lineText.match(/^(\s*-\s*)\[ \]/);
  // Match checked checkbox: - [x] or - [X]
  const checkedMatch = lineText.match(/^(\s*-\s*)\[[xX]\]/);

  if (uncheckedMatch) {
    // Replace [ ] with [x]
    const prefixLength = uncheckedMatch[1].length;
    const start = new vscode.Position(targetLine, prefixLength);
    const end = new vscode.Position(targetLine, prefixLength + 3);

    return editor.edit(editBuilder => {
      editBuilder.replace(new vscode.Range(start, end), '[x]');
    });
  } else if (checkedMatch) {
    // Replace [x] with [ ]
    const prefixLength = checkedMatch[1].length;
    const start = new vscode.Position(targetLine, prefixLength);
    const end = new vscode.Position(targetLine, prefixLength + 3);

    return editor.edit(editBuilder => {
      editBuilder.replace(new vscode.Range(start, end), '[ ]');
    });
  }

  return false;
}

/**
 * Detects if a click occurred on a checkbox and toggles it.
 * Called from selection change event.
 */
export function detectCheckboxClick(
  editor: vscode.TextEditor,
  previousSelection: vscode.Selection | undefined
): boolean {
  // Only trigger on single-click selections (not drag selections)
  if (!editor.selection.isEmpty) {
    return false;
  }

  const line = editor.selection.active.line;
  const char = editor.selection.active.character;
  const lineText = editor.document.lineAt(line).text;

  // Check if click is in the checkbox area (roughly first 6 characters: "- [ ] ")
  const checkboxMatch = lineText.match(/^(\s*-\s*\[[xX ]\])\s*/);
  if (checkboxMatch && char <= checkboxMatch[0].length) {
    // Click is in checkbox area
    toggleCheckbox(editor, line);
    return true;
  }

  return false;
}
