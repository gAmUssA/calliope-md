import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit, SKIP } from 'unist-util-visit';
import type { Node, Parent } from 'unist';
import type {
  ParsedDocument,
  HeaderElement,
  EmphasisElement,
  TaskListElement,
  InlineCodeElement,
  LinkElement,
  BlockquoteElement,
  HorizontalRuleElement,
  FencedCodeElement,
  ImageElement,
  ListItemElement,
  MetadataElement,
  TableElement,
  TableAlignType,
  SourceRange,
} from './types';

interface MdastNode extends Node {
  position?: {
    start: { line: number; column: number; offset: number };
    end: { line: number; column: number; offset: number };
  };
  children?: MdastNode[];
  value?: string;
  depth?: number;
  url?: string;
  alt?: string;
  checked?: boolean | null;
  lang?: string | null;
  ordered?: boolean;
  start?: number;
  spread?: boolean;
  align?: (string | null)[];
}

const parser = unified().use(remarkParse).use(remarkGfm);

/**
 * Detect YAML frontmatter at the start of a document.
 * Frontmatter must start with `---` on line 1 and have a closing `---`.
 * Returns null if no frontmatter is detected.
 */
function detectFrontmatter(text: string): MetadataElement | null {
  // Check if document starts with ---
  if (!text.startsWith('---')) {
    return null;
  }

  const lines = text.split('\n');
  
  // Find closing --- delimiter (must be on its own line)
  let closingLine = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      closingLine = i;
      break;
    }
  }

  // No closing delimiter found - treat as horizontal rule
  if (closingLine === -1) {
    return null;
  }

  // Calculate positions
  const startOffset = 0;
  const startLine = 1;
  const startColumn = 1;

  // Calculate end position (after closing ---)
  let endOffset = 0;
  for (let i = 0; i <= closingLine; i++) {
    endOffset += lines[i].length + 1; // +1 for newline
  }

  const endLine = closingLine + 1;
  const endColumn = lines[closingLine].length + 1;

  // Content is between the delimiters
  const contentStartOffset = lines[0].length + 1; // After first ---\n
  let contentEndOffset = 0;
  for (let i = 0; i < closingLine; i++) {
    contentEndOffset += lines[i].length + 1;
  }

  return {
    type: 'metadata',
    range: {
      start: { line: startLine, column: startColumn, offset: startOffset },
      end: { line: endLine, column: endColumn, offset: endOffset },
    },
    contentRange: {
      start: { line: 2, column: 1, offset: contentStartOffset },
      end: { line: closingLine, column: 1, offset: contentEndOffset },
    },
  };
}

export function parseMarkdown(text: string): ParsedDocument {
  // Detect frontmatter before AST parsing
  const metadata: MetadataElement[] = [];
  const frontmatter = detectFrontmatter(text);
  if (frontmatter) {
    metadata.push(frontmatter);
  }

  const tree = parser.parse(text) as MdastNode;

  const headers: HeaderElement[] = [];
  const emphasis: EmphasisElement[] = [];
  const taskLists: TaskListElement[] = [];
  const inlineCodes: InlineCodeElement[] = [];
  const links: LinkElement[] = [];
  const blockquotes: BlockquoteElement[] = [];
  const horizontalRules: HorizontalRuleElement[] = [];
  const fencedCodes: FencedCodeElement[] = [];
  const images: ImageElement[] = [];
  const listItems: ListItemElement[] = [];
  const tables: TableElement[] = [];

  // Track list context for depth calculation
  let currentListDepth = -1;
  let currentListOrdered = false;
  let currentListItemIndex = 0;

  visit(tree, (node: MdastNode, _index, parent: Parent | undefined) => {
    if (!node.position) return;

    switch (node.type) {
      case 'heading':
        extractHeader(node, text, headers);
        break;
      case 'strong':
        extractEmphasis(node, text, emphasis, 'bold');
        break;
      case 'emphasis':
        extractEmphasis(node, text, emphasis, 'italic');
        break;
      case 'delete':
        extractEmphasis(node, text, emphasis, 'strikethrough');
        break;
      case 'listItem':
        if (node.checked !== undefined && node.checked !== null) {
          extractTaskList(node, text, taskLists);
        } else {
          extractListItem(node, text, listItems, parent as MdastNode | undefined);
        }
        break;
      case 'inlineCode':
        extractInlineCode(node, text, inlineCodes);
        break;
      case 'link':
        extractLink(node, text, links);
        break;
      case 'blockquote':
        extractBlockquote(node, text, blockquotes);
        break;
      case 'thematicBreak':
        extractHorizontalRule(node, text, horizontalRules);
        break;
      case 'code':
        extractFencedCode(node, text, fencedCodes);
        break;
      case 'image':
        extractImage(node, text, images);
        break;
      case 'table':
        extractTable(node, text, tables);
        return SKIP; // Don't visit children — extractTable walks them
    }
  });

  // Filter out any elements that are within frontmatter range to prevent conflicts
  const frontmatterEndLine = frontmatter?.range.end.line ?? 0;
  
  const filteredHeaders = frontmatter
    ? headers.filter(h => h.range.start.line > frontmatterEndLine)
    : headers;
    
  const filteredEmphasis = frontmatter
    ? emphasis.filter(e => e.range.start.line > frontmatterEndLine)
    : emphasis;
    
  const filteredInlineCodes = frontmatter
    ? inlineCodes.filter(c => c.range.start.line > frontmatterEndLine)
    : inlineCodes;
    
  const filteredLinks = frontmatter
    ? links.filter(l => l.range.start.line > frontmatterEndLine)
    : links;
    
  const filteredHorizontalRules = frontmatter 
    ? horizontalRules.filter(hr => hr.range.start.line > frontmatterEndLine)
    : horizontalRules;

  return {
    headers: filteredHeaders,
    emphasis: filteredEmphasis,
    taskLists,
    inlineCodes: filteredInlineCodes,
    links: filteredLinks,
    blockquotes,
    horizontalRules: filteredHorizontalRules,
    fencedCodes,
    images,
    listItems,
    metadata,
    tables,
  };
}

function extractHeader(node: MdastNode, text: string, headers: HeaderElement[]): void {
  if (!node.position || !node.depth) return;

  const pos = node.position;
  const level = node.depth as 1 | 2 | 3 | 4 | 5 | 6;

  // Find the # markers - they are at the start of the line
  const lineStart = pos.start.offset - (pos.start.column - 1);
  const hashCount = level;
  const syntaxEnd = lineStart + hashCount + 1; // +1 for the space after #

  headers.push({
    type: 'header',
    level,
    range: {
      start: { line: pos.start.line, column: pos.start.column, offset: pos.start.offset },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
    syntaxRange: {
      start: { line: pos.start.line, column: 1, offset: lineStart },
      end: { line: pos.start.line, column: hashCount + 2, offset: syntaxEnd },
    },
    contentRange: {
      start: { line: pos.start.line, column: hashCount + 2, offset: syntaxEnd },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
  });
}

function extractEmphasis(
  node: MdastNode,
  text: string,
  emphasis: EmphasisElement[],
  variant: 'bold' | 'italic' | 'strikethrough'
): void {
  if (!node.position) return;

  const pos = node.position;
  const markerLength = variant === 'bold' ? 2 : variant === 'strikethrough' ? 2 : 1;

  // Check for bold-italic (*** or ___)
  let actualVariant = variant;
  let actualMarkerLength = markerLength;

  if (variant === 'bold') {
    // Check if this is actually bold-italic
    const charBefore = text.charAt(pos.start.offset - 1);
    const charAtStart = text.charAt(pos.start.offset);
    if ((charBefore === '*' || charBefore === '_') && charAtStart === charBefore) {
      // This might be part of a bold-italic, skip as it will be handled differently
    }
  }

  emphasis.push({
    type: 'emphasis',
    variant: actualVariant,
    range: {
      start: { line: pos.start.line, column: pos.start.column, offset: pos.start.offset },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
    openMarkerRange: {
      start: { line: pos.start.line, column: pos.start.column, offset: pos.start.offset },
      end: {
        line: pos.start.line,
        column: pos.start.column + actualMarkerLength,
        offset: pos.start.offset + actualMarkerLength,
      },
    },
    closeMarkerRange: {
      start: {
        line: pos.end.line,
        column: pos.end.column - actualMarkerLength,
        offset: pos.end.offset - actualMarkerLength,
      },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
    contentRange: {
      start: {
        line: pos.start.line,
        column: pos.start.column + actualMarkerLength,
        offset: pos.start.offset + actualMarkerLength,
      },
      end: {
        line: pos.end.line,
        column: pos.end.column - actualMarkerLength,
        offset: pos.end.offset - actualMarkerLength,
      },
    },
  });
}

function extractTaskList(node: MdastNode, text: string, taskLists: TaskListElement[]): void {
  if (!node.position || node.checked === undefined || node.checked === null) return;

  const pos = node.position;
  const checked = node.checked;

  // Find the checkbox pattern: - [ ] or - [x]
  const lineStart = pos.start.offset - (pos.start.column - 1);
  const lineText = text.slice(lineStart, pos.end.offset);
  const checkboxMatch = lineText.match(/^(\s*-\s*\[[ xX]\])\s*/);

  if (!checkboxMatch) return;

  const checkboxLength = checkboxMatch[1].length;
  const fullMatchLength = checkboxMatch[0].length;

  taskLists.push({
    type: 'taskList',
    checked,
    range: {
      start: { line: pos.start.line, column: pos.start.column, offset: pos.start.offset },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
    checkboxRange: {
      start: { line: pos.start.line, column: 1, offset: lineStart },
      end: { line: pos.start.line, column: fullMatchLength + 1, offset: lineStart + fullMatchLength },
    },
    contentRange: {
      start: {
        line: pos.start.line,
        column: fullMatchLength + 1,
        offset: lineStart + fullMatchLength,
      },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
  });
}

function extractInlineCode(node: MdastNode, text: string, inlineCodes: InlineCodeElement[]): void {
  if (!node.position) return;

  const pos = node.position;
  const value = node.value || '';
  
  // Check for language prefix: `ts:code`, `js:code`, etc.
  const langMatch = value.match(/^(ts|typescript|js|javascript|py|python):/i);
  const language = langMatch ? langMatch[1].toLowerCase() : undefined;
  
  // Adjust content range if language prefix exists
  const prefixLength = langMatch ? langMatch[0].length : 0;

  inlineCodes.push({
    type: 'inlineCode',
    language,
    range: {
      start: { line: pos.start.line, column: pos.start.column, offset: pos.start.offset },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
    openMarkerRange: {
      start: { line: pos.start.line, column: pos.start.column, offset: pos.start.offset },
      end: { line: pos.start.line, column: pos.start.column + 1, offset: pos.start.offset + 1 },
    },
    closeMarkerRange: {
      start: { line: pos.end.line, column: pos.end.column - 1, offset: pos.end.offset - 1 },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
    contentRange: {
      start: { line: pos.start.line, column: pos.start.column + 1 + prefixLength, offset: pos.start.offset + 1 + prefixLength },
      end: { line: pos.end.line, column: pos.end.column - 1, offset: pos.end.offset - 1 },
    },
  });
}

function extractLink(node: MdastNode, text: string, links: LinkElement[]): void {
  if (!node.position || !node.url) return;

  const pos = node.position;
  const url = node.url;

  // Link format: [text](url)
  // Find the ] position by looking at children end
  let textEnd = pos.start.offset + 1; // After [
  if (node.children && node.children.length > 0) {
    const lastChild = node.children[node.children.length - 1];
    if (lastChild.position) {
      textEnd = lastChild.position.end.offset;
    }
  }

  // Find ]( in the text
  const closeBracketPos = text.indexOf('](', textEnd);
  if (closeBracketPos === -1) return;

  const urlStart = closeBracketPos + 2; // After ](
  const urlEnd = pos.end.offset - 1; // Before )

  // Calculate line/column for positions
  const getLineCol = (offset: number) => {
    let line = 1;
    let lastNewline = -1;
    for (let i = 0; i < offset; i++) {
      if (text[i] === '\n') {
        line++;
        lastNewline = i;
      }
    }
    return { line, column: offset - lastNewline };
  };

  const openBracketLC = getLineCol(pos.start.offset);
  const textStartLC = getLineCol(pos.start.offset + 1);
  const closeBracketLC = getLineCol(closeBracketPos);
  const urlPartStartLC = getLineCol(closeBracketPos + 1);
  const urlPartEndLC = getLineCol(pos.end.offset);

  links.push({
    type: 'link',
    url,
    range: {
      start: { line: pos.start.line, column: pos.start.column, offset: pos.start.offset },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
    openBracketRange: {
      start: { line: openBracketLC.line, column: openBracketLC.column, offset: pos.start.offset },
      end: { line: textStartLC.line, column: textStartLC.column, offset: pos.start.offset + 1 },
    },
    textRange: {
      start: { line: textStartLC.line, column: textStartLC.column, offset: pos.start.offset + 1 },
      end: { line: closeBracketLC.line, column: closeBracketLC.column, offset: closeBracketPos },
    },
    closeBracketRange: {
      start: { line: closeBracketLC.line, column: closeBracketLC.column, offset: closeBracketPos },
      end: { line: urlPartStartLC.line, column: urlPartStartLC.column, offset: closeBracketPos + 1 },
    },
    urlPartRange: {
      start: { line: urlPartStartLC.line, column: urlPartStartLC.column, offset: closeBracketPos + 1 },
      end: { line: urlPartEndLC.line, column: urlPartEndLC.column, offset: pos.end.offset },
    },
  });
}

// Phase 2 extraction functions

function extractBlockquote(node: MdastNode, text: string, blockquotes: BlockquoteElement[]): void {
  if (!node.position) return;

  const pos = node.position;

  // Find all > markers in the blockquote
  const markerRanges: SourceRange[] = [];
  const lines = text.slice(pos.start.offset, pos.end.offset).split('\n');
  let currentOffset = pos.start.offset;
  let currentLine = pos.start.line;

  for (const line of lines) {
    const markerMatch = line.match(/^(\s*>)/);
    if (markerMatch) {
      const markerStart = currentOffset;
      const markerEnd = currentOffset + markerMatch[1].length;
      markerRanges.push({
        start: { line: currentLine, column: 1, offset: markerStart },
        end: { line: currentLine, column: markerMatch[1].length + 1, offset: markerEnd },
      });
    }
    currentOffset += line.length + 1; // +1 for newline
    currentLine++;
  }

  blockquotes.push({
    type: 'blockquote',
    range: {
      start: { line: pos.start.line, column: pos.start.column, offset: pos.start.offset },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
    markerRanges,
    contentRange: {
      start: { line: pos.start.line, column: pos.start.column, offset: pos.start.offset },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
  });
}

function extractHorizontalRule(node: MdastNode, text: string, horizontalRules: HorizontalRuleElement[]): void {
  if (!node.position) return;

  const pos = node.position;

  horizontalRules.push({
    type: 'horizontalRule',
    range: {
      start: { line: pos.start.line, column: pos.start.column, offset: pos.start.offset },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
    syntaxRange: {
      start: { line: pos.start.line, column: pos.start.column, offset: pos.start.offset },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
  });
}

function extractFencedCode(node: MdastNode, text: string, fencedCodes: FencedCodeElement[]): void {
  if (!node.position) return;

  const pos = node.position;
  const language = node.lang || null;

  // Find the opening fence line
  const lineStart = pos.start.offset - (pos.start.column - 1);
  const textSlice = text.slice(lineStart, pos.end.offset);
  const lines = textSlice.split('\n');

  if (lines.length < 2) return; // Need at least opening fence and closing fence

  const openFenceLine = lines[0];
  const closeFenceLine = lines[lines.length - 1];

  // Opening fence range
  const openFenceEnd = lineStart + openFenceLine.length;

  // Closing fence range
  const closeFenceStart = pos.end.offset - closeFenceLine.length;

  // Content range (between fences)
  const contentStart = openFenceEnd + 1; // After newline
  const contentEnd = closeFenceStart - 1; // Before newline

  fencedCodes.push({
    type: 'fencedCode',
    language,
    range: {
      start: { line: pos.start.line, column: pos.start.column, offset: pos.start.offset },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
    openFenceRange: {
      start: { line: pos.start.line, column: 1, offset: lineStart },
      end: { line: pos.start.line, column: openFenceLine.length + 1, offset: openFenceEnd },
    },
    closeFenceRange: {
      start: { line: pos.end.line, column: 1, offset: closeFenceStart },
      end: { line: pos.end.line, column: closeFenceLine.length + 1, offset: pos.end.offset },
    },
    contentRange: {
      start: { line: pos.start.line + 1, column: 1, offset: contentStart },
      end: { line: pos.end.line - 1, column: 1, offset: Math.max(contentStart, contentEnd) },
    },
  });
}

function extractImage(node: MdastNode, text: string, images: ImageElement[]): void {
  if (!node.position) return;

  const pos = node.position;
  const url = node.url || '';
  const alt = node.alt || '';

  images.push({
    type: 'image',
    url,
    alt,
    range: {
      start: { line: pos.start.line, column: pos.start.column, offset: pos.start.offset },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
    syntaxRange: {
      start: { line: pos.start.line, column: pos.start.column, offset: pos.start.offset },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
  });
}

function extractListItem(
  node: MdastNode,
  text: string,
  listItems: ListItemElement[],
  parent: MdastNode | undefined
): void {
  if (!node.position) return;

  const pos = node.position;

  // Determine if ordered or unordered from parent
  const ordered = parent?.ordered === true;
  const listStart = parent?.start ?? 1;

  // Find item index within parent
  let index: number | undefined;
  if (ordered && parent?.children) {
    const itemIndex = parent.children.indexOf(node);
    index = listStart + itemIndex;
  }

  // Calculate depth based on indentation
  const lineStart = pos.start.offset - (pos.start.column - 1);
  const lineText = text.slice(lineStart, pos.end.offset);

  // Match list marker: -, *, +, or number.
  const markerMatch = lineText.match(/^(\s*)([-*+]|\d+\.)\s/);
  if (!markerMatch) return;

  const indent = markerMatch[1].length;
  const marker = markerMatch[2];
  const depth = Math.floor(indent / 2); // Approximate depth from indentation

  const markerStart = lineStart + indent;
  const markerEnd = markerStart + marker.length;
  const contentStart = lineStart + markerMatch[0].length;

  listItems.push({
    type: 'listItem',
    ordered,
    index,
    depth,
    range: {
      start: { line: pos.start.line, column: pos.start.column, offset: pos.start.offset },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
    markerRange: {
      start: { line: pos.start.line, column: indent + 1, offset: markerStart },
      end: { line: pos.start.line, column: indent + marker.length + 1, offset: markerEnd },
    },
    contentRange: {
      start: { line: pos.start.line, column: markerMatch[0].length + 1, offset: contentStart },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
  });
}

function extractTable(node: MdastNode, text: string, tables: TableElement[]): void {
  if (!node.position || !node.children || node.children.length < 2) return;

  const pos = node.position;
  const align: TableAlignType[] = (node.align || []).map(a =>
    a === 'left' || a === 'center' || a === 'right' ? a : null
  );

  const rows: import('./types').TableRowElement[] = [];
  const headerRowNode = node.children[0];

  // Process header row (first child)
  if (headerRowNode?.position && headerRowNode.children) {
    const headerCells = extractTableCells(headerRowNode, text);
    rows.push({
      cells: headerCells,
      isHeader: true,
      range: {
        start: { line: headerRowNode.position.start.line, column: headerRowNode.position.start.column, offset: headerRowNode.position.start.offset },
        end: { line: headerRowNode.position.end.line, column: headerRowNode.position.end.column, offset: headerRowNode.position.end.offset },
      },
    });
  }

  // Compute separator range: the line between header row end and second row start
  const headerEndLine = headerRowNode?.position?.end.line ?? pos.start.line;
  const separatorLine = headerEndLine + 1; // 1-indexed
  const sepLineIdx = separatorLine - 1; // 0-indexed for text splitting
  const lines = text.split('\n');
  const sepLineText = sepLineIdx < lines.length ? lines[sepLineIdx] : '';
  let sepLineOffset = 0;
  for (let i = 0; i < sepLineIdx; i++) {
    sepLineOffset += lines[i].length + 1;
  }
  const separatorRange: SourceRange = {
    start: { line: separatorLine, column: 1, offset: sepLineOffset },
    end: { line: separatorLine, column: sepLineText.length + 1, offset: sepLineOffset + sepLineText.length },
  };

  // Process body rows (children after the first — remark-gfm skips the separator row in AST)
  for (let i = 1; i < node.children.length; i++) {
    const rowNode = node.children[i];
    if (!rowNode?.position || !rowNode.children) continue;

    const bodyCells = extractTableCells(rowNode, text);
    rows.push({
      cells: bodyCells,
      isHeader: false,
      range: {
        start: { line: rowNode.position.start.line, column: rowNode.position.start.column, offset: rowNode.position.start.offset },
        end: { line: rowNode.position.end.line, column: rowNode.position.end.column, offset: rowNode.position.end.offset },
      },
    });
  }

  tables.push({
    type: 'table',
    range: {
      start: { line: pos.start.line, column: pos.start.column, offset: pos.start.offset },
      end: { line: pos.end.line, column: pos.end.column, offset: pos.end.offset },
    },
    rows,
    separatorRange,
    align,
  });
}

function extractTableCells(rowNode: MdastNode, text: string): import('./types').TableCellElement[] {
  const cells: import('./types').TableCellElement[] = [];
  if (!rowNode.position || !rowNode.children) return cells;

  const rowLine = rowNode.position.start.line;
  const rowLineStart = rowNode.position.start.offset - (rowNode.position.start.column - 1);

  for (const cellNode of rowNode.children) {
    if (!cellNode.position) continue;

    const cellPos = cellNode.position;

    // Remark-gfm cell positions start at the leading `|` character
    const pipeOffset = cellPos.start.offset;
    if (text[pipeOffset] !== '|') continue;

    const pipeCol = pipeOffset - rowLineStart + 1; // 1-indexed
    const pipeRange: SourceRange = {
      start: { line: rowLine, column: pipeCol, offset: pipeOffset },
      end: { line: rowLine, column: pipeCol + 1, offset: pipeOffset + 1 },
    };

    // Content range from the cell's children (actual text/inline nodes)
    let contentStart = cellPos.start;
    let contentEnd = cellPos.end;
    if (cellNode.children && cellNode.children.length > 0) {
      const firstChild = cellNode.children[0];
      const lastChild = cellNode.children[cellNode.children.length - 1];
      if (firstChild.position) {
        contentStart = firstChild.position.start;
      }
      if (lastChild.position) {
        contentEnd = lastChild.position.end;
      }
    }

    const content = text.slice(contentStart.offset, contentEnd.offset).trim();
    const contentRange: SourceRange = {
      start: { line: contentStart.line, column: contentStart.column, offset: contentStart.offset },
      end: { line: contentEnd.line, column: contentEnd.column, offset: contentEnd.offset },
    };

    cells.push({ content, contentRange, pipeRange });
  }

  return cells;
}
