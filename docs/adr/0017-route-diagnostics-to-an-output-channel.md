# 17. Route diagnostics to a Calliope output channel

- **Status:** Accepted
- **Date:** 2026-07-06

## Context

ADR-0008 split failure handling by kind: presentation-mode failures became user-facing notifications, while render failures stayed on the console. That was an improvement over silent `console.error`, but it left the rendering half of the policy resting on `console.*`.

Console output from an extension host is only visible after opening the Developer Tools window. In practice that means it is invisible: a user reporting "my mermaid diagram doesn't render" has no way to produce the log, and the maintainer has no way to ask for it that a non-developer can follow. The output is also unfiltered — extension host console traffic from every installed extension is interleaved.

VS Code provides `window.createOutputChannel(name, { log: true })`, which yields a `LogOutputChannel`: a named channel in the Output panel, selectable by extension name, with per-level filtering and a user-visible log level the user can raise when reproducing a problem.

## Decision

All diagnostics route through `src/log.ts`, which owns a single lazily-created `LogOutputChannel` named "Calliope". `console.*` is no longer used anywhere in `src/`. The channel is disposed on deactivate via `disposeLogger()`.

The user-facing half of ADR-0008 is unchanged: presentation-mode failures still surface as `showErrorMessage` notifications with aggregation, and partial failure still never aborts an operation. Only the destination of non-notification diagnostics changes.

## Consequences

A user can now select "Calliope" in the Output panel and copy its contents into a bug report without opening DevTools, which makes render failures diagnosable in the field.

Log statements gain a severity level rather than all being `console.error`/`console.log`, so ordinary render fallbacks can be logged at a level that does not read as a fault.

This supersedes the "keep render failures on the console" half of ADR-0008. That ADR's title and its `Rendering` bullet no longer describe the code.

A `LogOutputChannel` is created lazily, so an install that never logs anything never contributes a channel to the Output dropdown.
