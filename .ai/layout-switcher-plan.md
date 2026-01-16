# Week View Layout Switcher Plan

## Goal

Let users toggle the weekly grid orientation to compare:

- Days as columns, hours as rows (current)
- Hours as columns, days as rows

## Scope

- Add a UI toggle in the week view header.
- Render either orientation without changing data structures.
- Keep visuals compact and consistent with current design.

## Approach

### 1) Layout option state

- Introduce `WeekGridLayout` type: `days-columns` | `hours-columns`.
- Store layout in `WeekViewContainerComponent` (signal), default to `days-columns`.

### 2) UI switcher

- Add a small segmented toggle near week navigation.
- Labels: Dni → kolumny and Godziny → kolumny.
- On click, update layout state.

### 3) Rendering strategy

Preferred (cleaner): new component `WeekGridTransposedComponent` with:

- Header row = hours
- Rows = days
- Uses the same `GridCell[][]` but maps indices during render

Fallback (faster): extend `WeekGridComponent`

- Add `layout` input and branch template/styles.

### 4) Cell mapping rules

- Use the existing `GridCell[][]` from `GridTransformService`.
- In transposed view, map:
  - Row index → day
  - Column index → time slot
- Activities remain unchanged; only cell indexing changes.

### 5) Styles

- Adjust grid template columns/rows for both layouts.
- Keep row height and time column width compact.
- Maintain sticky header and left column.

### 6) Persist user choice (optional)

- Save to `localStorage` under `weekViewLayout`.
- Restore on load.

## Documentation

- Add a short note to `README.md` or `docs/ARCHITECTURE.md` about the layout toggle.

## Out of Scope

- Editing schedule data
- Changing backend APIs
- New filters or AI changes
