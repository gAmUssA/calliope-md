## 1. Fix Deprecated Setting

- [x] 1.1 In `src/presentationMode.ts`, replace `'workbench.activityBar.visible': false` with `'workbench.activityBar.location': 'hidden'` in the `PRESENTATION_SETTINGS` constant

## 2. Verify

- [x] 2.1 Build the extension (`npm run compile`) and confirm no errors
- [x] 2.2 Manually test: toggle presentation mode on — activity bar should hide without error
- [x] 2.3 Manually test: toggle presentation mode off — activity bar should restore to original location
