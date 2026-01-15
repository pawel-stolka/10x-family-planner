# Feature Week View

Week Grid Calendar feature for Family Planner application.

## Overview

This library provides a comprehensive weekly calendar view that displays family members' activities, commitments, and meals in a grid format. It supports:

- 🗓️ **Week Navigation** - Browse previous/next weeks or jump to today
- 👨‍👩‍👧‍👦 **Member Filtering** - Filter activities by family member or show shared activities
- ⚠️ **Conflict Detection** - Automatically detects scheduling conflicts
- 🎨 **Color Coding** - Each family member has a unique color
- 📱 **Responsive Design** - Optimized for desktop (mobile coming soon)
- ⚡ **Performance** - Uses Angular signals and lazy rendering for optimal performance

## Features

### Components

#### WeekViewContainerComponent
Main container component that manages state and orchestrates all child components.

**Features:**
- Week navigation (previous/next/today)
- Loading and error states
- Empty state with CTA
- Modal management
- Filter management with debouncing

#### WeekGridComponent
Main grid component using CSS Grid layout.

**Features:**
- 8-column layout (time + 7 days)
- Sticky headers and time column
- Lazy rendering with `@defer`
- Dynamic time slots based on activity data

#### GridCellComponent
Individual cell in the grid that can contain multiple activities.

**Features:**
- Stacks multiple activities vertically
- Overflow handling with custom scrollbar
- Today highlight
- Empty state styling

#### ActivityCellComponent
Displays a single activity with all details.

**Features:**
- Color-coded by family member
- Proportional height based on duration
- Conflict indicators
- Hover tooltips
- Dim effect for filtering
- Shared activity pattern (diagonal stripes)

#### MemberFilterComponent
Filter buttons for family members.

**Features:**
- "All", individual members, and "Shared" options
- Debounced filter changes (150ms)
- Active state styling
- Keyboard accessible

#### MemberLegendComponent
Color legend showing family members.

**Features:**
- Color squares for each member
- Shared activity indicator
- Responsive flex layout

#### ActivityDetailModalComponent
Full-screen modal with activity details.

**Features:**
- Complete activity information
- Conflict warnings
- Fade and slide animations
- Keyboard support (Escape to close)
- Click outside to close

#### ActivityTooltipComponent
Hover tooltip with activity summary.

**Features:**
- Dark theme
- Fade-in animation (100ms)
- Positioned to avoid overflow
- Shows time, participants, description, type

### Services

#### GridTransformService
Transforms raw `TimeBlock[]` data into grid structure.

**Methods:**
- `transformToGrid()` - Main transformation logic
- `calculateTimeRange()` - Dynamic time slot calculation
- `validateTimeBlock()` - Input validation

#### ConflictDetectionService
Detects scheduling conflicts.

**Methods:**
- `detectConflicts()` - Marks conflicts in grid
- `getConflictsSummary()` - Returns conflict statistics

#### WeekScheduleService
API communication for schedule data.

**Methods:**
- `getWeekSchedule(weekStartDate)` - Fetches week data
- `getFamilyMembers()` - Fetches family members

### Models

See `week-grid.models.ts` for complete type definitions:

- `GridCell` - Single cell in grid
- `ActivityInCell` - Activity with view-specific data
- `DayInfo` - Day metadata
- `WeekGridViewModel` - Complete grid view model
- `FamilyMemberViewModel` - Member view model
- `TimeBlockViewModel` - Activity view model

### Utilities

#### Date Utils (`date.utils.ts`)
- `getMonday()` - Get Monday of week
- `addDays()` - Add days to date
- `isToday()` - Check if date is today
- `formatISODate()` - Format date to ISO string
- `eachDayOfWeek()` - Generate 7-day array

#### Time Utils (`time.utils.ts`)
- `parseTime()` - Convert HH:mm to minutes
- `formatTime()` - Convert minutes to HH:mm
- `calculateDuration()` - Human-readable duration
- `isValidTimeFormat()` - Validate time string
- `generateTimeSlots()` - Generate hour slots
- `calculateProportionalHeight()` - Calculate activity height in cell
- `overlapsWithSlot()` - Check time overlap

## Usage

### Basic Setup

```typescript
// In app.routes.ts
{
  path: 'schedule/week',
  loadChildren: () =>
    import('@family-planner/frontend/feature-week-view').then(
      (m) => m.weekViewRoutes
    ),
  canActivate: [authGuard],
}
```

### Standalone Usage

```typescript
import { WeekViewContainerComponent } from '@family-planner/frontend/feature-week-view';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [WeekViewContainerComponent],
  template: `<app-week-view-container />`,
})
export class MyComponent {}
```

### Custom Configuration

The library uses services that can be provided at component level:

```typescript
import { 
  WeekViewContainerComponent,
  WeekScheduleService 
} from '@family-planner/frontend/feature-week-view';

@Component({
  // ...
  providers: [
    {
      provide: WeekScheduleService,
      useClass: MyCustomScheduleService
    }
  ]
})
```

## API Integration

The view expects the following API endpoints:

### GET /api/v1/weekly-schedules

**Query Parameters:**
- `weekStartDate` (string, ISO date) - Monday of the week

**Response:**
```typescript
{
  weekStart: string;
  weekEnd: string;
  timeBlocks: TimeBlock[];
  members: FamilyMember[];
}
```

### GET /api/v1/family-members

**Response:**
```typescript
FamilyMember[]
```

## Customization

### Member Colors

Customize member colors in `week-grid.constants.ts`:

```typescript
export const MEMBER_COLORS: Record<string, string> = {
  tata: '#3b82f6',
  mama: '#ec4899',
  // Add more...
};
```

### Activity Icons

Customize activity type icons:

```typescript
export const ACTIVITY_ICONS: Record<BlockType, string> = {
  [BlockType.WORK]: '💼',
  [BlockType.ACTIVITY]: '⚽',
  [BlockType.MEAL]: '🍽️',
  [BlockType.OTHER]: '📌',
};
```

### Grid Dimensions

Adjust grid dimensions:

```typescript
export const CELL_HEIGHT = 80; // px
export const MIN_ACTIVITY_HEIGHT = 24; // px
export const TIME_COLUMN_WIDTH = 80; // px
```

## Performance

The library is optimized for performance:

- ✅ **OnPush Change Detection** - All components use OnPush
- ✅ **Signals** - Reactive state with Angular signals
- ✅ **Computed Signals** - Automatic memoization
- ✅ **Lazy Rendering** - Grid cells use `@defer (on viewport)`
- ✅ **Track Functions** - All `@for` loops have track functions
- ✅ **Debouncing** - Filter changes are debounced (150ms)

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Edge (latest 2 versions)
- Safari (latest 2 versions)

**Note:** IE11 is not supported.

## Dependencies

All dependencies are provided by the main application:

- `@angular/core` >= 18.0.0
- `@angular/common` >= 18.0.0
- `@angular/router` >= 18.0.0
- `@angular/animations` >= 18.0.0

## Testing

```bash
# Unit tests
nx test frontend-feature-week-view

# E2E tests
nx e2e frontend-e2e --grep="week view"
```

## Future Enhancements

- [ ] Drag & drop rescheduling
- [ ] Week picker calendar
- [ ] Export to PDF/iCal
- [ ] Mobile responsive version
- [ ] Customizable member colors (UI)
- [ ] Multiple weeks view (Month view)
- [ ] Recurring activities visualization
- [ ] Activity templates

## License

Private - Family Planner Application
