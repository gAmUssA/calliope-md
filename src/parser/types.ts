import type { Position as VscodePosition } from 'vscode';

export interface SourcePosition {
  line: number;    // 1-indexed (remark style)
  column: number;  // 1-indexed (remark style)
  offset: number;
}

export interface SourceRange {
  start: SourcePosition;
  end: SourcePosition;
}

export interface ParsedElement {
  type: string;
  range: SourceRange;
}

export interface HeaderElement extends ParsedElement {
  type: 'header';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  style: 'atx' | 'setext';
  syntaxRange: SourceRange;  // ATX: the # markers; Setext: the underline (=== or ---)
  contentRange: SourceRange; // The header text
}

export interface EmphasisElement extends ParsedElement {
  type: 'emphasis';
  variant: 'bold' | 'italic' | 'bold-italic' | 'strikethrough';
  openMarkerRange: SourceRange;
  closeMarkerRange: SourceRange;
  contentRange: SourceRange;
}

export interface TaskListElement extends ParsedElement {
  type: 'taskList';
  checked: boolean;
  checkboxRange: SourceRange;  // The `- [ ]` or `- [x]` part
  contentRange: SourceRange;   // The task text
}

export interface InlineCodeElement extends ParsedElement {
  type: 'inlineCode';
  language?: string;  // Optional language identifier (e.g., 'ts', 'js', 'py')
  openMarkerRange: SourceRange;
  closeMarkerRange: SourceRange;
  contentRange: SourceRange;
}

export interface LinkElement extends ParsedElement {
  type: 'link';
  url: string;
  textRange: SourceRange;         // The link text
  openBracketRange: SourceRange;  // [
  closeBracketRange: SourceRange; // ]
  urlPartRange: SourceRange;      // (url)
}

// Phase 2 Elements

export interface BlockquoteElement extends ParsedElement {
  type: 'blockquote';
  markerRanges: SourceRange[];    // The > markers for each line
  contentRange: SourceRange;      // The blockquote content
}

export interface HorizontalRuleElement extends ParsedElement {
  type: 'horizontalRule';
  syntaxRange: SourceRange;       // The ---, ***, or ___ syntax
}

export interface FencedCodeElement extends ParsedElement {
  type: 'fencedCode';
  language: string | null;
  openFenceRange: SourceRange;    // Opening ``` line
  closeFenceRange: SourceRange;   // Closing ``` line
  contentRange: SourceRange;      // The code content
}

export interface ImageElement extends ParsedElement {
  type: 'image';
  url: string;
  alt: string;
  syntaxRange: SourceRange;       // The full ![alt](url) syntax
}

export interface ListItemElement extends ParsedElement {
  type: 'listItem';
  ordered: boolean;
  index?: number;                 // For ordered lists: 1, 2, 3...
  markerRange: SourceRange;       // The -, *, +, or number marker
  contentRange: SourceRange;      // The list item content
  depth: number;                  // Nesting level (0 = top level)
}

export interface MetadataElement extends ParsedElement {
  type: 'metadata';
  contentRange: SourceRange;      // The frontmatter content (between delimiters)
}

export type TableAlignType = 'left' | 'center' | 'right' | null;

export interface TableCellElement {
  content: string;                // Trimmed cell text
  contentRange: SourceRange;      // Range of the cell content
  pipeRange: SourceRange;         // Range of the leading | delimiter
}

export interface TableRowElement {
  cells: TableCellElement[];
  isHeader: boolean;              // True for the first row
  range: SourceRange;
}

export interface TableElement extends ParsedElement {
  type: 'table';
  rows: TableRowElement[];
  separatorRange: SourceRange;    // The | --- | --- | line
  align: TableAlignType[];        // Per-column alignment
}

export interface ParsedDocument {
  headers: HeaderElement[];
  emphasis: EmphasisElement[];
  taskLists: TaskListElement[];
  inlineCodes: InlineCodeElement[];
  links: LinkElement[];
  blockquotes: BlockquoteElement[];
  horizontalRules: HorizontalRuleElement[];
  fencedCodes: FencedCodeElement[];
  images: ImageElement[];
  listItems: ListItemElement[];
  metadata: MetadataElement[];
  tables: TableElement[];
}

export type AnyParsedElement =
  | HeaderElement
  | EmphasisElement
  | TaskListElement
  | InlineCodeElement
  | LinkElement
  | BlockquoteElement
  | HorizontalRuleElement
  | FencedCodeElement
  | ImageElement
  | ListItemElement
  | MetadataElement
  | TableElement;
