# Time Block Creation Implementation Plan

## Overview

Implement API call to create time blocks when user submits the quick-add activity form, and update the week schedule view after successful creation.

## Steps

### 1. Store Schedule ID

- **Current State**: `WeekViewContainerComponent` loads week data but doesn't store `scheduleId`
- **Action**: Add `currentScheduleId` signal to store the schedule ID
- **Source**: Extract from `TimeBlock.scheduleId` in the first time block, or from API response if available
- **Fallback**: If no schedule exists, we need to handle this case (see step 6)

### 2. Extract Schedule ID from Response

- **Location**: `loadWeekData()` method in `WeekViewContainerComponent`
- **Action**:
  - Check if `response.timeBlocks.length > 0` and extract `scheduleId` from first block
  - Store in `currentScheduleId` signal
  - If no blocks exist, set to `null` or `undefined`

### 3. Add Create Time Block Service Method

- **Location**: `WeekScheduleService`
- **Method**: `createTimeBlock(scheduleId: string, data: CreateTimeBlockData): Observable<TimeBlock>`
- **Endpoint**: `POST /api/v1/weekly-schedules/{scheduleId}/time-blocks`
- **Request Body**:
  ```typescript
  {
    title: string;
    blockType: BlockType;
    familyMemberId?: string;
    timeRange: {
      start: string; // ISO datetime
      end: string; // ISO datetime
    };
    isShared: boolean;
    metadata?: Record<string, any>;
  }
  ```

### 4. Build Time Range Utility

- **Location**: `libs/frontend/feature-week-view/src/lib/utils/time.utils.ts`
- **Function**: `buildTimeRange(day: string, startTime: string, endTime: string): { start: string, end: string }`
- **Logic**:
  - `day` is ISO date string (e.g., "2026-01-20")
  - `startTime` is HH:mm format (e.g., "17:00")
  - `endTime` is HH:mm format (e.g., "18:00")
  - Combine: `day + "T" + startTime + ":00"` → ISO datetime
  - Return: `{ start: ISO datetime, end: ISO datetime }`

### 5. Update onActivityAdd Handler

- **Location**: `WeekViewContainerComponent.onActivityAdd()`
- **Actions**:
  1. Check if `currentScheduleId()` exists
  2. Build timeRange using utility function
  3. Call `scheduleService.createTimeBlock()`
  4. Handle loading state (set `isAddingActivity` signal)
  5. On success:
     - Close modal
     - Reload week data (`loadWeekData()`)
  6. On error:
     - Show error message
     - Keep modal open
     - Reset loading state

### 6. Handle Missing Schedule

- **Scenario**: User clicks empty cell but no schedule exists for the week
- **Options**:
  - **Option A**: Create schedule automatically before creating time block
  - **Option B**: Show error message asking user to generate schedule first
  - **Option C**: Create schedule on-the-fly if it doesn't exist
- **Recommendation**: Option C - Create schedule automatically if it doesn't exist
- **Implementation**:
  - Check if `currentScheduleId()` is null/undefined
  - If null, call schedule creation endpoint first
  - Then proceed with time block creation

### 7. Error Handling

- **Types of Errors**:
  - Network errors
  - Validation errors (overlapping blocks, invalid time range)
  - Missing schedule
  - Unauthorized access
- **UI Feedback**:
  - Show error message in modal or toast
  - Keep form data intact
  - Allow user to retry or cancel

### 8. Success Feedback

- **Actions**:
  - Close modal
  - Reload week data to show new activity
  - Optional: Show success toast/notification

## API Endpoint Details

### POST `/api/v1/weekly-schedules/{scheduleId}/time-blocks`

**Request:**

```json
{
  "title": "Morning Run",
  "blockType": "ACTIVITY",
  "familyMemberId": "uuid-optional",
  "timeRange": {
    "start": "2026-01-20T17:00:00Z",
    "end": "2026-01-20T18:00:00Z"
  },
  "isShared": false,
  "metadata": {}
}
```

**Response:**

```json
{
  "blockId": "uuid",
  "scheduleId": "uuid",
  "title": "Morning Run",
  "blockType": "ACTIVITY",
  "familyMemberId": "uuid",
  "timeRange": {
    "start": "2026-01-20T17:00:00Z",
    "end": "2026-01-20T18:00:00Z"
  },
  "isShared": false,
  "metadata": {},
  "createdAt": "2026-01-20T12:00:00Z",
  "updatedAt": "2026-01-20T12:00:00Z"
}
```

## Implementation Order

1. ✅ Add `buildTimeRange` utility function
2. ✅ Add `currentScheduleId` signal to `WeekViewContainerComponent`
3. ✅ Extract scheduleId in `loadWeekData()`
4. ✅ Add `createTimeBlock()` method to `WeekScheduleService`
5. ✅ Update `onActivityAdd()` to call API
6. ✅ Handle missing schedule case
7. ✅ Add error handling and user feedback
8. ✅ Test end-to-end flow

## Testing Checklist

- [ ] Create time block when schedule exists
- [ ] Create time block when schedule doesn't exist (auto-create)
- [ ] Handle overlapping time blocks (validation error)
- [ ] Handle network errors
- [ ] Verify week view updates after creation
- [ ] Verify modal closes on success
- [ ] Verify form validation works
- [ ] Test with shared activities (isShared = true)
- [ ] Test with different block types
- [ ] Test with different family members
