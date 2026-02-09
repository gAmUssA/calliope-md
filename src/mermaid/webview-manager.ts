import * as vscode from 'vscode';
import { ColorThemeKind } from 'vscode';
import type { PendingRender, RenderResponse } from './types';
import { MERMAID_CONSTANTS } from './constants';
import { createErrorSvg } from './error-handler';

/**
 * Manages the Mermaid webview lifecycle and communication.
 * Adapted from SeardnaSchmid/markdown-inline-editor-vscode.
 */
export class MermaidWebviewManager {
  private webviewView: vscode.WebviewView | undefined;
  private webviewLoaded: Promise<void>;
  private resolveWebviewLoaded: (() => void) | undefined;
  private pendingRenders = new Map<string, PendingRender>();
  private renderRequestCounter = 0;
  private messageHandlerDisposable: vscode.Disposable | undefined;
  private initTimeoutId: NodeJS.Timeout | undefined;
  private _extensionContext: vscode.ExtensionContext | undefined;

  constructor() {
    this.webviewLoaded = new Promise<void>((resolve) => {
      this.resolveWebviewLoaded = resolve;
    });
  }

  get extensionContext(): vscode.ExtensionContext | undefined {
    return this._extensionContext;
  }

  /**
   * Initialize the webview manager with extension context
   */
  initialize(context: vscode.ExtensionContext): void {
    this._extensionContext = context;

    const provider = new MermaidWebviewViewProvider(this);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        MermaidWebviewViewProvider.viewType,
        provider,
        { webviewOptions: { retainContextWhenHidden: true } }
      )
    );

    // Focus the view to trigger webview creation, then switch back
    void this.ensureWebviewThenSwitchBack();
  }

  private ensureWebviewThenSwitchBack(): void {
    const WEBVIEW_READY_TIMEOUT_MS = 5000;
    const SWITCH_BACK_DELAY_MS = 100;

    vscode.commands
      .executeCommand('calliope.mermaidRenderer.focus')
      .then(
        () => {
          Promise.race([
            this.webviewLoaded,
            new Promise<void>((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), WEBVIEW_READY_TIMEOUT_MS)
            ),
          ])
            .then(() => {
              this.initTimeoutId = setTimeout(() => {
                vscode.commands.executeCommand('workbench.view.explorer');
                this.initTimeoutId = undefined;
              }, SWITCH_BACK_DELAY_MS);
            })
            .catch((err: unknown) => {
              if (err instanceof Error && err.message === 'timeout') {
                console.warn('Mermaid: Webview not ready after opening view');
              }
              this.initTimeoutId = setTimeout(() => {
                vscode.commands.executeCommand('workbench.view.explorer');
                this.initTimeoutId = undefined;
              }, SWITCH_BACK_DELAY_MS);
            });
        },
        (err: unknown) => {
          if (err !== undefined) {
            console.warn('Mermaid: Failed to focus view', err);
          }
        }
      );
  }

  setWebviewView(view: vscode.WebviewView): void {
    this.webviewView = view;
    this.resolveWebviewLoaded?.();
  }

  getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const mermaidScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'media', 'mermaid', 'mermaid.esm.min.mjs')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      padding: 20px;
      line-height: 1.6;
    }
    .info-box {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .info-box h3 {
      margin-top: 0;
      color: var(--vscode-textLink-foreground);
    }
    .info-box p {
      margin: 8px 0;
      color: var(--vscode-descriptionForeground);
    }
    .hidden {
      display: none;
    }
  </style>
</head>
<body>
  <div class="info-box">
    <h3>Mermaid Diagram Renderer</h3>
    <p>This webview is used internally by Calliope to render Mermaid diagrams inline in your markdown files.</p>
    <p><strong>You can safely ignore this view.</strong> It runs in the background and has no user-facing functionality.</p>
  </div>
  <div id="renderContainer" class="hidden"></div>
  <script type="module">
    import mermaid from '${mermaidScriptUri}';

    const vscode = acquireVsCodeApi();

    function getDiagramType(source) {
      const firstNonEmptyLine = source
        .split(/\\r?\\n/)
        .map((l) => l.trim())
        .find((l) => l.length > 0);
      if (!firstNonEmptyLine) return 'unknown';
      return firstNonEmptyLine.split(/\\s+/)[0] || 'unknown';
    }

    window.addEventListener('message', async (event) => {
      const data = event.data;

      if (!data || !data.source) {
        return;
      }

      const requestId = data.requestId;
      const diagramType = getDiagramType(data.source);

      try {
        mermaid.initialize({
          theme: data.darkMode ? 'dark' : 'default',
          fontFamily: data.fontFamily || undefined,
          startOnLoad: false,
          securityLevel: 'strict',
        });

        let svg;
        let renderContainer;
        const renderId = 'mermaid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

        if (diagramType === 'gantt') {
          renderContainer = document.createElement('div');
          renderContainer.style.position = 'absolute';
          renderContainer.style.left = '-10000px';
          renderContainer.style.top = '0';
          renderContainer.style.width = '2000px';
          renderContainer.style.height = '1px';
          renderContainer.style.visibility = 'hidden';
          document.body?.appendChild(renderContainer);
        }

        try {
          const result = renderContainer
            ? await mermaid.render(renderId, data.source, renderContainer)
            : await mermaid.render(renderId, data.source);
          svg = result.svg;
        } finally {
          if (renderContainer) {
            renderContainer.remove();
          }
        }

        vscode.postMessage({ svg, requestId });
      } catch (error) {
        const errorMessage = error?.message || error?.toString?.() || 'Unknown error occurred';
        vscode.postMessage({ error: errorMessage, requestId });
      }
    });

    vscode.postMessage({ ready: true });
  </script>
</body>
</html>`;
  }

  handleWebviewMessage(message: RenderResponse): void {
    if (message && message.ready) {
      return;
    }

    if (message && message.error) {
      const requestId = message.requestId;
      if (requestId && this.pendingRenders.has(requestId)) {
        const { resolve, timeoutId } = this.pendingRenders.get(requestId)!;
        clearTimeout(timeoutId);
        const isDark =
          vscode.window.activeColorTheme.kind === ColorThemeKind.Dark ||
          vscode.window.activeColorTheme.kind === ColorThemeKind.HighContrast;
        const errorSvg = createErrorSvg(message.error, 400, 200, isDark);
        resolve(errorSvg);
        this.pendingRenders.delete(requestId);
      }
      return;
    }

    if (message && message.requestId && this.pendingRenders.has(message.requestId)) {
      const requestId = message.requestId;
      const { resolve, timeoutId } = this.pendingRenders.get(requestId)!;
      clearTimeout(timeoutId);
      const svg = message.svg || '';
      resolve(svg);
      this.pendingRenders.delete(requestId);
      return;
    }

    // Legacy support: string message without requestId
    if (typeof message === 'string') {
      if (this.pendingRenders.size === 1) {
        const [requestId, { resolve, timeoutId }] = Array.from(this.pendingRenders.entries())[0];
        clearTimeout(timeoutId);
        resolve(message as unknown as string);
        this.pendingRenders.delete(requestId);
      }
    }
  }

  setMessageHandlerDisposable(disposable: vscode.Disposable): void {
    this.messageHandlerDisposable?.dispose();
    this.messageHandlerDisposable = disposable;
  }

  /**
   * Request SVG rendering with timeout
   */
  async requestSvg(
    data: { source: string; darkMode: boolean; fontFamily?: string },
    timeoutMs: number = MERMAID_CONSTANTS.REQUEST_TIMEOUT_MS
  ): Promise<string> {
    if (!this.webviewView) {
      throw new Error('Webview not available');
    }

    const requestId = `req-${Date.now()}-${++this.renderRequestCounter}`;

    return new Promise<string>((resolve, reject) => {
      if (!this.webviewView) {
        reject(new Error('Webview not available'));
        return;
      }

      const timeoutId = setTimeout(() => {
        if (this.pendingRenders.has(requestId)) {
          this.pendingRenders.delete(requestId);
          reject(new Error('Mermaid render request timed out'));
        }
      }, timeoutMs);

      this.pendingRenders.set(requestId, { resolve, reject, timeoutId });

      try {
        this.webviewView.webview.postMessage({ ...data, requestId });
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingRenders.delete(requestId);
        reject(error);
      }
    });
  }

  async waitForWebview(): Promise<void> {
    await this.webviewLoaded;
    if (!this.webviewView) {
      throw new Error('Failed to create mermaid webview');
    }
  }

  dispose(): void {
    if (this.initTimeoutId) {
      clearTimeout(this.initTimeoutId);
      this.initTimeoutId = undefined;
    }

    for (const { reject, timeoutId } of this.pendingRenders.values()) {
      clearTimeout(timeoutId);
      reject(new Error('Mermaid renderer disposed'));
    }
    this.pendingRenders.clear();

    this.messageHandlerDisposable?.dispose();
    this.messageHandlerDisposable = undefined;

    this.webviewView = undefined;
    this.resolveWebviewLoaded = undefined;
  }
}

/**
 * Webview view provider for Mermaid rendering
 */
class MermaidWebviewViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'calliope.mermaidRenderer';

  constructor(private manager: MermaidWebviewManager) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    if (!this.manager.extensionContext) {
      return;
    }

    const extensionContext = this.manager.extensionContext;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(extensionContext.extensionUri, 'media')],
    };

    webviewView.webview.html = this.manager.getWebviewContent(
      webviewView.webview,
      extensionContext.extensionUri
    );

    this.manager.setWebviewView(webviewView);

    const messageHandlerDisposable = webviewView.webview.onDidReceiveMessage(
      (message) => {
        this.manager.handleWebviewMessage(message);
      },
      null,
      []
    );

    this.manager.setMessageHandlerDisposable(messageHandlerDisposable);
  }
}
