import * as vscode from 'vscode';
import { LRUCache } from './lru-cache';
import { MermaidWebviewManager } from './webview-manager';
import { processSvg, svgToDataUri } from './svg-processor';
import { createErrorSvg, extractErrorMessage } from './error-handler';
import { MERMAID_CONSTANTS } from './constants';
import type { MermaidRenderOptions } from './types';

// Singleton webview manager instance
let webviewManager: MermaidWebviewManager | undefined;

// Memoization cache for decorations (LRU)
const decorationCache = new LRUCache<string, Promise<string>>(
  MERMAID_CONSTANTS.DECORATION_CACHE_MAX_ENTRIES
);

// Log "waiting for webview" at most once per session
let hasLoggedWaitingForWebview = false;

async function waitForWebviewOnceLogged(manager: MermaidWebviewManager): Promise<void> {
  if (!hasLoggedWaitingForWebview) {
    hasLoggedWaitingForWebview = true;
    console.warn('Mermaid: waiting for webview');
  }
  await manager.waitForWebview();
}

/**
 * Initialize the Mermaid renderer with extension context
 */
export function initMermaidRenderer(context: vscode.ExtensionContext): void {
  if (webviewManager) {
    return;
  }

  webviewManager = new MermaidWebviewManager();
  webviewManager.initialize(context);
}

/**
 * Memoized function to get Mermaid decoration
 */
function memoizeMermaidDecoration(
  func: (
    source: string,
    darkMode: boolean,
    height: number,
    fontFamily?: string
  ) => Promise<string>
): (source: string, darkMode: boolean, height: number, fontFamily?: string) => Promise<string> {
  return (
    source: string,
    darkMode: boolean,
    height: number,
    fontFamily?: string
  ): Promise<string> => {
    const key = `${source}|${darkMode}|${height}|${fontFamily ?? ''}`;
    const cached = decorationCache.get(key);
    if (cached) {
      return cached;
    }

    const promise = func(source, darkMode, height, fontFamily);
    decorationCache.set(key, promise);
    // Evict failed renders from cache
    promise.catch(() => {
      decorationCache.delete(key);
    });
    return promise;
  };
}

const getMermaidDecoration = memoizeMermaidDecoration(
  async (
    source: string,
    darkMode: boolean,
    height: number,
    fontFamily?: string
  ): Promise<string> => {
    if (!webviewManager) {
      throw new Error('Mermaid renderer not initialized. Call initMermaidRenderer first.');
    }

    await waitForWebviewOnceLogged(webviewManager);

    const svgString = await webviewManager.requestSvg(
      { source, darkMode, fontFamily },
      MERMAID_CONSTANTS.REQUEST_TIMEOUT_MS
    );

    // Check if this is an error SVG
    if (svgString.includes('Mermaid Rendering Error')) {
      const errorSvg = createErrorSvg(
        extractErrorMessage(svgString) || 'Rendering failed',
        Math.max(400, height * 2),
        height,
        darkMode
      );
      return errorSvg;
    }

    const processedSvg = processSvg(svgString, height);
    return processedSvg;
  }
);

/**
 * Render Mermaid SVG for decoration display
 */
export async function renderMermaidSvg(
  source: string,
  options: MermaidRenderOptions & { numLines?: number }
): Promise<string> {
  if (!webviewManager) {
    throw new Error('Mermaid renderer not initialized. Call initMermaidRenderer first.');
  }

  await waitForWebviewOnceLogged(webviewManager);

  const darkMode = options.theme === 'dark';

  // Calculate height based on line count
  const editorConfig = vscode.workspace.getConfiguration('editor');
  let lineHeight = editorConfig.get<number>('lineHeight', 0);

  if (lineHeight === 0 || lineHeight < 8) {
    const fontSize = editorConfig.get<number>('fontSize', 14);
    const multiplier = process.platform === 'darwin' ? 1.5 : 1.35;
    lineHeight = Math.round(multiplier * fontSize);
    if (lineHeight < 8) {
      lineHeight = 8;
    }
  }

  const numLines = options.numLines || 5;
  const height = options.height || (numLines + 2) * lineHeight;

  return getMermaidDecoration(source, darkMode, height, options.fontFamily);
}

/**
 * Clear the decoration cache (e.g., on theme change)
 */
export function clearMermaidCache(): void {
  decorationCache.clear();
}

// Re-export utilities
export { svgToDataUri } from './svg-processor';
export { createErrorSvg } from './error-handler';

/**
 * Dispose and clean up the Mermaid renderer
 */
export function disposeMermaidRenderer(): void {
  if (webviewManager) {
    webviewManager.dispose();
    webviewManager = undefined;
  }

  decorationCache.clear();
}
