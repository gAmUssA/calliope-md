---
# vscode-calliope-md-ycgf
title: calliope.renderImages still defaults to true
status: todo
type: bug
priority: high
created_at: 2026-08-21T03:24:43Z
updated_at: 2026-08-21T03:24:43Z
---

The archived change `2026-03-16-optional-inline-images` made inline image rendering opt-in, and `openspec/specs/image-rendering/spec.md` records it as a requirement ("The setting SHALL default to `false` (disabled)"). See ADR-0016.

Half the change landed. `src/decorations/elements/images.ts` no longer produces `syntaxHidden`/`syntaxGhost` ranges, so image syntax stays visible — that part is done. The default flip was not applied:

- `package.json` -> `contributes.configuration.properties["calliope.renderImages"].default` is `true`
- `src/config.ts:37` -> `config.get<boolean>('renderImages', true)`

Both tasks were checked off in the archived `tasks.md` (1.1 and 1.2) but `git log -S '"calliope.renderImages"' -- package.json` shows the block untouched since `ddfd11e` (2026-02-01), so it was never actually done.

Effect: every user gets inline image previews by default, resolved against the filesystem or network, when the shipped intent was opt-in.

- [ ] Set the `package.json` default to `false`
- [ ] Set the `src/config.ts` fallback to `false`
- [ ] Note the default change in CHANGELOG (users upgrading will see previews stop)
