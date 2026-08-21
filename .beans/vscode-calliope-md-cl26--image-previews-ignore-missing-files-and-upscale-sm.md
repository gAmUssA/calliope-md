---
# vscode-calliope-md-cl26
title: Image previews ignore missing files and upscale small images
status: completed
type: bug
priority: normal
created_at: 2026-08-21T03:24:50Z
updated_at: 2026-08-21T03:48:24Z
---

`openspec/specs/image-rendering/spec.md` states two requirements that `src/decorations/elements/images.ts` does not implement.

**No placeholder for missing or broken images.** Spec: "The system SHALL display a placeholder icon when an image cannot be loaded", covering both a local file that does not exist and a remote URL that fails to load. `createImageDecorations` only checks whether `resolveImagePath` returned a URI — it never checks existence, and there is no failure path for remote fetches. A broken image silently renders nothing, so the user cannot tell a broken path from a disabled setting. There is no placeholder logic anywhere in `src/` (`grep -rn "placeholder\|existsSync" src/` is empty).

**Small images are upscaled.** Spec: "WHEN an image is smaller than 200 pixels wide THEN the preview SHALL display at original size". The decoration hardcodes `width: '200px', height: 'auto'` (`images.ts:41-42`) for every image, so a 32px icon is blown up to 200px.

- [ ] Show a placeholder icon when a local image file does not exist
- [ ] Show a placeholder icon when a remote image fails to load
- [ ] Constrain preview width with a maximum rather than a fixed width, so images under 200px render at natural size
