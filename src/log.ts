import * as vscode from 'vscode';

let channel: vscode.LogOutputChannel | undefined;

/**
 * Shared "Calliope" log output channel so users can inspect and report
 * failures (View → Output → Calliope) without opening devtools.
 */
export function getLogger(): vscode.LogOutputChannel {
  if (!channel) {
    channel = vscode.window.createOutputChannel('Calliope', { log: true });
  }
  return channel;
}

export function disposeLogger(): void {
  channel?.dispose();
  channel = undefined;
}
