# Implementation Plan - Goals & Recurring Blocks Management

**Created:** 2026-01-13  
**Status:** Planning Phase  
**Estimated Time:** 16-24 hours (2-4 days)

---

> **🔗 Related Plan:** This plan complements `.ai/week-schedule-plan.md`  
> **Relationship:**  
> - **week-schedule-plan.md** = End-to-end flow to generate first weekly schedule  
> - **goals-plan.md** = Dedicated UI for managing recurring goals (this document)  
> **Shared Components:** Backend goals CRUD + Frontend goals service/store  
> **Unique to this plan:** Goals management UI (list, card, form, filters)

---

## 📋 Overview

### 🎯 Goal
Enable users to manage their family's recurring goals and activities through a dedicated screen. This includes viewing, creating, editing, and organizing goals for all family members.

### 📊 Current State

#### ✅ What We Have:

**Backend:**
- ✅ Database schema for `recurring_goals` table
- ✅ RecurringGoalEntity with TypeORM mapping
- ✅ JWT Authentication
- ✅ User and FamilyMember entities

**Frontend:**
- ✅ AuthStore + Guards
- ✅ Dashboard placeholder
- ✅ Routing infrastructure
- ✅ HTTP interceptor with JWT tokens

#### ❌ What's Missing:

**Backend:**
1. ❌ `POST /v1/recurring-goals` - create goal
2. ❌ `GET /v1/recurring-goals` - list goals (with filtering)
3. ❌ `GET /v1/recurring-goals/:id` - get single goal
4. ❌ `PATCH /v1/recurring-goals/:id` - update goal
5. ❌ `DELETE /v1/recurring-goals/:id` - soft delete goal
6. ❌ Validation DTOs for goal operations

**Frontend:**
1. ❌ Goals management page/view
2. ❌ Goals list component (display all goals)
3. ❌ Goal form component (create/edit)
4. ❌ Goal card component (display single goal)
5. ❌ GoalsStore (state management)
6. ❌ Goals API service
7. ❌ Goal filtering/sorting UI

---

## 📝 DETAILED IMPLEMENTATION PLAN

> **Note:** This plan shares backend components with `.ai/week-schedule-plan.md` (Step 1.2).  
> If implementing both plans, the backend Phase 1 only needs to be done once.

### **PHASE 1: Backend API Endpoints** (Priority: HIGH)

> **📎 Reference:** See `.ai/week-schedule-plan.md` Step 1.2 for detailed backend implementation.  
> This section provides a summary + additions specific to goals management.

#### Step 1.1: Recurring Goals Controller & Service

**Files to create/modify:**
```
libs/backend/feature-schedule/src/lib/
├── controllers/
│   └── recurring-goal.controller.ts        (NEW)
├── services/
│   └── recurring-goal.service.ts           (NEW)
├── dto/
│   ├── create-recurring-goal.dto.ts        (NEW)
│   ├── update-recurring-goal.dto.ts        (NEW)
│   └── query-recurring-goals.dto.ts        (NEW - additional for filtering)
└── schedule.module.ts                      (UPDATE - add controller)
```

**Endpoints:**
```typescript
POST   /api/v1/recurring-goals       // Create goal
GET    /api/v1/recurring-goals       // List goals (with filters)
GET    /api/v1/recurring-goals/:id   // Get single goal
PATCH  /api/v1/recurring-goals/:id   // Update goal
DELETE /api/v1/recurring-goals/:id   // Soft delete
```

**CreateRecurringGoalDto:**
```typescript
{
  familyMemberId: string;              // UUID, required
  name: string;                        // required, 1-200 chars
  description?: string;                // optional, max 500 chars
  frequencyPerWeek: number;            // required, 1-14
  preferredDurationMinutes: number;    // required, 15-480 (8 hours max)
  preferredTimeOfDay?: string[];       // optional, ['morning', 'afternoon', 'evening']
  priority: number;                    // required, 0-2 (0=LOW, 1=MEDIUM, 2=HIGH)
  rules?: {                            // optional JSONB
    daysOfWeek?: string[];             // e.g., ['monday', 'wednesday']
    timeRanges?: string[];             // e.g., ['09:00-12:00']
    avoidConflicts?: boolean;
  };
}
```

**UpdateRecurringGoalDto:**
```typescript
{
  name?: string;
  description?: string;
  frequencyPerWeek?: number;
  preferredDurationMinutes?: number;
  preferredTimeOfDay?: string[];
  priority?: number;
  rules?: Record<string, any>;
}
```

**QueryRecurringGoalsDto:**
```typescript
{
  familyMemberId?: string;    // Filter by family member
  priority?: number;          // Filter by priority
  sortBy?: 'name' | 'priority' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}
```

**Validation Rules:**
- `familyMemberId`: must be valid UUID, must belong to authenticated user
- `name`: required, min 1, max 200 chars
- `description`: max 500 chars
- `frequencyPerWeek`: required, min 1, max 14
- `preferredDurationMinutes`: required, min 15, max 480
- `preferredTimeOfDay`: array of valid values ('morning', 'afternoon', 'evening')
- `priority`: must be 0, 1, or 2
- User can have max 50 recurring goals

**Business Logic:**
- Auto-link to authenticated user via `familyMemberId.userId`
- Validate `familyMemberId` belongs to current user
- Soft delete pattern (set `deleted_at`)
- Return goals with family member details (JOIN query)
- Order by priority DESC, then by name ASC (default)

**Service Methods:**
```typescript
class RecurringGoalService {
  async create(userId: string, dto: CreateRecurringGoalDto): Promise<RecurringGoalEntity>;
  async findAll(userId: string, query: QueryRecurringGoalsDto): Promise<RecurringGoalEntity[]>;
  async findOne(userId: string, goalId: string): Promise<RecurringGoalEntity>;
  async update(userId: string, goalId: string, dto: UpdateRecurringGoalDto): Promise<RecurringGoalEntity>;
  async remove(userId: string, goalId: string): Promise<void>;
  async validateFamilyMemberAccess(userId: string, familyMemberId: string): Promise<boolean>;
}
```

**Estimated Time:** 4-6 hours

---

#### Step 1.2: Add to Schedule Module

**File:** `libs/backend/feature-schedule/src/lib/schedule.module.ts`

**Changes:**
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      WeeklyScheduleEntity,
      TimeBlockEntity,
      FamilyMemberEntity,
      RecurringGoalEntity, // Already imported
    ]),
  ],
  controllers: [
    ScheduleController,
    ScheduleGeneratorController,
    RecurringGoalController, // NEW
  ],
  providers: [
    ScheduleService,
    ScheduleGeneratorService,
    RecurringGoalService, // NEW
    OpenAIService,
  ],
  exports: [
    ScheduleService,
    ScheduleGeneratorService,
    RecurringGoalService, // NEW
  ],
})
export class ScheduleModule {}
```

**Estimated Time:** 1 hour

---

### **PHASE 2: Frontend Library - Goals Data Access** (Priority: HIGH)

> **📎 Reference:** See `.ai/week-schedule-plan.md` Phase 2 for shared service/store implementation.  
> This section adds filtering/sorting capabilities specific to the goals management UI.

#### Step 2.1: Create Goals Data Access Library

**Generate library:**
```bash
npx nx generate @nx/angular:library data-access-goals \
  --directory=libs/frontend/data-access-goals \
  --importPath=@family-planner/frontend/data-access-goals \
  --standalone \
  --tags=type:data-access,scope:frontend
```

**Files to create:**
```
libs/frontend/data-access-goals/src/lib/
├── services/
│   └── goals-api.service.ts         (NEW)
├── store/
│   └── goals.store.ts                (NEW)
├── models/
│   ├── recurring-goal.model.ts       (NEW)
│   └── goal-query.model.ts           (NEW)
└── index.ts                          (UPDATE)
```

**Estimated Time:** 1 hour

---

#### Step 2.2: Goals API Service

**File:** `libs/frontend/data-access-goals/src/lib/services/goals-api.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecurringGoal, CreateGoalRequest, UpdateGoalRequest, QueryGoalsParams } from '../models';

@Injectable({ providedIn: 'root' })
export class GoalsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/recurring-goals';

  createGoal(request: CreateGoalRequest): Observable<RecurringGoal> {
    return this.http.post<RecurringGoal>(this.apiUrl, request);
  }

  getGoals(params?: QueryGoalsParams): Observable<RecurringGoal[]> {
    let httpParams = new HttpParams();
    if (params?.familyMemberId) {
      httpParams = httpParams.set('familyMemberId', params.familyMemberId);
    }
    if (params?.priority !== undefined) {
      httpParams = httpParams.set('priority', params.priority.toString());
    }
    if (params?.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params?.sortOrder) {
      httpParams = httpParams.set('sortOrder', params.sortOrder);
    }
    return this.http.get<RecurringGoal[]>(this.apiUrl, { params: httpParams });
  }

  getGoal(goalId: string): Observable<RecurringGoal> {
    return this.http.get<RecurringGoal>(`${this.apiUrl}/${goalId}`);
  }

  updateGoal(goalId: string, request: UpdateGoalRequest): Observable<RecurringGoal> {
    return this.http.patch<RecurringGoal>(`${this.apiUrl}/${goalId}`, request);
  }

  deleteGoal(goalId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${goalId}`);
  }
}
```

**Estimated Time:** 2 hours

---

#### Step 2.3: Goals Store (Angular Signals)

**File:** `libs/frontend/data-access-goals/src/lib/store/goals.store.ts`

```typescript
import { Injectable, signal, computed, inject } from '@angular/core';
import { GoalsApiService } from '../services/goals-api.service';
import { RecurringGoal, CreateGoalRequest, UpdateGoalRequest, QueryGoalsParams } from '../models';

export type GoalsState = {
  goals: RecurringGoal[];
  selectedGoal: RecurringGoal | null;
  isLoading: boolean;
  error: string | null;
};

@Injectable({ providedIn: 'root' })
export class GoalsStore {
  private readonly goalsApi = inject(GoalsApiService);

  // State
  private readonly goalsSignal = signal<RecurringGoal[]>([]);
  private readonly selectedGoalSignal = signal<RecurringGoal | null>(null);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  // Selectors
  readonly goals = this.goalsSignal.asReadonly();
  readonly selectedGoal = this.selectedGoalSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computed
  readonly goalsByPriority = computed(() => {
    const goals = this.goalsSignal();
    return {
      high: goals.filter(g => g.priority === 2),
      medium: goals.filter(g => g.priority === 1),
      low: goals.filter(g => g.priority === 0),
    };
  });

  readonly goalsByMember = computed(() => {
    const goals = this.goalsSignal();
    const grouped = new Map<string, RecurringGoal[]>();
    goals.forEach(goal => {
      const memberId = goal.familyMemberId;
      if (!grouped.has(memberId)) {
        grouped.set(memberId, []);
      }
      grouped.get(memberId)!.push(goal);
    });
    return grouped;
  });

  // Actions
  async loadGoals(params?: QueryGoalsParams): Promise<void> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const goals = await this.goalsApi.getGoals(params).toPromise();
      this.goalsSignal.set(goals || []);
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to load goals');
      console.error('Failed to load goals:', error);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async createGoal(request: CreateGoalRequest): Promise<RecurringGoal | null> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const newGoal = await this.goalsApi.createGoal(request).toPromise();
      if (newGoal) {
        this.goalsSignal.update(goals => [...goals, newGoal]);
        return newGoal;
      }
      return null;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to create goal');
      console.error('Failed to create goal:', error);
      return null;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async updateGoal(goalId: string, request: UpdateGoalRequest): Promise<RecurringGoal | null> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const updatedGoal = await this.goalsApi.updateGoal(goalId, request).toPromise();
      if (updatedGoal) {
        this.goalsSignal.update(goals =>
          goals.map(g => g.goalId === goalId ? updatedGoal : g)
        );
        if (this.selectedGoalSignal()?.goalId === goalId) {
          this.selectedGoalSignal.set(updatedGoal);
        }
        return updatedGoal;
      }
      return null;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to update goal');
      console.error('Failed to update goal:', error);
      return null;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async deleteGoal(goalId: string): Promise<boolean> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      await this.goalsApi.deleteGoal(goalId).toPromise();
      this.goalsSignal.update(goals => goals.filter(g => g.goalId !== goalId));
      if (this.selectedGoalSignal()?.goalId === goalId) {
        this.selectedGoalSignal.set(null);
      }
      return true;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to delete goal');
      console.error('Failed to delete goal:', error);
      return false;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  selectGoal(goalId: string | null): void {
    if (!goalId) {
      this.selectedGoalSignal.set(null);
      return;
    }
    const goal = this.goalsSignal().find(g => g.goalId === goalId);
    this.selectedGoalSignal.set(goal || null);
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}
```

**Estimated Time:** 3 hours

---

### **PHASE 3: Frontend Feature - Goals Management UI** (Priority: HIGH)

#### Step 3.1: Create Goals Feature Library

**Generate library:**
```bash
npx nx generate @nx/angular:library feature-goals \
  --directory=libs/frontend/feature-goals \
  --importPath=@family-planner/frontend/feature-goals \
  --standalone \
  --routing \
  --tags=type:feature,scope:frontend
```

**Component Structure:**
```
libs/frontend/feature-goals/src/lib/
├── goals-list/
│   ├── goals-list.component.ts       (NEW - main container)
│   ├── goals-list.component.html
│   └── goals-list.component.scss
├── goal-card/
│   ├── goal-card.component.ts        (NEW - display single goal)
│   ├── goal-card.component.html
│   └── goal-card.component.scss
├── goal-form/
│   ├── goal-form.component.ts        (NEW - create/edit form)
│   ├── goal-form.component.html
│   └── goal-form.component.scss
├── goal-filters/
│   ├── goal-filters.component.ts     (NEW - filter/sort controls)
│   ├── goal-filters.component.html
│   └── goal-filters.component.scss
├── lib.routes.ts                      (UPDATE - add routes)
└── index.ts
```

**Estimated Time:** 1 hour (setup)

---

#### Step 3.2: Goals List Component (Main View)

**File:** `libs/frontend/feature-goals/src/lib/goals-list/goals-list.component.ts`

**Features:**
- Display all recurring goals grouped by family member OR by priority
- Filter by family member
- Sort by name/priority/date
- Quick actions: Edit, Delete
- "Add New Goal" button
- Empty state when no goals
- Loading state
- Error handling

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Recurring Goals & Activities             [+ Add]   │
├─────────────────────────────────────────────────────┤
│  Filters: [All Members ▼] [All Priorities ▼]       │
│  Sort by: [Priority ▼]                              │
├─────────────────────────────────────────────────────┤
│  ┌─ HIGH PRIORITY ───────────────────────────────┐  │
│  │  [Goal Card 1] [Goal Card 2]                  │  │
│  └───────────────────────────────────────────────┘  │
│  ┌─ MEDIUM PRIORITY ─────────────────────────────┐  │
│  │  [Goal Card 3] [Goal Card 4]                  │  │
│  └───────────────────────────────────────────────┘  │
│  ┌─ LOW PRIORITY ────────────────────────────────┐  │
│  │  [Goal Card 5]                                │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Code Structure:**
```typescript
@Component({
  selector: 'fp-goals-list',
  standalone: true,
  imports: [
    CommonModule,
    GoalCardComponent,
    GoalFiltersComponent,
    // Material imports as needed
  ],
  templateUrl: './goals-list.component.html',
  styleUrls: ['./goals-list.component.scss'],
})
export class GoalsListComponent implements OnInit {
  private readonly goalsStore = inject(GoalsStore);
  private readonly router = inject(Router);

  // Signals from store
  goals = this.goalsStore.goals;
  goalsByPriority = this.goalsStore.goalsByPriority;
  isLoading = this.goalsStore.isLoading;
  error = this.goalsStore.error;

  // Local state
  filterMemberId = signal<string | null>(null);
  sortBy = signal<'name' | 'priority' | 'createdAt'>('priority');
  sortOrder = signal<'ASC' | 'DESC'>('DESC');

  ngOnInit(): void {
    this.loadGoals();
  }

  async loadGoals(): Promise<void> {
    await this.goalsStore.loadGoals({
      familyMemberId: this.filterMemberId() || undefined,
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder(),
    });
  }

  onFilterChange(memberId: string | null): void {
    this.filterMemberId.set(memberId);
    this.loadGoals();
  }

  onSortChange(sortBy: 'name' | 'priority' | 'createdAt', sortOrder: 'ASC' | 'DESC'): void {
    this.sortBy.set(sortBy);
    this.sortOrder.set(sortOrder);
    this.loadGoals();
  }

  onAddGoal(): void {
    this.router.navigate(['/goals/new']);
  }

  onEditGoal(goalId: string): void {
    this.router.navigate(['/goals/edit', goalId]);
  }

  async onDeleteGoal(goalId: string): Promise<void> {
    if (confirm('Are you sure you want to delete this goal?')) {
      await this.goalsStore.deleteGoal(goalId);
    }
  }
}
```

**Estimated Time:** 4-5 hours

---

#### Step 3.3: Goal Card Component

**File:** `libs/frontend/feature-goals/src/lib/goal-card/goal-card.component.ts`

**Features:**
- Display goal details in a card format
- Show family member name
- Priority indicator (color-coded)
- Frequency and duration info
- Preferred time of day
- Quick actions: Edit, Delete

**Card Layout:**
```
┌──────────────────────────────────────────┐
│ 🏃 Morning Workout             [Edit][×] │
│ ──────────────────────────────────────── │
│ Member: Dad                               │
│ Frequency: 3x per week                    │
│ Duration: 45 minutes                      │
│ Time: Morning                             │
│ Priority: ⚠️ HIGH                         │
└──────────────────────────────────────────┘
```

**Code Structure:**
```typescript
@Component({
  selector: 'fp-goal-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './goal-card.component.html',
  styleUrls: ['./goal-card.component.scss'],
})
export class GoalCardComponent {
  @Input({ required: true }) goal!: RecurringGoal;
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  onEdit(): void {
    this.edit.emit(this.goal.goalId);
  }

  onDelete(): void {
    this.delete.emit(this.goal.goalId);
  }

  getPriorityLabel(): string {
    const labels = { 0: 'LOW', 1: 'MEDIUM', 2: 'HIGH' };
    return labels[this.goal.priority as keyof typeof labels] || 'MEDIUM';
  }

  getPriorityColor(): string {
    const colors = { 0: 'green', 1: 'orange', 2: 'red' };
    return colors[this.goal.priority as keyof typeof colors] || 'gray';
  }
}
```

**Estimated Time:** 2-3 hours

---

#### Step 3.4: Goal Form Component (Create/Edit)

**File:** `libs/frontend/feature-goals/src/lib/goal-form/goal-form.component.ts`

**Features:**
- Reactive form with validation
- Family member selection dropdown
- Name input (required)
- Description textarea (optional)
- Frequency per week input (1-14)
- Duration input (15-480 minutes)
- Preferred time of day multi-select
- Priority selector (LOW/MEDIUM/HIGH)
- Advanced rules (collapsible section)
- Save & Cancel buttons

**Form Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Create New Goal                                     │
├─────────────────────────────────────────────────────┤
│  Family Member: [Select member ▼]                   │
│  Goal Name: [_____________________________]         │
│  Description: [_____________________________]        │
│                [_____________________________]        │
│  Frequency: [___] times per week                    │
│  Duration: [___] minutes per session                │
│  Preferred Time: ☐ Morning ☐ Afternoon ☐ Evening   │
│  Priority: ○ Low ● Medium ○ High                    │
│                                                      │
│  [▼] Advanced Rules (Optional)                      │
│  ┌───────────────────────────────────────────────┐  │
│  │ Specific Days: ☐ Mon ☐ Tue ☐ Wed ...         │  │
│  │ Avoid Conflicts: ☑                            │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  [Cancel]                              [Save Goal]  │
└─────────────────────────────────────────────────────┘
```

**Code Structure:**
```typescript
@Component({
  selector: 'fp-goal-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Material form components
  ],
  templateUrl: './goal-form.component.html',
  styleUrls: ['./goal-form.component.scss'],
})
export class GoalFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly goalsStore = inject(GoalsStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  @Input() goalId?: string; // For edit mode

  form = this.fb.group({
    familyMemberId: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', Validators.maxLength(500)],
    frequencyPerWeek: [3, [Validators.required, Validators.min(1), Validators.max(14)]],
    preferredDurationMinutes: [30, [Validators.required, Validators.min(15), Validators.max(480)]],
    preferredTimeOfDay: [[] as string[]],
    priority: [1, [Validators.required, Validators.min(0), Validators.max(2)]],
    rules: this.fb.group({
      daysOfWeek: [[] as string[]],
      avoidConflicts: [true],
    }),
  });

  isEditMode = false;
  isLoading = this.goalsStore.isLoading;

  ngOnInit(): void {
    if (this.goalId) {
      this.isEditMode = true;
      this.loadGoal(this.goalId);
    }
  }

  async loadGoal(goalId: string): Promise<void> {
    // Load goal from store and populate form
    const goal = await this.goalsStore.selectGoal(goalId);
    if (goal) {
      this.form.patchValue({
        familyMemberId: goal.familyMemberId,
        name: goal.name,
        description: goal.description,
        frequencyPerWeek: goal.frequencyPerWeek,
        preferredDurationMinutes: goal.preferredDurationMinutes,
        preferredTimeOfDay: goal.preferredTimeOfDay || [],
        priority: goal.priority,
        rules: goal.rules || {},
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const request = {
      familyMemberId: formValue.familyMemberId!,
      name: formValue.name!,
      description: formValue.description || undefined,
      frequencyPerWeek: formValue.frequencyPerWeek!,
      preferredDurationMinutes: formValue.preferredDurationMinutes!,
      preferredTimeOfDay: formValue.preferredTimeOfDay?.length ? formValue.preferredTimeOfDay : undefined,
      priority: formValue.priority!,
      rules: formValue.rules || {},
    };

    let result;
    if (this.isEditMode && this.goalId) {
      result = await this.goalsStore.updateGoal(this.goalId, request);
    } else {
      result = await this.goalsStore.createGoal(request);
    }

    if (result) {
      this.router.navigate(['/goals']);
    }
  }

  onCancel(): void {
    this.router.navigate(['/goals']);
  }
}
```

**Estimated Time:** 4-5 hours

---

#### Step 3.5: Routes Configuration

**File:** `libs/frontend/feature-goals/src/lib/lib.routes.ts`

```typescript
import { Route } from '@angular/router';
import { GoalsListComponent } from './goals-list/goals-list.component';
import { GoalFormComponent } from './goal-form/goal-form.component';

export const goalsRoutes: Route[] = [
  {
    path: '',
    component: GoalsListComponent,
  },
  {
    path: 'new',
    component: GoalFormComponent,
  },
  {
    path: 'edit/:id',
    component: GoalFormComponent,
  },
];
```

**File:** `apps/frontend/src/app/app.routes.ts` (UPDATE)

```typescript
{
  path: 'goals',
  loadChildren: () =>
    import('@family-planner/frontend/feature-goals').then(m => m.goalsRoutes),
  canActivate: [authGuard],
},
```

**Estimated Time:** 1 hour

---

### **PHASE 4: Integration & Testing** (Priority: MEDIUM)

#### Step 4.1: Add Navigation Link

**File:** `apps/frontend/src/app/app.ts` or navigation component

Add "Goals" link to main navigation menu:
```html
<nav>
  <a routerLink="/dashboard">Dashboard</a>
  <a routerLink="/goals">Goals</a>
  <a routerLink="/profile">Profile</a>
</nav>
```

**Estimated Time:** 30 minutes

---

#### Step 4.2: Backend Unit Tests

**Files to create:**
```
libs/backend/feature-schedule/src/lib/
├── controllers/
│   └── recurring-goal.controller.spec.ts
├── services/
│   └── recurring-goal.service.spec.ts
```

**Test Coverage:**
- Service: CRUD operations, validation, authorization
- Controller: HTTP responses, error handling, DTOs

**Estimated Time:** 3-4 hours

---

#### Step 4.3: Frontend Unit Tests

**Files to create:**
```
libs/frontend/feature-goals/src/lib/
├── goals-list/goals-list.component.spec.ts
├── goal-card/goal-card.component.spec.ts
├── goal-form/goal-form.component.spec.ts
└── store/goals.store.spec.ts
```

**Test Coverage:**
- Components: rendering, user interactions, emissions
- Store: state management, async operations, computed values

**Estimated Time:** 3-4 hours

---

#### Step 4.4: E2E Tests (Optional but Recommended)

**File:** `apps/frontend-e2e/src/goals.spec.ts` (NEW)

**Test Scenarios:**
1. Navigate to goals page
2. Create a new goal
3. View goal in list
4. Edit existing goal
5. Delete goal
6. Filter goals by member
7. Sort goals by priority

**Estimated Time:** 2-3 hours

---

## 📊 ACCEPTANCE CRITERIA

### Backend:
- [x] All CRUD endpoints implemented
- [x] DTOs with validation
- [x] Authorization checks (user owns family member)
- [x] Soft delete implemented
- [x] Query filtering works (member, priority)
- [x] Proper error handling
- [x] Unit tests passing (>80% coverage)

### Frontend:
- [x] Goals list displays all goals
- [x] Can create new goal via form
- [x] Can edit existing goal
- [x] Can delete goal with confirmation
- [x] Filter by family member works
- [x] Sort functionality works
- [x] Loading states displayed
- [x] Error messages shown
- [x] Responsive design (mobile-friendly)
- [x] Unit tests passing (>80% coverage)

### User Experience:
- [x] Navigation to goals page is intuitive
- [x] Forms are validated properly
- [x] Success/error feedback shown
- [x] Empty state when no goals
- [x] Quick actions easily accessible
- [x] Priority visual indicators clear

---

## 🚀 IMPLEMENTATION PHASES SUMMARY

### Phase 1: Backend API (4-7 hours)
1. Create DTOs (1h)
2. Implement service (2-3h)
3. Implement controller (1-2h)
4. Add to module (1h)

### Phase 2: Frontend Data Access (5-6 hours)
1. Generate library (1h)
2. Create API service (2h)
3. Create store (3h)

### Phase 3: Frontend UI (10-14 hours)
1. Generate feature library (1h)
2. Goals list component (4-5h)
3. Goal card component (2-3h)
4. Goal form component (4-5h)
5. Routes configuration (1h)

### Phase 4: Testing & Integration (6-11 hours)
1. Add navigation (0.5h)
2. Backend tests (3-4h)
3. Frontend tests (3-4h)
4. E2E tests (2-3h, optional)

**Total Estimated Time:** 16-24 hours

---

## 📝 NEXT STEPS

**Ready to implement! Choose your approach:**

### Option 1: Goals Management Only (Focused)
**When to use:** You want a dedicated goals screen before building schedule generation.
- Backend goals CRUD (Phase 1)
- Frontend data access (Phase 2)
- Goals UI components (Phase 3)
- Testing (Phase 4)
- **Duration:** 2-4 days (16-24 hours)

### Option 2: Combined with Schedule Generation (Recommended)
**When to use:** You want the complete flow from setup to schedule generation.
1. Implement shared backend (goals + family members)
2. Implement shared data access layers
3. Build **goals management UI first** (this plan Phase 3)
4. Then build schedule generation flow (week-schedule-plan)
- **Duration:** 4-6 days (27-40 hours combined)
- **See:** Implementation Strategy above for detailed order

### Option 3: Ultra-MVP Goals (Quickest)
**When to use:** You just need basic goal management for testing.
- Backend CRUD only (no filtering/sorting)
- Simple list component
- Basic form (no advanced rules)
- **Duration:** 1 day (6-8 hours)

---

**💡 Recommendation:** Start with **Option 2, Path B** (Goals UI → Schedule Generation)  
This provides the most logical user flow and better data validation before AI generation.

**Tell me which approach you prefer and I'll start implementing!** 🚀

---

## 🔗 DEPENDENCIES

### Must Be Done First:
- [x] Authentication working
- [x] Database schema exists
- [x] TypeORM entities defined
- [ ] Family Members endpoints (see `week-schedule-plan.md` Step 1.1)
- [ ] Recurring Goals backend endpoints (Phase 1 - shared with week-schedule-plan)

### Nice to Have:
- [ ] Angular Material installed
- [ ] Shared UI components library
- [ ] Consistent design system

---

## 🎯 IMPLEMENTATION STRATEGY (Given Overlap)

### **Scenario 1: Implementing Both Plans**

**Recommended Order:**

1. **Shared Backend First** (6-8 hours)
   - Family Members endpoints (week-schedule-plan Step 1.1)
   - Recurring Goals endpoints (Phase 1 - do once, shared by both)

2. **Shared Frontend Services** (5-6 hours)
   - Goals data access library (Phase 2 - do once, shared by both)
   - Family data access library (from week-schedule-plan)

3. **Choose Path:**
   - **Path A:** Build schedule generation flow first (week-schedule-plan Phases 3-6)
   - **Path B:** Build goals management UI first (this plan Phase 3) ← **Recommended**

**Why Path B First?**
- Users need to manage goals before generating schedules
- Goals UI provides data entry for schedule generation
- Easier to test/validate goal data before AI generation
- More intuitive user flow: Setup Goals → Generate Schedule

**Total Time:** 27-40 hours (4-6 days) for both plans combined

---

### **Scenario 2: Goals Management Only**

**Order:**
1. Phase 1: Backend (4-7h)
2. Phase 2: Data Access (5-6h)
3. Phase 3: UI (10-14h)
4. Phase 4: Testing (6-11h)

**Total Time:** 16-24 hours (2-4 days)

---

### **Scenario 3: Schedule Generation Only**

See `.ai/week-schedule-plan.md` for full details.  
Note: Will need basic goals CRUD anyway (can use simple forms instead of dedicated UI).

---

## 📎 NOTES

- This feature is foundational for the schedule generation flow
- Users typically set up goals before generating schedules
- Consider adding bulk import/export for goals
- Future: Template goals for common activities
- Future: Goal categories/tags for better organization
- Future: Goal history/analytics

---

**Last Updated:** 2026-01-13  
**Status:** Planning Complete - Ready for Implementation
**Priority:** HIGH (Phase 1 MVP Component)
