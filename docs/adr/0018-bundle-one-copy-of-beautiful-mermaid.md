# 18. Load beautiful-mermaid through a single specifier and minify on prepublish

- **Status:** Accepted
- **Date:** 2026-08-20

## Context

ADR-0007 and ADR-0011 describe `beautiful-mermaid` as "dynamically imported on first use", to avoid loading the library for documents without diagrams. That intent was implemented twice, in two different ways: `renderMermaidToSVG` used `await import('beautiful-mermaid')`, while `renderMermaidToAscii` used `require('beautiful-mermaid')`, because it is synchronous and cannot await.

The package's `exports` map routes those two forms to different files:

```json
".": { "import": "./dist/index.js", "require": "./dist/index.cjs" }
```

esbuild therefore resolved them as two unrelated modules and bundled both. The shipped `out/extension.js` contained two complete copies of the library — 396KB of a 951KB bundle, 42% of the output, for a library used by one feature.

Separately, `package.json` had no `vscode:prepublish` script. `vsce package` does not build on its own, so it packaged whatever happened to be sitting in `out/` from the last local command. A stale test-only bundle reached a `.vsix` this way.

## Decision

Both call sites use `require('beautiful-mermaid')`. Converging on `require` rather than `import` is forced by `renderMermaidToAscii` being synchronous.

This preserves the laziness ADR-0007 wanted. esbuild wraps a bundled CommonJS module in a `__commonJS` closure that runs on first call, so the library still initializes only when a diagram is first rendered — the deferral survives, the duplicate does not.

Add `compile:prod` (`compile` plus `--minify`) and wire it to `vscode:prepublish`, so packaging and publishing always build fresh, minified output. `pretest` keeps using the unminified `compile`, so test failures and stack traces stay readable.

## Consequences

`out/extension.js` drops from 958KB to 329KB, a 66% reduction. Activation parses a third as much JavaScript.

`vsce package` can no longer ship a stale or hand-modified `out/`. The build that is packaged is the build that was just produced.

The published bundle is minified, so a stack trace from a user's Output channel will have mangled names. The unminified build remains one `npm run compile` away, and line numbers survive.

A future contributor adding a third call site must use `require` to avoid reintroducing the duplicate. The reason is recorded in a comment at both call sites.
