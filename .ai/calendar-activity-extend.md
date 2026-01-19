# Calendar Activity Extension - Week Navigation & Activity Details Modal

## 📋 Overview

This document describes the proposed enhancement to the week view calendar that allows:
1. **Clicking on empty space in a cell** to open a modal
2. **The modal provides**:
   - Ability to change the current week (date picker)
   - Display activity details (if activities exist in that cell)

## 🎯 Current State Analysis

### Existing Implementation

#### Grid Cell Structure
- **Component**: `GridCellComponent` (`libs/frontend/feature-week-view/src/lib/components/grid-cell/`)
- **Structure**: Each cell contains an `activities-stack` with activity slots for each family member
- **Empty cells**: Have empty activity slots (`<div class="activity-slot empty"></div>`)
- **Click handling**: Currently only activities emit click events via `activityClick` output

#### Activity Modal
- **Component**: `ActivityDetailModalComponent` (already exists)
- **Trigger**: Clicking on an activity cell
- **Content**: Shows full activity details (time, participants, description, type, conflicts)

#### Week Navigation
- **Current method**: Header buttons (Previous, Today, Next)
- **State**: `weekStartDate` signal in `WeekViewContainerComponent`
- **URL sync**: Week date is synced with URL query params (`?week=2026-01-13`)

### Current Click Flow
```
User clicks activity → ActivityCellComponent.onClick() 
  → GridCellComponent.onActivityClick() 
    → WeekGridComponent.onActivityClick() 
      → WeekViewContainerComponent.onActivityClick() 
        → Opens ActivityDetailModalComponent
```

## 🔍 Questions to Decide

### 1. **Modal Purpose & Content**

**Q1.1**: What should happen when clicking empty space in a cell?
- **Option A**: Open a modal with **only** week navigation (date picker)
- **Option B**: Open a modal with **both** week navigation AND activity details section (if activities exist)
- **Option C**: Open a modal with week navigation AND quick-add activity form
- **Option D**: Different behavior for completely empty cells vs. cells with some activities

**Recommendation**: Option B - Unified modal that shows:
- Week navigation section (always visible)
- Activity details section (if activities exist in that cell/time slot)

Response:C

**Q1.2**: Should the modal show activities for:
- **Option A**: Only the clicked cell (specific day + time slot)
- **Option B**: All activities for that day (all time slots)
- **Option C**: All activities for that time slot across the week

**Recommendation**: Option A - Show activities for the specific cell (day + time slot)
Response:A

### 2. **Empty Space Detection**

**Q2.1**: How do we detect "empty space" clicks?
- **Option A**: Click on the cell background (not on any activity)
- **Option B**: Click on empty activity slots
- **Option C**: Both - any click in cell that doesn't hit an activity

**Recommendation**: Option C - Add click handler to `GridCellComponent` that checks if click target is not an activity

Response:C

**Q2.2**: Should we distinguish between:
- Completely empty cells (no activities at all)
- Partially filled cells (some members have activities, others don't)

**Recommendation**: Yes - different visual feedback (hover state) for empty vs. partially filled cells

Response: yes

### 3. **Modal Component Architecture**

**Q3.1**: Should we create a new modal or extend existing `ActivityDetailModalComponent`?
- **Option A**: New `CellNavigationModalComponent` for empty space clicks
- **Option B**: Extend `ActivityDetailModalComponent` to handle both cases
- **Option C**: Create `WeekNavigationModalComponent` that can show both navigation and activity details

**Recommendation**: Option C - New `WeekNavigationModalComponent` that:
- Always shows week navigation
- Conditionally shows activity details section
- Can be reused for other navigation scenarios


Response:C

**Q3.2**: Modal layout structure:
```
┌─────────────────────────────────────┐
│ Week Navigation Modal          [×]  │
├─────────────────────────────────────┤
│                                     │
│ 📅 Navigate to Week                 │
│ [Date Picker: 2026-01-13]           │
│ [Go to Week] button                 │
│                                     │
│ ─────────────────────────────────  │
│                                     │
│ ⏰ Activities at this time           │
│ (only if activities exist)           │
│ [Activity list/details]             │
│                                     │
└─────────────────────────────────────┘
```

### 4. **Date Picker Implementation**

**Q4.1**: Which date picker should we use?
- **Option A**: Native HTML `<input type="date">` (currently used in schedule-generator-panel)
- **Option B**: Angular Material DatePicker (`@angular/material/datepicker`)
- **Option C**: Custom date picker component
- **Option D**: Week picker (shows calendar, highlights week)

**Recommendation**: Option D - Week picker that:
- Shows calendar view
- Highlights the selected week (Monday-Sunday)
- Allows clicking any Monday to navigate
- Falls back to native input if Material is not available

Response:b

**Q4.2**: Date picker constraints:
- **Option A**: Allow any date (past/future)
- **Option B**: Only future weeks
- **Option C**: Only weeks within reasonable range (e.g., ±1 year)

**Recommendation**: Option C - Allow navigation to any week within ±1 year from current date
Response:c

### 5. **User Experience & Visual Feedback**

**Q5.1**: How should empty cells indicate they're clickable?
- **Option A**: Hover effect (background color change, cursor pointer)
- **Option B**: Visual indicator (icon, border, subtle pattern)
- **Option C**: No visual change until hover
- **Option D**: Tooltip on hover ("Click to navigate to week")

**Recommendation**: Option A + D - Hover effect with tooltip
Response:a

**Q5.2**: Should clicking empty space have different behavior in different layouts?
- **Days-columns layout**: Click empty cell → navigate to that week
- **Hours-columns layout**: Same behavior?

**Recommendation**: Same behavior in both layouts
Response:same behavior

**Q5.3**: What happens after selecting a new week in the modal?
- **Option A**: Close modal immediately, navigate to week
- **Option B**: Show confirmation, then navigate
- **Option C**: Navigate without closing modal (show loading state)

**Recommendation**: Option A - Close modal and navigate immediately (with loading state in calendar)
Response:a

### 6. **Activity Details in Modal**

**Q6.1**: If a cell has multiple activities (different family members), how should they be displayed?
- **Option A**: List all activities with expandable details
- **Option B**: Show summary, click to expand individual activity
- **Option C**: Show only first activity, with "View all X activities" link

**Recommendation**: Option A - List all activities with expandable sections
Response:a

**Q6.2**: Should clicking an activity in the modal open the full `ActivityDetailModalComponent`?
- **Option A**: Yes - nested modal or replace current modal
- **Option B**: No - show inline expanded details
- **Option C**: Replace current modal content

**Recommendation**: Option B - Expand inline (better UX, no modal stacking)
Response:b

### 7. **Event Handling & State Management**

**Q7.1**: How should we handle click events in `GridCellComponent`?
- **Option A**: Add `(click)` handler to cell div, check if target is activity
- **Option B**: Add click handler to empty activity slots
- **Option C**: Use event delegation at grid level

**Recommendation**: Option A - Add click handler with event target checking:
```typescript
onCellClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  // Check if click was on activity or empty space
  if (!target.closest('.activity-cell')) {
    this.cellClick.emit({
      cell: this.cell(),
      day: this.cell().day,
      timeSlot: this.cell().timeSlot,
    });
  }
}
```
Response:a

**Q7.2**: Should we prevent activity clicks from bubbling to cell click?
- **Option A**: Yes - stop propagation in activity click
- **Option B**: No - handle in cell click handler

**Recommendation**: Option A - Already handled (activities have their own click handlers)
Response:a

### 8. **Accessibility**

**Q8.1**: Keyboard navigation:
- **Option A**: Empty cells should be focusable (tab navigation)
- **Option B**: Only activities are focusable
- **Option C**: Add keyboard shortcut (e.g., 'N' for navigate to week)

**Recommendation**: Option A + C - Make cells focusable and add keyboard shortcuts
Response:a+c

**Q8.2**: Screen reader announcements:
- What should be announced when focusing an empty cell?
- What should be announced when opening the modal?

**Recommendation**: 
- Empty cell: "Empty time slot, [Day] [Time]. Press Enter to navigate to week or view activities."
- Modal: "Week navigation modal. Select a week to navigate."
Response:as recommentation

### 9. **Performance Considerations**

**Q9.1**: Should we lazy load the modal component?
- **Option A**: Yes - use `@defer` for modal
- **Option B**: No - modal is lightweight

**Recommendation**: Option A - Use `@defer` since modal is not always visible
Response:a

**Q9.2**: Should we preload week data when hovering over date picker?
- **Option A**: Yes - prefetch on hover
- **Option B**: No - load only on selection

**Recommendation**: Option B - Load only on selection (avoid unnecessary API calls)
Response:b

### 10. **Integration with Existing Features**

**Q10.1**: How should this interact with existing week navigation buttons?
- **Option A**: Both methods work independently
- **Option B**: Clicking empty space is alternative to header buttons
- **Option C**: Header buttons remain primary, empty space click is secondary

**Recommendation**: Option A - Both methods work, provide flexibility
Response:a

**Q10.2**: Should the modal remember last selected week?
- **Option A**: Yes - prefill date picker with last selected
- **Option B**: No - always start with current week
- **Option C**: Prefill with the week of the clicked cell

**Recommendation**: Option C - Prefill with the week containing the clicked cell's date
Response:c

### 11. **Edge Cases**

**Q11.1**: What if user clicks empty space in a cell that spans multiple time slots?
- **Option A**: Use the start time slot
- **Option B**: Use the clicked position to determine time
- **Option C**: Show all activities for that day

**Recommendation**: Option A - Use the cell's time slot (simpler, consistent)
Response:a

**Q11.2**: What if the selected week has no schedule data?
- **Option A**: Show empty state in modal
- **Option B**: Navigate anyway, show empty state in calendar
- **Option C**: Show warning before navigating

**Recommendation**: Option B - Navigate and show empty state (consistent with current behavior)
Response:b

**Q11.3**: What if user is in the middle of editing an activity?
- **Option A**: Block opening modal (show warning)
- **Option B**: Close edit modal, open navigation modal
- **Option C**: Allow both modals (stacked)

**Recommendation**: Option A - Block opening (prevent confusion, maintain focus)
Response:a

## 📐 Proposed Implementation Plan

### Phase 1: Core Functionality

1. **Add cell click handler to `GridCellComponent`**
   - Detect clicks on empty space
   - Emit `cellClick` event with cell data

2. **Create `WeekNavigationModalComponent`**
   - Week date picker (calendar view)
   - Activity details section (conditional)
   - Navigation action button

3. **Update `WeekViewContainerComponent`**
   - Handle `cellClick` event from grid
   - Open `WeekNavigationModalComponent`
   - Handle week navigation from modal

### Phase 2: Enhancements

1. **Visual feedback for empty cells**
   - Hover states
   - Tooltips
   - Cursor changes

2. **Accessibility improvements**
   - Keyboard navigation
   - ARIA labels
   - Screen reader support

3. **Activity details in modal**
   - List all activities in cell
   - Expandable details
   - Quick actions

### Phase 3: Polish

1. **Animations**
   - Modal enter/exit
   - Loading states
   - Transitions

2. **Error handling**
   - Invalid date selection
   - API errors
   - Network failures

## 🎨 UI/UX Mockup

```
┌─────────────────────────────────────────────────────────┐
│  Week Navigation                          [×] Close     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📅 Navigate to Week                                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  January 2026                                     │  │
│  │  ┌──┬──┬──┬──┬──┬──┬──┐                          │  │
│  │  │Mo│Tu│We│Th│Fr│Sa│Su│                          │  │
│  │  ├──┼──┼──┼──┼──┼──┼──┤                          │  │
│  │  │  │  │  │  │  │  │  │                          │  │
│  │  │11│12│13│14│15│16│17│ ← Selected week         │  │
│  │  │18│19│20│21│22│23│24│                          │  │
│  │  │25│26│27│28│29│30│31│                          │  │
│  │  └──┴──┴──┴──┴──┴──┴──┘                          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Selected: January 13 - 19, 2026                        │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Navigate to This Week                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ────────────────────────────────────────────────────  │
│                                                          │
│  ⏰ Activities at Monday, 09:00                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 💼 Work (Tata)                                     │  │
│  │ 09:00 - 17:00 • WORK • Fixed                      │  │
│  │ [View Details]                                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 💪 Gym (Mama)                                      │  │
│  │ 09:00 - 10:00 • ACTIVITY • Goal                   │  │
│  │ [View Details]                                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Technical Considerations

### Component Structure

```typescript
// New component: WeekNavigationModalComponent
@Component({
  selector: 'app-week-navigation-modal',
  template: `
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <!-- Week Navigation Section -->
        <section class="week-navigation">
          <h2>📅 Navigate to Week</h2>
          <app-week-picker 
            [selectedWeek]="selectedWeek()"
            (weekSelect)="onWeekSelect($event)"
          />
          <button (click)="navigateToWeek()">Navigate</button>
        </section>

        <!-- Activity Details Section (conditional) -->
        @if (activities().length > 0) {
          <section class="activity-details">
            <h2>⏰ Activities at {{ cellInfo() }}</h2>
            @for (activity of activities(); track activity.id) {
              <app-activity-summary 
                [activity]="activity"
                (click)="viewActivityDetails(activity)"
              />
            }
          </section>
        }
      </div>
    </div>
  `
})
export class WeekNavigationModalComponent {
  selectedWeek = input.required<Date>();
  activities = input<ActivityInCell[]>([]);
  cellInfo = input<{ day: string; timeSlot: string }>();
  
  weekSelect = output<Date>();
  activityClick = output<ActivityInCell>();
  close = output<void>();
}
```

### Event Flow

```
User clicks empty cell
  → GridCellComponent.onCellClick()
    → Emits cellClick event with { cell, day, timeSlot }
      → WeekViewContainerComponent.onCellClick()
        → Opens WeekNavigationModalComponent
          → User selects week
            → Modal emits weekSelect
              → WeekViewContainerComponent.navigateToWeek()
                → Updates weekStartDate signal
                  → Effect triggers loadWeekData()
                    → Calendar updates
```

## 📝 API Considerations

### No New API Endpoints Required

- Week navigation uses existing `getWeekSchedule(weekStartDate)` endpoint
- Activity details are already available in the current week data
- No additional backend changes needed

## ✅ Acceptance Criteria

1. ✅ Clicking empty space in any cell opens the week navigation modal
2. ✅ Modal displays week picker (calendar view)
3. ✅ Selecting a week and clicking "Navigate" updates the calendar view
4. ✅ Modal shows activities for the clicked cell (if any exist)
5. ✅ Activities in modal are clickable and show details
6. ✅ Modal is keyboard accessible (ESC to close, Tab navigation)
7. ✅ Empty cells have visual hover feedback
8. ✅ Modal works in both layout modes (days-columns, hours-columns)
9. ✅ URL is updated when navigating to new week
10. ✅ Loading state is shown during week data fetch

## 🚀 Next Steps

1. **Review and decide on all questions above**
2. **Create implementation plan with specific tasks**
3. **Design week picker component (or choose library)**
4. **Implement core functionality (Phase 1)**
5. **Test with real data**
6. **Add enhancements (Phase 2 & 3)**

---

## 📚 Related Documents

- `.ai/prd.md` - Product Requirements Document
- `.ai/tech-stack.md` - Technology Stack
- `.ai/week-view-implementation-plan.md` - Week View Implementation
- `.ai/week-view-navigation-plan.md` - Week Navigation Plan
- `.cursor/rules/frontend.mdc` - Frontend Coding Standards
