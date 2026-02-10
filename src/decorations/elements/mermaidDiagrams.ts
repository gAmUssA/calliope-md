import * as vscode from 'vscode';
import * as crypto from 'crypto';
import type { FencedCodeElement } from '../../parser/types';
import type { DecorationTypes } from '../decorationTypes';
import { getVisibilityState, getCursorPositions } from '../visibilityState';
import { getConfig } from '../../config';

export interface MermaidDiagramDecorations {
  mermaidRendered: vscode.DecorationOptions[];
  mermaidGhost: vscode.DecorationOptions[];
  mermaidError: vscode.DecorationOptions[];
}

// SVG rendering cache: content hash -> data URI
const svgCache = new Map<string, string>();

// ASCII rendering cache: content hash -> ascii text
const asciiCache = new Map<string, string>();

// Error cache: content hash -> error message
const errorCache = new Map<string, string>();

// Track active diagram hashes for cleanup
const activeDiagramHashes = new Set<string>();

/**
 * Calculate hash of mermaid code for caching
 */
function hashContent(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Convert SVG string to data URI using URL encoding
 * This matches the approach from markdown-inline-editor-vscode
 */
function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

/**
 * Clean up unused SVG files
 * Note: This is now a no-op since we use data URIs instead of files
 * Kept for backward compatibility
 */
export function cleanupUnusedSvgFiles(): void {
  // No-op: we no longer use file system for SVG storage
  // Data URIs are stored in memory cache only
}

/**
 * Clear all mermaid caches - call when document changes significantly
 * This prevents stale diagrams from showing after content is removed
 */
export function clearMermaidCaches(): void {
  svgCache.clear();
  asciiCache.clear();
  errorCache.clear();
  activeDiagramHashes.clear();
}

/**
 * Render mermaid code to SVG asynchronously
 */
async function renderMermaidToSVG(code: string): Promise<string> {
  try {
    // Dynamic import to avoid loading mermaid until needed
    const { renderMermaid } = await import('beautiful-mermaid');
    
    // Detect if we're in dark mode
    const isDarkMode = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ||
                       vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast;
    
    // Render options with good spacing - let diagram be its natural size
    const options = {
      // Theme colors
      bg: isDarkMode ? '#1e1e1e' : '#ffffff',
      fg: isDarkMode ? '#d4d4d4' : '#333333',
      // Optional enrichment colors for better visibility
      line: isDarkMode ? '#569cd6' : '#0066cc',
      accent: isDarkMode ? '#4ec9b0' : '#107c10',
      muted: isDarkMode ? '#808080' : '#666666',
      // Layout options - generous spacing for readability
      padding: 40,           // Canvas padding (default: 40)
      nodeSpacing: 50,       // Horizontal spacing between nodes (default: 24)
      layerSpacing: 50,      // Vertical spacing between layers (default: 40)
      transparent: true,     // Transparent background for cleaner look
    };
    
    // Render the diagram with options - no height constraints
    // VS Code decoration API overlays content, so large diagrams will overflow
    // This is a known limitation - diagrams render at natural size for readability
    const svg = await renderMermaid(code, options);
    
    return svg;
  } catch (error) {
    // Throw error to be caught by caller
    throw new Error(`Mermaid rendering failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Render mermaid code to ASCII art synchronously
 */
function renderMermaidToAscii(code: string): string {
  try {
    // Synchronous import since renderMermaidAscii is sync
    const { renderMermaidAscii } = require('beautiful-mermaid');
    
    // Render the diagram with compact options to fit in hover tooltips
    const ascii = renderMermaidAscii(code, { 
      useAscii: false,  // Unicode box-drawing for better appearance
      paddingX: 2,      // Reduced horizontal spacing (default: 5)
      paddingY: 1,      // Reduced vertical spacing (default: 5)
      boxBorderPadding: 0  // Minimal padding inside boxes (default: 1)
    });
    
    return ascii;
  } catch (error) {
    // Throw error to be caught by caller
    throw new Error(`ASCII rendering failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Render mermaid with error handling and caching
 */
async function renderMermaidWithCache(code: string, hash: string): Promise<{ dataUri?: string; ascii?: string; error?: string }> {
  const config = getConfig();
  const mode = config.mermaidRenderMode;
  
  // Check cache first based on mode
  // In auto mode, check SVG first since it's preferred
  if (mode === 'svg' || mode === 'auto') {
    if (svgCache.has(hash)) {
      return { dataUri: svgCache.get(hash) };
    }
  }
  
  if (mode === 'ascii' || mode === 'auto') {
    if (asciiCache.has(hash)) {
      return { ascii: asciiCache.get(hash) };
    }
  }
  
  if (errorCache.has(hash)) {
    return { error: errorCache.get(hash) };
  }
  
  // Render based on mode
  try {
    if (mode === 'ascii') {
      // ASCII mode only
      const ascii = renderMermaidToAscii(code);
      asciiCache.set(hash, ascii);
      return { ascii };
    } else if (mode === 'svg') {
      // SVG mode only
      const svg = await renderMermaidToSVG(code);
      const dataUri = svgToDataUri(svg);
      
      svgCache.set(hash, dataUri);
      return { dataUri };
    } else {
      // Auto mode: try SVG, fallback to ASCII
      try {
        const svg = await renderMermaidToSVG(code);
        const dataUri = svgToDataUri(svg);
        
        svgCache.set(hash, dataUri);
        return { dataUri };
      } catch (svgError) {
        // SVG failed, try ASCII fallback
        console.warn('SVG rendering failed, falling back to ASCII:', svgError);
        try {
          const ascii = renderMermaidToAscii(code);
          asciiCache.set(hash, ascii);
          return { ascii };
        } catch (asciiError) {
          throw svgError; // Throw original SVG error if ASCII also fails
        }
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errorCache.set(hash, errorMsg);
    console.error('Mermaid rendering error:', errorMsg);
    return { error: errorMsg };
  }
}

/**
 * Create mermaid diagram decorations with three-state visibility logic
 */
export function createMermaidDiagramDecorations(
  mermaidBlocks: FencedCodeElement[],
  editor: vscode.TextEditor
): MermaidDiagramDecorations {
  const result: MermaidDiagramDecorations = {
    mermaidRendered: [],
    mermaidGhost: [],
    mermaidError: [],
  };
  
  const cursorPositions = getCursorPositions(editor);
  
  // Clear active diagram hashes for this update cycle
  activeDiagramHashes.clear();
  
  for (const block of mermaidBlocks) {
    // Check visibility state
    const visibility = getVisibilityState(cursorPositions, block.range, block.contentRange);
    
    // Extract code content
    const document = editor.document;
    const startLine = block.contentRange.start.line - 1;
    const endLine = block.contentRange.end.line - 1;
    
    let code = '';
    for (let i = startLine; i <= endLine; i++) {
      if (i < document.lineCount) {
        code += document.lineAt(i).text + '\n';
      }
    }
    code = code.trim();
    
    // Skip if no code
    if (!code) {
      continue;
    }
    
    // Calculate the total number of lines in the mermaid block (including fences)
    const totalLines = block.range.end.line - block.range.start.line + 1;
    
    // Calculate hash for caching
    const hash = hashContent(code);
    
    // Mark this diagram as active
    activeDiagramHashes.add(hash);
    
    // Start async rendering (non-blocking)
    renderMermaidWithCache(code, hash).then(({ dataUri, ascii, error }) => {
      // Trigger decoration update when rendering completes
      // This will be handled by the decoration manager's update cycle
      if (dataUri || ascii || error) {
        // Force a decoration update by triggering a fake change
        // The decoration manager will pick up the cached result
        vscode.commands.executeCommand('calliope.internal.updateDecorations');
      }
    }).catch(err => {
      console.error('Unexpected error in mermaid rendering:', err);
    });
    
    // Check if we have cached results
    const cachedDataUri = svgCache.get(hash);
    const cachedAscii = asciiCache.get(hash);
    const cachedError = errorCache.get(hash);
    
    // Create ranges for fences and content
    const openFenceRange = new vscode.Range(
      block.openFenceRange.start.line - 1,
      block.openFenceRange.start.column - 1,
      block.openFenceRange.end.line - 1,
      block.openFenceRange.end.column - 1
    );
    
    const closeFenceRange = new vscode.Range(
      block.closeFenceRange.start.line - 1,
      block.closeFenceRange.start.column - 1,
      block.closeFenceRange.end.line - 1,
      block.closeFenceRange.end.column - 1
    );
    
    const contentRange = new vscode.Range(
      block.contentRange.start.line - 1,
      block.contentRange.start.column - 1,
      block.contentRange.end.line - 1,
      block.contentRange.end.column - 1
    );
    
    if (cachedError) {
      // Log error to console instead of showing inline (prevents diagram overlap)
      console.warn(`[Calliope] Mermaid rendering failed at line ${block.openFenceRange.start.line}: ${cachedError}`);
      // Don't add any decorations - let the code block display normally
      continue;
    } else if (cachedDataUri) {
      // Show SVG diagram using data URI (prioritize SVG over ASCII)
      const svgUri = vscode.Uri.parse(cachedDataUri);
      
      if (visibility === 'rendered') {
        // Hide fences
        result.mermaidRendered.push({ range: openFenceRange });
        result.mermaidRendered.push({ range: closeFenceRange });
        
        // Hide each content line individually (multi-line range decoration doesn't hide properly)
        const contentStartLine = block.contentRange.start.line - 1;
        const contentEndLine = block.contentRange.end.line - 1;
        for (let lineNum = contentStartLine; lineNum <= contentEndLine; lineNum++) {
          if (lineNum < editor.document.lineCount) {
            const line = editor.document.lineAt(lineNum);
            result.mermaidRendered.push({
              range: new vscode.Range(lineNum, 0, lineNum, line.text.length)
            });
          }
        }
        
        // Show SVG above opening fence
        result.mermaidRendered.push({
          range: new vscode.Range(openFenceRange.start, openFenceRange.start),
          renderOptions: {
            before: {
              contentIconPath: svgUri,
            },
          },
        });
      } else if (visibility === 'ghost') {
        // Ghost fences
        result.mermaidGhost.push({ range: openFenceRange });
        result.mermaidGhost.push({ range: closeFenceRange });
        
        // Ghost each content line individually
        const contentStartLine = block.contentRange.start.line - 1;
        const contentEndLine = block.contentRange.end.line - 1;
        for (let lineNum = contentStartLine; lineNum <= contentEndLine; lineNum++) {
          if (lineNum < editor.document.lineCount) {
            const line = editor.document.lineAt(lineNum);
            result.mermaidGhost.push({
              range: new vscode.Range(lineNum, 0, lineNum, line.text.length)
            });
          }
        }
        
        // Show SVG with reduced opacity
        result.mermaidGhost.push({
          range: new vscode.Range(openFenceRange.start, openFenceRange.start),
          renderOptions: {
            before: {
              contentIconPath: svgUri,
            },
          },
        });
      }
      // 'raw' state: show code normally, no decorations
    } else if (cachedAscii) {
      // ASCII rendering - show indicator that ASCII is available (VS Code decorations don't support multiline text)
      // The ASCII art itself is available via hover tooltip
      // Only show indicator if not in 'raw' state
      if (visibility === 'rendered') {
        result.mermaidRendered.push({
          range: openFenceRange,
          renderOptions: {
            after: {
              contentText: ' 📊 ASCII diagram (hover to view)',
              color: new vscode.ThemeColor('editorCodeLens.foreground'),
            },
          },
        });
      } else if (visibility === 'ghost') {
        result.mermaidGhost.push({
          range: openFenceRange,
          renderOptions: {
            after: {
              contentText: ' 📊 ASCII diagram (hover to view)',
              color: new vscode.ThemeColor('editorCodeLens.foreground'),
            },
          },
        });
      }
      // 'raw' state: show code normally, no decorations
    }
  }
  
  // Clean up cache entries for diagrams that no longer exist in the document
  // This prevents stale SVGs from showing after mermaid blocks are deleted
  for (const hash of svgCache.keys()) {
    if (!activeDiagramHashes.has(hash)) {
      svgCache.delete(hash);
    }
  }
  for (const hash of asciiCache.keys()) {
    if (!activeDiagramHashes.has(hash)) {
      asciiCache.delete(hash);
    }
  }
  for (const hash of errorCache.keys()) {
    if (!activeDiagramHashes.has(hash)) {
      errorCache.delete(hash);
    }
  }
  
  return result;
}

/**
 * Apply mermaid diagram decorations to the editor
 */
export function applyMermaidDiagramDecorations(
  editor: vscode.TextEditor,
  types: DecorationTypes,
  decorations: MermaidDiagramDecorations
): void {
  editor.setDecorations(types.mermaidDiagramRendered, decorations.mermaidRendered);
  editor.setDecorations(types.mermaidDiagramGhost, decorations.mermaidGhost);
  editor.setDecorations(types.mermaidDiagramError, decorations.mermaidError);
}

/**
 * Hover provider for displaying ASCII diagrams
 */
export class MermaidHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const line = document.lineAt(position.line);
    const text = line.text;
    
    // Check if cursor is on a mermaid fence line
    if (!text.trim().startsWith('```mermaid')) {
      return null;
    }
    
    // Find the code block boundaries
    let startLine = position.line;
    let endLine = position.line;
    
    // Find end of code block
    for (let i = position.line + 1; i < document.lineCount; i++) {
      const lineText = document.lineAt(i).text;
      if (lineText.trim() === '```') {
        endLine = i;
        break;
      }
    }
    
    // Extract code content
    let code = '';
    for (let i = startLine + 1; i < endLine; i++) {
      code += document.lineAt(i).text + '\n';
    }
    code = code.trim();
    
    if (!code) {
      return null;
    }
    
    const markdown = new vscode.MarkdownString();
    
    // Calculate hash and check ASCII cache
    const hash = hashContent(code);
    const cachedAscii = asciiCache.get(hash);
    
    if (cachedAscii) {
      markdown.appendCodeblock(cachedAscii, '');
      markdown.appendMarkdown('\n\n_ASCII rendering of mermaid diagram_\n\n');
    }
    
    // Add click-to-edit hint
    markdown.appendMarkdown('💡 **Tip**: Click on the diagram to edit the code');
    
    return new vscode.Hover(markdown);
  }
}
