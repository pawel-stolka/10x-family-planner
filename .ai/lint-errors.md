# Lint Errors and Warnings

Generated from recent targeted `npx nx run-many -t lint` runs.

## Current Error Status

- **No ESLint error-level issues remain** in the workspace for the projects previously failing lint:
  - `feature-commitments`
  - `feature-goals`
  - `feature-week-view`
  - `feature-schedule`
  - `frontend`
  - `frontend-e2e`

All items that were listed as **errors** in the previous version of this file have been fixed (labels associated with controls, accessibility click/keyboard issues, `no-output-native`, `no-useless-escape`, `networkidle`, and selector / static-import violations).

## Remaining Warnings (Summary only)

- Numerous `@typescript-eslint/no-explicit-any` warnings in shared models, frontend data-access stores, and backend schedule services/DTOs.
- Several `@typescript-eslint/no-non-null-assertion` and `@typescript-eslint/no-unused-vars` warnings across frontend feature libs.
- Playwright lint warnings in `apps/frontend-e2e/src/auth.spec.ts` (conditional logic in tests and skipped tests).
- Unused `eslint-disable` directives in backend-e2e support files.

To regenerate this file after future changes, run:

- `npx nx run-many -t lint`
- Then update this markdown with any new **error-level** findings and an updated warnings summary.
