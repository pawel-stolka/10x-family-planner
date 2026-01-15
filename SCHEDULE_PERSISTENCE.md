# Schedule Persistence - How It Works

This document explains how generated schedules are saved and retrieved from the database.

## Overview

When you generate a weekly schedule using AI:
1. ✅ **Schedule is saved to database** automatically
2. ✅ **Can be retrieved later** without regenerating
3. ✅ **One schedule per user per week** (unique constraint)
4. ✅ **Includes all time blocks** with relations to goals and family members

## Database Tables

### `weekly_schedules`
- `schedule_id` (UUID, primary key)
- `user_id` (UUID, references auth.users)
- `week_start_date` (date, Monday of the week)
- `is_ai_generated` (boolean)
- `metadata` (JSONB, generation params)
- Unique constraint: `(user_id, week_start_date)`

### `time_blocks`
- `block_id` (UUID, primary key)
- `schedule_id` (UUID, references weekly_schedules)
- `title` (text)
- `block_type` (enum: WORK, ACTIVITY, MEAL, OTHER)
- `time_range` (TSTZRANGE, PostgreSQL range type)
- `family_member_id` (UUID, optional)
- `recurring_goal_id` (UUID, optional)
- `is_shared` (boolean)
- `metadata` (JSONB)

## How It Works

### 1. Schedule Generation Flow

```typescript
POST /api/v1/schedule-generator
Authorization: Bearer <jwt_token>
Body: {
  weekStartDate: "2026-01-13",  // Monday
  strategy: "balanced",
  preferences: {}
}
```

**Backend Process:**
1. Validate week start date (must be Monday)
2. Load family members and goals
3. Call OpenAI API to generate schedule
4. **Check if schedule exists** for this week
5. **Delete old schedule** if exists (regenerate)
6. **Create new `weekly_schedules` record**
7. **Create all `time_blocks` records**
8. Return complete schedule with all blocks

**Result:** Schedule is now saved in database! 🎉

### 2. Retrieving Saved Schedule

#### Option A: Get by Schedule ID

```typescript
GET /api/v1/weekly-schedules/:scheduleId
Authorization: Bearer <jwt_token>
```

Returns complete schedule with all time blocks.

#### Option B: List Schedules (NEW!)

```typescript
GET /api/v1/weekly-schedules?weekStartDate=2026-01-13
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `weekStartDate` (optional): Filter by week start date
- `isAiGenerated` (optional): Filter AI vs manual schedules

Returns array of schedules matching filters.

### 3. Frontend Integration

#### WeekViewContainerComponent

```typescript
async loadWeekData() {
  // 1. Try to load existing schedule from database
  const response = await this.scheduleService.getWeekSchedule(weekStartISO);
  
  // 2. Check if schedule exists
  if (response.timeBlocks.length > 0) {
    // ✅ Schedule exists - display it
    this.rawScheduleData.set(response.timeBlocks);
    this.scheduleExists.set(true);
  } else {
    // ❌ No schedule - show empty state with "Generate" button
    this.scheduleExists.set(false);
  }
}
```

#### UI States

**When schedule EXISTS:**
```
┌─────────────────────────────────────┐
│  Week 13.01 - 19.01.2026            │
│  ◀ Previous | Today | Next ▶        │
├─────────────────────────────────────┤
│  Filter: All | Tata | Mama | ...    │
│  Legend: [Colors]                   │
├─────────────────────────────────────┤
│  ┌───────┬───────┬───────┬────┐    │
│  │ Mon   │ Tue   │ Wed   │... │    │
│  ├───────┼───────┼───────┼────┤    │
│  │ 09:00 │ Work  │ Work  │... │    │
│  │ 10:00 │ ...   │ ...   │... │    │
│  └───────┴───────┴───────┴────┘    │
└─────────────────────────────────────┘
```

**When schedule DOES NOT EXIST:**
```
┌─────────────────────────────────────┐
│  Week 13.01 - 19.01.2026            │
│  ◀ Previous | Today | Next ▶        │
├─────────────────────────────────────┤
│                                     │
│         📅                          │
│  Brak harmonogramu dla tego         │
│  tygodnia                           │
│                                     │
│  Wygeneruj nowy harmonogram za      │
│  pomocą AI lub dodaj aktywności     │
│  ręcznie.                           │
│                                     │
│  [ ✨ Generuj harmonogram ]         │
│                                     │
└─────────────────────────────────────┘
```

## API Endpoints Summary

### Schedule Generation
- **POST** `/api/v1/schedule-generator`
  - Generates and **saves** new schedule
  - Replaces existing schedule for same week
  - Returns: `{ scheduleId, weekStartDate, summary, timeBlocks[] }`

### Schedule Retrieval
- **GET** `/api/v1/weekly-schedules/:scheduleId`
  - Get specific schedule by ID
  - Returns: Complete schedule with all relations

- **GET** `/api/v1/weekly-schedules`
  - List all user's schedules
  - Query params: `weekStartDate`, `isAiGenerated`
  - Returns: Array of schedules

## Important Notes

### 1. Regeneration Behavior

When you generate a schedule for a week that already has one:
- ✅ Old schedule is **deleted**
- ✅ New schedule is created
- ⚠️ **Previous schedule is lost** (no versioning yet)

### 2. Data Persistence

- ✅ Schedules persist across sessions
- ✅ No need to regenerate every time
- ✅ Navigate between weeks - each loads from database

### 3. Security

- ✅ Row Level Security (RLS) enforced
- ✅ Users can only see their own schedules
- ✅ JWT authentication required
- ✅ `user_id` verified at both DB and app level

### 4. Soft Delete

- ✅ Records are soft-deleted (not removed)
- ✅ `deleted_at` timestamp for GDPR compliance
- ✅ Can be restored if needed

## Example Flow

### User Journey: Generate and View Schedule

1. **User navigates to Week View**
   ```
   Frontend: GET /api/v1/weekly-schedules?weekStartDate=2026-01-13
   Backend: Returns [] (no schedule exists)
   UI: Shows empty state with "Generate" button
   ```

2. **User clicks "Generate Schedule"**
   ```
   Frontend: POST /api/v1/schedule-generator
   Body: { weekStartDate: "2026-01-13", strategy: "balanced" }
   
   Backend:
   - Calls OpenAI API
   - Saves schedule to database
   - Returns complete schedule
   
   Frontend: Displays generated schedule
   ```

3. **User refreshes page or comes back later**
   ```
   Frontend: GET /api/v1/weekly-schedules?weekStartDate=2026-01-13
   Backend: Returns saved schedule from database
   UI: Shows saved schedule (no regeneration needed!)
   ```

4. **User navigates to next week**
   ```
   Frontend: GET /api/v1/weekly-schedules?weekStartDate=2026-01-20
   Backend: Returns [] (no schedule for next week)
   UI: Shows empty state
   ```

## Future Enhancements

### Phase 2 Features:
- [ ] **Manual editing** of time blocks
- [ ] **Schedule versioning** (keep history)
- [ ] **Export/import** schedules
- [ ] **Templates** (save favorite schedules)
- [ ] **Recurring schedules** (auto-generate weekly)
- [ ] **Conflict resolution** UI
- [ ] **Schedule sharing** between family members

### Performance Optimizations:
- [ ] **Caching** frequently accessed schedules
- [ ] **Pagination** for schedule lists
- [ ] **Lazy loading** of time block details
- [ ] **WebSocket** updates for real-time collaboration

## Troubleshooting

### Schedule not showing after generation

**Check:**
1. Backend logs - was schedule saved?
2. Database - check `weekly_schedules` table
3. Frontend - check network tab for API response
4. RLS - verify user_id matches

**Solution:**
```sql
-- Check if schedule exists
SELECT * FROM weekly_schedules 
WHERE user_id = '<your_user_id>' 
AND week_start_date = '2026-01-13'
AND deleted_at IS NULL;

-- Check time blocks
SELECT * FROM time_blocks 
WHERE schedule_id = '<schedule_id>'
AND deleted_at IS NULL;
```

### Multiple schedules for same week

**This shouldn't happen** due to unique constraint, but if it does:
```sql
-- Find duplicates
SELECT user_id, week_start_date, COUNT(*) 
FROM weekly_schedules 
WHERE deleted_at IS NULL
GROUP BY user_id, week_start_date 
HAVING COUNT(*) > 1;
```

### Schedule loads slowly

**Check:**
- Database indexes on `user_id`, `week_start_date`
- Number of time blocks (should be < 100 per week)
- Network latency

**Optimize:**
```typescript
// Use projection to load only needed fields
relations: ['timeBlocks'] // Don't load all relations if not needed
```

## Code References

### Backend Services

- **ScheduleGeneratorService** (`libs/backend/feature-schedule/src/lib/services/schedule-generator.service.ts`)
  - Lines 145-159: Creates `weekly_schedules` record
  - Lines 172-267: Creates `time_blocks` records

- **ScheduleService** (`libs/backend/feature-schedule/src/lib/services/schedule.service.ts`)
  - Lines 42-122: `findScheduleById()`
  - Lines 124-180: `findScheduleByWeek()` (NEW)
  - Lines 182-250: `listSchedules()` (NEW)

### Backend Controllers

- **ScheduleController** (`libs/backend/feature-schedule/src/lib/controllers/schedule.controller.ts`)
  - Lines 68-177: GET by ID endpoint
  - Lines 179-230: LIST endpoint (NEW)

### Frontend Services

- **WeekScheduleService** (`libs/frontend/feature-week-view/src/lib/services/week-schedule.service.ts`)
  - Lines 24-54: `getWeekSchedule()` - fetches from database

### Frontend Components

- **WeekViewContainerComponent** (`libs/frontend/feature-week-view/src/lib/components/week-view-container/week-view-container.component.ts`)
  - Lines 320-348: `loadWeekData()` - loads from database
  - Lines 419-426: `scheduleExists` signal
  - Lines 450-458: `generateSchedule()` - TODO: implement

## Summary

✅ **Schedules ARE saved** to database automatically when generated
✅ **Can be retrieved** without regeneration
✅ **Persist across sessions** and page refreshes
✅ **One schedule per week per user** (unique constraint)
✅ **Full relational data** (goals, family members, time blocks)

**You don't need to implement anything - it's already working!** 🎉

The only missing piece is the **"Generate Schedule" button** in the Week View, which should redirect to the schedule generator feature or open a modal. This is a TODO for Phase 2.
