# Week View Grid Layout - Design Plan

## Current State Analysis

### Existing Implementation

- **Layout**: Vertical list grouped by day, then by family member
- **Display**: Each day is a section with member subsections containing time blocks
- **Filtering**: Buttons to filter by "All", "Shared", or individual family members
- **Styling**: Color-coded left borders by block type (WORK, ACTIVITY, MEAL, OTHER)
- **Data**: TimeBlocks with start/end times, member assignment, shared flag, block type

### Pain Points

- ❌ Vertical scrolling required to see the full week
- ❌ Difficult to compare same time slots across different days
- ❌ Inefficient use of screen space
- ❌ No visual overview of the week at a glance

## Proposed Grid Layout

### Concept

Transform to a calendar grid where:

- **Columns**: 7 weekdays (Monday - Sunday)
- **Rows**: Time slots throughout the day
- **Cells**: Display activities for all family members in each time slot
- **Legend**: Show family members with their assigned colors/patterns

---

## Design Questions

### 1. Time Slot Granularity

**Question**: What time increment should each row represent?

**Options**:

- A) 15-minute slots (more granular, more rows)
- B) 30-minute slots (balanced)
- C) 1-hour slots (simpler, less rows)
- D) Variable/smart sizing based on actual activities

**Considerations**:

- Smaller increments = more precise but requires more scrolling
- Larger increments = less precise but better overview
- Variable sizing = complex but optimal space usage

**Your preference**: C) 1-hour slots

---

### 2. Display Hours Range

**Question**: What time range should be displayed by default?

**Options**:

- A) 6:00 AM - 10:00 PM (16 hours)
- B) 7:00 AM - 11:00 PM (16 hours)
- C) Full 24 hours
- D) Dynamic based on earliest/latest activity in the week
- E) Configurable by user

**Considerations**:

- Most family activities happen during waking hours
- Kids might have early/late activities
- Work blocks might start early or end late

**Your preference**: D) Dynamic based on earliest/latest activity in the week

---

### 3. Family Member Visual Distinction

**Question**: How should we distinguish different family members in the grid?

**Options**:

- A) **Background colors** (e.g., tata=blue, mama=pink, hania=yellow, etc.)
- B) **Border colors** with white/light background
- C) **Patterns** (stripes, dots, diagonal lines)
- D) **Shapes** (rounded corners, sharp edges, circles)
- E) **Initials/Avatars** with color coding
- F) **Combination** of color + initials

**Visual Examples Needed**:

```
tata:     [████████] Solid blue
mama:     [████████] Solid pink
hania:    [████████] Solid yellow
małgosia: [████████] Solid green
monika:   [████████] Solid purple
```

or

```
tata:     [T] Blue with initial
mama:     [M] Pink with initial
```

**Your preference**: F) **Combination** of color + initials

---

### 4. Shared/Family Activities Display

**Question**: How should shared activities (👨‍👩‍👧‍👦 family time) be displayed?

**Options**:

- A) Span across all member columns (merged cell)
- B) Show in a separate "Shared" column
- C) Display with a special pattern/color in each member's section
- D) Use a distinct visual marker (diagonal stripes, special border)

**Example**:

```
           Mon         Tue         Wed
10:00   |--------FAMILY MEAL--------|  (spans all)
        |  tata | mama | kids      |
```

**Your preference**: D) Use a distinct visual marker (diagonal stripes, special border)

---

### 5. Activity Details Display

**Question**: What information should be visible in each grid cell?

**Minimum Info**:

- Activity title
- Time range

**Additional Info** (choose):

- [ ] Block type (WORK, ACTIVITY, MEAL, OTHER)
- [ ] Goal/Fixed badges
- [ ] Duration
- [ ] Description/notes
- [ ] Icons for activity type

**Display Strategy**:

- A) Show all info in cell (might be cramped)
- B) Show minimal info + expand on hover (tooltip)
- C) Show minimal info + click to open modal/sidebar
- D) Adjust detail level based on cell size

**Your preference**: Icons for activity type & B Strategy

---

### 6. Activity Type Color Coding

**Question**: Should we keep the current block type colors alongside member colors?

**Current Colors**:

- WORK: Purple/Blue (#667eea)
- ACTIVITY: Green (#48bb78)
- MEAL: Orange (#f6ad55)
- OTHER: Gray (#cbd5e0)

**Options**:

- A) Use member colors ONLY (remove block type colors)
- B) Use block type colors ONLY (remove member distinction)
- C) Combine both (member color background + block type border/icon)
- D) Use member colors + icon/text label for block type

**Your preference**: D

---

### 7. Legend Design

**Question**: Where and how should the family member legend be displayed?

**Position Options**:

- A) Top of the grid (horizontal)
- B) Left side of the grid (vertical)
- C) Floating/sticky at the bottom
- D) Inside the filter controls area

**Content**:

```
Example 1 (Horizontal):
[tata] [mama] [hania] [małgosia] [monika] [👨‍👩‍👧‍👦 Shared]

Example 2 (With squares):
■ tata  ■ mama  ■ hania  ■ małgosia  ■ monika  ▨ Shared

Example 3 (Detailed):
tata (Dad) - 15 activities
mama (Mom) - 12 activities
```

**Your preference**: A & example 2

---

### 8. Grid Cell Structure

**Question**: When multiple members have activities at the same time, how should the cell be divided?

**Scenario**: Monday 9:00 AM - tata has "Work", mama has "Training", hania has "School"

**Options**:

- A) Stack vertically within cell (3 mini-blocks)
- B) Split cell into columns (3 side-by-side sections)
- C) Show only filtered member (based on current filter)
- D) Show most important + count indicator ("tata: Work +2 more")

**Visual Examples**:

```
Option A (Vertical Stack):
+---------------+
| tata: Work    |
| mama: Train   |
| hania: School |
+---------------+

Option B (Horizontal Split):
+---------------+
|T: Wrk|M: Trn|H: Sch|
+---------------+

Option D (Collapse):
+---------------+
| tata: Work    |
| +2 more...    |
+---------------+
```

**Your preference**: A stack

---

### 9. Empty Time Slots

**Question**: How should empty time slots be displayed?

**Options**:

- A) Show all time slots (including empty) with light background
- B) Collapse empty slots, show only occupied times
- C) Show empty slots but make them very compact
- D) Gray out empty slots

**Benefit of showing empty slots**: Easy to see free time for scheduling

**Your preference**: A

---

### 10. Filtering Behavior

**Question**: How should filtering work in the grid view?

**Current**: Buttons for "All", "Shared", and each family member

**Options**:

- A) **Dim others**: Keep all visible but highlight/brighten selected member
- B) **Hide others**: Only show selected member's activities
- C) **Column focus**: Expand selected member's column, shrink others
- D) **Toggle multiple**: Allow selecting multiple members (checkboxes)

**Your preference**: A

---

### 11. Responsive Design

**Question**: How should the grid adapt to smaller screens?

**Mobile Challenges**: 7 columns + time column = 8 columns (too narrow)

**Options**:

- A) Horizontal scroll (keep grid structure)
- B) Show one day at a time with swipe navigation
- C) Switch to current vertical list view on mobile
- D) Show simplified version (fewer columns, member names as labels)

**Tablet**: Show full grid or reduced?

**Your preference**: Only Desktop now

---

### 12. Interaction Features

**Question**: What interactions should be supported?

**Potential Features**:

- [x] Click activity to view details
- [ ] Hover to see tooltip with full info
- [ ] Drag-and-drop to reschedule (future)
- [ ] Click empty slot to add new activity (future)
- [ ] Export to calendar (iCal, Google Calendar)
- [ ] Print-friendly view

**Your preference**: add it to NICE-TO-HAVE-IN-FUTURE list

---

## 📋 Round 1 - Summary of Decisions

| #   | Aspect                  | Decision            | Key Details                                               |
| --- | ----------------------- | ------------------- | --------------------------------------------------------- |
| 1   | **Time Slots**          | 1-hour slots        | Simpler overview, less scrolling                          |
| 2   | **Hours Range**         | Dynamic             | Based on earliest/latest activity in week                 |
| 3   | **Member Distinction**  | Color + Initials    | Combination approach for clarity                          |
| 4   | **Shared Activities**   | Visual Marker       | Diagonal stripes or special border                        |
| 5   | **Activity Details**    | Icons + Hover       | Minimal info in cell, tooltip on hover                    |
| 6   | **Activity Type**       | Member color + Icon | Keep member colors primary, add type icons                |
| 7   | **Legend**              | Top Horizontal      | `■ tata  ■ mama  ■ hania  ■ małgosia  ■ monika  ▨ Shared` |
| 8   | **Multiple Activities** | Vertical Stack      | Stack all members' activities in cell                     |
| 9   | **Empty Slots**         | Show All            | Light background for easy free-time visibility            |
| 10  | **Filtering**           | Hide Others         | Only show selected member(s)                              |
| 11  | **Responsive**          | Desktop Only        | Mobile/tablet support deferred                            |
| 12  | **Interactions**        | Click for Details   | Hover and other features = future                         |

### Design Direction

✅ **Calendar-style grid layout** with 7-day columns and hourly rows  
✅ **Member-centric coloring** with activity type icons  
✅ **Clean, minimal cells** with tooltip expansion  
✅ **Desktop-first** implementation

---

## 🔍 Round 2 - Implementation Details

### 13. Exact Color Palette

**Question**: What are the exact colors for each family member?

**Need to Define**:

```typescript
interface MemberColors {
  tata: string; // e.g., '#3B82F6' (blue)
  mama: string; // e.g., '#EC4899' (pink)
  hania: string; // e.g., '#F59E0B' (amber)
  małgosia: string; // e.g., '#10B981' (emerald)
  monika: string; // e.g., '#8B5CF6' (purple)
  shared: string; // e.g., '#6B7280' (gray)
}
```

**Considerations**:

- Should work well together when stacked
- Good contrast with white text for readability
- Match any existing brand colors?

**Your preference**: Should work well together when stacked - let's hardcode it with AI-proposal in future this should be set in family preferences (auto-assigned when family member adding)

---

### 14. Activity Spanning Multiple Hours

**Question**: How should activities longer than 1 hour be displayed?

**Scenario**: "Work" from 9:00 AM - 5:00 PM (8 hours)

**Options**:

- A) **Repeat in each hour slot** (shows "Work" 8 times)
- B) **Merge cells vertically** (single tall cell spanning 8 rows)
- C) **Show only at start time** with duration indicator ("Work (8h)")
- D) **Show at start and end** with visual connection (line/border)

**Visual Examples**:

```
Option B (Merged):        Option C (Start only):
09:00 |  Work        |    09:00 | Work (8h)    |
10:00 |     ↓        |    10:00 | [empty]      |
11:00 |     ↓        |    11:00 | [empty]      |
12:00 |     ↓        |    12:00 | [empty]      |
```

**Considerations**:

- Visual clarity vs. implementation complexity
- How it interacts with other activities in the same time
- Scrolling behavior

**Your preference**: A

---

### 15. Activity Type Icons

**Question**: Which icon set and specific icons for each activity type?

**Options**:

- A) **Material Icons** (Google)
- B) **Font Awesome** (already used in project?)
- C) **Lucide Icons** (modern, lightweight)
- D) **Custom SVG icons**
- E) **Emoji** (simple, no dependencies)

**Icon Mapping**:

```
WORK:     ? (💼 briefcase, 🖥️ laptop, ⚙️ work symbol)
ACTIVITY: ? (🏃 running, 🎯 target, ⚽ sports)
MEAL:     ? (🍽️ dinner, 🍔 food, ☕ meal)
OTHER:    ? (📌 pin, ⭐ star, 📋 list)
SHARED:   ? (👨‍👩‍👧‍👦 family, 👥 people, 🤝 handshake)
```

**Your preference**: Emoji

---

### 16. Shared Activity Visual Pattern

**Question**: What exactly should the "diagonal stripes" or special marker look like?

**Options**:

- A) **Diagonal stripes background** (repeating pattern)
  ```css
  background: repeating-linear-gradient(45deg, color1, color1 10px, color2 10px, color2 20px);
  ```
- B) **Thick colored border** (e.g., 4px dashed or dotted)
- C) **Special icon/badge** in corner (👨‍👩‍👧‍👦 or ⭐)
- D) **Gradient background** (different from solid colors)
- E) **Border pattern** (striped border instead of background)

**Your preference**: A

---

### 17. Tooltip Content & Styling

**Question**: What information should appear in the hover tooltip?

**Suggested Content**:

```
┌─────────────────────────────┐
│ 🍽️ Family Dinner           │
│                             │
│ ⏰ 18:00 - 19:00 (1h)       │
│ 👤 tata, mama, hania        │
│ 📝 Pizza night!             │
│ 🏷️ MEAL • Fixed             │
│                             │
│ 💡 Click for details        │
└─────────────────────────────┘
```

**What to Include**:

- [ ] Activity title
- [ ] Full time range + duration
- [ ] List of participants
- [ ] Description/notes
- [ ] Block type badge
- [ ] Goal vs Fixed indicator
- [ ] Click hint

**Your preference**: make assumption

---

### 18. Grid Cell Dimensions

**Question**: What are the specific height and width for grid cells?

**Time Column Width**: **\_\_** px (to fit "09:00 AM" or "9:00")

**Day Column Width**:

- A) Fixed width (e.g., 180px)
- B) Fluid (divide remaining space by 7)
- C) Minimum width with overflow scroll

**Cell Height**: **\_\_** px per hour slot

**Considerations**:

- Typical screen widths: 1920px, 1440px, 1366px
- Need room for stacked activities (3-4 per cell?)
- Padding/margins

**Your preference**: B) Fluid

---

### 19. Activity Title Overflow

**Question**: How should long activity titles be handled in grid cells?

**Scenario**: "Weekly Team Standup Meeting with Department" (too long)

**Options**:

- A) **Truncate with ellipsis** ("Weekly Team Stand...")
- B) **Wrap to multiple lines** (makes cell taller)
- C) **Abbreviate intelligently** ("Weekly Team Standup...")
- D) **Show full title only on hover** (truncate in cell)
- E) **Shrink font size** to fit (minimum size limit)

**Your preference**: A + D

---

### 20. Time Format Display

**Question**: Should time be displayed in 12-hour or 24-hour format?

**Options**:

- A) **12-hour** (9:00 AM, 2:00 PM)
- B) **24-hour** (09:00, 14:00)
- C) **User preference** (add setting)
- D) **Locale-based** (use browser locale)

**Time Row Labels**:

```
Option A:           Option B:
9:00 AM             09:00
10:00 AM            10:00
11:00 AM            11:00
12:00 PM            12:00
1:00 PM             13:00
```

**Your preference**: B

---

### 21. Week Start Day

**Question**: Should the week start on Monday or Sunday?

**Current Data**: Uses Monday-Sunday order

**Options**:

- A) **Monday** (ISO standard, European)
- B) **Sunday** (US standard)
- C) **User preference** (configurable)

**Grid Headers**:

```
Option A: Mon | Tue | Wed | Thu | Fri | Sat | Sun
Option B: Sun | Mon | Tue | Wed | Thu | Fri | Sat
```

**Your preference**: A

---

### 22. Current Week Indication

**Question**: How should "today" and the current time be highlighted?

**Visual Markers**:

- [x] Highlight current day column with different background
- [ ] Bold/underline current day header
- [ ] Show "current time" line across the grid (red horizontal line)
- [ ] Highlight current hour row
- [ ] Add "TODAY" badge to current day header

**Example**:

```
Mon      Tue      [TODAY]      Thu      Fri
                   Wed
```

**Your preference**: Highlight current day column with different background

---

### 23. Loading & Empty States

**Question**: What should be displayed when there's no data or data is loading?

**Loading State**:

- A) Full skeleton grid with pulsing cells
- B) Spinner in center with message
- C) Progressive loading (show grid as data arrives)

**Empty State** (no activities this week):

- A) Show empty grid with helper message ("No activities scheduled")
- B) Show illustration + CTA ("Plan your week")
- C) Hide grid, show message only
- D) Show empty grid

**Your preference**: 1A, 2D

---

### 24. Filtering Animation

**Question**: Should there be a transition when filtering members?

**When hiding/showing activities**:

- A) **Instant** (no animation)
- B) **Fade out/in** (opacity transition)
- C) **Slide out/in** (height transition)
- D) **Combination** (fade + slight slide)

**Duration**: **\_\_** ms (e.g., 200ms, 300ms)

**Your preference**: B

---

### 25. Grid Scrolling Behavior

**Question**: How should scrolling work if there are many hours?

**Scenario**: Week has activities from 6 AM to 11 PM (17 hours)

**Options**:

- A) **Scroll entire page** (grid scrolls with page)
- B) **Fixed headers** (day headers and time column sticky)
- C) **Virtual scrolling** (render only visible rows)
- D) **Scroll to first activity** on page load

**Sticky Elements**:

- [x] Day headers (Mon, Tue, etc.)
- [x] Time column (hour labels)
- [x] Legend
- [x] Filter buttons

**Your preference**: above

---

### 26. Click Activity Details Display

**Question**: When clicking an activity, how should details be shown?

**Options**:

- A) **Modal dialog** (centered overlay, dark backdrop)
- B) **Slide-out panel** from right side
- C) **Popover** near the clicked cell
- D) **Inline expansion** (cell expands to show details)
- E) **Navigate to detail page** (route change)

**Content in Detail View**:

- Full activity information
- Edit button (if allowed)
- Delete button (if allowed)
- Close/back button

**Your preference**: A

---

### 27. Minimum Activity Duration Display

**Question**: Should very short activities (< 30 min) be displayed differently?

**Scenario**: "Coffee break" 10:00 - 10:15 (15 minutes)

**In a 1-hour grid slot**:

- A) **Full height** (same as 1-hour activities)
- B) **Proportional height** (1/4 of cell height)
- C) **Minimum height** (e.g., 24px, always readable)
- D) **Special indicator** (dot or small badge)

**Your preference**: B

---

### 28. Conflict Detection Visual

**Question**: Should overlapping activities be visually indicated?

**Scenario**: tata has "Meeting" 9:00-10:00 AND "Gym" 9:30-10:30 (conflict)

**Visual Indicators**:

- A) **Red border** around conflicting activities
- B) **Warning icon** (⚠️) in cell
- C) **Different background pattern** (warning color)
- D) **Don't show** (conflicts allowed, no visual indicator)
- E) **Slight overlap visual** (second activity slightly offset/behind)

**Your preference**: A B

---

### 29. Family Member Order

**Question**: What should be the order of family members in stacked cells?

**When multiple members have activities at same time**:

- A) **Alphabetical** (hania, małgosia, mama, monika, tata)
- B) **By role** (parents first: tata, mama, then kids by age)
- C) **By age** (oldest to youngest)
- D) **Custom order** (user-defined preference)
- E) **Dynamic** (most active member first)

**Example in 9:00 AM cell**:

```
Option B (Role/Age):
+------------------+
| tata: Work       |
| mama: Yoga       |
| hania: School    |
| małgosia: School |
+------------------+
```

**Your preference**: B

---

### 30. Performance Optimization

**Question**: Given potential 224+ cells, what optimization strategies should be implemented?

**Options to Consider**:

- [x] Angular `track` functions for `@for` loops
- [x] Memoization of computed cell data with signals
- [ ] Virtual scrolling for time rows
- [x] Lazy rendering (render only visible area)
- [x] Debounced filtering
- [x] OnPush change detection strategy
- [ ] Web Workers for data transformation

**Most Important** (pick top 3):

1. ***
2. ***
3. ***

**Your preference**: as above

---

## Technical Considerations

### Implementation Approach

**Option 1: CSS Grid**

```typescript
.week-grid {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr); // time + 7 days
  grid-template-rows: repeat(32, 40px); // e.g., 30-min slots
}
```

**Option 2: Table-based**

- Classic approach
- Good semantic HTML
- Easy to make responsive

**Option 3: Canvas/SVG**

- Highly customizable
- Better for complex layouts
- More complex to implement

**Recommendation**: CSS Grid for flexibility and maintainability

### Data Structure Changes

**Current**: TimeBlocks grouped by day → member
**Needed**: Grid of [timeSlot][day] → members[]

```typescript
interface GridCell {
  timeSlot: string; // e.g., "09:00"
  day: string; // e.g., "2026-01-13"
  activities: {
    member: FamilyMember;
    block: TimeBlock;
  }[];
}
```

### Performance Considerations

- **7 days × 32 slots = 224 cells** to render
- Use Angular `@for` with `track` for performance
- Consider virtual scrolling for time axis
- Memoize computed values with signals

---

## Next Steps

1. **Answer all questions above**
2. **Review and approve the approach**
3. **Create mockup/wireframe** (optional but recommended)
4. **Update component implementation**:
   - Create grid layout structure
   - Implement legend component
   - Add color/pattern system for members
   - Handle shared activities
   - Update filtering logic
   - Add responsive breakpoints
5. **Test with real data**
6. **Gather family feedback**
7. **Iterate based on usage**

---

## Additional Notes

### Accessibility

- Ensure proper ARIA labels for grid navigation
- Keyboard navigation support
- Screen reader friendly
- Color contrast for text on colored backgrounds

### Future Enhancements

- Week navigation (previous/next week)
- Month view option
- Conflict highlighting
- Activity duration visualization (vertical height)
- Print stylesheet

---

## Decision Log

| Date       | Question #        | Decision     | Rationale                                      |
| ---------- | ----------------- | ------------ | ---------------------------------------------- |
| 2026-01-14 | Round 1 (Q1-Q12)  | All answered | Initial design direction established           |
| 2026-01-14 | Round 2 (Q13-Q30) | All answered | Implementation details finalized               |
| 2026-01-14 | Review Summary    | Created      | See `.ai/week-view-plan-review.md` for details |

---

## Implementation Checklist

**📋 Full implementation plan available in:** `.ai/week-view-plan-review.md`

High-level checklist:

- [ ] Define color constants for all family members
- [ ] Select and configure icon library
- [ ] Create grid cell component with proper dimensions
- [ ] Implement activity stacking logic
- [ ] Build tooltip component with full activity details
- [ ] Add shared activity visual markers
- [ ] Create legend component
- [ ] Implement filtering with animations
- [ ] Add click handler for activity details
- [ ] Optimize with Angular signals and track functions
- [ ] Handle edge cases (multi-hour activities, overlaps)
- [ ] Add accessibility features (ARIA, keyboard nav)
- [ ] Test with real family data

---

**Status**: ✅ All Decisions Complete → Ready for Implementation
**Last Updated**: 2026-01-14
**Review Document**: `.ai/week-view-plan-review.md`
**Owner**: Family Planning Team
