# Week View Grid Layout - Decision Review & Implementation Summary

**Date**: 2026-01-14  
**Status**: ✅ All decisions finalized  
**Ready for**: Implementation

---

## 📋 Executive Summary

All design questions (30 total) have been answered. The week view will be a **desktop-first, calendar-style grid** with:

- **7 columns** (Mon-Sun) × **dynamic rows** (1-hour slots based on activity times)
- **Member-centric coloring** with background colors + initials
- **Visual distinction** for activity types using emojis
- **Proportional sizing** for activities based on duration
- **Smooth transitions** and hover tooltips for better UX
- **Performance-optimized** with Angular signals, lazy rendering, and OnPush

---

## 🎨 Visual Design Specifications

### Layout Structure

```
┌──────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ Time │   Mon   │   Tue   │   Wed   │   Thu   │   Fri   │   Sat   │   Sun   │
├──────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ 09:00│ ┌─────┐ │         │ ┌─────┐ │         │         │         │         │
│      │ │  T  │ │         │ │  M  │ │         │         │         │         │
│      │ └─────┘ │         │ └─────┘ │         │         │         │         │
├──────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ 10:00│ ┌─────┐ │ ┌─────┐ │ ┌─────┐ │         │         │         │         │
│      │ │  T  │ │ │  M  │ │ │ ALL │ │         │         │         │         │
│      │ ├─────┤ │ └─────┘ │ │▨▨▨▨▨│ │         │         │         │         │
│      │ │  H  │ │         │ └─────┘ │         │         │         │         │
│      │ └─────┘ │         │         │         │         │         │         │
└──────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

Legend: ■ tata (T)  ■ mama (M)  ■ hania (H)  ■ małgosia  ■ monika  ▨ Shared
```

### Grid Dimensions

| Element         | Specification                         | Rationale                         |
| --------------- | ------------------------------------- | --------------------------------- |
| **Time Column** | TBD (AI proposal)                     | Fit "09:00" in 24-hour format     |
| **Day Columns** | Fluid (1/7 of remaining width)        | Responsive to screen width        |
| **Cell Height** | TBD (AI proposal)                     | Enough for 3-4 stacked activities |
| **Time Format** | 24-hour (09:00, 14:00)                | European standard                 |
| **Hour Range**  | Dynamic (earliest to latest activity) | Optimize vertical space           |

### Color System

**Decision**: AI-proposed hardcoded palette (future: user-configurable in family preferences)

```typescript
// To be implemented with AI suggestion
interface MemberColors {
  tata: string; // Blue family
  mama: string; // Pink/Rose family
  hania: string; // Amber/Yellow family
  małgosia: string; // Emerald/Green family
  monika: string; // Purple family
  shared: string; // Gray or special pattern base
}
```

**Requirements**:

- Work well when stacked vertically
- Good contrast with white text
- Accessible for color-blind users (supplemented with initials)

---

## 🔧 Feature Specifications

### Round 1 Decisions (Core Features)

| #       | Feature               | Decision                  | Implementation Notes                                              |
| ------- | --------------------- | ------------------------- | ----------------------------------------------------------------- |
| **Q1**  | Time Slot Granularity | **1-hour slots**          | Clean, minimal scrolling                                          |
| **Q2**  | Hours Range           | **Dynamic**               | Calculate from earliest/latest activity                           |
| **Q3**  | Member Distinction    | **Color + Initials**      | Background color with initials overlay                            |
| **Q4**  | Shared Activities     | **Diagonal stripes**      | CSS `repeating-linear-gradient` at 45°                            |
| **Q5**  | Activity Details      | **Icons + Hover tooltip** | Emoji icons, full details on hover                                |
| **Q6**  | Activity Type Coding  | **Member color + Emoji**  | Primary: member color, Secondary: type emoji                      |
| **Q7**  | Legend Position       | **Top Horizontal**        | Format: `■ tata  ■ mama  ■ hania  ■ małgosia  ■ monika  ▨ Shared` |
| **Q8**  | Multiple Activities   | **Vertical Stack**        | Stack all members' blocks within cell                             |
| **Q9**  | Empty Time Slots      | **Show All**              | Light background, helps identify free time                        |
| **Q10** | Filtering Behavior    | **Dim Others** ⚠️         | **CHANGED FROM "Hide"** - Keep visible but dim non-selected       |
| **Q11** | Responsive Design     | **Desktop Only**          | Mobile/tablet deferred to future                                  |
| **Q12** | Interactions          | **Click for Details**     | Modal on click; hover/drag-drop = future                          |

⚠️ **Important Change**: Q10 was revised from "Hide Others" to "Dim Others" - better UX for context awareness.

---

### Round 2 Decisions (Implementation Details)

| #       | Feature                 | Decision                        | Implementation Notes                                        |
| ------- | ----------------------- | ------------------------------- | ----------------------------------------------------------- |
| **Q13** | Color Palette           | **AI-proposed + future config** | Hardcode initial, add to family prefs later                 |
| **Q14** | Multi-hour Activities   | **Repeat in each slot**         | Show activity in every hour it spans                        |
| **Q15** | Icon Library            | **Emoji** 😊                    | No dependencies, universal, fun                             |
| **Q16** | Shared Activity Pattern | **Diagonal stripes (CSS)**      | Use `repeating-linear-gradient(45deg, ...)`                 |
| **Q17** | Tooltip Content         | **AI assumption**               | Include: title, time, participants, type, description       |
| **Q18** | Cell Dimensions         | **Fluid width**                 | Day columns divide remaining space equally                  |
| **Q19** | Title Overflow          | **Truncate + Full on hover**    | Ellipsis in cell, full title in tooltip                     |
| **Q20** | Time Format             | **24-hour**                     | 09:00, 14:00, 18:00 format                                  |
| **Q21** | Week Start Day          | **Monday**                      | ISO 8601 standard (Mon-Sun)                                 |
| **Q22** | Today Indication        | **Highlight column**            | Different background for current day                        |
| **Q23** | Loading/Empty States    | **Skeleton + Empty grid**       | Loading: pulsing skeleton; Empty: show grid                 |
| **Q24** | Filtering Animation     | **Fade transition**             | Opacity animation for smooth UX                             |
| **Q25** | Scrolling               | **Sticky headers**              | Day headers, time column, legend, filter buttons all sticky |
| **Q26** | Activity Details View   | **Modal dialog**                | Centered overlay with backdrop                              |
| **Q27** | Short Activities        | **Proportional height**         | 15-min activity = 1/4 cell height                           |
| **Q28** | Conflict Detection      | **Red border + Warning icon**   | Both visual indicators for overlaps                         |
| **Q29** | Member Order            | **Role/Age**                    | Parents first (tata, mama), then kids by age                |
| **Q30** | Performance             | **5 optimizations**             | See performance section below                               |

---

## 📊 Detailed Feature Breakdown

### 1. Activity Type Icons (Emoji)

```typescript
const ACTIVITY_ICONS = {
  WORK: '💼', // Briefcase
  ACTIVITY: '⚽', // Sports/Activity
  MEAL: '🍽️', // Meal
  OTHER: '📌', // Pin/Other
  SHARED: '👨‍👩‍👧‍👦', // Family
};
```

### 2. Multi-Hour Activity Display

**Option A - Repeat in Each Slot** ✅

```
09:00 | 💼 Work (tata)     |
10:00 | 💼 Work (tata)     |
11:00 | 💼 Work (tata)     |
12:00 | 💼 Work (tata)     |
```

**Pros**:

- Simple implementation
- Clear visual continuity
- Easy to understand

**Cons**:

- Some redundancy
- More DOM elements

### 3. Shared Activity Visual Pattern

```css
.shared-activity {
  background: repeating-linear-gradient(45deg, var(--member-color-1), var(--member-color-1) 10px, var(--member-color-2), var(--member-color-2) 20px);
}
```

### 4. Tooltip Content (AI Assumption)

**Proposed Structure**:

```
┌─────────────────────────────────┐
│ 🍽️ Family Dinner               │
│                                 │
│ ⏰ 18:00 - 19:00 (1h)           │
│ 👤 tata, mama, hania, małgosia  │
│ 📝 Pizza night with the family! │
│ 🏷️ MEAL • Fixed                 │
│                                 │
│ 💡 Click for full details       │
└─────────────────────────────────┘
```

**Include**:

- ✅ Activity title with type emoji
- ✅ Full time range + duration
- ✅ List of all participants
- ✅ Description/notes (if present)
- ✅ Block type badge
- ✅ Goal vs Fixed indicator
- ✅ Click hint

### 5. Filtering - Dim Others (Revised)

**Original**: Hide non-selected members completely  
**Revised**: Dim non-selected members to ~30% opacity

**Benefits**:

- Maintain context of full schedule
- Better for family coordination
- Easier to see conflicts/gaps
- Less jarring transition

```css
.activity-cell.dimmed {
  opacity: 0.3;
  pointer-events: none;
  filter: grayscale(0.5);
}
```

### 6. Conflict Detection

**Visual Indicators**:

1. **Red border** (3px solid #ef4444) around conflicting activities
2. **Warning icon** (⚠️) in top-right corner of cell

**Logic**:

- Detect when same person has overlapping time blocks
- Show indicators in both/all conflicting activities
- Apply to activities in different time slots that overlap

### 7. Proportional Height for Short Activities

```typescript
function calculateActivityHeight(durationMinutes: number, cellHeight: number): number {
  const hourlyHeight = cellHeight;
  return Math.max(
    24, // minimum readable height
    (durationMinutes / 60) * hourlyHeight
  );
}

// Examples with cellHeight = 80px:
// 15 min → 20px (but min 24px) → 24px
// 30 min → 40px
// 45 min → 60px
// 60 min → 80px (full)
```

### 8. Member Stacking Order

**Priority**: Role → Age

```typescript
const MEMBER_ORDER = [
  'tata', // Parent 1
  'mama', // Parent 2
  'Hania', // Oldest child
  'Małgosia', // Middle child
  'Monika', // Youngest child
];
```

---

## ⚡ Performance Optimization Strategy

### Selected Optimizations (Q30)

| Priority  | Technique                     | Implementation                                    | Impact                  |
| --------- | ----------------------------- | ------------------------------------------------- | ----------------------- |
| 🔴 HIGH   | **Angular `track` functions** | `@for (cell of cells; track cell.id)`             | Minimize re-renders     |
| 🔴 HIGH   | **Memoization with signals**  | Cache computed cell data                          | Reduce calculations     |
| 🔴 HIGH   | **Lazy rendering**            | Render only visible viewport                      | Reduce initial DOM size |
| 🟡 MEDIUM | **Debounced filtering**       | 150ms debounce on filter changes                  | Reduce filter spam      |
| 🟡 MEDIUM | **OnPush change detection**   | `changeDetection: ChangeDetectionStrategy.OnPush` | Skip unnecessary checks |

### Not Implemented (Initially)

- ❌ Virtual scrolling - May add if performance issues arise
- ❌ Web Workers - Overkill for current data size

### Performance Targets

```typescript
// Target metrics
const PERFORMANCE_TARGETS = {
  initialRenderTime: '<100ms', // First paint
  filteringDelay: '<50ms', // Filter response time
  tooltipDelay: '<10ms', // Hover to tooltip
  modalOpenTime: '<30ms', // Click to modal
  gridCellsRendered: '224+', // 7 days × ~16-32 hours
};
```

---

## 🎯 Data Structure

### Grid Cell Interface

```typescript
interface GridCell {
  id: string; // Unique identifier for tracking
  timeSlot: string; // "09:00"
  day: string; // "2026-01-13" (ISO date)
  dayOfWeek: number; // 0-6 (Mon-Sun)
  isEmpty: boolean; // Quick check for empty cells
  activities: ActivityInCell[]; // All activities in this slot
}

interface ActivityInCell {
  id: string;
  member: FamilyMember; // tata, mama, hania, małgosia, monika
  block: TimeBlock; // Full time block data
  isShared: boolean; // Shared/family activity flag
  hasConflict: boolean; // Overlaps with another activity
  proportionalHeight: number; // % of cell height (for <1h activities)
}

interface TimeBlock {
  id: string;
  title: string;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  type: 'WORK' | 'ACTIVITY' | 'MEAL' | 'OTHER';
  description?: string;
  isGoal: boolean; // Goal vs Fixed
  emoji?: string; // Type emoji
}
```

### Data Transformation Pipeline

```typescript
// Current structure → Grid structure
TimeBlock[] grouped by day/member
    ↓
Parse and extract time range
    ↓
Generate hourly time slots (dynamic)
    ↓
Map activities to [timeSlot][day] cells
    ↓
Stack multiple members per cell
    ↓
Sort by member order (role/age)
    ↓
Calculate proportional heights
    ↓
Detect conflicts
    ↓
Apply styling classes
    ↓
Render grid with Angular signals
```

---

## 🎨 CSS Architecture

### Grid Layout

```scss
.week-grid-container {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr); // Time column + 7 days
  grid-auto-rows: minmax(60px, auto); // Minimum height per hour
  gap: 1px;
  background: var(--grid-line-color);

  position: relative;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

// Sticky headers
.day-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--header-bg);
  font-weight: 600;

  &.today {
    background: var(--today-highlight);
    color: var(--today-text);
  }
}

.time-column {
  position: sticky;
  left: 0;
  z-index: 10;
  background: var(--time-bg);
  padding: 8px;
  text-align: right;
  font-size: 0.875rem;
  color: var(--time-text);
}
```

### Activity Cell Styling

```scss
.activity-cell {
  position: relative;
  border-radius: 4px;
  padding: 4px 8px;
  margin: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: opacity 200ms ease, transform 100ms ease;

  // Member colors applied via [style.background]
  color: white;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  // Filtering
  &.dimmed {
    opacity: 0.3;
    pointer-events: none;
    filter: grayscale(0.5);
  }

  // Conflicts
  &.has-conflict {
    border: 3px solid #ef4444;

    &::after {
      content: '⚠️';
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 0.75rem;
    }
  }

  // Shared activities
  &.shared {
    background: repeating-linear-gradient(45deg, var(--member-color), var(--member-color) 10px, rgba(255, 255, 255, 0.2) 10px, rgba(255, 255, 255, 0.2) 20px) !important;
  }

  // Truncate text
  .activity-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
```

### Legend Component

```scss
.legend {
  position: sticky;
  top: 60px; // Below day headers
  z-index: 15;
  display: flex;
  gap: 16px;
  padding: 12px;
  background: var(--legend-bg);
  border-bottom: 2px solid var(--border-color);

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;

    .color-square {
      width: 16px;
      height: 16px;
      border-radius: 2px;

      &.shared {
        background: repeating-linear-gradient(45deg, #6b7280, #6b7280 4px, #9ca3af 4px, #9ca3af 8px);
      }
    }
  }
}
```

---

## 🔄 Interaction Flows

### 1. Page Load

```
1. Fetch schedule data for current week
2. Show skeleton grid (pulsing cells)
3. Transform data to grid structure
4. Calculate dynamic hour range
5. Render grid with all activities
6. Apply today highlight
7. Initialize filters (default: "All")
```

### 2. Filter Member

```
1. User clicks member filter button
2. Debounce 150ms (if rapid clicks)
3. Apply filter state to cells
4. Fade animation (200ms)
   - Selected: opacity 1.0
   - Others: opacity 0.3 + grayscale
5. Update filter button styling
```

### 3. Hover Activity

```
1. Mouse enters activity cell
2. Delay 10ms (avoid flicker)
3. Calculate tooltip position
4. Render tooltip with full details
5. Show with fade-in (100ms)
6. Mouse leaves → fade-out (100ms)
```

### 4. Click Activity

```
1. User clicks activity cell
2. Prevent event bubbling
3. Open modal dialog (30ms)
4. Render full activity details
5. Show edit/delete buttons (if allowed)
6. Modal backdrop darkens screen
7. User closes → fade out modal
```

---

## 📱 Sticky Elements Configuration

**Z-index hierarchy**:

```scss
$z-index: (
  modal-backdrop: 50,
  modal-content: 51,
  day-header: 20,
  legend: 15,
  filter-buttons: 18,
  time-column: 10,
  activity-cell: 1,
  grid-background: 0,
);
```

**Sticky elements**:

1. ✅ Day headers (Mon, Tue, ...) - `top: 0`
2. ✅ Time column (09:00, 10:00, ...) - `left: 0`
3. ✅ Legend - `top: 60px` (below headers)
4. ✅ Filter buttons - `top: 110px` (below legend)

---

## 🎭 Animation Specifications

| Interaction     | Animation       | Duration | Easing      |
| --------------- | --------------- | -------- | ----------- |
| Filter change   | Fade opacity    | 200ms    | ease-in-out |
| Hover activity  | Scale up        | 100ms    | ease-out    |
| Tooltip appear  | Fade in         | 100ms    | ease-out    |
| Modal open      | Fade + slide    | 200ms    | ease-out    |
| Today highlight | Pulse (on load) | 500ms    | ease-in-out |

---

## ✅ Implementation Checklist

### Phase 1: Core Structure (Week 1)

- [ ] Create `WeekGridComponent` with CSS Grid layout
- [ ] Implement time column with dynamic hour range
- [ ] Add day headers (Mon-Sun) with sticky positioning
- [ ] Build grid cell structure with `@for` tracking
- [ ] Set up member color constants (AI-proposed palette)
- [ ] Add "today" column highlighting

### Phase 2: Activity Display (Week 1-2)

- [ ] Create `ActivityCellComponent` for individual activities
- [ ] Implement member color + initial display
- [ ] Add emoji icons for activity types
- [ ] Implement proportional height for short activities
- [ ] Add repeat logic for multi-hour activities
- [ ] Implement vertical stacking for multiple members
- [ ] Apply member order sorting (role/age)

### Phase 3: Shared Activities & Patterns (Week 2)

- [ ] Create diagonal stripe CSS for shared activities
- [ ] Apply pattern to shared family activities
- [ ] Test pattern with different member colors

### Phase 4: Interactions (Week 2-3)

- [ ] Add hover tooltip component
- [ ] Implement tooltip content (AI assumption structure)
- [ ] Add click handler for activity details
- [ ] Create modal dialog component
- [ ] Connect modal to activity data

### Phase 5: Filtering (Week 3)

- [ ] Create filter button component
- [ ] Implement "dim others" filter logic
- [ ] Add fade animation (200ms)
- [ ] Add debouncing (150ms)
- [ ] Update legend to show filter state

### Phase 6: Advanced Features (Week 3-4)

- [ ] Implement conflict detection logic
- [ ] Add red border + warning icon for conflicts
- [ ] Add empty state (show grid with light background)
- [ ] Add loading state (skeleton grid with pulse)
- [ ] Implement title truncation with ellipsis

### Phase 7: Legend & UI Polish (Week 4)

- [ ] Create legend component (horizontal, top position)
- [ ] Add color squares for each member
- [ ] Add shared activity indicator (▨)
- [ ] Make legend sticky

### Phase 8: Performance Optimization (Week 4)

- [ ] Add `track` functions to all `@for` loops
- [ ] Implement signal-based memoization for grid data
- [ ] Add OnPush change detection strategy
- [ ] Implement lazy rendering (viewport detection)
- [ ] Add debouncing to filter changes
- [ ] Performance testing and profiling

### Phase 9: Accessibility (Week 5)

- [ ] Add ARIA labels to grid cells
- [ ] Add keyboard navigation (arrow keys)
- [ ] Test screen reader compatibility
- [ ] Verify color contrast ratios
- [ ] Add focus indicators

### Phase 10: Testing & Refinement (Week 5-6)

- [ ] Unit tests for grid transformation logic
- [ ] Component tests for all interactions
- [ ] E2E tests for full user flows
- [ ] Test with real family data
- [ ] Performance benchmarking
- [ ] Gather family feedback
- [ ] Iterate based on feedback

---

## 🚀 Technical Implementation Notes

### Angular Signals Usage

```typescript
// Component signals
readonly rawScheduleData = signal<TimeBlock[]>([]);
readonly selectedFilter = signal<string>('all');
readonly gridCells = computed(() => {
  // Memoized transformation
  return this.transformToGrid(
    this.rawScheduleData(),
    this.selectedFilter()
  );
});

// Filtering with signals
readonly visibleCells = computed(() => {
  const filter = this.selectedFilter();
  if (filter === 'all') return this.gridCells();

  return this.gridCells().map(cell => ({
    ...cell,
    activities: cell.activities.map(activity => ({
      ...activity,
      isDimmed: activity.member !== filter
    }))
  }));
});
```

### Track Functions

```typescript
// Grid cells
trackByCell(index: number, cell: GridCell): string {
  return `${cell.day}-${cell.timeSlot}`;
}

// Activities within cell
trackByActivity(index: number, activity: ActivityInCell): string {
  return activity.id;
}
```

### Lazy Rendering Strategy

```typescript
// Implement intersection observer
@ViewChild('gridContainer') gridContainer!: ElementRef;

ngAfterViewInit() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.renderCell(entry.target);
        }
      });
    },
    { root: this.gridContainer.nativeElement, threshold: 0.1 }
  );

  // Observe all cell elements
  this.cellElements.forEach(el => observer.observe(el));
}
```

---

## 🎯 Success Metrics

### User Experience

- ✅ See full week at a glance without scrolling
- ✅ Quickly identify free time slots
- ✅ Compare same time across different days
- ✅ Understand who is doing what and when
- ✅ Spot scheduling conflicts immediately

### Technical Performance

- Initial load: < 100ms
- Filter response: < 50ms
- Smooth animations: 60fps
- Memory usage: < 50MB
- No layout shifts (CLS = 0)

### Accessibility

- WCAG 2.1 Level AA compliant
- Keyboard navigable
- Screen reader friendly
- Color contrast ratio > 4.5:1

---

## 🔮 Future Enhancements (Deferred)

### Short-term (Next Quarter)

- [ ] Week navigation (prev/next)
- [ ] Hover tooltip for additional info
- [ ] Print-friendly stylesheet
- [ ] Export to iCal/Google Calendar

### Medium-term (6 months)

- [ ] Drag-and-drop to reschedule
- [ ] Click empty slot to add activity
- [ ] Month view option
- [ ] Mobile/tablet responsive views
- [ ] User-configurable color preferences

### Long-term (1 year)

- [ ] Multi-family view (grandparents, etc.)
- [ ] Activity templates library
- [ ] AI-powered schedule suggestions
- [ ] Integration with external calendars
- [ ] Conflict resolution wizard

---

## 📝 Notes & Clarifications

### Decision Rationale

1. **Why "Dim Others" instead of "Hide Others"?**

   - Maintains context for better family coordination
   - Easier to see how one person's schedule affects others
   - Less jarring visual change
   - Still highlights the focused member clearly

2. **Why Repeat Multi-Hour Activities?**

   - Simpler implementation than cell merging
   - Clear visual continuity
   - Easier to handle overlapping activities
   - Better for scrolling (always visible)

3. **Why Emoji Instead of Icon Library?**

   - Zero dependencies
   - Universal across all platforms
   - Fun and family-friendly
   - No loading time
   - Reduces bundle size

4. **Why Proportional Height?**

   - Visual accuracy for short activities
   - Better space utilization
   - Clear distinction between durations
   - Maintains minimum readable size (24px)

5. **Why AI-Proposed Colors?**
   - Faster initial implementation
   - Ensures good color harmony
   - Defers complexity to future iteration
   - Can be customized per family later

---

## 🎬 Wireframe Reference

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Week View - Jan 13-19, 2026                                    [< Today >] │
├────────────────────────────────────────────────────────────────────────────┤
│  Filters: [All] [tata] [mama] [hania] [małgosia] [monika] [👨‍👩‍👧‍👦 Shared] │
├────────────────────────────────────────────────────────────────────────────┤
│  Legend: ■ tata  ■ mama  ■ hania  ■ małgosia  ■ monika  ▨ Shared          │
├───────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬───────┤
│ Time  │   Mon   │   Tue   │★ Wed ★  │   Thu   │   Fri   │   Sat   │  Sun  │
│       │   13    │   14    │★  15 ★  │   16    │   17    │   18    │  19   │
├───────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼───────┤
│ 06:00 │         │         │░░░░░░░░░│         │         │         │       │
├───────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼───────┤
│ 07:00 │ 💼 T    │ 💼 T    │░💼 T   ░│ 💼 T    │ 💼 T    │ ⚽ H+M  │ 🍽️▨▨▨ │
│       │ 🏃 M    │ 🏃 M    │░🏃 M   ░│ 🏃 M    │ 🏃 M    │         │       │
├───────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼───────┤
│ 08:00 │ 💼 T    │ 💼 T    │░💼 T   ░│ 💼 T    │ 💼 T    │         │ 🍽️▨▨▨ │
│       │ 📚 H    │ 📚 H+M  │░📚 H+M ░│ 📚 H+M  │ 📚 H    │         │       │
├───────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼───────┤
│  ...  │   ...   │   ...   │░  ...  ░│   ...   │   ...   │   ...   │  ...  │
├───────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼───────┤
│ 18:00 │ 🍽️▨▨▨▨ │ 🍽️▨▨▨▨ │░🍽️▨▨▨▨░│ 🍽️▨▨▨▨ │ 🍽️▨▨▨▨ │ 🍽️▨▨▨▨ │🍽️▨▨▨▨│
└───────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴───────┘

Legend:
- ░ = Today highlight (Wed)
- T/M/H = Member initials
- 💼🏃📚🍽️ = Activity type emojis
- ▨▨ = Shared activity diagonal stripes pattern
```

---

## 🤝 Sign-off

**Design Approved**: ✅  
**Technical Feasibility**: ✅  
**Ready for Implementation**: ✅

**Estimated Timeline**: 4-6 weeks for full implementation  
**Next Step**: Phase 1 - Core Structure

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-14  
**Created by**: Family Planning Team  
**Reviewed by**: AI Design Partner
