# Implementation Plan - First Week Schedule Generation

**Created:** 2026-01-12  
**Status:** Planning Phase  
**Estimated Time:** 31-41 hours (5-7 days)

---

## 📋 Overview

### 🎯 Goal
Enable users to generate their first weekly schedule with basic family data and recurring goals.

### 📊 Current State

#### ✅ What We Have:

**Backend:**
- ✅ Database schema (migrations complete)
- ✅ Entity models (WeeklySchedule, TimeBlock, FamilyMember, RecurringGoal)
- ✅ GET endpoint for schedules (`GET /v1/weekly-schedules/:scheduleId`)
- ✅ JWT Authentication
- ✅ Supabase integration

**Frontend:**
- ✅ AuthStore + Guards (authGuard, publicOnlyGuard)
- ✅ Login/Register flow working
- ✅ Dashboard placeholder
- ✅ Routing infrastructure
- ✅ Proxy configuration to backend

#### ❌ What's Missing:

**Backend:**
1. ❌ `POST /v1/family-members` - create member
2. ❌ `GET /v1/family-members` - list members
3. ❌ `POST /v1/recurring-goals` - create goal
4. ❌ `GET /v1/recurring-goals` - list goals
5. ❌ `POST /v1/schedule-generator` - **AI generation** (key endpoint)
6. ❌ `GET /v1/weekly-schedules` - list schedules

**Frontend:**
1. ❌ Quick Setup Flow (simplified onboarding)
2. ❌ Schedule Generator View
3. ❌ Weekly Calendar View (display generated schedule)
4. ❌ Frontend stores (FamilyStore, GoalsStore, ScheduleStore)

---

## 📝 DETAILED IMPLEMENTATION PLAN

### **PHASE 1: Backend API Endpoints** (Priority: HIGH)

#### Step 1.1: Family Members Endpoints

**Files to create/modify:**
```
libs/backend/feature-schedule/src/lib/
├── controllers/
│   └── family-member.controller.ts         (NEW)
├── services/
│   └── family-member.service.ts            (NEW)
├── dto/
│   ├── create-family-member.dto.ts         (NEW)
│   └── update-family-member.dto.ts         (NEW)
└── schedule.module.ts                      (UPDATE - add controller)
```

**Endpoints:**
```typescript
POST   /v1/family-members       // Create member
GET    /v1/family-members       // List all user's members
GET    /v1/family-members/:id   // Get single member
PATCH  /v1/family-members/:id   // Update member
DELETE /v1/family-members/:id   // Soft delete
```

**CreateFamilyMemberDto:**
```typescript
{
  name: string;              // required, 1-100 chars
  role: 'USER' | 'SPOUSE' | 'CHILD';  // required
  age?: number;              // required if role = CHILD
  preferences?: {            // optional JSONB
    interests?: string[];
    energyLevels?: string;
  };
}
```

**Validation Rules:**
- `name`: required, min 1, max 100 chars
- `role`: must be enum value
- `age`: required when `role = CHILD`, must be > 0
- `preferences`: optional JSON object
- User can have max 10 family members
- Owner (current user) created automatically on registration

**Business Logic:**
- Auto-link to authenticated user (`user_id` from JWT)
- RLS: user can only access their own family members
- Soft delete pattern (set `deleted_at`)

---

#### Step 1.2: Recurring Goals Endpoints

**Files to create/modify:**
```
libs/backend/feature-schedule/src/lib/
├── controllers/
│   └── recurring-goal.controller.ts        (NEW)
├── services/
│   └── recurring-goal.service.ts           (NEW)
├── dto/
│   ├── create-recurring-goal.dto.ts        (NEW)
│   └── update-recurring-goal.dto.ts        (NEW)
└── schedule.module.ts                      (UPDATE)
```

**Endpoints:**
```typescript
POST   /v1/recurring-goals       // Create goal
GET    /v1/recurring-goals       // List goals (query: ?memberId=uuid)
GET    /v1/recurring-goals/:id   // Get single goal
PATCH  /v1/recurring-goals/:id   // Update goal
DELETE /v1/recurring-goals/:id   // Soft delete
```

**CreateRecurringGoalDto:**
```typescript
{
  familyMemberId: string;              // UUID, required
  name: string;                        // required, 1-200 chars
  description?: string;                // optional
  frequencyPerWeek: number;            // required, > 0
  preferredDurationMinutes: number;    // required, > 0
  preferredTimeOfDay?: 'MORNING' | 'AFTERNOON' | 'EVENING';  // optional
  priority: 'LOW' | 'MEDIUM' | 'HIGH'; // required, default MEDIUM
  rules?: {                            // optional JSONB
    daysOfWeek?: string[];
    timeRanges?: string[];
  };
}
```

**Validation Rules:**
- `familyMemberId`: must be valid UUID, must belong to user
- `name`: required, min 1, max 200 chars
- `frequencyPerWeek`: required, must be > 0, max 14 (2x per day)
- `preferredDurationMinutes`: required, must be > 0, max 480 (8 hours)
- `priority`: must be enum value, defaults to MEDIUM
- User can have max 50 goals per family member

**Business Logic:**
- Verify `familyMemberId` belongs to authenticated user
- RLS: user can only access goals for their family members
- Soft delete pattern

---

#### Step 1.3: Schedule Generator Endpoint (AI Integration)

**Files to create/modify:**
```
libs/backend/feature-schedule/src/lib/
├── controllers/
│   └── schedule-generator.controller.ts    (NEW)
├── services/
│   ├── schedule-generator.service.ts       (NEW)
│   └── openai.service.ts                   (NEW - optional for AI)
├── dto/
│   ├── generate-schedule.dto.ts            (NEW)
│   └── schedule-generation-response.dto.ts (NEW)
└── schedule.module.ts                      (UPDATE)
```

**Main Endpoint:**
```typescript
POST /v1/schedule-generator
```

**GenerateScheduleDto:**
```typescript
{
  weekStartDate: string;     // ISO date, must be Monday, future date
  strategy?: 'balanced' | 'energy-optimized' | 'goal-focused';  // default: balanced
  preferences?: {
    respectFixedBlocks?: boolean;      // default: true
    includeAllGoals?: boolean;         // default: true
    preferMornings?: boolean;          // default: false
    maximizeFamilyTime?: boolean;      // default: false
  };
}
```

**Response:**
```typescript
{
  scheduleId: string;        // UUID of created schedule
  weekStartDate: string;     // ISO date
  summary: {
    totalBlocks: number;
    goalsScheduled: number;
    totalGoals: number;
    conflicts: number;
    distribution: {
      monday: number,
      tuesday: number,
      // ... all days
    };
  };
  timeBlocks: TimeBlock[];   // Array of generated blocks
}
```

**AI Integration - Two Options:**

##### **Option A: OpenAI GPT-4 Integration** (Recommended for production)

**Setup:**
```bash
npm install openai
```

**Environment variables:**
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
```

**Implementation:**
```typescript
// libs/backend/feature-schedule/src/lib/services/openai.service.ts
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateSchedule(params: {
    familyMembers: FamilyMember[];
    recurringGoals: RecurringGoal[];
    weekStartDate: Date;
    strategy: string;
  }): Promise<TimeBlock[]> {
    const prompt = this.buildPrompt(params);
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { 
          role: 'system', 
          content: 'You are a family schedule optimization assistant...' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Parse response and create time blocks
    return this.parseScheduleResponse(completion.choices[0].message.content);
  }

  private buildPrompt(params): string {
    return `
      Generate a weekly schedule for the following family:
      
      Family Members:
      ${params.familyMembers.map(m => `- ${m.name} (${m.role}, age: ${m.age})`).join('\n')}
      
      Recurring Goals:
      ${params.recurringGoals.map(g => 
        `- ${g.name}: ${g.frequencyPerWeek}x/week, ${g.preferredDurationMinutes}min, priority: ${g.priority}`
      ).join('\n')}
      
      Week: ${params.weekStartDate} to ${addDays(params.weekStartDate, 6)}
      Strategy: ${params.strategy}
      
      Requirements:
      1. Fit all goals into the week
      2. Respect time preferences
      3. Avoid conflicts
      4. Balance workload across days
      5. Consider energy levels
      
      Return JSON format:
      [
        {
          "title": "Goal name",
          "blockType": "ACTIVITY",
          "day": "monday",
          "startTime": "09:00",
          "endTime": "10:00",
          "familyMemberId": "uuid",
          "notes": "Why scheduled here"
        }
      ]
    `;
  }
}
```

**Pros:**
- Intelligent scheduling
- Considers complex constraints
- Natural language understanding
- Adapts to feedback over time

**Cons:**
- Requires OpenAI API key (costs money)
- Latency (5-15 seconds per generation)
- Rate limits (need to handle)
- JSON parsing can be unreliable

---

##### **Option B: Mock Algorithm** (For MVP testing - faster)

**Implementation:**
```typescript
// libs/backend/feature-schedule/src/lib/services/schedule-generator.service.ts

@Injectable()
export class ScheduleGeneratorService {
  async generateSchedule(params: {
    userId: string;
    weekStartDate: Date;
    strategy: string;
  }): Promise<{ schedule: WeeklySchedule; blocks: TimeBlock[] }> {
    
    // 1. Load family members
    const members = await this.familyMemberService.findByUserId(params.userId);
    
    // 2. Load recurring goals
    const goals = await this.recurringGoalService.findByUserId(params.userId);
    
    // 3. Create weekly schedule
    const schedule = await this.scheduleService.create({
      userId: params.userId,
      weekStartDate: params.weekStartDate,
      isAiGenerated: true,
      metadata: { strategy: params.strategy }
    });
    
    // 4. Generate time blocks using simple algorithm
    const blocks = this.distributeGoalsAcrossWeek(goals, members, params.weekStartDate);
    
    // 5. Save time blocks
    const savedBlocks = await Promise.all(
      blocks.map(block => this.timeBlockService.create(schedule.scheduleId, block))
    );
    
    return { schedule, blocks: savedBlocks };
  }

  private distributeGoalsAcrossWeek(
    goals: RecurringGoal[],
    members: FamilyMember[],
    weekStart: Date
  ): CreateTimeBlockDto[] {
    const blocks: CreateTimeBlockDto[] = [];
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Sort goals by priority
    const sortedGoals = goals.sort((a, b) => {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Simple distribution algorithm
    sortedGoals.forEach(goal => {
      const member = members.find(m => m.familyMemberId === goal.familyMemberId);
      if (!member) return;
      
      // Distribute across week based on frequency
      const daysToSchedule = this.selectDays(goal.frequencyPerWeek, daysOfWeek);
      
      daysToSchedule.forEach((day, index) => {
        const dayIndex = daysOfWeek.indexOf(day);
        const date = addDays(weekStart, dayIndex);
        
        // Choose time based on preference
        const { startTime, endTime } = this.getPreferredTimeSlot(
          goal.preferredTimeOfDay,
          goal.preferredDurationMinutes
        );
        
        blocks.push({
          title: goal.name,
          blockType: this.mapGoalToBlockType(goal),
          familyMemberId: goal.familyMemberId,
          timeRange: {
            start: `${format(date, 'yyyy-MM-dd')}T${startTime}`,
            end: `${format(date, 'yyyy-MM-dd')}T${endTime}`
          },
          isShared: false,
          metadata: {
            goalId: goal.goalId,
            generatedBy: 'algorithm'
          }
        });
      });
    });
    
    return blocks;
  }
  
  private selectDays(frequency: number, days: string[]): string[] {
    // Distribute evenly across week
    const step = Math.floor(days.length / frequency);
    const selected: string[] = [];
    
    for (let i = 0; i < frequency && i < days.length; i++) {
      selected.push(days[i * step % days.length]);
    }
    
    return selected;
  }
  
  private getPreferredTimeSlot(
    timeOfDay: string | null,
    durationMinutes: number
  ): { startTime: string; endTime: string } {
    // Default time slots
    const slots = {
      MORNING: { start: '07:00', end: '12:00' },
      AFTERNOON: { start: '12:00', end: '17:00' },
      EVENING: { start: '17:00', end: '21:00' }
    };
    
    const slot = timeOfDay ? slots[timeOfDay] : slots.MORNING;
    const startHour = parseInt(slot.start.split(':')[0]);
    
    return {
      startTime: slot.start,
      endTime: `${String(startHour + Math.floor(durationMinutes / 60)).padStart(2, '0')}:${String(durationMinutes % 60).padStart(2, '0')}`
    };
  }
  
  private mapGoalToBlockType(goal: RecurringGoal): string {
    // Simple heuristic based on goal name
    const name = goal.name.toLowerCase();
    if (name.includes('work')) return 'WORK';
    if (name.includes('meal') || name.includes('dinner') || name.includes('lunch')) return 'MEAL';
    return 'ACTIVITY';
  }
}
```

**Pros:**
- Fast (< 1 second)
- Free (no API costs)
- Deterministic
- Easy to debug
- Good for MVP testing

**Cons:**
- Less intelligent
- Simple rule-based
- No learning capability
- May not handle complex constraints

---

**Recommendation:** Start with **Option B (Mock)**, validate the entire flow works, then optionally upgrade to **Option A (OpenAI)** later.

---

#### Step 1.4: Weekly Schedules List Endpoint

**File to modify:**
```
libs/backend/feature-schedule/src/lib/controllers/schedule.controller.ts
```

**Add endpoint:**
```typescript
@Get()
@ApiOperation({ summary: 'List weekly schedules' })
async listSchedules(
  @Query() query: ListSchedulesDto,
  @CurrentUser() user: JwtPayload
): Promise<PaginatedResponse<WeeklyScheduleDto>> {
  const schedules = await this.scheduleService.findAll({
    userId: user.userId,
    weekStartDate: query.weekStartDate,
    isAiGenerated: query.isAiGenerated,
    limit: query.limit || 20,
    offset: query.offset || 0
  });
  
  return {
    data: schedules.map(s => this.scheduleMapper.toDto(s)),
    total: schedules.length,
    limit: query.limit || 20,
    offset: query.offset || 0
  };
}
```

**ListSchedulesDto:**
```typescript
{
  weekStartDate?: string;    // Filter by week
  isAiGenerated?: boolean;   // Filter by generation method
  limit?: number;            // Pagination, default 20
  offset?: number;           // Pagination, default 0
}
```

---

### **PHASE 2: Frontend - Data Access Layer**

#### Step 2.1: Create Frontend Data Access Library

**Generate library:**
```bash
npx nx g @nx/js:lib data-access-schedule \
  --directory=libs/frontend/data-access-schedule \
  --importPath=@family-planner/frontend/data-access-schedule \
  --tags=type:data-access,scope:frontend \
  --unitTestRunner=jest \
  --bundler=none
```

**Structure:**
```
libs/frontend/data-access-schedule/
├── src/
│   ├── index.ts
│   └── lib/
│       ├── models/
│       │   ├── family-member.model.ts
│       │   ├── recurring-goal.model.ts
│       │   ├── schedule.model.ts
│       │   └── time-block.model.ts
│       ├── services/
│       │   ├── family.service.ts
│       │   ├── goals.service.ts
│       │   └── schedule.service.ts
│       └── stores/
│           ├── family.store.ts
│           ├── goals.store.ts
│           └── schedule.store.ts
```

---

#### Step 2.2: Models

**family-member.model.ts:**
```typescript
export interface FamilyMember {
  familyMemberId: string;
  userId: string;
  name: string;
  role: 'USER' | 'SPOUSE' | 'CHILD';
  age?: number;
  preferences?: {
    interests?: string[];
    energyLevels?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFamilyMemberData {
  name: string;
  role: 'USER' | 'SPOUSE' | 'CHILD';
  age?: number;
  preferences?: Record<string, any>;
}

export interface UpdateFamilyMemberData {
  name?: string;
  age?: number;
  preferences?: Record<string, any>;
}
```

**recurring-goal.model.ts:**
```typescript
export interface RecurringGoal {
  goalId: string;
  familyMemberId: string;
  name: string;
  description?: string;
  frequencyPerWeek: number;
  preferredDurationMinutes: number;
  preferredTimeOfDay?: 'MORNING' | 'AFTERNOON' | 'EVENING';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  rules?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRecurringGoalData {
  familyMemberId: string;
  name: string;
  description?: string;
  frequencyPerWeek: number;
  preferredDurationMinutes: number;
  preferredTimeOfDay?: 'MORNING' | 'AFTERNOON' | 'EVENING';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

**schedule.model.ts:**
```typescript
export interface WeeklySchedule {
  scheduleId: string;
  userId: string;
  weekStartDate: string;
  isAiGenerated: boolean;
  metadata?: Record<string, any>;
  timeBlocks?: TimeBlock[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeBlock {
  blockId: string;
  scheduleId: string;
  title: string;
  blockType: 'WORK' | 'ACTIVITY' | 'MEAL' | 'OTHER';
  familyMemberId?: string;
  timeRange: {
    start: string;
    end: string;
  };
  isShared: boolean;
  metadata?: Record<string, any>;
}

export interface GenerateScheduleRequest {
  weekStartDate: string;
  strategy?: 'balanced' | 'energy-optimized' | 'goal-focused';
  preferences?: {
    respectFixedBlocks?: boolean;
    includeAllGoals?: boolean;
    preferMornings?: boolean;
    maximizeFamilyTime?: boolean;
  };
}

export interface GenerateScheduleResponse {
  scheduleId: string;
  weekStartDate: string;
  summary: {
    totalBlocks: number;
    goalsScheduled: number;
    totalGoals: number;
    conflicts: number;
    distribution: Record<string, number>;
  };
  timeBlocks: TimeBlock[];
}
```

---

#### Step 2.3: Services

**family.service.ts:**
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FamilyMember, CreateFamilyMemberData, UpdateFamilyMemberData } from '../models/family-member.model';

@Injectable({ providedIn: 'root' })
export class FamilyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/family-members';

  list(): Observable<FamilyMember[]> {
    return this.http.get<FamilyMember[]>(this.apiUrl);
  }

  get(id: string): Observable<FamilyMember> {
    return this.http.get<FamilyMember>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateFamilyMemberData): Observable<FamilyMember> {
    return this.http.post<FamilyMember>(this.apiUrl, data);
  }

  update(id: string, data: UpdateFamilyMemberData): Observable<FamilyMember> {
    return this.http.patch<FamilyMember>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

**goals.service.ts:**
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecurringGoal, CreateRecurringGoalData } from '../models/recurring-goal.model';

@Injectable({ providedIn: 'root' })
export class GoalsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/recurring-goals';

  list(memberId?: string): Observable<RecurringGoal[]> {
    let params = new HttpParams();
    if (memberId) {
      params = params.set('memberId', memberId);
    }
    return this.http.get<RecurringGoal[]>(this.apiUrl, { params });
  }

  get(id: string): Observable<RecurringGoal> {
    return this.http.get<RecurringGoal>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateRecurringGoalData): Observable<RecurringGoal> {
    return this.http.post<RecurringGoal>(this.apiUrl, data);
  }

  update(id: string, data: Partial<CreateRecurringGoalData>): Observable<RecurringGoal> {
    return this.http.patch<RecurringGoal>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

**schedule.service.ts:**
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  WeeklySchedule, 
  GenerateScheduleRequest, 
  GenerateScheduleResponse 
} from '../models/schedule.model';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1';

  listSchedules(params?: { weekStartDate?: string; isAiGenerated?: boolean }): Observable<WeeklySchedule[]> {
    let httpParams = new HttpParams();
    if (params?.weekStartDate) {
      httpParams = httpParams.set('weekStartDate', params.weekStartDate);
    }
    if (params?.isAiGenerated !== undefined) {
      httpParams = httpParams.set('isAiGenerated', String(params.isAiGenerated));
    }
    return this.http.get<WeeklySchedule[]>(`${this.apiUrl}/weekly-schedules`, { params: httpParams });
  }

  getSchedule(scheduleId: string): Observable<WeeklySchedule> {
    return this.http.get<WeeklySchedule>(`${this.apiUrl}/weekly-schedules/${scheduleId}`);
  }

  generateSchedule(request: GenerateScheduleRequest): Observable<GenerateScheduleResponse> {
    return this.http.post<GenerateScheduleResponse>(`${this.apiUrl}/schedule-generator`, request);
  }
}
```

---

#### Step 2.4: Stores (Angular Signals)

**family.store.ts:**
```typescript
import { Injectable, signal, computed, inject } from '@angular/core';
import { tap, catchError, throwError } from 'rxjs';
import { FamilyService } from '../services/family.service';
import { FamilyMember, CreateFamilyMemberData, UpdateFamilyMemberData } from '../models/family-member.model';

@Injectable({ providedIn: 'root' })
export class FamilyStore {
  private readonly familyService = inject(FamilyService);

  // Signals
  private readonly membersSignal = signal<FamilyMember[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly members = this.membersSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computed
  readonly membersCount = computed(() => this.membersSignal().length);
  readonly hasMember = computed(() => this.membersSignal().length > 0);

  /**
   * Load all family members
   */
  loadMembers() {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.familyService.list().pipe(
      tap(members => {
        this.membersSignal.set(members);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new family member
   */
  addMember(data: CreateFamilyMemberData) {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.familyService.create(data).pipe(
      tap(member => {
        this.membersSignal.update(members => [...members, member]);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * Update family member
   */
  updateMember(id: string, data: UpdateFamilyMemberData) {
    this.loadingSignal.set(true);

    return this.familyService.update(id, data).pipe(
      tap(updatedMember => {
        this.membersSignal.update(members =>
          members.map(m => m.familyMemberId === id ? updatedMember : m)
        );
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete family member
   */
  deleteMember(id: string) {
    this.loadingSignal.set(true);

    return this.familyService.delete(id).pipe(
      tap(() => {
        this.membersSignal.update(members =>
          members.filter(m => m.familyMemberId !== id)
        );
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  private extractErrorMessage(error: any): string {
    return error?.error?.message || error?.message || 'An error occurred';
  }
}
```

**Similar patterns for `goals.store.ts` and `schedule.store.ts`**

---

### **PHASE 3: Frontend - Quick Setup Flow**

#### Step 3.1: Create Feature Library

**Generate library:**
```bash
npx nx g @nx/angular:lib feature-schedule \
  --directory=libs/frontend/feature-schedule \
  --importPath=@family-planner/frontend/feature-schedule \
  --tags=type:feature,scope:frontend \
  --routing=true \
  --lazy=true \
  --style=scss
```

#### Step 3.2: Quick Setup View

**Route:** `/quick-setup`

**Purpose:** Minimal configuration before first generation

**Files structure:**
```
libs/frontend/feature-schedule/src/lib/quick-setup/
├── quick-setup-view.component.ts
├── quick-setup-view.component.html
├── quick-setup-view.component.scss
├── family-form/
│   ├── family-form.component.ts
│   └── family-form.component.html
└── goals-form/
    ├── goals-form.component.ts
    └── goals-form.component.html
```

**UI Flow:**
```
┌─────────────────────────────────────┐
│  Quick Setup (Step 1 of 2)          │
├─────────────────────────────────────┤
│                                     │
│  👥 Add Family Members              │
│                                     │
│  [You] John Doe (Owner)             │
│                                     │
│  Add Member:                        │
│  Name: [_____________]              │
│  Role: [Spouse ▼]                   │
│  Age:  [__] (if child)              │
│  [+ Add Member]                     │
│                                     │
│  Members: 1                         │
│                                     │
│  [Skip] [Next →]                    │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Quick Setup (Step 2 of 2)          │
├─────────────────────────────────────┤
│                                     │
│  🎯 Add Recurring Goals (Optional)  │
│                                     │
│  Add Goal:                          │
│  Name: [________________]           │
│  For:  [John Doe ▼]                 │
│  Times/week: [3]                    │
│  Duration:   [30] minutes           │
│  [+ Add Goal]                       │
│                                     │
│  Goals: 0                           │
│                                     │
│  [← Back] [Skip] [Generate Week →]  │
│                                     │
└─────────────────────────────────────┘
```

**Implementation details:**
- Reactive forms with validation
- Add/Remove members dynamically
- Add/Remove goals dynamically
- Progress indicator (Step 1/2, 2/2)
- Can skip goals step
- "Generate Week" button navigates to `/generate`

---

### **PHASE 4: Frontend - Schedule Generator View**

#### Step 4.1: Generator View

**Route:** `/generate`

**Files:**
```
libs/frontend/feature-schedule/src/lib/generator/
├── generator-view.component.ts
├── generator-form/
│   └── generator-form.component.ts
├── progress-modal/
│   └── progress-modal.component.ts
└── preview-modal/
    └── preview-modal.component.ts
```

**UI Layout:**
```
┌────────────────────────────────────────┐
│  🪄 Generate Week Schedule             │
├────────────────────────────────────────┤
│                                        │
│  📅 Select Week                        │
│  [Jan 13-19, 2026 ▼]                  │
│  (Default: next Monday)                │
│                                        │
│  🎯 Generation Strategy                │
│  ⚪ Balanced                           │
│  ○  Energy-optimized                  │
│  ○  Goal-focused                      │
│                                        │
│  ⚙️ Preferences                        │
│  ☑ Include all goals                  │
│  ☑ Prefer mornings                    │
│  ☐ Maximize family time               │
│                                        │
│  📊 Current Setup                      │
│  • 3 family members                   │
│  • 5 recurring goals                  │
│  • 0 fixed blocks                     │
│                                        │
│  [🪄 Generate Schedule]                │
│                                        │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Generating Schedule...                │
├────────────────────────────────────────┤
│                                        │
│  ⏳ Please wait...                     │
│                                        │
│  [████████░░░░░░░░░░░░░] 40%          │
│                                        │
│  Analyzing family goals...             │
│                                        │
│  [Cancel]                              │
│                                        │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Schedule Generated! ✅                │
├────────────────────────────────────────┤
│                                        │
│  📊 Summary                            │
│  • 15 time blocks created              │
│  • 5/5 goals scheduled                 │
│  • 0 conflicts                         │
│                                        │
│  Distribution:                         │
│  Mon: 3 blocks                         │
│  Tue: 2 blocks                         │
│  Wed: 3 blocks                         │
│  ...                                   │
│                                        │
│  How is it?                            │
│  [👍 Great] [👎 Nope]                  │
│                                        │
│  [Accept & View Calendar]              │
│  [Regenerate]                          │
│                                        │
└────────────────────────────────────────┘
```

**Flow:**
1. User configures generation parameters
2. Click "Generate" → POST /v1/schedule-generator
3. Progress modal shows (with cancel option)
4. On success → Preview modal
5. User provides feedback (thumbs up/down)
6. Click "Accept" → Navigate to /schedule/:scheduleId

---

### **PHASE 5: Frontend - Weekly Calendar View**

#### Step 5.1: Calendar View

**Route:** `/schedule` or `/schedule/:scheduleId`

**Files:**
```
libs/frontend/feature-schedule/src/lib/calendar/
├── calendar-view.component.ts
├── calendar-header/
│   └── calendar-header.component.ts
├── week-grid/
│   └── week-grid.component.ts
└── time-block-card/
    └── time-block-card.component.ts
```

**UI Layout:**
```
┌──────────────────────────────────────────────────────────────────┐
│  ← Week: Jan 13-19, 2026 →   [All Members ▼]  [+ Add Block]    │
├──────────────────────────────────────────────────────────────────┤
│      Mon     Tue     Wed     Thu     Fri     Sat     Sun        │
├──────────────────────────────────────────────────────────────────┤
│ 6am                                                              │
│ 7am  [Work─] [Work─] [Work─] [Work─] [Work─]                   │
│ 8am  [─────] [─────] [─────] [─────] [─────]                   │
│ 9am  [─────] [─────] [─────] [─────] [─────]                   │
│10am  [─────] [─────] [─────] [─────] [─────]                   │
│11am  [─────] [─────] [─────] [─────] [─────]                   │
│12pm  [─────] [─────] [─────] [─────] [─────]                   │
│ 1pm  [─────] [─────] [─────] [─────] [─────]                   │
│ 2pm  [─────] [─────] [─────] [─────] [─────]                   │
│ 3pm  [─────] [─────] [─────] [─────] [─────]                   │
│ 4pm  [─────] [─────] [─────] [─────] [─────]                   │
│ 5pm  [─────] [─────] [─────] [─────] [─────]                   │
│ 6pm  [🏃Run] [     ] [🏃Run] [     ] [🏃Run] [Family] [       ] │
│ 7pm  [     ] [     ] [     ] [     ] [     ] [Time─] [       ] │
│ 8pm  [     ] [Date─] [     ] [     ] [Date─] [─────] [       ] │
│ 9pm  [     ] [Night] [     ] [     ] [Night] [─────] [       ] │
│10pm                                                              │
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- 7-column CSS Grid layout (one per day)
- Time rows (6am-11pm, 30-minute increments)
- Time blocks positioned with CSS Grid
- Color-coded by block type:
  - 🔵 WORK (blue)
  - 🟢 ACTIVITY (green)
  - 🟠 MEAL (orange)
  - 🟣 OTHER (purple)
- Click block → View details
- Week navigation (◀ ▶)
- Filter by family member
- Responsive: desktop (7 cols), tablet (3-4 cols scroll), mobile (1 col swipe)

---

## 🔄 IMPLEMENTATION ORDER

### **Sprint 1: Backend Foundation** (4-6 hours)

**Tasks:**
1. Create FamilyMember controller + service
2. Create RecurringGoal controller + service
3. Add GET /v1/weekly-schedules endpoint
4. Create all DTOs
5. Add validation
6. Test with Swagger/Postman

**Testing:**
```bash
# Test family members
POST /api/v1/family-members
GET  /api/v1/family-members

# Test recurring goals
POST /api/v1/recurring-goals
GET  /api/v1/recurring-goals

# Test schedules list
GET  /api/v1/weekly-schedules
```

---

### **Sprint 2: AI Schedule Generator** (6-8 hours)

**Tasks:**
1. Create ScheduleGeneratorController
2. Decide: OpenAI vs Mock algorithm
3. Implement generation logic
4. Create time blocks
5. Conflict detection
6. Test generation endpoint

**Testing:**
```bash
POST /api/v1/schedule-generator
{
  "weekStartDate": "2026-01-13",
  "strategy": "balanced"
}
```

---

### **Sprint 3: Frontend Stores & Services** (3-4 hours)

**Tasks:**
1. Create data-access-schedule library
2. Implement FamilyStore + FamilyService
3. Implement GoalsStore + GoalsService
4. Implement ScheduleStore + ScheduleService
5. Create models/interfaces
6. Test stores in isolation

---

### **Sprint 4: Quick Setup Flow** (4-5 hours)

**Tasks:**
1. Create feature-schedule library
2. Quick Setup View component
3. Family Form component
4. Goals Form component
5. Integration with stores
6. Routing configuration
7. Update dashboard with "Quick Setup" CTA

---

### **Sprint 5: Schedule Generator UI** (5-6 hours)

**Tasks:**
1. Generator View component
2. Generator Form component
3. Progress Modal component
4. Preview Modal component
5. Feedback integration
6. Error handling
7. Loading states

---

### **Sprint 6: Weekly Calendar View** (6-8 hours)

**Tasks:**
1. Calendar View component
2. Calendar Header component
3. Week Grid component (CSS Grid)
4. Time Block Card component
5. Week navigation logic
6. Filter functionality
7. Responsive design
8. Click handlers

---

### **Sprint 7: Integration & Testing** (3-4 hours)

**Tasks:**
1. End-to-end flow testing
2. Error handling refinement
3. Loading states polish
4. Edge cases (no members, no goals, etc.)
5. Documentation updates
6. Bug fixes

---

## 🚀 QUICK START OPTIONS

### **Option 1: Ultra-MVP (6-8 hours)**

**Goal:** Get the entire flow working ASAP with minimal features

**Implementation:**
1. **Backend Mock Generator** (3 hours)
   - Simple algorithm that creates fixed pattern blocks
   - No family members/goals required
   - Just generates dummy schedule

2. **Frontend Button on Dashboard** (3 hours)
   - "Generate Mock Week" button
   - Calls generator API
   - Shows loading spinner
   - Navigates to basic calendar view

3. **Basic Calendar View** (2 hours)
   - Simple grid showing generated blocks
   - No editing, just display
   - Week navigation

**Result:**
- ✅ Complete flow working
- ✅ Test database integration
- ✅ Test frontend-backend communication
- ✅ Foundation for full implementation

---

### **Option 2: Full Implementation (31-41 hours)**

**All 7 sprints as described above**

---

### **Option 3: Incremental (Flexible)**

**Phase by phase:**
1. Sprint 1 + 2 → Backend complete
2. Test backend with Postman/Swagger
3. Sprint 3 + 4 → Frontend setup
4. Test setup flow
5. Sprint 5 + 6 → Generator + Calendar
6. Sprint 7 → Polish

---

## ❓ DECISION POINTS

### 1. AI Integration Strategy?

**Options:**
- **A) OpenAI GPT-4** - Realistic, requires API key, costs money, 5-15s latency
- **B) Mock Algorithm** - Fast, free, deterministic, good for MVP
- **C) Hybrid** - Start with mock, add AI later

**Recommendation:** **B (Mock)** for MVP, upgrade to **A** when flow validated

---

### 2. Implementation Approach?

**Options:**
- **Full** (all 7 sprints) → 5-7 days
- **Ultra-MVP** (mock + basic UI) → 1-2 days
- **Incremental** (backend first, then frontend) → flexible

**Recommendation:** **Ultra-MVP** to validate flow, then expand incrementally

---

### 3. Scope?

**Minimal (MVP):**
- [ ] Family members CRUD
- [ ] Recurring goals CRUD
- [ ] Mock schedule generator
- [ ] Basic calendar display
- [ ] No editing of generated schedule

**Extended:**
- [ ] AI generation (OpenAI)
- [ ] Time block editing
- [ ] Conflict detection UI
- [ ] Advanced filters
- [ ] Feedback collection
- [ ] History view

**Recommendation:** Start with **Minimal**, add **Extended** features iteratively

---

## 📊 ESTIMATED TIMELINE

### Ultra-MVP:
- **1-2 days** (6-8 hours coding)
- Working end-to-end flow
- Mock generator
- Basic display

### Full MVP:
- **5-7 days** (31-41 hours coding)
- Complete feature set
- Production-ready
- All UI components

### With AI Integration:
- **+2-3 days** (additional 10-15 hours)
- OpenAI integration
- Prompt engineering
- Response parsing
- Error handling

---

## 🎯 SUCCESS CRITERIA

**MVP Complete When:**
- [ ] User can add family members
- [ ] User can add recurring goals
- [ ] User can generate a weekly schedule
- [ ] Schedule displays in calendar view
- [ ] Week navigation works
- [ ] No major bugs in happy path
- [ ] Backend tests passing
- [ ] Frontend compiles without errors

**Production Ready When:**
- [ ] All MVP criteria met
- [ ] Error handling robust
- [ ] Loading states smooth
- [ ] Responsive design works
- [ ] E2E tests passing
- [ ] Documentation complete
- [ ] Code reviewed

---

## 📝 NEXT STEPS

**Ready to start! Choose your path:**

1. **Ultra-MVP** → Fast validation (1-2 days)
2. **Full Implementation** → Complete feature (5-7 days)
3. **Incremental** → Backend first, then frontend

**Tell me which approach you want and I'll start implementing!** 🚀

---

**Last Updated:** 2026-01-12  
**Status:** Planning Complete - Ready for Implementation
