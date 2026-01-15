# Layout Switcher Implementation Plan

## Overview
Implement a toggle that switches the week view between:
- Days as columns (current)
- Hours as columns (transposed)

The plan focuses on frontend-only changes and keeps existing data structures.

## Step-by-step
1) Define layout type and state
- Add `WeekGridLayout` type: `days-columns` | `hours-columns`.
- Add a `layout` signal in `WeekViewContainerComponent`.
- Default to `days-columns`.

2) Add the UI toggle
- Place a segmented control near the week navigation buttons.
- Buttons: `Dni → kolumny`, `Godziny → kolumny`.
- On click, update the `layout` signal.

3) Add transposed grid component
- Create `WeekGridTransposedComponent` (standalone).
- Inputs: `gridCells`, `members`, `layout` (optional if needed).
- Render:
  - Header row = hours (time slots).
  - Rows = days.
  - Use existing `GridCell[][]` but map `row=day`, `col=time`.

4) Wire component selection
- In `WeekViewContainerComponent` template, render:
  - `WeekGridComponent` when layout is `days-columns`.
  - `WeekGridTransposedComponent` when layout is `hours-columns`.

5) Styles and layout parity
- Match compact sizing and sticky header/left column.
- Ensure time header and day column align with existing widths/heights.
- Reuse existing activity cell styles.

6) Optional: persist layout
- Save layout to `localStorage` on change.
- Restore on init and update signal.

7) Documentation
- Add a short note to `README.md` or `docs/ARCHITECTURE.md` about the toggle.

## Acceptance Checklist
- Toggle switches layout instantly without reload.
- Both layouts show identical activities and conflicts.
- No duplication or missing cells.
- Works with filtering and week navigation.
- Layout choice persists if enabled.
