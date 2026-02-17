import * as vscode from 'vscode';

export interface CalliopeConfig {
  enabled: boolean;
  ghostOpacity: number;
  renderHeaders: boolean;
  renderEmphasis: boolean;
  renderTaskLists: boolean;
  renderLinks: boolean;
  renderInlineCode: boolean;
  renderBlockquotes: boolean;
  renderHorizontalRules: boolean;
  renderCodeBlocks: boolean;
  renderImages: boolean;
  renderLists: boolean;
  renderMermaidDiagrams: boolean;
  mermaidRenderMode: 'svg' | 'ascii' | 'auto';
  renderMetadata: boolean;
  renderTables: boolean;
}

export function getConfig(): CalliopeConfig {
  const config = vscode.workspace.getConfiguration('calliope');

  return {
    enabled: config.get<boolean>('enabled', true),
    ghostOpacity: config.get<number>('ghostOpacity', 0.3),
    renderHeaders: config.get<boolean>('renderHeaders', true),
    renderEmphasis: config.get<boolean>('renderEmphasis', true),
    renderTaskLists: config.get<boolean>('renderTaskLists', true),
    renderLinks: config.get<boolean>('renderLinks', true),
    renderInlineCode: config.get<boolean>('renderInlineCode', true),
    renderBlockquotes: config.get<boolean>('renderBlockquotes', true),
    renderHorizontalRules: config.get<boolean>('renderHorizontalRules', true),
    renderCodeBlocks: config.get<boolean>('renderCodeBlocks', true),
    renderImages: config.get<boolean>('renderImages', true),
    renderLists: config.get<boolean>('renderLists', true),
    renderMermaidDiagrams: config.get<boolean>('renderMermaidDiagrams', false),
    mermaidRenderMode: config.get<'svg' | 'ascii' | 'auto'>('mermaidRenderMode', 'auto'),
    renderMetadata: config.get<boolean>('renderMetadata', true),
    renderTables: config.get<boolean>('renderTables', false),
  };
}
