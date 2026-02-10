## Context

The vscode-calliope-md extension renders markdown elements with decorations to improve readability. The current implementation parses markdown using remark/remark-gfm and applies decorations for headers, emphasis, links, code blocks, and other elements. The parser (`src/parser/markdownParser.ts`) extracts element ranges from the AST, and decoration managers apply visual styling.

YAML frontmatter is a common markdown convention where metadata is placed at the start of a file between `---` delimiters:

```yaml
---
title: My Document
description: Example metadata
tags: [markdown, frontmatter]
---
```

Currently, this frontmatter is treated as regular content without any visual distinction.

## Goals / Non-Goals

**Goals:**
- Detect YAML frontmatter blocks at document start (between `---` delimiters)
- Apply visual decorations to distinguish metadata from content (dimming, distinctive styling)
- Integrate with existing decoration system consistently with other elements
- Parse frontmatter in the markdown parser to extract position information

**Non-Goals:**
- Parsing or validating YAML structure (treat as opaque text block)
- Editing or manipulating frontmatter content
- Supporting other metadata formats (TOML, JSON frontmatter)
- Collapsing/expanding frontmatter blocks

## Decisions

### Decision 1: Detect frontmatter in markdown parser

**Rationale**: The existing architecture uses `markdownParser.ts` to extract all element positions from the remark AST. Frontmatter detection should follow this pattern for consistency.

**Approach**: 
- Detect frontmatter by checking if document starts with `---` followed by another `---` on a subsequent line
- remark-gfm doesn't natively parse frontmatter, so we'll detect it via text-based pattern matching before/after AST parsing
- Extract the range (start/end line and offset) for the entire frontmatter block including delimiters

**Alternatives considered**:
- Using remark-frontmatter plugin: Would parse YAML structure, which is unnecessary complexity. We only need position information for decoration.
- Detecting frontmatter in decoration manager: Would violate separation of concerns; parser should handle all markdown parsing.

### Decision 2: Create dedicated decoration element type

**Rationale**: Following the existing pattern, each markdown element type has a dedicated module in `src/decorations/elements/`.

**Approach**:
- Create `src/decorations/elements/metadata.ts` (or `frontmatter.ts`)
- Define decoration style: dim the entire frontmatter block with reduced opacity and potentially distinctive background
- Follow the styling pattern used for other elements (e.g., code blocks, blockquotes)

**Alternatives considered**:
- Reusing blockquote styling: Frontmatter has different semantic meaning and should be visually distinct
- Syntax highlighting YAML: Out of scope; too complex for initial implementation

### Decision 3: Style as a single block decoration

**Rationale**: Frontmatter should be visually distinguished as a whole unit, not as individual lines.

**Approach**:
- Apply a single decoration range covering the entire frontmatter block (both delimiters and content)
- Use opacity reduction (e.g., 0.6) and potentially a subtle background color
- Make delimiters (`---`) slightly more prominent than content

**Alternatives considered**:
- Per-line decorations: More complex, no visual benefit
- Hiding frontmatter: Too aggressive; users need to see and edit metadata

## Risks / Trade-offs

**Risk**: False positive detection if `---` appears in regular content  
→ **Mitigation**: Only detect frontmatter at the absolute start of the document (position 0). This is the standard YAML frontmatter convention.

**Risk**: Performance impact from additional parsing logic  
→ **Mitigation**: Frontmatter detection is a simple regex/text check at document start; minimal overhead. The existing parse cache will also cache frontmatter results.

**Trade-off**: Not parsing YAML structure means we can't provide field-specific styling  
→ **Accepted**: Keeps implementation simple; users can still read frontmatter. Future enhancement could add YAML parsing if needed.

**Risk**: Conflict with horizontal rule (`---`) at document start  
→ **Mitigation**: YAML frontmatter requires TWO `---` delimiters (opening and closing). A single `---` will be treated as a horizontal rule, which is correct behavior.
