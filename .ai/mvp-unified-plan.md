# MVP Implementation Plan - Unified Family Planner

**Created:** 2026-01-13  
**Status:** Partially Implemented (Phases 1, 2, 4, 5 done; Phase 3 pending)  
**Priority:** HIGH (Phase 1 MVP)  
**Estimated Time:** 35-50 hours (5-7 days)

---

## 📋 EXECUTIVE SUMMARY

### 🎯 Goal

Build a complete MVP that allows families to:

1. Set up their family structure (members)
2. Define recurring goals/activities
3. Generate AI-powered weekly schedules
4. View and navigate schedules in a calendar

### 🏗️ Architecture Philosophy

**Foundation First:** User & Family setup is the cornerstone. Everything else depends on having proper family data.

```
User Account (Authentication) ✅ DONE
    ↓
Family Members (WHO will do activities)
    ↓
Recurring Goals (WHAT activities to schedule)
    ↓
Schedule Generation (WHEN to do activities)
    ↓
Calendar View (SEE the generated schedule)
```

### 📊 Current State

#### ✅ What We Have:

- ✅ Authentication system (JWT, custom users table)
- ✅ Database schema complete (all tables migrated)
- ✅ TypeORM entities defined
- ✅ Backend infrastructure (NestJS, Supabase)
- ✅ Frontend infrastructure (Angular standalone, routing, guards)
- ✅ HTTP interceptor with JWT
- ✅ Basic schedule generator endpoint (mock algorithm)
- ✅ Demo user for development
- ✅ Family Members: backend CRUD API + Angular UI (list, create, edit, delete, validation)
- ✅ Recurring Goals: backend CRUD API + Angular UI (filters, sorting, grouping by priority)
- ✅ Weekly calendar view (`/schedule/week`) with navigation, grid layout, and schedule rendering
- ✅ Navigation between `family`, `goals`, `commitments`, and `schedule` features

#### 🚧 Still Missing / To Improve:

1. 🚧 **Setup Flow:** Guided user onboarding experience (first-time flow across family + goals + schedule)
2. 🚧 **Schedule Generation UI polish:** Progress indicator, richer success/error feedback, and tighter integration with family/goals metadata

---

## 🚀 IMPLEMENTATION PHASES

### **PHASE 1: Family Members (Foundation)**

**Priority:** CRITICAL  
**Time:** 8-12 hours (1-2 days)  
**Why First:** Goals require family members to exist. Can't plan activities without knowing WHO.

#### Backend: Family Members API (4-6 hours)

**Files to create:**

```
libs/backend/feature-schedule/src/lib/
├── controllers/
│   └── family-member.controller.ts        (NEW)
├── services/
│   └── family-member.service.ts           (NEW)
├── dto/
│   ├── create-family-member.dto.ts        (NEW)
│   └── update-family-member.dto.ts        (NEW)
└── schedule.module.ts                     (UPDATE)
```

**Endpoints:**

```typescript
POST   /api/v1/family-members       // Create member
GET    /api/v1/family-members       // List all user's members
GET    /api/v1/family-members/:id   // Get single member
PATCH  /api/v1/family-members/:id   // Update member
DELETE /api/v1/family-members/:id   // Soft delete
```

**DTOs:**

**CreateFamilyMemberDto:**

```typescript
{
  name: string;              // required, 1-100 chars
  role: 'USER' | 'SPOUSE' | 'CHILD';  // required
  age?: number;              // required if role = CHILD, min 0, max 120
  preferences?: {            // optional JSONB
    interests?: string[];
    energyLevels?: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}
```

**UpdateFamilyMemberDto:**

```typescript
{
  name?: string;
  age?: number;
  preferences?: Record<string, any>;
}
```

**Validation Rules:**

- `name`: required, min 1, max 100 chars
- `role`: must be enum value ('USER', 'SPOUSE', 'CHILD')
- `age`: required when `role = 'CHILD'`, must be 0-120
- User can have max 10 family members
- Cannot delete last family member (must have at least 1)

**Business Logic:**

```typescript
// family-member.service.ts

@Injectable()
export class FamilyMemberService {
  constructor(
    @InjectRepository(FamilyMemberEntity)
    private readonly familyMemberRepo: Repository<FamilyMemberEntity>
  ) {}

  async create(userId: string, dto: CreateFamilyMemberDto): Promise<FamilyMemberEntity> {
    // Check limit
    const count = await this.familyMemberRepo.count({
      where: { userId, deletedAt: IsNull() },
    });
    if (count >= 10) {
      throw new BadRequestException('Maximum 10 family members allowed');
    }

    // Validate age for children
    if (dto.role === 'CHILD' && !dto.age) {
      throw new BadRequestException('Age is required for children');
    }

    const member = this.familyMemberRepo.create({
      userId,
      name: dto.name,
      role: dto.role,
      age: dto.age,
      preferences: dto.preferences || {},
    });

    return await this.familyMemberRepo.save(member);
  }

  async findAll(userId: string): Promise<FamilyMemberEntity[]> {
    return await this.familyMemberRepo.find({
      where: { userId, deletedAt: IsNull() },
      order: { role: 'ASC', name: 'ASC' },
    });
  }

  async findOne(userId: string, familyMemberId: string): Promise<FamilyMemberEntity> {
    const member = await this.familyMemberRepo.findOne({
      where: { familyMemberId, userId, deletedAt: IsNull() },
    });
    if (!member) {
      throw new NotFoundException('Family member not found');
    }
    return member;
  }

  async update(userId: string, familyMemberId: string, dto: UpdateFamilyMemberDto): Promise<FamilyMemberEntity> {
    const member = await this.findOne(userId, familyMemberId);
    Object.assign(member, dto);
    member.updatedAt = new Date();
    return await this.familyMemberRepo.save(member);
  }

  async remove(userId: string, familyMemberId: string): Promise<void> {
    // Check if last member
    const count = await this.familyMemberRepo.count({
      where: { userId, deletedAt: IsNull() },
    });
    if (count <= 1) {
      throw new BadRequestException('Cannot delete last family member');
    }

    const member = await this.findOne(userId, familyMemberId);
    member.deletedAt = new Date();
    await this.familyMemberRepo.save(member);
  }
}
```

**Controller:**

```typescript
// family-member.controller.ts

@Controller('family-members')
@UseGuards(JwtAuthGuard)
export class FamilyMemberController {
  constructor(private readonly familyMemberService: FamilyMemberService) {}

  @Post()
  async create(@Body() dto: CreateFamilyMemberDto, @Request() req: any): Promise<FamilyMemberEntity> {
    return await this.familyMemberService.create(req.user.userId, dto);
  }

  @Get()
  async findAll(@Request() req: any): Promise<FamilyMemberEntity[]> {
    return await this.familyMemberService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any): Promise<FamilyMemberEntity> {
    return await this.familyMemberService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateFamilyMemberDto, @Request() req: any): Promise<FamilyMemberEntity> {
    return await this.familyMemberService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    await this.familyMemberService.remove(req.user.userId, id);
  }
}
```

**Add to Module:**

```typescript
// schedule.module.ts

@Module({
  imports: [TypeOrmModule.forFeature([FamilyMemberEntity, RecurringGoalEntity, WeeklyScheduleEntity, TimeBlockEntity])],
  controllers: [
    ScheduleController,
    ScheduleGeneratorController,
    FamilyMemberController, // NEW
  ],
  providers: [
    ScheduleService,
    ScheduleGeneratorService,
    OpenAIService,
    FamilyMemberService, // NEW
  ],
  exports: [
    ScheduleService,
    FamilyMemberService, // NEW
  ],
})
export class ScheduleModule {}
```

**Testing (Postman/cURL):**

```bash
# Create family member
curl -X POST http://localhost:3000/api/v1/family-members \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dad",
    "role": "USER"
  }'

# List all members
curl http://localhost:3000/api/v1/family-members \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Frontend: Family Members UI (4-6 hours)

**Generate Library:**

```bash
npx nx generate @nx/angular:library data-access-family \
  --directory=libs/frontend/data-access-family \
  --importPath=@family-planner/frontend/data-access-family \
  --standalone \
  --tags=type:data-access,scope:frontend
```

**Files to create:**

```
libs/frontend/data-access-family/src/lib/
├── models/
│   └── family-member.model.ts         (NEW)
├── services/
│   └── family-api.service.ts          (NEW)
├── store/
│   └── family.store.ts                (NEW)
└── index.ts                           (UPDATE)
```

**Models:**

```typescript
// family-member.model.ts

export interface FamilyMember {
  familyMemberId: string;
  userId: string;
  name: string;
  role: 'USER' | 'SPOUSE' | 'CHILD';
  age?: number;
  preferences?: {
    interests?: string[];
    energyLevels?: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFamilyMemberRequest {
  name: string;
  role: 'USER' | 'SPOUSE' | 'CHILD';
  age?: number;
  preferences?: Record<string, any>;
}

export interface UpdateFamilyMemberRequest {
  name?: string;
  age?: number;
  preferences?: Record<string, any>;
}
```

**Service:**

```typescript
// family-api.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FamilyMember, CreateFamilyMemberRequest, UpdateFamilyMemberRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class FamilyApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/family-members';

  getMembers(): Observable<FamilyMember[]> {
    return this.http.get<FamilyMember[]>(this.apiUrl);
  }

  getMember(id: string): Observable<FamilyMember> {
    return this.http.get<FamilyMember>(`${this.apiUrl}/${id}`);
  }

  createMember(request: CreateFamilyMemberRequest): Observable<FamilyMember> {
    return this.http.post<FamilyMember>(this.apiUrl, request);
  }

  updateMember(id: string, request: UpdateFamilyMemberRequest): Observable<FamilyMember> {
    return this.http.patch<FamilyMember>(`${this.apiUrl}/${id}`, request);
  }

  deleteMember(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

**Store (Angular Signals):**

```typescript
// family.store.ts

import { Injectable, signal, computed, inject } from '@angular/core';
import { FamilyApiService } from '../services/family-api.service';
import { FamilyMember, CreateFamilyMemberRequest, UpdateFamilyMemberRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class FamilyStore {
  private readonly familyApi = inject(FamilyApiService);

  // State
  private readonly membersSignal = signal<FamilyMember[]>([]);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly members = this.membersSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computed
  readonly membersCount = computed(() => this.membersSignal().length);
  readonly hasMembers = computed(() => this.membersSignal().length > 0);
  readonly membersByRole = computed(() => {
    const members = this.membersSignal();
    return {
      user: members.filter((m) => m.role === 'USER'),
      spouse: members.filter((m) => m.role === 'SPOUSE'),
      children: members.filter((m) => m.role === 'CHILD'),
    };
  });

  // Actions
  async loadMembers(): Promise<void> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const members = await this.familyApi.getMembers().toPromise();
      this.membersSignal.set(members || []);
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to load family members');
      console.error('Failed to load family members:', error);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async createMember(request: CreateFamilyMemberRequest): Promise<FamilyMember | null> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const newMember = await this.familyApi.createMember(request).toPromise();
      if (newMember) {
        this.membersSignal.update((members) => [...members, newMember]);
        return newMember;
      }
      return null;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to create family member');
      console.error('Failed to create family member:', error);
      return null;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async updateMember(id: string, request: UpdateFamilyMemberRequest): Promise<FamilyMember | null> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const updatedMember = await this.familyApi.updateMember(id, request).toPromise();
      if (updatedMember) {
        this.membersSignal.update((members) => members.map((m) => (m.familyMemberId === id ? updatedMember : m)));
        return updatedMember;
      }
      return null;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to update family member');
      console.error('Failed to update family member:', error);
      return null;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async deleteMember(id: string): Promise<boolean> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      await this.familyApi.deleteMember(id).toPromise();
      this.membersSignal.update((members) => members.filter((m) => m.familyMemberId !== id));
      return true;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to delete family member');
      console.error('Failed to delete family member:', error);
      return false;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}
```

**Generate Feature Library:**

```bash
npx nx generate @nx/angular:library feature-family \
  --directory=libs/frontend/feature-family \
  --importPath=@family-planner/frontend/feature-family \
  --standalone \
  --routing \
  --tags=type:feature,scope:frontend
```

**Create Components:**

```
libs/frontend/feature-family/src/lib/
├── family-list/
│   ├── family-list.component.ts       (NEW)
│   ├── family-list.component.html     (NEW)
│   └── family-list.component.scss     (NEW)
├── family-member-card/
│   ├── family-member-card.component.ts    (NEW)
│   ├── family-member-card.component.html  (NEW)
│   └── family-member-card.component.scss  (NEW)
├── family-member-form/
│   ├── family-member-form.component.ts    (NEW)
│   ├── family-member-form.component.html  (NEW)
│   └── family-member-form.component.scss  (NEW)
├── lib.routes.ts                      (UPDATE)
└── index.ts                           (UPDATE)
```

**Component: Family List**

```typescript
// family-list.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FamilyStore } from '@family-planner/frontend/data-access-family';
import { FamilyMemberCardComponent } from '../family-member-card/family-member-card.component';

@Component({
  selector: 'fp-family-list',
  standalone: true,
  imports: [CommonModule, FamilyMemberCardComponent],
  templateUrl: './family-list.component.html',
  styleUrls: ['./family-list.component.scss'],
})
export class FamilyListComponent implements OnInit {
  private readonly familyStore = inject(FamilyStore);
  private readonly router = inject(Router);

  // Signals from store
  members = this.familyStore.members;
  membersByRole = this.familyStore.membersByRole;
  isLoading = this.familyStore.isLoading;
  error = this.familyStore.error;

  ngOnInit(): void {
    this.loadMembers();
  }

  async loadMembers(): Promise<void> {
    await this.familyStore.loadMembers();
  }

  onAddMember(): void {
    this.router.navigate(['/family/new']);
  }

  onEditMember(memberId: string): void {
    this.router.navigate(['/family/edit', memberId]);
  }

  async onDeleteMember(memberId: string): Promise<void> {
    if (confirm('Are you sure you want to remove this family member?')) {
      await this.familyStore.deleteMember(memberId);
    }
  }

  getRoleIcon(role: string): string {
    const icons = {
      USER: '👤',
      SPOUSE: '💑',
      CHILD: '👶',
    };
    return icons[role as keyof typeof icons] || '👤';
  }
}
```

**Template:**

```html
<!-- family-list.component.html -->

<div class="family-list-container">
  <header class="family-list-header">
    <h1>Family Members</h1>
    <button class="btn-primary" (click)="onAddMember()">+ Add Member</button>
  </header>

  <div *ngIf="isLoading()" class="loading-state">
    <p>Loading family members...</p>
  </div>

  <div *ngIf="error()" class="error-state">
    <p class="error-message">{{ error() }}</p>
    <button (click)="loadMembers()">Retry</button>
  </div>

  <div *ngIf="!isLoading() && !error()" class="family-list-content">
    <div *ngIf="members().length === 0" class="empty-state">
      <p>No family members yet. Add your first member to get started!</p>
      <button class="btn-primary" (click)="onAddMember()">Add Family Member</button>
    </div>

    <div *ngIf="members().length > 0" class="members-grid">
      <fp-family-member-card *ngFor="let member of members()" [member]="member" (edit)="onEditMember($event)" (delete)="onDeleteMember($event)" />
    </div>

    <div class="family-summary">
      <h3>Family Structure</h3>
      <ul>
        <li>Parents: {{ membersByRole().user.length + membersByRole().spouse.length }}</li>
        <li>Children: {{ membersByRole().children.length }}</li>
        <li>Total: {{ members().length }}</li>
      </ul>
    </div>
  </div>
</div>
```

**Component: Family Member Card**

```typescript
// family-member-card.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FamilyMember } from '@family-planner/frontend/data-access-family';

@Component({
  selector: 'fp-family-member-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './family-member-card.component.html',
  styleUrls: ['./family-member-card.component.scss'],
})
export class FamilyMemberCardComponent {
  @Input({ required: true }) member!: FamilyMember;
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  onEdit(): void {
    this.edit.emit(this.member.familyMemberId);
  }

  onDelete(): void {
    this.delete.emit(this.member.familyMemberId);
  }

  getRoleIcon(): string {
    const icons = {
      USER: '👤',
      SPOUSE: '💑',
      CHILD: '👶',
    };
    return icons[this.member.role] || '👤';
  }

  getRoleLabel(): string {
    return this.member.role.charAt(0) + this.member.role.slice(1).toLowerCase();
  }
}
```

**Template:**

```html
<!-- family-member-card.component.html -->

<div class="member-card">
  <div class="member-card-header">
    <span class="role-icon">{{ getRoleIcon() }}</span>
    <div class="member-actions">
      <button class="btn-icon" (click)="onEdit()" title="Edit">✏️</button>
      <button class="btn-icon" (click)="onDelete()" title="Delete">🗑️</button>
    </div>
  </div>

  <div class="member-card-body">
    <h3>{{ member.name }}</h3>
    <p class="role">{{ getRoleLabel() }}</p>
    <p *ngIf="member.age" class="age">Age: {{ member.age }}</p>

    <div *ngIf="member.preferences?.interests?.length" class="interests">
      <strong>Interests:</strong>
      <ul>
        <li *ngFor="let interest of member.preferences.interests">{{ interest }}</li>
      </ul>
    </div>
  </div>
</div>
```

**Component: Family Member Form**

```typescript
// family-member-form.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FamilyStore } from '@family-planner/frontend/data-access-family';

@Component({
  selector: 'fp-family-member-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './family-member-form.component.html',
  styleUrls: ['./family-member-form.component.scss'],
})
export class FamilyMemberFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly familyStore = inject(FamilyStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  memberId: string | null = null;
  isEditMode = false;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    role: ['USER', Validators.required],
    age: [null as number | null],
    interests: [''],
  });

  roles = [
    { value: 'USER', label: 'Parent (You)' },
    { value: 'SPOUSE', label: 'Spouse/Partner' },
    { value: 'CHILD', label: 'Child' },
  ];

  ngOnInit(): void {
    this.memberId = this.route.snapshot.paramMap.get('id');
    if (this.memberId) {
      this.isEditMode = true;
      this.loadMember(this.memberId);
    }

    // Conditional age validation
    this.form.get('role')?.valueChanges.subscribe((role) => {
      const ageControl = this.form.get('age');
      if (role === 'CHILD') {
        ageControl?.setValidators([Validators.required, Validators.min(0), Validators.max(120)]);
      } else {
        ageControl?.clearValidators();
      }
      ageControl?.updateValueAndValidity();
    });
  }

  async loadMember(id: string): Promise<void> {
    const members = this.familyStore.members();
    const member = members.find((m) => m.familyMemberId === id);
    if (member) {
      this.form.patchValue({
        name: member.name,
        role: member.role,
        age: member.age || null,
        interests: member.preferences?.interests?.join(', ') || '',
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
      name: formValue.name!,
      role: formValue.role as 'USER' | 'SPOUSE' | 'CHILD',
      age: formValue.age || undefined,
      preferences: {
        interests: formValue.interests
          ? formValue.interests
              .split(',')
              .map((i) => i.trim())
              .filter(Boolean)
          : [],
      },
    };

    let result;
    if (this.isEditMode && this.memberId) {
      result = await this.familyStore.updateMember(this.memberId, request);
    } else {
      result = await this.familyStore.createMember(request);
    }

    if (result) {
      this.router.navigate(['/family']);
    }
  }

  onCancel(): void {
    this.router.navigate(['/family']);
  }
}
```

**Template:**

```html
<!-- family-member-form.component.html -->

<div class="member-form-container">
  <h1>{{ isEditMode ? 'Edit' : 'Add' }} Family Member</h1>

  <form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="form-group">
      <label for="name">Name *</label>
      <input id="name" type="text" formControlName="name" placeholder="Enter name" />
      <div class="error" *ngIf="form.get('name')?.invalid && form.get('name')?.touched">Name is required</div>
    </div>

    <div class="form-group">
      <label for="role">Role *</label>
      <select id="role" formControlName="role">
        <option *ngFor="let role of roles" [value]="role.value">{{ role.label }}</option>
      </select>
    </div>

    <div class="form-group" *ngIf="form.get('role')?.value === 'CHILD'">
      <label for="age">Age *</label>
      <input id="age" type="number" formControlName="age" placeholder="Enter age" min="0" max="120" />
      <div class="error" *ngIf="form.get('age')?.invalid && form.get('age')?.touched">Age is required for children</div>
    </div>

    <div class="form-group">
      <label for="interests">Interests (comma-separated)</label>
      <input id="interests" type="text" formControlName="interests" placeholder="e.g., Sports, Reading, Music" />
    </div>

    <div class="form-actions">
      <button type="button" class="btn-secondary" (click)="onCancel()">Cancel</button>
      <button type="submit" class="btn-primary" [disabled]="form.invalid">{{ isEditMode ? 'Update' : 'Create' }} Member</button>
    </div>
  </form>
</div>
```

**Routes:**

```typescript
// lib.routes.ts

import { Route } from '@angular/router';
import { FamilyListComponent } from './family-list/family-list.component';
import { FamilyMemberFormComponent } from './family-member-form/family-member-form.component';

export const familyRoutes: Route[] = [
  {
    path: '',
    component: FamilyListComponent,
  },
  {
    path: 'new',
    component: FamilyMemberFormComponent,
  },
  {
    path: 'edit/:id',
    component: FamilyMemberFormComponent,
  },
];
```

**Add to App Routes:**

```typescript
// apps/frontend/src/app/app.routes.ts

{
  path: 'family',
  loadChildren: () =>
    import('@family-planner/frontend/feature-family').then(m => m.familyRoutes),
  canActivate: [authGuard],
},
```

**Basic Styles (optional):**

```scss
// family-list.component.scss

.family-list-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.family-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h1 {
    margin: 0;
  }
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.empty-state,
.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
  border: 2px dashed #ddd;
  border-radius: 8px;
}

.family-summary {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;

  h3 {
    margin-top: 0;
  }

  ul {
    list-style: none;
    padding: 0;

    li {
      padding: 0.5rem 0;
    }
  }
}
```

```scss
// family-member-card.component.scss

.member-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  background: white;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
}

.member-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  .role-icon {
    font-size: 2rem;
  }

  .member-actions {
    display: flex;
    gap: 0.5rem;
  }
}

.member-card-body {
  h3 {
    margin: 0 0 0.5rem;
  }

  .role {
    color: #666;
    font-size: 0.9rem;
    margin: 0.25rem 0;
  }

  .age {
    color: #888;
    font-size: 0.85rem;
  }

  .interests {
    margin-top: 1rem;

    strong {
      display: block;
      margin-bottom: 0.5rem;
    }

    ul {
      list-style: none;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;

      li {
        background: #e3f2fd;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.85rem;
      }
    }
  }
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;

  &:hover {
    opacity: 0.7;
  }
}
```

**Acceptance Criteria for Phase 1:**

- [x] Backend: All family member CRUD endpoints working
- [x] Backend: Validation enforced (age for children, max 10 members, etc.)
- [x] Backend: Authorization working (users only see their own members)
- [x] Frontend: Can list all family members
- [x] Frontend: Can create new family member with form validation
- [x] Frontend: Can edit existing family member
- [x] Frontend: Can delete family member (with confirmation)
- [x] Frontend: Loading and error states displayed
- [x] Frontend: Responsive design (mobile-friendly)

---

### **PHASE 2: Recurring Goals (Foundation)**

**Priority:** CRITICAL  
**Time:** 8-12 hours (1-2 days)  
**Why Second:** Goals define WHAT activities to schedule. Requires family members to exist first.

#### Backend: Recurring Goals API (4-6 hours)

**Files to create:**

```
libs/backend/feature-schedule/src/lib/
├── controllers/
│   └── recurring-goal.controller.ts        (NEW)
├── services/
│   └── recurring-goal.service.ts           (NEW)
├── dto/
│   ├── create-recurring-goal.dto.ts        (NEW)
│   ├── update-recurring-goal.dto.ts        (NEW)
│   └── query-recurring-goals.dto.ts        (NEW)
└── schedule.module.ts                      (UPDATE)
```

**Endpoints:**

```typescript
POST   /api/v1/recurring-goals       // Create goal
GET    /api/v1/recurring-goals       // List goals (with filters)
GET    /api/v1/recurring-goals/:id   // Get single goal
PATCH  /api/v1/recurring-goals/:id   // Update goal
DELETE /api/v1/recurring-goals/:id   // Soft delete
```

**DTOs:**

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
  priority?: number;          // Filter by priority (0, 1, 2)
  sortBy?: 'name' | 'priority' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}
```

**Service Implementation:**

```typescript
// recurring-goal.service.ts

@Injectable()
export class RecurringGoalService {
  constructor(
    @InjectRepository(RecurringGoalEntity)
    private readonly goalRepo: Repository<RecurringGoalEntity>,
    @InjectRepository(FamilyMemberEntity)
    private readonly familyMemberRepo: Repository<FamilyMemberEntity>
  ) {}

  async create(userId: string, dto: CreateRecurringGoalDto): Promise<RecurringGoalEntity> {
    // Validate family member belongs to user
    await this.validateFamilyMemberAccess(userId, dto.familyMemberId);

    // Check limit (max 50 goals per user)
    const count = await this.goalRepo.count({
      where: {
        familyMember: { userId },
        deletedAt: IsNull(),
      },
      relations: ['familyMember'],
    });
    if (count >= 50) {
      throw new BadRequestException('Maximum 50 recurring goals allowed');
    }

    const goal = this.goalRepo.create({
      familyMemberId: dto.familyMemberId,
      name: dto.name,
      description: dto.description,
      frequencyPerWeek: dto.frequencyPerWeek,
      preferredDurationMinutes: dto.preferredDurationMinutes,
      preferredTimeOfDay: dto.preferredTimeOfDay || [],
      priority: dto.priority,
      rules: dto.rules || {},
    });

    return await this.goalRepo.save(goal);
  }

  async findAll(userId: string, query: QueryRecurringGoalsDto): Promise<RecurringGoalEntity[]> {
    const queryBuilder = this.goalRepo.createQueryBuilder('goal').leftJoinAndSelect('goal.familyMember', 'member').where('member.user_id = :userId', { userId }).andWhere('goal.deleted_at IS NULL').andWhere('member.deleted_at IS NULL');

    // Apply filters
    if (query.familyMemberId) {
      queryBuilder.andWhere('goal.family_member_id = :familyMemberId', {
        familyMemberId: query.familyMemberId,
      });
    }

    if (query.priority !== undefined) {
      queryBuilder.andWhere('goal.priority = :priority', { priority: query.priority });
    }

    // Apply sorting
    const sortBy = query.sortBy || 'priority';
    const sortOrder = query.sortOrder || 'DESC';

    if (sortBy === 'name') {
      queryBuilder.orderBy('goal.name', sortOrder);
    } else if (sortBy === 'priority') {
      queryBuilder.orderBy('goal.priority', sortOrder);
    } else {
      queryBuilder.orderBy('goal.created_at', sortOrder);
    }

    return await queryBuilder.getMany();
  }

  async findOne(userId: string, goalId: string): Promise<RecurringGoalEntity> {
    const goal = await this.goalRepo.findOne({
      where: {
        goalId,
        deletedAt: IsNull(),
        familyMember: { userId, deletedAt: IsNull() },
      },
      relations: ['familyMember'],
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  async update(userId: string, goalId: string, dto: UpdateRecurringGoalDto): Promise<RecurringGoalEntity> {
    const goal = await this.findOne(userId, goalId);

    Object.assign(goal, dto);
    goal.updatedAt = new Date();

    return await this.goalRepo.save(goal);
  }

  async remove(userId: string, goalId: string): Promise<void> {
    const goal = await this.findOne(userId, goalId);
    goal.deletedAt = new Date();
    await this.goalRepo.save(goal);
  }

  private async validateFamilyMemberAccess(userId: string, familyMemberId: string): Promise<void> {
    const member = await this.familyMemberRepo.findOne({
      where: {
        familyMemberId,
        userId,
        deletedAt: IsNull(),
      },
    });

    if (!member) {
      throw new NotFoundException('Family member not found or access denied');
    }
  }
}
```

**Controller:**

```typescript
// recurring-goal.controller.ts

@Controller('recurring-goals')
@UseGuards(JwtAuthGuard)
export class RecurringGoalController {
  constructor(private readonly goalService: RecurringGoalService) {}

  @Post()
  async create(@Body() dto: CreateRecurringGoalDto, @Request() req: any): Promise<RecurringGoalEntity> {
    return await this.goalService.create(req.user.userId, dto);
  }

  @Get()
  async findAll(@Query() query: QueryRecurringGoalsDto, @Request() req: any): Promise<RecurringGoalEntity[]> {
    return await this.goalService.findAll(req.user.userId, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any): Promise<RecurringGoalEntity> {
    return await this.goalService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRecurringGoalDto, @Request() req: any): Promise<RecurringGoalEntity> {
    return await this.goalService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    await this.goalService.remove(req.user.userId, id);
  }
}
```

**Add to Module:**

```typescript
// schedule.module.ts

@Module({
  imports: [TypeOrmModule.forFeature([FamilyMemberEntity, RecurringGoalEntity, WeeklyScheduleEntity, TimeBlockEntity])],
  controllers: [
    ScheduleController,
    ScheduleGeneratorController,
    FamilyMemberController,
    RecurringGoalController, // NEW
  ],
  providers: [
    ScheduleService,
    ScheduleGeneratorService,
    OpenAIService,
    FamilyMemberService,
    RecurringGoalService, // NEW
  ],
  exports: [
    ScheduleService,
    FamilyMemberService,
    RecurringGoalService, // NEW
  ],
})
export class ScheduleModule {}
```

---

#### Frontend: Recurring Goals UI (4-6 hours)

**Generate Library:**

```bash
npx nx generate @nx/angular:library data-access-goals \
  --directory=libs/frontend/data-access-goals \
  --importPath=@family-planner/frontend/data-access-goals \
  --standalone \
  --tags=type:data-access,scope:frontend
```

**Files structure:**

```
libs/frontend/data-access-goals/src/lib/
├── models/
│   └── recurring-goal.model.ts
├── services/
│   └── goals-api.service.ts
├── store/
│   └── goals.store.ts
└── index.ts
```

**Models:**

```typescript
// recurring-goal.model.ts

export interface RecurringGoal {
  goalId: string;
  familyMemberId: string;
  name: string;
  description?: string;
  frequencyPerWeek: number;
  preferredDurationMinutes: number;
  preferredTimeOfDay?: string[];
  priority: number; // 0=LOW, 1=MEDIUM, 2=HIGH
  rules?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGoalRequest {
  familyMemberId: string;
  name: string;
  description?: string;
  frequencyPerWeek: number;
  preferredDurationMinutes: number;
  preferredTimeOfDay?: string[];
  priority: number;
  rules?: Record<string, any>;
}

export interface UpdateGoalRequest {
  name?: string;
  description?: string;
  frequencyPerWeek?: number;
  preferredDurationMinutes?: number;
  preferredTimeOfDay?: string[];
  priority?: number;
  rules?: Record<string, any>;
}

export interface QueryGoalsParams {
  familyMemberId?: string;
  priority?: number;
  sortBy?: 'name' | 'priority' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}
```

**Service:**

```typescript
// goals-api.service.ts

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

**Store:**

```typescript
// goals.store.ts

import { Injectable, signal, computed, inject } from '@angular/core';
import { GoalsApiService } from '../services/goals-api.service';
import { RecurringGoal, CreateGoalRequest, UpdateGoalRequest, QueryGoalsParams } from '../models';

@Injectable({ providedIn: 'root' })
export class GoalsStore {
  private readonly goalsApi = inject(GoalsApiService);

  // State
  private readonly goalsSignal = signal<RecurringGoal[]>([]);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly goals = this.goalsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computed
  readonly goalsCount = computed(() => this.goalsSignal().length);
  readonly hasGoals = computed(() => this.goalsSignal().length > 0);

  readonly goalsByPriority = computed(() => {
    const goals = this.goalsSignal();
    return {
      high: goals.filter((g) => g.priority === 2),
      medium: goals.filter((g) => g.priority === 1),
      low: goals.filter((g) => g.priority === 0),
    };
  });

  readonly goalsByMember = computed(() => {
    const goals = this.goalsSignal();
    const grouped = new Map<string, RecurringGoal[]>();
    goals.forEach((goal) => {
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
        this.goalsSignal.update((goals) => [...goals, newGoal]);
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
        this.goalsSignal.update((goals) => goals.map((g) => (g.goalId === goalId ? updatedGoal : g)));
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
      this.goalsSignal.update((goals) => goals.filter((g) => g.goalId !== goalId));
      return true;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to delete goal');
      console.error('Failed to delete goal:', error);
      return false;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}
```

**Generate Feature Library:**

```bash
npx nx generate @nx/angular:library feature-goals \
  --directory=libs/frontend/feature-goals \
  --importPath=@family-planner/frontend/feature-goals \
  --standalone \
  --routing \
  --tags=type:feature,scope:frontend
```

**Components structure:**

```
libs/frontend/feature-goals/src/lib/
├── goals-list/
│   ├── goals-list.component.ts
│   ├── goals-list.component.html
│   └── goals-list.component.scss
├── goal-card/
│   ├── goal-card.component.ts
│   ├── goal-card.component.html
│   └── goal-card.component.scss
├── goal-form/
│   ├── goal-form.component.ts
│   ├── goal-form.component.html
│   └── goal-form.component.scss
├── lib.routes.ts
└── index.ts
```

**Component: Goals List**

```typescript
// goals-list.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GoalsStore } from '@family-planner/frontend/data-access-goals';
import { FamilyStore } from '@family-planner/frontend/data-access-family';
import { GoalCardComponent } from '../goal-card/goal-card.component';

@Component({
  selector: 'fp-goals-list',
  standalone: true,
  imports: [CommonModule, GoalCardComponent],
  templateUrl: './goals-list.component.html',
  styleUrls: ['./goals-list.component.scss'],
})
export class GoalsListComponent implements OnInit {
  private readonly goalsStore = inject(GoalsStore);
  private readonly familyStore = inject(FamilyStore);
  private readonly router = inject(Router);

  // Signals from stores
  goals = this.goalsStore.goals;
  goalsByPriority = this.goalsStore.goalsByPriority;
  isLoading = this.goalsStore.isLoading;
  error = this.goalsStore.error;
  members = this.familyStore.members;

  // Local state for filtering
  filterMemberId = signal<string | null>(null);
  sortBy = signal<'name' | 'priority' | 'createdAt'>('priority');
  sortOrder = signal<'ASC' | 'DESC'>('DESC');

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    await this.familyStore.loadMembers();
    await this.loadGoals();
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

  onSortChange(sortBy: 'name' | 'priority' | 'createdAt'): void {
    this.sortBy.set(sortBy);
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

  getMemberName(memberId: string): string {
    const member = this.members().find((m) => m.familyMemberId === memberId);
    return member?.name || 'Unknown';
  }
}
```

**Template:**

```html
<!-- goals-list.component.html -->

<div class="goals-list-container">
  <header class="goals-list-header">
    <h1>Recurring Goals & Activities</h1>
    <button class="btn-primary" (click)="onAddGoal()">+ Add Goal</button>
  </header>

  <div class="filters-bar">
    <div class="filter-group">
      <label>Filter by Member:</label>
      <select (change)="onFilterChange($any($event.target).value || null)">
        <option value="">All Members</option>
        <option *ngFor="let member of members()" [value]="member.familyMemberId">{{ member.name }}</option>
      </select>
    </div>

    <div class="filter-group">
      <label>Sort by:</label>
      <select [value]="sortBy()" (change)="onSortChange($any($event.target).value)">
        <option value="priority">Priority</option>
        <option value="name">Name</option>
        <option value="createdAt">Date Created</option>
      </select>
    </div>
  </div>

  <div *ngIf="isLoading()" class="loading-state">
    <p>Loading goals...</p>
  </div>

  <div *ngIf="error()" class="error-state">
    <p class="error-message">{{ error() }}</p>
    <button (click)="loadGoals()">Retry</button>
  </div>

  <div *ngIf="!isLoading() && !error()" class="goals-content">
    <div *ngIf="goals().length === 0" class="empty-state">
      <p>No goals yet. Add your first goal to get started!</p>
      <button class="btn-primary" (click)="onAddGoal()">Add Goal</button>
    </div>

    <div *ngIf="goals().length > 0">
      <!-- High Priority -->
      <div *ngIf="goalsByPriority().high.length > 0" class="priority-section">
        <h2>⚠️ High Priority</h2>
        <div class="goals-grid">
          <fp-goal-card *ngFor="let goal of goalsByPriority().high" [goal]="goal" [memberName]="getMemberName(goal.familyMemberId)" (edit)="onEditGoal($event)" (delete)="onDeleteGoal($event)" />
        </div>
      </div>

      <!-- Medium Priority -->
      <div *ngIf="goalsByPriority().medium.length > 0" class="priority-section">
        <h2>⚡ Medium Priority</h2>
        <div class="goals-grid">
          <fp-goal-card *ngFor="let goal of goalsByPriority().medium" [goal]="goal" [memberName]="getMemberName(goal.familyMemberId)" (edit)="onEditGoal($event)" (delete)="onDeleteGoal($event)" />
        </div>
      </div>

      <!-- Low Priority -->
      <div *ngIf="goalsByPriority().low.length > 0" class="priority-section">
        <h2>💡 Low Priority</h2>
        <div class="goals-grid">
          <fp-goal-card *ngFor="let goal of goalsByPriority().low" [goal]="goal" [memberName]="getMemberName(goal.familyMemberId)" (edit)="onEditGoal($event)" (delete)="onDeleteGoal($event)" />
        </div>
      </div>
    </div>
  </div>
</div>
```

**Component: Goal Card**

```typescript
// goal-card.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecurringGoal } from '@family-planner/frontend/data-access-goals';

@Component({
  selector: 'fp-goal-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './goal-card.component.html',
  styleUrls: ['./goal-card.component.scss'],
})
export class GoalCardComponent {
  @Input({ required: true }) goal!: RecurringGoal;
  @Input({ required: true }) memberName!: string;
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
    const colors = { 0: '#4caf50', 1: '#ff9800', 2: '#f44336' };
    return colors[this.goal.priority as keyof typeof colors] || '#999';
  }
}
```

**Template:**

```html
<!-- goal-card.component.html -->

<div class="goal-card" [style.border-left-color]="getPriorityColor()">
  <div class="goal-card-header">
    <h3>{{ goal.name }}</h3>
    <div class="actions">
      <button class="btn-icon" (click)="onEdit()" title="Edit">✏️</button>
      <button class="btn-icon" (click)="onDelete()" title="Delete">🗑️</button>
    </div>
  </div>

  <div class="goal-card-body">
    <p *ngIf="goal.description" class="description">{{ goal.description }}</p>

    <div class="goal-details">
      <div class="detail-item"><strong>Member:</strong> {{ memberName }}</div>
      <div class="detail-item"><strong>Frequency:</strong> {{ goal.frequencyPerWeek }}x per week</div>
      <div class="detail-item"><strong>Duration:</strong> {{ goal.preferredDurationMinutes }} minutes</div>
      <div class="detail-item" *ngIf="goal.preferredTimeOfDay && goal.preferredTimeOfDay.length > 0"><strong>Time:</strong> {{ goal.preferredTimeOfDay.join(', ') }}</div>
      <div class="detail-item">
        <strong>Priority:</strong>
        <span class="priority-badge" [style.background-color]="getPriorityColor()"> {{ getPriorityLabel() }} </span>
      </div>
    </div>
  </div>
</div>
```

**Component: Goal Form**

```typescript
// goal-form.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { GoalsStore } from '@family-planner/frontend/data-access-goals';
import { FamilyStore } from '@family-planner/frontend/data-access-family';

@Component({
  selector: 'fp-goal-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './goal-form.component.html',
  styleUrls: ['./goal-form.component.scss'],
})
export class GoalFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly goalsStore = inject(GoalsStore);
  private readonly familyStore = inject(FamilyStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  goalId: string | null = null;
  isEditMode = false;

  members = this.familyStore.members;
  isLoading = this.goalsStore.isLoading;

  form = this.fb.group({
    familyMemberId: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', Validators.maxLength(500)],
    frequencyPerWeek: [3, [Validators.required, Validators.min(1), Validators.max(14)]],
    preferredDurationMinutes: [30, [Validators.required, Validators.min(15), Validators.max(480)]],
    preferredTimeOfDay: [[] as string[]],
    priority: [1, [Validators.required, Validators.min(0), Validators.max(2)]],
  });

  timeOfDayOptions = [
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening', label: 'Evening' },
  ];

  priorityOptions = [
    { value: 0, label: 'Low', color: '#4caf50' },
    { value: 1, label: 'Medium', color: '#ff9800' },
    { value: 2, label: 'High', color: '#f44336' },
  ];

  ngOnInit(): void {
    this.familyStore.loadMembers();

    this.goalId = this.route.snapshot.paramMap.get('id');
    if (this.goalId) {
      this.isEditMode = true;
      this.loadGoal(this.goalId);
    }
  }

  async loadGoal(id: string): Promise<void> {
    const goals = this.goalsStore.goals();
    const goal = goals.find((g) => g.goalId === id);
    if (goal) {
      this.form.patchValue({
        familyMemberId: goal.familyMemberId,
        name: goal.name,
        description: goal.description || '',
        frequencyPerWeek: goal.frequencyPerWeek,
        preferredDurationMinutes: goal.preferredDurationMinutes,
        preferredTimeOfDay: goal.preferredTimeOfDay || [],
        priority: goal.priority,
      });
    }
  }

  onTimeOfDayChange(value: string, checked: boolean): void {
    const current = this.form.value.preferredTimeOfDay || [];
    if (checked) {
      this.form.patchValue({
        preferredTimeOfDay: [...current, value],
      });
    } else {
      this.form.patchValue({
        preferredTimeOfDay: current.filter((v) => v !== value),
      });
    }
  }

  isTimeOfDaySelected(value: string): boolean {
    return (this.form.value.preferredTimeOfDay || []).includes(value);
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

**Template:**

```html
<!-- goal-form.component.html -->

<div class="goal-form-container">
  <h1>{{ isEditMode ? 'Edit' : 'Add' }} Recurring Goal</h1>

  <form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="form-group">
      <label for="familyMemberId">Family Member *</label>
      <select id="familyMemberId" formControlName="familyMemberId">
        <option value="">Select a member</option>
        <option *ngFor="let member of members()" [value]="member.familyMemberId">{{ member.name }}</option>
      </select>
      <div class="error" *ngIf="form.get('familyMemberId')?.invalid && form.get('familyMemberId')?.touched">Please select a family member</div>
    </div>

    <div class="form-group">
      <label for="name">Goal Name *</label>
      <input id="name" type="text" formControlName="name" placeholder="e.g., Morning Workout, Piano Practice" />
      <div class="error" *ngIf="form.get('name')?.invalid && form.get('name')?.touched">Name is required (max 200 characters)</div>
    </div>

    <div class="form-group">
      <label for="description">Description</label>
      <textarea id="description" formControlName="description" rows="3" placeholder="Optional details about this goal..."></textarea>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="frequencyPerWeek">Times per Week *</label>
        <input id="frequencyPerWeek" type="number" formControlName="frequencyPerWeek" min="1" max="14" />
        <div class="error" *ngIf="form.get('frequencyPerWeek')?.invalid && form.get('frequencyPerWeek')?.touched">Must be between 1 and 14</div>
      </div>

      <div class="form-group">
        <label for="preferredDurationMinutes">Duration (minutes) *</label>
        <input id="preferredDurationMinutes" type="number" formControlName="preferredDurationMinutes" min="15" max="480" />
        <div class="error" *ngIf="form.get('preferredDurationMinutes')?.invalid && form.get('preferredDurationMinutes')?.touched">Must be between 15 and 480 minutes</div>
      </div>
    </div>

    <div class="form-group">
      <label>Preferred Time of Day</label>
      <div class="checkbox-group">
        <label *ngFor="let option of timeOfDayOptions" class="checkbox-label">
          <input type="checkbox" [checked]="isTimeOfDaySelected(option.value)" (change)="onTimeOfDayChange(option.value, $any($event.target).checked)" />
          {{ option.label }}
        </label>
      </div>
    </div>

    <div class="form-group">
      <label>Priority *</label>
      <div class="radio-group">
        <label *ngFor="let option of priorityOptions" class="radio-label">
          <input type="radio" name="priority" [value]="option.value" formControlName="priority" />
          <span [style.color]="option.color">{{ option.label }}</span>
        </label>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn-secondary" (click)="onCancel()">Cancel</button>
      <button type="submit" class="btn-primary" [disabled]="form.invalid || isLoading()">{{ isEditMode ? 'Update' : 'Create' }} Goal</button>
    </div>
  </form>
</div>
```

**Routes:**

```typescript
// lib.routes.ts

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

**Add to App Routes:**

```typescript
// apps/frontend/src/app/app.routes.ts

{
  path: 'goals',
  loadChildren: () =>
    import('@family-planner/frontend/feature-goals').then(m => m.goalsRoutes),
  canActivate: [authGuard],
},
```

**Acceptance Criteria for Phase 2:**

- [x] Backend: All recurring goals CRUD endpoints working
- [x] Backend: Validation enforced (frequency, duration, priority, family member access)
- [x] Backend: Filtering and sorting working
- [x] Frontend: Can list all goals (filtered/sorted)
- [x] Frontend: Can create new goal with validation
- [x] Frontend: Can edit existing goal
- [x] Frontend: Can delete goal (with confirmation)
- [x] Frontend: Goals grouped by priority
- [x] Frontend: Loading and error states displayed

---

### **PHASE 3: Setup/Onboarding Flow**

**Priority:** HIGH  
**Time:** 4-6 hours  
**Why:** Provide guided first-time user experience

**Create simple onboarding that guides users through:**

1. Adding at least one family member
2. Adding at least one goal
3. Proceeding to schedule generation

**This will be a simplified version - full implementation details available upon request.**

---

### **PHASE 4: Schedule Generation (Already Exists)**

**Priority:** HIGH  
**Time:** 2-4 hours (enhancement only)  
**Status:** ✅ Mostly done, needs UI improvements

**What's already working:**

- ✅ Backend endpoint: `POST /api/v1/schedule-generator`
- ✅ Mock generation algorithm
- ✅ ScheduleStore in frontend
- ✅ Basic generation from dashboard

**What needs work:**

- Better generation UI (not just a button)
- Progress indicator
- Success/error feedback
- Better integration with family/goals data

---

### **PHASE 5: Calendar View**

**Priority:** HIGH  
**Time:** 8-12 hours  
**Why:** Users need to SEE the generated schedule

**Create weekly calendar component that:**

- Displays time blocks in a grid
- Shows 7 days (Monday-Sunday)
- Color-coded by block type
- Click to view details
- Week navigation
- Responsive design

**Full implementation details available upon request.**

---

## 🎯 ACCEPTANCE CRITERIA (Overall MVP)

### Must Have (Phase 1 MVP):

- [x] User can register and login
- [x] User can add/edit/delete family members
- [x] User can add/edit/delete recurring goals
- [x] User can generate a weekly schedule
- [x] User can view generated schedule in calendar
- [x] All CRUD operations work correctly (family members, recurring goals, schedule generation)
- [x] Authorization prevents accessing other users' data (JWT + RLS + per-user queries)
- [x] Loading states displayed during operations (family/goals stores + schedule UI)
- [x] Error messages displayed when operations fail (family/goals stores + schedule UI)

### Nice to Have (Post-MVP):

- [ ] Onboarding flow for new users
- [ ] Edit generated schedule (drag & drop)
- [ ] Conflict detection and warnings
- [ ] OpenAI integration (instead of mock algorithm)
- [ ] Multiple schedule versions/history
- [ ] Export schedule (PDF, iCal)
- [ ] Mobile-optimized views
- [ ] Dark mode

---

## 📊 TIME ESTIMATE SUMMARY

| Phase                         | Backend    | Frontend   | Total      |
| ----------------------------- | ---------- | ---------- | ---------- |
| Phase 1: Family Members       | 4-6h       | 4-6h       | 8-12h      |
| Phase 2: Recurring Goals      | 4-6h       | 4-6h       | 8-12h      |
| Phase 3: Onboarding Flow      | -          | 4-6h       | 4-6h       |
| Phase 4: Generation (enhance) | 1-2h       | 2-3h       | 3-5h       |
| Phase 5: Calendar View        | 2-3h       | 6-9h       | 8-12h      |
| **TOTAL**                     | **11-17h** | **20-30h** | **35-50h** |

**Estimated Calendar Time:** 5-7 days (assuming 6-8 hours/day)

---

## 🚀 IMPLEMENTATION APPROACH

### Recommended: **Phase-by-Phase (Safest)**

**Day 1-2:** Phase 1 (Family Members)

- Morning: Backend API
- Afternoon: Frontend UI
- Test end-to-end

**Day 2-3:** Phase 2 (Recurring Goals)

- Morning: Backend API
- Afternoon: Frontend UI
- Test end-to-end

**Day 4:** Phase 3 (Onboarding) + Phase 4 (Generation Enhancement)

- Morning: Onboarding flow
- Afternoon: Better generation UI

**Day 5-6:** Phase 5 (Calendar View)

- Full days: Calendar component development

**Day 7:** Integration & Polish

- Bug fixes
- Performance improvements
- Documentation

### Alternative: **Backend First, Then Frontend**

**Days 1-2:** All Backend

- Family Members API
- Recurring Goals API
- Test with Postman/cURL

**Days 3-6:** All Frontend

- Family UI
- Goals UI
- Onboarding
- Calendar

**Day 7:** Integration & Polish

---

## 📝 NEXT STEPS

**Ready to implement! Which approach do you prefer?**

1. **Phase-by-Phase** (Recommended) - Build each feature completely before moving to next
2. **Backend First** - Complete all APIs first, then all UI
3. **Custom** - Tell me which parts you want to prioritize

**I can start implementing immediately!** 🚀

---

**Last Updated:** 2026-01-27  
**Status:** Phases 1, 2, 4, 5 Implemented; Phase 3 (Onboarding) Pending  
**Priority:** HIGH (Phase 1 MVP)
**Depends On:** Authentication ✅, Database Schema ✅, TypeORM Entities ✅
