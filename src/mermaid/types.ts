/**
 * Options for rendering Mermaid diagrams
 */
export interface MermaidRenderOptions {
  theme: 'default' | 'dark';
  fontFamily?: string;
  height?: number;
  numLines?: number;
}

/**
 * Pending render request tracking
 */
export interface PendingRender {
  resolve: (svg: string) => void;
  reject: (error: Error) => void;
  timeoutId: NodeJS.Timeout;
}

/**
 * Message sent to webview for rendering
 */
export interface RenderRequest {
  source: string;
  darkMode: boolean;
  fontFamily?: string;
  requestId: string;
}

/**
 * Message received from webview
 */
export interface RenderResponse {
  svg?: string;
  error?: string;
  requestId?: string;
  ready?: boolean;
}
