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
  syntaxRange: SourceRange;  // The # markers
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

export interface ParsedDocument {
  headers: HeaderElement[];
  emphasis: EmphasisElement[];
  taskLists: TaskListElement[];
  inlineCodes: InlineCodeElement[];
  links: LinkElement[];
}

export type AnyParsedElement =
  | HeaderElement
  | EmphasisElement
  | TaskListElement
  | InlineCodeElement
  | LinkElement;
