## Frontend E2E Test Plan – Family Life Planner

**Scope:** Playwright E2E tests for the Angular frontend (`apps/frontend`) run via `frontend-e2e` (Nx + `@nx/playwright`). Covers Phase 1 MVP flows from `.ai/prd.md` and `.ai/mvp-unified-plan.md`.

---

### 1. Technical Setup

- **Runner**: Playwright (`@playwright/test`) integrated with Nx (`@nx/playwright`).
- **Project**: `apps/frontend-e2e` (already configured).
- **Base URL**: `http://localhost:6400` (started automatically by Playwright via `frontend:serve`).
- **Env assumptions**:
  - For *UI-only* checks: frontend only, backend can be offline (forms, routing, guards with mocked/empty state).
  - For *full happy-path* flows: Supabase + backend + frontend running according to `.ai/mvp-unified-plan.md` and `apps/frontend/TESTING.md`.

**Command to run all E2E tests:**

- `npx nx e2e frontend-e2e`

---

### 2. Test Strategy

- **Goal**: Validate that a real user can complete the MVP journeys:
  1. Register and log in.
  2. Set up family members.
  3. Create recurring goals.
  4. Generate a weekly schedule.
  5. View the schedule in the weekly calendar grid.
- **Prioritization**:
  - First: thin *happy-path* tests across the whole journey (one spec per journey).
  - Second: focused specs for edge cases (validation, guards, error UI) around auth/family/goals/schedule.
  - Performance/UX checks (grid render, filter responsiveness) as *lightweight* assertions only (no synthetic perf harness yet).

---

### 3. Test Suites & Scenarios

#### 3.1 Auth & Routing (`auth.spec.ts`)

- **US-001 / US-002 / US-006 – Registration & Login & Protected access**
- **Purpose**: Ensure basic access control and auth flows work end-to-end.

**Scenarios:**

1. **Redirect unauthenticated user from `/` to `/login` (UI-only)**  
   - Navigate to `/`.  
   - Expect redirect to `/login`.  
   - Assert login view is visible (titles, CTA link to register).

2. **Registration happy path (full flow, backend required)**  
   - Go to `/register`.  
   - Fill valid data (new email, strong password, confirm password, GDPR checkbox).  
   - Submit form.  
   - Expect redirect to `/dashboard` or `/schedule/week` (depending on current behavior).  
   - Assert navigation bar shows authenticated state (user email + Logout; no Login/Register links).

3. **Login happy path (full flow)**  
   - Go to `/login`.  
   - Use known test user (seeded or created in test 2).  
   - Submit form.  
   - Expect redirect to `/schedule/week`.  
   - Assert weekly calendar is rendered (day headers, time column, at least 1 block or empty grid).

4. **Login validation + error display (UI-only)**  
   - Try submitting empty form → expect inline validation errors.  
   - Enter invalid email format → specific validation error.  
   - Enter wrong credentials with backend running → API error surfaced in error banner.

5. **Guards behavior**  
   - While unauthenticated, navigate directly to `/schedule/week` or `/family` → expect redirect to `/login`.  
   - After login, navigate to `/login` or `/register` → expect redirect to `/schedule/week` or `/dashboard` (PublicOnlyGuard).  
   - Logout from navigation bar → expect redirect to `/login` and authenticated links disappear.

#### 3.2 Onboarding & Navigation Shell (`onboarding-nav.spec.ts`)

- **MVP Plan – Setup Flow + App shell navigation**

**Scenarios:**

1. **First-time user guidance (when onboarding implemented)**  
   - After first successful login, expect soft guidance to create family member + goal (banner, callout, or wizard).  
   - Follow CTAs: navigate to `/family`, then `/goals`, then `/schedule/week`.

2. **Navigation bar states (authenticated vs public)**  
   - Unauthenticated: only `Login` and `Register` visible; links for `Dashboard/Family/Goals/Commitments` hidden.  
   - Authenticated: feature links visible (`Dashboard`, `Family`, `Goals`, `Commitments`, `Schedule`) and `Logout` button; public actions hidden.

3. **Deep-link navigation**  
   - While logged in, go directly to `/family`, `/goals`, `/commitments`, `/schedule/week` by URL and verify pages load (no guard loops or blank screen).

#### 3.3 Family Members (`family-members.spec.ts`)

- **Phase 1 – Family Members (WHO)**

**Preconditions:** user logged in (use helper `loginAsTestUser(page)` or Playwright `test.beforeEach`).

**Scenarios:**

1. **List family members**  
   - Navigate to `/family`.  
   - Verify page header “Family Members”.  
   - Assert:  
     - Existing members listed as cards.  
     - Summary section shows correct counts (parents, children, total).

2. **Create new family member**  
   - Click “+ Add Member”.  
   - Fill name, role = `PARENT`/`SPOUSE`, optional age.  
   - Save and expect redirect back to `/family`.  
   - Assert new member appears in list and counts updated.

3. **Create child with required age validation**  
   - Role = `CHILD`, leave age empty → expect validation error.  
   - Fill valid age → form becomes submittable; after save, card shows “Age: X”.

4. **Edit family member**  
   - From card, click Edit.  
   - Change name/role, save.  
   - Verify updates reflected in list and summary.

5. **Delete family member (confirmation UX)**  
   - Click Delete on a member card.  
   - Confirm in browser dialog.  
   - Verify card removed from list and counts updated.  
   - Edge: attempting to delete last member should show error message (from backend) surfaced in UI.

#### 3.4 Recurring Goals (`recurring-goals.spec.ts`)

- **Phase 2 – Recurring Goals (WHAT)**

**Preconditions:** user logged in, at least one family member exists.

**Scenarios:**

1. **List and group goals by priority**  
   - Go to `/goals`.  
   - Verify header “Recurring Goals & Activities”.  
   - Assert sections for “High”, “Medium”, “Low” priorities exist and correctly group cards.

2. **Create new goal**  
   - Click “+ Add Goal”.  
   - Select family member, set frequency, duration, time of day, and priority.  
   - Save and verify card appears in appropriate priority section with correct member name.

3. **Validation rules**  
   - Frequency < 1 or > 14 → show validation errors, block submit.  
   - Duration < 15 or > 480 → show validation errors, block submit.  
   - Missing member → error until selected.

4. **Filtering & sorting**  
   - Use “Filter by Member” dropdown to show only goals for one member; verify only those cards visible.  
   - Switch sorting: by priority, name, createdAt (spot-check ordering via DOM positions or field values).

5. **Edit & delete goal**  
   - Edit a goal and verify changes (name, priority, member) reflected in list.  
   - Delete a goal with confirmation and ensure it is removed from UI.

#### 3.5 Weekly Schedule Generation (`schedule-generation.spec.ts`)

- **US-003 / US-004 / US-005 – Generate & review weekly schedule**

**Preconditions:** user logged in; at least one family member and some goals defined.

**Scenarios:**

1. **Trigger schedule generation (happy path)**  
   - Navigate to `/schedule/week` (or `/dashboard` if generation UI is there).  
   - Click the “Generate schedule” button.  
   - Wait for API call completion (mock or real).  
   - Assert:  
     - Success feedback visible (toast/banner/text).  
     - New time blocks appear in weekly view for the upcoming week.

2. **Generation error handling**  
   - Simulate backend error (e.g. wrong URL or temporarily stop backend) for this test only.  
   - Click “Generate schedule”.  
   - Verify user-friendly error message and no crash / broken layout.

3. **Regenerate schedule behavior**  
   - With existing schedule visible, click “Regenerate” (if implemented).  
   - Assert UI shows loading state and eventually an updated set of blocks (basic change check: block count or text differs).

4. **Schedule persistence**  
   - After generation, reload page (F5).  
   - Assert schedule for that week is still present (blocks loaded from backend/local storage, not only in-memory store).

#### 3.6 Weekly Calendar View & Interactions (`week-view.spec.ts`)

- **US-007 / US-008 – Grid calendar, filters, conflict display**

**Preconditions:** user logged in, at least one weekly schedule exists with multiple blocks and some overlaps.

**Scenarios:**

1. **Grid structure**  
   - Go to `/schedule/week`.  
   - Verify 7 day columns (Mon–Sun headers).  
   - Verify time rows (hour slots) visible without vertical scroll on standard desktop viewport (e.g. 1440x900).  

2. **Block rendering & legend**  
   - Assert blocks show member color/initials and possibly icons for activity types.  
   - Legend at top shows all family members with corresponding colors.

3. **Filter by member**  
   - Click filters: `Wszyscy/All`, individual member, “Wspólne/Family” (if available).  
   - Assert filtered blocks remain fully opaque; others are dimmed (opacity reduced + grayscale).  
   - Check filter changes are debounced (no flicker on quick clicking; implementation detail, light assertion on final state after small timeout).

4. **Conflict visualization**  
   - Ensure test data includes overlapping blocks for one member or shared times.  
   - Assert conflicts have red border and warning icon as per PRD.  
   - Optionally, hover or click conflict icon to see additional info (if implemented).

5. **Block details (modal/tooltip)**  
   - Hover over a block → tooltip shows activity name, member, time, and notes.  
   - Click a block → modal or side panel appears with full details and close button.  
   - Close interaction returns user to same scroll position and filter state.

6. **Keyboard navigation & accessibility (basic)**  
   - Use Tab/Shift+Tab to focus navigation, filters, and at least one block.  
   - Press Enter/Space on a focused block to open details.  
   - Ensure focus is trapped in modal and returns to block when modal closed (if ARIA support implemented).

---

### 4. Cross‑Cutting Concerns

- **Test data strategy**
  - Prefer deterministic seeded data for E2E (e.g. known user + family + goals precreated by migrations or setup script).
  - For registration/login tests, either:
    - Use a static “E2E” user created once by backend seed, or
    - Generate unique emails per run (`e2e+timestamp@example.com`) and allow db to grow in dev.

- **Selectors**
  - Prefer semantic Playwright queries (`getByRole`, `getByLabel`, `getByText`) aligned with accessibility.  
  - Add `data-testid` only where necessary (e.g. dynamic grid cells, conflict badges) to avoid brittle CSS selectors.

- **Environment separation**
  - Long‑running full‑stack tests (with backend + Supabase) should be clearly marked or grouped (e.g. `test.describe('full-stack')`) so you can filter them via `--grep` when needed.

---

### 5. Implementation Order

1. **Stage 1 – Smoke & routing**
   - Implement `auth.spec.ts` UI-only tests for redirects, view rendering, and nav bar states.
2. **Stage 2 – CRUD flows**
   - Implement `family-members.spec.ts` and `recurring-goals.spec.ts` happy-path CRUD tests.
3. **Stage 3 – Schedule & calendar**
   - Implement `schedule-generation.spec.ts` and `week-view.spec.ts` for generation + grid interactions.
4. **Stage 4 – Edge cases & a11y**
   - Add validation/error scenarios, conflict checks, and basic keyboard navigation assertions.

This keeps the E2E suite small but high-value and directly mapped to the MVP acceptance criteria in `.ai/prd.md` and `.ai/mvp-unified-plan.md`.

