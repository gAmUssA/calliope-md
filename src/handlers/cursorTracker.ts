import * as vscode from 'vscode';

export type CursorChangeCallback = (editor: vscode.TextEditor) => void;

let callback: CursorChangeCallback | undefined;

export function setCursorChangeCallback(cb: CursorChangeCallback): void {
  callback = cb;
}

export function handleSelectionChange(event: vscode.TextEditorSelectionChangeEvent): void {
  if (callback && event.textEditor.document.languageId === 'markdown') {
    callback(event.textEditor);
  }
}
