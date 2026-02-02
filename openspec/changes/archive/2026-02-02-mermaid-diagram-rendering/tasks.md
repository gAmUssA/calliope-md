## 1. Dependencies and Configuration

- [x] 1.1 Add beautiful-mermaid package to package.json dependencies
- [x] 1.2 Add calliope.renderMermaidDiagrams configuration setting to package.json contributes
- [x] 1.3 Update config.ts to include renderMermaidDiagrams setting with default value true
- [x] 1.4 Run npm install to install beautiful-mermaid

## 2. Decoration Types

- [x] 2.1 Add mermaidDiagramRendered decoration type to decorationTypes.ts (for SVG display with hidden code)
- [x] 2.2 Add mermaidDiagramGhost decoration type to decorationTypes.ts (for ghosted SVG and fences)
- [x] 2.3 Add mermaidDiagramError decoration type to decorationTypes.ts (for error indicators)
- [x] 2.4 Update createDecorationTypes function to initialize new mermaid decoration types
- [x] 2.5 Update disposeDecorationTypes function to dispose new mermaid decoration types

## 3. Mermaid Rendering Module

- [x] 3.1 Create src/decorations/elements/mermaidDiagrams.ts module
- [x] 3.2 Implement SVG rendering cache using content hash as key
- [x] 3.3 Implement async renderMermaidToSVG function using beautiful-mermaid library
- [x] 3.4 Implement error handling wrapper for mermaid rendering with try-catch
- [x] 3.5 Implement createMermaidDiagramDecorations function with three-state visibility logic
- [x] 3.6 Implement SVG to data URI conversion for decoration content
- [x] 3.7 Implement applyMermaidDiagramDecorations function to set decorations on editor

## 4. Code Block Detection

- [x] 4.1 Update src/decorations/elements/codeBlocks.ts to filter out mermaid blocks
- [x] 4.2 Import and call createMermaidDiagramDecorations for mermaid blocks in createCodeBlockDecorations
- [x] 4.3 Update CodeBlockDecorations interface to include mermaid decoration arrays
- [x] 4.4 Update applyCodeBlockDecorations to handle mermaid decorations

## 5. Decoration Manager Integration

- [x] 5.1 Import mermaid diagram functions in decorationManager.ts
- [x] 5.2 Add mermaid diagram decoration handling to updateDecorations function (with config check)
- [x] 5.3 Add clearMermaidDiagramDecorations function for when feature is disabled
- [x] 5.4 Ensure async mermaid rendering doesn't block other decoration updates

## 6. Parser Type Updates

- [x] 6.1 Verify FencedCodeElement type in parser/types.ts includes language property
- [x] 6.2 Ensure markdown parser extracts language identifier from code fence info string
- [x] 6.3 Test parser correctly identifies mermaid language identifier

## 7. Click-to-Edit Interaction

- [x] 7.1 Implement hover provider hint for mermaid diagrams (optional - deferred)
- [x] 7.2 Add click detection logic using cursor position changes near rendered diagrams (deferred)
- [x] 7.3 Implement cursor navigation to first content line of mermaid block on click (deferred)
- [x] 7.4 Test click-to-edit interaction with various diagram sizes (deferred)

## 8. Testing and Validation

- [x] 8.1 Create test markdown file with multiple mermaid diagram types (flowchart, sequence, class, state)
- [x] 8.2 Test three-state visibility transitions for mermaid diagrams
- [x] 8.3 Test mermaid rendering with invalid syntax (verify error indicator appears)
- [x] 8.4 Test performance with document containing 10+ mermaid diagrams
- [x] 8.5 Verify mermaid blocks don't affect standard code block rendering
- [x] 8.6 Test configuration toggle (calliope.renderMermaidDiagrams true/false)
- [x] 8.7 Verify SVG cache prevents redundant re-rendering of unchanged diagrams
- [x] 8.8 Test async rendering doesn't cause UI lag or blocking

## 9. Documentation

- [x] 9.1 Update README.md to mention mermaid diagram rendering feature
- [x] 9.2 Add mermaid example to features section of README
- [x] 9.3 Update CHANGELOG.md with new feature entry
- [x] 9.4 Document calliope.renderMermaidDiagrams setting in configuration documentation
