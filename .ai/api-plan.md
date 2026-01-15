# REST API Plan

## 1. Resources

| Resource                     | Backing table         | Description                                              |
| ---------------------------- | --------------------- | -------------------------------------------------------- |
| Auth                         | users (Supabase Auth) | Registration & session management                        |
| User                         | users                 | Current authenticated user profile                       |
| FamilyMember                 | family_members        | All members (spouse, children, owner) tied to a user     |
| RecurringGoal                | recurring_goals       | Repeating goals (fitness, hobby, etc.) per family member |
| WeeklySchedule               | weekly_schedules      | Weekly calendar per user (Mon–Sun)                       |
| TimeBlock                    | time_blocks           | Blocks within a weekly schedule                          |
| Feedback                     | feedback              | Thumbs-up / thumbs-down + comments per schedule / block  |
| SuggestionCache              | suggestions_cache     | Cached AI suggestions (activities, meals)                |
| UsageStats                   | usage_stats           | Daily usage statistics per user                          |
| Suggestion (virtual)         | —                     | On-demand activity / meal suggestions via AI             |
| ScheduleGeneration (virtual) | —                     | AI-powered generation of an upcoming week                |

## 2. Endpoints

> All URLs are relative to `/v1`. All endpoints, except `/auth/**`, require a valid **Bearer JWT** issued by Supabase. Rate-limit: 60 req/min/user by default; 5 req/min/user for endpoints that invoke OpenAI.

### 2.1 Auth

| Method | Path             | Description                | Request body                      | Success (200)   | Errors             |
| ------ | ---------------- | -------------------------- | --------------------------------- | --------------- | ------------------ |
| POST   | `/auth/register` | Create a new account       | `{email, password, displayName?}` | `{token, user}` | 400 (email exists) |
| POST   | `/auth/login`    | Obtain JWT                 | `{email, password}`               | `{token, user}` | 401 (invalid)      |
| POST   | `/auth/logout`   | Invalidate current session | —                                 | 204 No Content  | 401                |

### 2.2 User

| Method | Path    | Description              | Body            | Success   | Errors           |
| ------ | ------- | ------------------------ | --------------- | --------- | ---------------- |
| GET    | `/user` | Get own profile          | —               | `UserDto` | 401              |
| PATCH  | `/user` | Update profile           | `{displayName}` | `UserDto` | 400 (validation) |
| DELETE | `/user` | Delete account & cascade | —               | 204       | 401              |

`UserDto` example:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "John",
  "createdAt": "2026-01-09T12:00:00Z"
}
```

### 2.3 Family Members

| Method | Path                         | Description                                                       |
| ------ | ---------------------------- | ----------------------------------------------------------------- |
| GET    | `/family-members`            | List all active members (pagination: `page`, `limit`, default 20) |
| POST   | `/family-members`            | Add member `{name, role, age?, preferences?, color?, initial?}`                     |
| GET    | `/family-members/{memberId}` | Get member                                                        |
| PATCH  | `/family-members/{memberId}` | Update member (partial)                                           |
| DELETE | `/family-members/{memberId}` | Soft-delete member                                                |

Validation highlights:

- `role` ∈ `USER | SPOUSE | CHILD`
- `age` required when `role = CHILD`
- `color` optional hex color (e.g., `#3B82F6`), auto-assigned if not provided
- `initial` optional 1-2 letter initial (e.g., `T`, `M`), auto-generated from name if not provided

`FamilyMemberDto` example:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Tata",
  "role": "USER",
  "age": null,
  "color": "#3B82F6",
  "initial": "T",
  "preferences": {},
  "createdAt": "2026-01-09T12:00:00Z"
}
```

### 2.4 Recurring Goals

| Method | Path                        | Description                                                                                                                   |
| ------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/recurring-goals`          | List goals (`memberId?`, `sort=priority`, pagination)                                                                         |
| POST   | `/recurring-goals`          | `{familyMemberId, name, description?, frequencyPerWeek>0, preferredDurationMinutes>0, preferredTimeOfDay?, priority, rules?}` |
| GET    | `/recurring-goals/{goalId}` | Get goal                                                                                                                      |
| PATCH  | `/recurring-goals/{goalId}` | Update                                                                                                                        |
| DELETE | `/recurring-goals/{goalId}` | Soft-delete                                                                                                                   |

### 2.5 Weekly Schedules

| Method | Path                             | Description                                                     |
| ------ | -------------------------------- | --------------------------------------------------------------- |
| GET    | `/weekly-schedules`              | List schedules (`weekStartDate?`, `isAiGenerated?`, pagination) |
| POST   | `/weekly-schedules`              | Create manual schedule `{weekStartDate}`                        |
| GET    | `/weekly-schedules/{scheduleId}` | Get schedule inc. blocks, family members, and conflict data     |
| PATCH  | `/weekly-schedules/{scheduleId}` | Update metadata                                                 |
| DELETE | `/weekly-schedules/{scheduleId}` | Soft-delete                                                     |

Constraint: unique `(userId, weekStartDate)`.

**Query Parameters for Grid View:**
- `view=grid` - Returns optimized payload for grid rendering with pre-calculated conflicts and time ranges
- `includeMemberData=true` - Eagerly loads family member colors/initials (default: true for grid view)

**Grid View Optimized Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "weekStartDate": "2026-01-13",
  "isAiGenerated": true,
  "timeRange": {
    "earliestTime": "06:00",
    "latestTime": "22:00"
  },
  "familyMembers": [
    {
      "id": "uuid",
      "name": "Tata",
      "color": "#3B82F6",
      "initial": "T",
      "role": "USER"
    }
  ],
  "timeBlocks": [
    {
      "id": "uuid",
      "title": "Work",
      "startTime": "09:00",
      "endTime": "17:00",
      "dayOfWeek": 1,
      "blockType": "WORK",
      "familyMemberId": "uuid",
      "isShared": false,
      "isGoal": false,
      "hasConflict": false,
      "conflictingBlockIds": []
    }
  ],
  "metadata": {
    "totalBlocks": 45,
    "conflictCount": 2,
    "memberActivityCount": {
      "tata": 15,
      "mama": 18,
      "hania": 12
    }
  }
}
```

### 2.6 Time Blocks

| Method | Path                                         | Description                                                                         |
| ------ | -------------------------------------------- | ----------------------------------------------------------------------------------- |
| GET    | `/weekly-schedules/{scheduleId}/time-blocks` | List blocks (filter by `familyMemberId?`, `blockType?`, `day?`)                             |
| POST   | `/weekly-schedules/{scheduleId}/time-blocks` | Create block `{title, blockType, familyMemberId?, timeRange, isShared?, isGoal?, description?, metadata?}` |
| GET    | `/time-blocks/{blockId}`                     | Get block with conflict detection                                                                           |
| PATCH  | `/time-blocks/{blockId}`                     | Update block                                                                        |
| DELETE | `/time-blocks/{blockId}`                     | Soft-delete                                                                         |

Validation & business rules:

- `timeRange` must not overlap another non-shared block for same `familyMemberId` (conflict detector service + DB EXCLUDE constraint).
- `blockType` ∈ `WORK | ACTIVITY | MEAL | OTHER`.
- `isShared` boolean flag for family-wide activities (displayed with special pattern in grid view).
- `isGoal` boolean flag distinguishing recurring goals from fixed commitments.
- Response includes `hasConflict` boolean and `conflictingBlockIds` array for grid view conflict visualization.

`TimeBlockDto` example:

```json
{
  "id": "uuid",
  "scheduleId": "uuid",
  "familyMemberId": "uuid",
  "title": "Morning Workout",
  "description": "Gym session",
  "blockType": "ACTIVITY",
  "startTime": "07:00",
  "endTime": "08:00",
  "dayOfWeek": 1,
  "isShared": false,
  "isGoal": true,
  "hasConflict": false,
  "conflictingBlockIds": [],
  "metadata": {},
  "createdAt": "2026-01-09T12:00:00Z"
}
```

### 2.7 Schedule Generation (AI)

| Method | Path                                          | Description                                                                     |
| ------ | --------------------------------------------- | ------------------------------------------------------------------------------- |
| POST   | `/schedule-generator`                         | Generate plan for closest upcoming week based on fixed blocks & recurring goals |
| POST   | `/schedule-generator/preview`                 | Same as above but returns draft without persisting                              |
| POST   | `/schedule-generator/{scheduleId}/regenerate` | Regenerate specific week overriding existing blocks                             |

Body example:

```json
{
  "weekStartDate": "2026-01-11",
  "strategy": "balanced" // optional algorithm hint
}
```

Responses stream progress or return `{scheduleId, summary}`.

### 2.8 Suggestions (Activities & Meals)

| Method | Path                      | Query params                                  | Description           |
| ------ | ------------------------- | --------------------------------------------- | --------------------- |
| GET    | `/suggestions/activities` | `location?`, `age?`, `timeOfDay?`, `weather?` | Return 3–5 activities |
| GET    | `/suggestions/meals`      | `mealType?`, `diet?`, `availableIngredients?` | Return 3–5 recipes    |

Internally cached in `suggestions_cache`; `expires_at` controls invalidation.

### 2.9 Feedback

| Method | Path                       | Description                                        |
| ------ | -------------------------- | -------------------------------------------------- |
| POST   | `/feedback`                | Submit `{scheduleId, blockId?, rating, comments?}` |
| GET    | `/feedback?scheduleId=...` | List feedback for user (pagination)                |

Validation: `rating` ∈ `-1 | 1`.

### 2.10 Usage Statistics

| Method | Path                  | Description                               |
| ------ | --------------------- | ----------------------------------------- |
| GET    | `/usage-stats`        | Daily stats (`from`, `to`)                |
| GET    | `/weekly-usage-stats` | Aggregated materialized view per ISO week |

## 3. Authentication & Authorization

- **Authentication:** Supabase JWT in `Authorization: Bearer <token>` header.
- **Authorization:** RLS enforced in Postgres as per schema (`SET app.user_id`). Backend additionally verifies the token’s `sub` matches requested resource’s `user_id`.
- **Roles:**
  - `user` – default; can only access own data.
  - `admin` – bypass RLS (service role) for maintenance jobs.

**Security measures**

- HTTPS everywhere, HSTS.
- Rate limiting (per-user & per-IP) via API Gateway.
- Input validation with Zod (backend) & class-validator (NestJS pipe).
- Bcrypt password hashing handled by Supabase.
- Soft-delete (`deleted_at`) prevents hard loss; hard-purge job complies with GDPR.

## 4. Validation & Business Logic

| Resource        | Key Validation Rules                                                                                       | Business Logic                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| FamilyMember    | `role` enum; `age` >0 when `role=CHILD`; `preferences` JSON schema; `color` valid hex; `initial` 1-2 chars | Auto-create owner record (`role=USER`) after registration; auto-assign color/initial if not provided |
| RecurringGoal   | `frequencyPerWeek > 0`; `preferredDurationMinutes >0`; `priority` smallint; `rules` JSON validated (RRULE) | Used by AI generator to distribute goals across week           |
| WeeklySchedule  | Unique per `(userId, weekStartDate)`; `weekStartDate` must be Monday; soft-delete                          | AI flag `isAiGenerated` set when produced by generator; pre-calculate time range and conflicts for grid view |
| TimeBlock       | `blockType` enum; `timeRange` valid & non-overlapping (EXCLUDE constraint); optional `familyMemberId`; `isShared` boolean; `isGoal` boolean | ConflictDetectorService prevents overlaps before insert/update; detects conflicts for grid visualization |
| Feedback        | `rating` in {-1,1}                                                                                         | Updates `usage_stats.acceptedCount` when `rating = 1`          |
| SuggestionCache | `expiresAt` future date                                                                                    | Hit returns cached payload; cold miss triggers OpenAI call     |

## 5. Pagination, Filtering & Sorting

- Pagination: cursor-based (`page`, `limit`) or RFC 5988 `Link` headers.
- Filtering: query params (`memberId`, `weekStartDate`, etc.)
- Sorting: `sort` param (`createdAt`, `priority`, `weekStartDate`, default desc).

## 6. Error Model

Standard JSON:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "frequencyPerWeek must be > 0",
  "timestamp": "2026-01-09T12:34:56Z",
  "path": "/v1/recurring-goals"
}
```

## 7. Performance & Scalability

- **Indices** from schema support frequent filters (`family_member_id`, `block_type`, partial indices on soft-delete columns).
- Read-heavy endpoints (week view) use eager loading + DTO projection to reduce payload.
- AI endpoints guarded by cache & rate-limit to control OpenAI cost.
- Use pagination & `range` requests for large lists.
- Future: partition `weekly_schedules` & `time_blocks` by `weekStartDate` to aid archival.

### Grid View Specific Optimizations

- **Single endpoint fetch:** `GET /weekly-schedules/{scheduleId}` returns all data needed for grid rendering in one call (blocks, members, conflicts, time range).
- **Conflict pre-calculation:** Backend calculates overlaps during fetch, avoiding N² comparisons on frontend.
- **Eager loading:** Time blocks include denormalized family member data (name, color, initial) to avoid frontend joins.
- **Time range metadata:** Response includes `earliestActivityTime` and `latestActivityTime` for dynamic hour range calculation.
- **Caching headers:** Set appropriate `Cache-Control` headers for frequently accessed weeks.
- **Compression:** Enable gzip/brotli compression for schedule responses (typical 70-80% reduction).

**Performance targets:**
- Schedule fetch: <200ms (including all blocks, members, conflicts)
- Response payload: <50KB compressed per week
- Support for 50+ time blocks per week without degradation

---

This plan covers CRUD operations, AI-specific workflows, validation rules, and security constraints required for Phase 1 of the Family Life Planner backend.
