import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
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
}

const parser = unified().use(remarkParse).use(remarkGfm);

export function parseMarkdown(text: string): ParsedDocument {
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
    }
  });

  return {
    headers,
    emphasis,
    taskLists,
    inlineCodes,
    links,
    blockquotes,
    horizontalRules,
    fencedCodes,
    images,
    listItems,
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

  inlineCodes.push({
    type: 'inlineCode',
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
      start: { line: pos.start.line, column: pos.start.column + 1, offset: pos.start.offset + 1 },
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
