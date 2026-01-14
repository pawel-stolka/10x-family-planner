# Plan Implementacji Widoku Week Grid Calendar

## 1. Przegląd

Widok Week Grid Calendar to desktopowy kalendarz tygodniowy w formie siatki (7 dni × dynamiczne sloty godzinowe), który umożliwia rodzinie wizualizację wszystkich zobowiązań, aktywności i posiłków w jednym miejscu. Widok obsługuje kolorowe rozróżnienie członków rodziny, filtrowanie, detekcję konfliktów oraz interakcje (tooltips, modal). Zoptymalizowany pod kątem wydajności z wykorzystaniem Angular signals, OnPush change detection i lazy rendering.

## 2. Routing widoku

```typescript
{
  path: 'schedule/week',
  component: WeekViewContainerComponent,
  canActivate: [AuthGuard]
}
```

Alternatywnie jako domyślny widok po zalogowaniu:

```typescript
{
  path: 'schedule',
  redirectTo: 'schedule/week',
  pathMatch: 'full'
}
```

## 3. Struktura komponentów

```
WeekViewContainerComponent (kontener, routing)
├── MemberFilterComponent (przyciski filtrowania)
├── MemberLegendComponent (legenda kolorów)
├── WeekGridComponent (główna siatka CSS Grid)
│   ├── GridHeaderComponent (nagłówki dni)
│   ├── TimeColumnComponent (kolumna czasowa)
│   └── GridCellComponent (pojedyncza komórka, ~224+ instancji)
│       └── ActivityCellComponent (aktywność w komórce, wielokrotne)
│           └── ActivityTooltipComponent (tooltip przy hover)
└── ActivityDetailModalComponent (modal szczegółów)
```

**Hierarchia**:

- Container → zarządza stanem i logiką biznesową
- Filter/Legend → sticky UI controls
- Grid → renderowanie siatki z optymalizacjami
- Cell/Activity → niskopoziomowe komponenty prezentacji

## 4. Szczegóły komponentów

### 4.1. WeekViewContainerComponent

**Opis**: Główny kontener zarządzający stanem widoku, pobieraniem danych i logiką biznesową.

**Główne elementy**:

```html
<div class="week-view-container">
  <div class="week-view-header">
    <h1>Tydzień {{ weekStartDate | date:'dd.MM' }} - {{ weekEndDate | date:'dd.MM.yyyy' }}</h1>
    <button (click)="loadPreviousWeek()">‹ Poprzedni</button>
    <button (click)="loadCurrentWeek()">Dzisiaj</button>
    <button (click)="loadNextWeek()">Następny ›</button>
  </div>

  <app-member-filter [members]="familyMembers()" [selectedFilter]="selectedFilter()" (filterChange)="onFilterChange($event)" />

  <app-member-legend [members]="familyMembers()" />

  @if (isLoading()) {
  <div class="skeleton-grid">...</div>
  } @else if (hasError()) {
  <div class="error-message">{{ errorMessage() }}</div>
  } @else {
  <app-week-grid [gridCells]="visibleCells()" [members]="familyMembers()" (activityClick)="onActivityClick($event)" />
  } @if (selectedActivity()) {
  <app-activity-detail-modal [activity]="selectedActivity()" (close)="closeActivityModal()" />
  }
</div>
```

**Obsługiwane interakcje**:

- Nawigacja między tygodniami (poprzedni/następny/dzisiaj)
- Zmiana filtra członka rodziny
- Kliknięcie aktywności (otwieranie modala)
- Zamknięcie modala

**Typy**:

- `TimeBlock[]` - surowe dane harmonogramu
- `FamilyMember[]` - lista członków rodziny
- `WeekGridViewModel` - model widoku siatki
- `ActivityInCell | null` - wybrana aktywność

**Propsy**: Brak (główny komponent routingu)

**Signals**:

```typescript
// Input signals
readonly rawScheduleData = signal<TimeBlock[]>([]);
readonly familyMembers = signal<FamilyMember[]>([]);
readonly selectedFilter = signal<string>('all');
readonly selectedActivity = signal<ActivityInCell | null>(null);
readonly isLoading = signal<boolean>(true);
readonly hasError = signal<boolean>(false);
readonly errorMessage = signal<string>('');
readonly weekStartDate = signal<Date>(getMonday(new Date()));

// Computed signals
readonly weekEndDate = computed(() => addDays(this.weekStartDate(), 6));
readonly gridCells = computed(() => this.transformToGrid(this.rawScheduleData()));
readonly visibleCells = computed(() => this.applyFilter(this.gridCells(), this.selectedFilter()));
```

---

### 4.2. MemberFilterComponent

**Opis**: Sticky przyciski filtrowania członków rodziny z animacją i debouncing.

**Główne elementy**:

```html
<div class="member-filter">
  <button [class.active]="selectedFilter() === 'all'" (click)="onFilterClick('all')">Wszyscy</button>

  @for (member of members(); track member.id) {
  <button [class.active]="selectedFilter() === member.id" [style.border-color]="member.color" (click)="onFilterClick(member.id)">{{ member.name }}</button>
  }

  <button [class.active]="selectedFilter() === 'shared'" (click)="onFilterClick('shared')">👨‍👩‍👧‍👦 Wspólne</button>
</div>
```

**Obsługiwane interakcje**:

- Kliknięcie przycisku filtra
- Debouncing (150ms) przy szybkich kliknięciach

**Walidacja**: Sprawdzenie czy wybrany filtr istnieje w liście członków

**Typy**: `FamilyMember[]`, `string` (filter value)

**Propsy**:

```typescript
members = input<FamilyMember[]>([]);
selectedFilter = input<string>('all');
filterChange = output<string>();
```

---

### 4.3. MemberLegendComponent

**Opis**: Sticky legenda pokazująca kolory członków rodziny i oznaczenie wspólnych aktywności.

**Główne elementy**:

```html
<div class="member-legend">
  @for (member of members(); track member.id) {
  <div class="legend-item">
    <div class="color-square" [style.background]="member.color"></div>
    <span>{{ member.name }} ({{ member.initial }})</span>
  </div>
  }
  <div class="legend-item">
    <div class="color-square shared"></div>
    <span>Wspólne</span>
  </div>
</div>
```

**Typy**: `FamilyMember[]`

**Propsy**:

```typescript
members = input<FamilyMember[]>([]);
```

---

### 4.4. WeekGridComponent

**Opis**: Główna siatka tygodnia wykorzystująca CSS Grid. Odpowiada za renderowanie struktury grid, nagłówków dni i kolumny czasowej.

**Główne elementy**:

```html
<div class="week-grid-container" #gridContainer>
  <!-- Header row -->
  <div class="time-header"></div>
  @for (day of days; track day.date) {
  <app-grid-header [day]="day" [isToday]="isToday(day.date)" />
  }

  <!-- Time slots rows with deferrable views for performance -->
  @for (timeSlot of timeSlots(); track timeSlot) {
  <app-time-column [time]="timeSlot" />

  @for (day of days; track day.date) { @defer (on viewport) {
  <app-grid-cell [cell]="getCell(timeSlot, day.date)" [isToday]="isToday(day.date)" (activityClick)="onActivityClick($event)" />
  } @placeholder {
  <div class="grid-cell-placeholder"></div>
  } } }
</div>
```

**Obsługiwane interakcje**:

- Scroll z sticky positioning
- Kliknięcie aktywności (propagacja do parent)

**Typy**:

- `GridCell[][]` - macierz komórek
- `string[]` - sloty czasowe (09:00, 10:00, ...)
- `DayInfo[]` - informacje o dniach tygodnia

**Propsy**:

```typescript
gridCells = input<GridCell[][]>([]);
members = input<FamilyMember[]>([]);
activityClick = output<ActivityInCell>();
```

**Computed**:

```typescript
readonly timeSlots = computed(() => this.calculateDynamicTimeRange(this.gridCells()));
readonly days = computed(() => this.generateDaysArray(this.weekStart()));
```

---

### 4.5. GridHeaderComponent

**Opis**: Nagłówek dnia tygodnia ze sticky positioning i highlight dla dzisiejszego dnia.

**Główne elementy**:

```html
<div class="day-header" [class.today]="isToday">
  <div class="day-name">{{ dayName }}</div>
  <div class="day-date">{{ dayDate }}</div>
</div>
```

**Propsy**:

```typescript
day = input<DayInfo>({ name: '', date: '', dayOfWeek: 0 });
isToday = input<boolean>(false);
```

---

### 4.6. TimeColumnComponent

**Opis**: Kolumna z godziną dla wiersza siatki (sticky left).

**Główne elementy**:

```html
<div class="time-column">{{ time }}</div>
```

**Propsy**:

```typescript
time = input<string>(''); // Format: "09:00"
```

---

### 4.7. GridCellComponent

**Opis**: Pojedyncza komórka siatki zawierająca 0-N aktywności. Obsługuje stackowanie wielu aktywności.

**Główne elementy**:

```html
<div class="grid-cell" [class.today]="isToday" [class.empty]="cell.isEmpty">
  @if (!cell.isEmpty) {
  <div class="activities-stack">
    @for (activity of cell.activities; track activity.id) {
    <app-activity-cell [activity]="activity" [cellHeight]="CELL_HEIGHT" (click)="onActivityClick(activity)" />
    }
  </div>
  }
</div>
```

**Obsługiwane interakcje**:

- Kliknięcie aktywności
- Hover dla tooltip (delegowane do ActivityCellComponent)

**Typy**: `GridCell`, `ActivityInCell[]`

**Propsy**:

```typescript
cell = input<GridCell>(defaultGridCell());
isToday = input<boolean>(false);
activityClick = output<ActivityInCell>();
```

---

### 4.8. ActivityCellComponent

**Opis**: Komórka aktywności z kolorem członka rodziny, emoji typu, inicjałami i opcjonalnym tooltipem.

**Główne elementy**:

```html
<div class="activity-cell" [class.dimmed]="activity.isDimmed" [class.has-conflict]="activity.hasConflict" [class.shared]="activity.isShared" [style.background]="getBackground()" [style.height.px]="getHeight()" (mouseenter)="showTooltip = true" (mouseleave)="showTooltip = false">
  <span class="activity-emoji">{{ activity.block.emoji }}</span>
  <span class="activity-title">{{ activity.block.title }}</span>
  <span class="member-initial">{{ activity.member.initial }}</span>

  @if (showTooltip) {
  <app-activity-tooltip [activity]="activity" />
  }
</div>
```

**Obsługiwane interakcje**:

- Hover (pokazanie/ukrycie tooltipa z 10ms delay)
- Kliknięcie (otworzenie modala)

**Walidacja**:

- `proportionalHeight >= 24px` (minimum readable)
- Sprawdzenie czy `activity.block.startTime` i `endTime` są valid

**Typy**: `ActivityInCell`, `TimeBlock`, `FamilyMember`

**Propsy**:

```typescript
activity = input<ActivityInCell>(defaultActivity());
cellHeight = input<number>(80);

// State
readonly showTooltip = signal<boolean>(false);
```

**Metody**:

```typescript
getBackground(): string {
  const act = this.activity(); // Signal getter
  if (act.isShared) {
    return this.generateSharedPattern();
  }
  return act.member.color;
}

getHeight(): number {
  const act = this.activity(); // Signal getter
  const height = this.cellHeight(); // Signal getter
  return Math.max(24, act.proportionalHeight * height);
}

generateSharedPattern(): string {
  const act = this.activity(); // Signal getter
  const color = act.member.color;
  return `repeating-linear-gradient(45deg, ${color}, ${color} 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 20px)`;
}
```

---

### 4.9. ActivityTooltipComponent

**Opis**: Tooltip wyświetlający szczegóły aktywności przy hover (fade-in 100ms).

**Główne elementy**:

```html
<div class="activity-tooltip" @fadeIn>
  <div class="tooltip-header">
    <span class="tooltip-emoji">{{ activity.block.emoji }}</span>
    <span class="tooltip-title">{{ activity.block.title }}</span>
  </div>

  <div class="tooltip-body">
    <div class="tooltip-row">
      <span>⏰</span>
      <span>{{ activity.block.startTime }} - {{ activity.block.endTime }} ({{ duration }})</span>
    </div>
    <div class="tooltip-row">
      <span>👤</span>
      <span>{{ participantsText }}</span>
    </div>
    @if (activity.block.description) {
    <div class="tooltip-row">
      <span>📝</span>
      <span>{{ activity.block.description }}</span>
    </div>
    }
    <div class="tooltip-row">
      <span>🏷️</span>
      <span>{{ activity.block.type }} • {{ activity.block.isGoal ? 'Goal' : 'Fixed' }}</span>
    </div>
  </div>

  <div class="tooltip-footer">
    <small>💡 Kliknij aby zobaczyć szczegóły</small>
  </div>
</div>
```

**Typy**: `ActivityInCell`

**Propsy**:

```typescript
activity = input<ActivityInCell>(defaultActivity());
```

**Computed**:

```typescript
readonly duration = computed(() => calculateDuration(this.activity().block));
readonly participantsText = computed(() => formatParticipants(this.activity()));
```

---

### 4.10. ActivityDetailModalComponent

**Opis**: Modal z pełnymi szczegółami aktywności, opcjami edycji/usunięcia (Phase 2).

**Główne elementy**:

```html
<div class="modal-backdrop" (click)="close.emit()" @fadeIn>
  <div class="modal-content" (click)="$event.stopPropagation()" @slideIn>
    <div class="modal-header">
      <h2>
        <span>{{ activity.block.emoji }}</span>
        {{ activity.block.title }}
      </h2>
      <button class="close-btn" (click)="close.emit()">✕</button>
    </div>

    <div class="modal-body">
      <div class="detail-section">
        <h3>Czas</h3>
        <p>{{ activity.block.startTime }} - {{ activity.block.endTime }}</p>
        <p>Czas trwania: {{ duration }}</p>
      </div>

      <div class="detail-section">
        <h3>Uczestnicy</h3>
        <div class="participants-list">
          @for (participant of participants; track participant.id) {
          <div class="participant-chip" [style.background]="participant.color">{{ participant.name }}</div>
          }
        </div>
      </div>

      @if (activity.block.description) {
      <div class="detail-section">
        <h3>Opis</h3>
        <p>{{ activity.block.description }}</p>
      </div>
      }

      <div class="detail-section">
        <h3>Typ</h3>
        <span class="type-badge">{{ activity.block.type }}</span>
        <span class="goal-badge">{{ activity.block.isGoal ? 'Cel' : 'Stałe' }}</span>
      </div>

      @if (activity.hasConflict) {
      <div class="detail-section conflict-warning">
        <h3>⚠️ Konflikt</h3>
        <p>Ta aktywność pokrywa się z inną w harmonogramie.</p>
      </div>
      }
    </div>

    <div class="modal-footer">
      <!-- Phase 2: Edit/Delete buttons -->
      <button class="btn-secondary" (click)="close.emit()">Zamknij</button>
    </div>
  </div>
</div>
```

**Obsługiwane interakcje**:

- Zamknięcie modala (kliknięcie backdrop/przycisku/Escape)
- Edycja/usunięcie (Phase 2)

**Typy**: `ActivityInCell`

**Propsy**:

```typescript
activity = input<ActivityInCell | null>(null);
close = output<void>();
```

---

## 5. Typy

### 5.1. Główne typy domenowe

```typescript
// libs/shared/models-schedule/src/lib/types/

export type FamilyMemberId = 'tata' | 'mama' | 'hania' | 'małgosia' | 'monika';

export interface FamilyMember {
  id: FamilyMemberId;
  name: string;
  initial: string; // 'T', 'M', 'H', 'Mł', 'Mo'
  color: string; // Hex color
  role: 'parent' | 'child';
  age?: number;
}

export type ActivityType = 'WORK' | 'ACTIVITY' | 'MEAL' | 'OTHER';

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  type: ActivityType;
  description?: string;
  isGoal: boolean; // Goal vs Fixed
  emoji?: string;
  memberId: FamilyMemberId;
  isShared?: boolean; // Wspólna aktywność rodzinna
  participantIds?: FamilyMemberId[]; // Dla shared activities
}
```

### 5.2. ViewModels dla Grid

```typescript
// libs/frontend/feature-schedule/src/lib/models/

export interface GridCell {
  id: string; // Unikalne ID: `${dayISO}-${timeSlot}`
  timeSlot: string; // "09:00"
  day: string; // "2026-01-13" (ISO date)
  dayOfWeek: number; // 0=Mon, 6=Sun
  isEmpty: boolean;
  activities: ActivityInCell[];
}

export interface ActivityInCell {
  id: string;
  member: FamilyMember;
  block: TimeBlock;
  isShared: boolean;
  hasConflict: boolean;
  proportionalHeight: number; // 0.0-1.0 (0.25 = 15min, 1.0 = 60min)
  isDimmed: boolean; // Dla filtrowania
}

export interface DayInfo {
  name: string; // 'Poniedziałek', 'Wtorek', ...
  shortName: string; // 'Pon', 'Wt', ...
  date: string; // ISO date
  dayOfWeek: number; // 0-6
  dayOfMonth: number; // 1-31
}

export interface WeekGridViewModel {
  weekStart: Date;
  weekEnd: Date;
  cells: GridCell[][];
  timeSlots: string[];
  days: DayInfo[];
}
```

### 5.3. API DTOs

```typescript
// libs/shared/models-schedule/src/lib/dto/

export interface GetWeekScheduleRequest {
  weekStartDate: string; // ISO date (Monday)
  userId: string;
}

export interface GetWeekScheduleResponse {
  weekStart: string;
  weekEnd: string;
  timeBlocks: TimeBlock[];
  members: FamilyMember[];
}
```

### 5.4. Typy pomocnicze

```typescript
export interface MemberColors {
  tata: string; // '#3b82f6' (blue-500)
  mama: string; // '#ec4899' (pink-500)
  hania: string; // '#f59e0b' (amber-500)
  małgosia: string; // '#10b981' (emerald-500)
  monika: string; // '#a855f7' (purple-500)
}

export const MEMBER_COLORS: MemberColors = {
  tata: '#3b82f6',
  mama: '#ec4899',
  hania: '#f59e0b',
  małgosia: '#10b981',
  monika: '#a855f7',
};

export const MEMBER_ORDER: FamilyMemberId[] = ['tata', 'mama', 'hania', 'małgosia', 'monika'];

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  WORK: '💼',
  ACTIVITY: '⚽',
  MEAL: '🍽️',
  OTHER: '📌',
};

export const CELL_HEIGHT = 80; // px
export const MIN_ACTIVITY_HEIGHT = 24; // px
```

---

## 6. Zarządzanie stanem

### 6.1. Stan w WeekViewContainerComponent

Wykorzystanie Angular signals z computed dla memoizacji:

```typescript
import { Component, OnInit, ChangeDetectionStrategy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-week-view-container',
  standalone: true,
  imports: [CommonModule /* ...other components */],
  templateUrl: './week-view-container.component.html',
  styleUrls: ['./week-view-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekViewContainerComponent implements OnInit {
  // Services
  private scheduleService = inject(ScheduleService);
  private familyService = inject(FamilyService);
  private gridTransformService = inject(GridTransformService);
  private conflictDetectionService = inject(ConflictDetectionService);

  // Input signals (źródła prawdy)
  readonly rawScheduleData = signal<TimeBlock[]>([]);
  readonly familyMembers = signal<FamilyMember[]>([]);
  readonly selectedFilter = signal<string>('all');
  readonly selectedActivity = signal<ActivityInCell | null>(null);
  readonly weekStartDate = signal<Date>(getMonday(new Date()));
  readonly isLoading = signal<boolean>(false);
  readonly hasError = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  // Computed signals (automatycznie przeliczane)
  readonly weekEndDate = computed(() => addDays(this.weekStartDate(), 6));

  readonly gridCells = computed(() => {
    const rawData = this.rawScheduleData();
    const members = this.familyMembers();
    const weekStart = this.weekStartDate();

    if (!rawData.length || !members.length) return [];

    // Transformacja: TimeBlock[] → GridCell[][]
    const cells = this.gridTransformService.transformToGrid(rawData, weekStart, members);

    // Detekcja konfliktów
    return this.conflictDetectionService.detectConflicts(cells);
  });

  readonly visibleCells = computed(() => {
    const cells = this.gridCells();
    const filter = this.selectedFilter();

    if (filter === 'all') return cells;

    // Filtrowanie: dim innych członków
    return cells.map((row) =>
      row.map((cell) => ({
        ...cell,
        activities: cell.activities.map((activity) => ({
          ...activity,
          isDimmed: filter === 'shared' ? !activity.isShared : activity.member.id !== filter,
        })),
      }))
    );
  });

  ngOnInit() {
    this.loadWeekData();
    this.loadFamilyMembers();
  }

  async loadWeekData() {
    this.isLoading.set(true);
    this.hasError.set(false);

    try {
      const response = await this.scheduleService.getWeekSchedule(formatISO(this.weekStartDate()));
      this.rawScheduleData.set(response.timeBlocks);
    } catch (error) {
      this.hasError.set(true);
      this.errorMessage.set('Nie udało się załadować harmonogramu.');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Debounced filter change using effect
  private pendingFilter = signal<string | null>(null);

  constructor() {
    // Use effect for side effects instead of constructor logic
    effect(() => {
      const filter = this.pendingFilter();
      if (filter !== null) {
        // Debounce logic will be in onFilterChange using setTimeout
        this.selectedFilter.set(filter);
      }
    });
  }

  private filterTimeout?: ReturnType<typeof setTimeout>;

  onFilterChange(filter: string) {
    // Debounce 150ms
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    this.filterTimeout = setTimeout(() => {
      this.pendingFilter.set(filter);
    }, 150);
  }
}
```

### 6.2. Custom Services

#### GridTransformService

```typescript
@Injectable()
export class GridTransformService {
  transformToGrid(blocks: TimeBlock[], weekStart: Date, members: FamilyMember[]): GridCell[][] {
    // 1. Generuj 7 dni tygodnia
    const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

    // 2. Oblicz dynamiczny zakres godzin
    const timeRange = this.calculateTimeRange(blocks);
    const timeSlots = this.generateTimeSlots(timeRange.start, timeRange.end);

    // 3. Stwórz macierz komórek
    const grid: GridCell[][] = timeSlots.map((timeSlot) => days.map((day) => this.createEmptyCell(timeSlot, day)));

    // 4. Wypełnij komórki aktywnościami
    blocks.forEach((block) => {
      const activities = this.mapBlockToActivities(block, members);
      this.placeActivitiesInGrid(grid, activities, timeSlots, days);
    });

    // 5. Sortuj aktywności w komórkach wg member order
    this.sortActivitiesInCells(grid, members);

    return grid;
  }

  private calculateTimeRange(blocks: TimeBlock[]): { start: number; end: number } {
    // Znajdź najwcześniejszą i najpóźniejszą godzinę
    // Domyślnie: 6:00 - 23:00
  }

  private generateTimeSlots(startHour: number, endHour: number): string[] {
    // ['06:00', '07:00', ..., '23:00']
  }

  private mapBlockToActivities(block: TimeBlock, members: FamilyMember[]): ActivityInCell[] {
    // Mapuj TimeBlock → ActivityInCell z proporcjonalną wysokością
  }

  private placeActivitiesInGrid(/* ... */) {
    // Dla aktywności wielogodzinowych: powtórz w każdym slocie
  }
}
```

#### ConflictDetectionService

```typescript
@Injectable()
export class ConflictDetectionService {
  detectConflicts(grid: GridCell[][]): GridCell[][] {
    return grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        activities: this.markConflictsInCell(cell.activities),
      }))
    );
  }

  private markConflictsInCell(activities: ActivityInCell[]): ActivityInCell[] {
    // Grupuj po członku rodziny
    const byMember = groupBy(activities, (a) => a.member.id);

    // Dla każdego członka sprawdź overlapping
    Object.values(byMember).forEach((memberActivities) => {
      if (memberActivities.length > 1) {
        // Konflikt: ta sama osoba w tym samym czasie
        memberActivities.forEach((a) => (a.hasConflict = true));
      }
    });

    return activities;
  }
}
```

---

## 7. Integracja API

### 7.1. ScheduleService

```typescript
@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private http = inject(HttpClient);
  private baseUrl = '/api/schedules';

  getWeekSchedule(weekStartDate: string): Observable<GetWeekScheduleResponse> {
    return this.http.get<GetWeekScheduleResponse>(`${this.baseUrl}/week/${weekStartDate}`);
  }
}
```

**Request**: `GET /api/schedules/week/:weekStartDate`

- Parametr: `weekStartDate` (ISO date, Monday)

**Response**:

```typescript
{
  weekStart: '2026-01-13',
  weekEnd: '2026-01-19',
  timeBlocks: [
    {
      id: 'tb-001',
      title: 'Praca',
      startTime: '09:00',
      endTime: '17:00',
      type: 'WORK',
      isGoal: false,
      emoji: '💼',
      memberId: 'tata',
      isShared: false
    },
    // ...
  ],
  members: [
    {
      id: 'tata',
      name: 'Tata',
      initial: 'T',
      color: '#3b82f6',
      role: 'parent'
    },
    // ...
  ]
}
```

### 7.2. FamilyService

```typescript
@Injectable({ providedIn: 'root' })
export class FamilyService {
  private http = inject(HttpClient);
  private baseUrl = '/api/family';

  getMembers(): Observable<FamilyMember[]> {
    return this.http.get<FamilyMember[]>(`${this.baseUrl}/members`);
  }
}
```

---

## 8. Interakcje użytkownika

### 8.1. Nawigacja tygodniowa

**Akcja**: Kliknięcie "Poprzedni" / "Następny" / "Dzisiaj"

**Przepływ**:

1. Użytkownik klika przycisk nawigacji
2. `weekStartDate` signal jest aktualizowany
3. `weekEndDate` computed automatycznie przelicza
4. `loadWeekData()` jest wywoływane (effect)
5. Nowe dane są pobierane z API
6. `rawScheduleData` signal jest aktualizowany
7. `gridCells` i `visibleCells` są automatycznie przeliczane
8. Widok się renderuje z animacją fade

### 8.2. Filtrowanie członków rodziny

**Akcja**: Kliknięcie przycisku filtra

**Przepływ**:

1. Użytkownik klika filtr (np. "Tata")
2. Event `filterChange` jest emitowany
3. Debounce 150ms (jeśli szybkie kliknięcia)
4. `selectedFilter` signal jest aktualizowany
5. `visibleCells` computed przelicza (stosuje `isDimmed`)
6. CSS transition (200ms fade) aplikuje opacity 0.3 + grayscale
7. Przycisk filtra otrzymuje klasę `.active`

### 8.3. Hover na aktywności

**Akcja**: Najechanie myszą na komórkę aktywności

**Przepływ**:

1. `mouseenter` event na `ActivityCellComponent`
2. Delay 10ms (uniknięcie flickering)
3. `showTooltip` signal ustawiany na `true`
4. `ActivityTooltipComponent` renderuje się
5. CSS animation fade-in 100ms
6. Tooltip pozycjonowany dynamicznie (avoid overflow)
7. `mouseleave` → fade-out 100ms → ukrycie

### 8.4. Kliknięcie aktywności

**Akcja**: Kliknięcie komórki aktywności

**Przepływ**:

1. `click` event na `ActivityCellComponent`
2. `$event.stopPropagation()` (zapobiega bubbling)
3. Event `activityClick` propaguje do `WeekGridComponent`
4. Dalej propaguje do `WeekViewContainerComponent`
5. `selectedActivity` signal ustawiany na klikniętą aktywność
6. `ActivityDetailModalComponent` renderuje się (30ms)
7. Modal backdrop fade-in + content slide-in (200ms)

### 8.5. Zamknięcie modala

**Akcja**: Kliknięcie backdrop / przycisk "✕" / klawisz Escape

**Przepływ**:

1. Event `close` z `ActivityDetailModalComponent`
2. `selectedActivity` signal ustawiany na `null`
3. Modal fade-out (200ms)
4. Komponent jest usuwany z DOM

---

## 9. Warunki i walidacja

### 9.1. Walidacja danych wejściowych

**GridTransformService**:

- ✅ `startTime` i `endTime` muszą być w formacie HH:mm
- ✅ `endTime` > `startTime` (brak aktywności o ujemnym czasie)
- ✅ `memberId` musi istnieć w liście `familyMembers`
- ✅ Dla `isShared=true`, `participantIds` nie może być puste
- ⚠️ Jeśli walidacja się nie powiedzie: skip aktywności + log warning

**Przykład**:

```typescript
private validateTimeBlock(block: TimeBlock): boolean {
  if (!this.isValidTimeFormat(block.startTime) || !this.isValidTimeFormat(block.endTime)) {
    console.warn(`Invalid time format in block ${block.id}`);
    return false;
  }

  if (this.parseTime(block.endTime) <= this.parseTime(block.startTime)) {
    console.warn(`Invalid time range in block ${block.id}`);
    return false;
  }

  return true;
}
```

### 9.2. Warunki wyświetlania

**ActivityCellComponent**:

- ✅ `proportionalHeight >= 24px` (minimum readable)
- ✅ `hasConflict=true` → czerwona ramka 3px + ikona ⚠️
- ✅ `isDimmed=true` → opacity 0.3 + grayscale 0.5 + pointer-events none
- ✅ `isShared=true` → diagonal stripes background

**GridCellComponent**:

- ✅ `isEmpty=true` → light gray background, no activities
- ✅ `isToday=true` → column highlight background

### 9.3. Warunki UI

**MemberFilterComponent**:

- ✅ Wybrany filtr ma klasę `.active` (border + bold)
- ✅ Jeśli filtr !== 'all', odpowiednie aktywności są dimmed

**WeekGridComponent**:

- ✅ Jeśli `timeSlots().length === 0` → empty state
- ✅ Jeśli `isLoading()` → skeleton grid z pulsing animation
- ✅ Jeśli `hasError()` → error message z retry button

---

## 10. Obsługa błędów

### 10.1. Błędy API

**Scenariusz**: `GET /api/schedules/week/:weekStartDate` zwraca 500

**Obsługa**:

```typescript
async loadWeekData() {
  this.isLoading.set(true);
  this.hasError.set(false);

  try {
    const response = await this.scheduleService.getWeekSchedule(/*...*/);
    this.rawScheduleData.set(response.timeBlocks);
  } catch (error) {
    this.hasError.set(true);

    if (error instanceof HttpErrorResponse) {
      if (error.status === 404) {
        this.errorMessage.set('Nie znaleziono harmonogramu dla tego tygodnia.');
      } else if (error.status >= 500) {
        this.errorMessage.set('Problem z serwerem. Spróbuj ponownie później.');
      } else {
        this.errorMessage.set('Wystąpił nieoczekiwany błąd.');
      }
    }
  } finally {
    this.isLoading.set(false);
  }
}
```

**UI**: Wyświetlenie komunikatu + przycisk "Spróbuj ponownie"

### 10.2. Brak danych

**Scenariusz**: API zwraca `timeBlocks: []` (pusty harmonogram)

**Obsługa**:

- Wyświetl pustą siatkę z komunikatem: "Brak aktywności w tym tygodniu. Wygeneruj harmonogram za pomocą AI!"
- Przycisk CTA: "Generuj harmonogram"

### 10.3. Nieprawidłowe dane czasowe

**Scenariusz**: `TimeBlock` ma `startTime: "25:00"` (invalid)

**Obsługa**:

- `GridTransformService.validateTimeBlock()` zwraca `false`
- Skip aktywności
- Log warning do konsoli (dev mode)
- Nie blokuj renderowania pozostałych aktywności

### 10.4. Konflikty renderowania

**Scenariusz**: Zbyt wiele aktywności w jednej komórce (>4)

**Obsługa**:

- Renderuj wszystkie (stackuj pionowo)
- Jeśli przekracza wysokość komórki → overflow scroll dla komórki
- Alternatywnie: pokazuj tylko pierwsze 3 + badge "+2 więcej"

### 10.5. Performance degradation

**Scenariusz**: Grid renderuje się >100ms (cel: <100ms)

**Obsługa**:

- Lazy rendering: użyj Angular deferrable views (@defer on viewport)
- Renderuj tylko widoczne wiersze w viewport
- Defer renderowania pozostałych wierszy automatycznie
- Monitoruj performance.mark() w dev mode

---

## 11. Kroki implementacji

### Krok 1: Setup struktury projektu (1-2 dni)

1. Stwórz library dla feature week-view:

   ```bash
   nx g @nx/angular:library feature-week-view --directory=libs/frontend/feature-week-view --standalone
   ```

2. Stwórz strukturę folderów:

   ```
   libs/frontend/feature-week-view/src/lib/
   ├── components/
   │   ├── week-view-container/
   │   ├── week-grid/
   │   ├── grid-cell/
   │   ├── activity-cell/
   │   ├── member-filter/
   │   ├── member-legend/
   │   ├── grid-header/
   │   ├── time-column/
   │   ├── activity-tooltip/
   │   └── activity-detail-modal/
   ├── services/
   │   ├── grid-transform.service.ts
   │   ├── conflict-detection.service.ts
   │   └── schedule.service.ts
   ├── models/
   │   └── week-grid.models.ts
   └── utils/
       ├── date.utils.ts
       └── time.utils.ts
   ```

3. Dodaj typy w `libs/shared/models-schedule`

4. Skonfiguruj routing w `apps/frontend`

---

### Krok 2: Implementacja typów i utilities (1 dzień)

1. Zdefiniuj wszystkie interfejsy w `week-grid.models.ts`
2. Stwórz konstanty (`MEMBER_COLORS`, `ACTIVITY_ICONS`, `MEMBER_ORDER`)
3. Implementuj utilities:
   - `parseTime(time: string): number` (HH:mm → minuty)
   - `formatTime(minutes: number): string` (minuty → HH:mm)
   - `calculateDuration(start: string, end: string): string` ("2h 30min")
   - `getMonday(date: Date): Date`
   - `isToday(date: Date): boolean`

---

### Krok 3: Core services (2-3 dni)

1. **ScheduleService**:

   - Implementuj `getWeekSchedule()`
   - Dodaj error handling
   - Testuj z mock data

2. **GridTransformService**:

   - `transformToGrid()` - główna logika
   - `calculateTimeRange()` - dynamiczny zakres
   - `generateTimeSlots()` - generacja slotów
   - `mapBlockToActivities()` - mapping
   - `placeActivitiesInGrid()` - placement
   - Testy jednostkowe dla każdej metody

3. **ConflictDetectionService**:
   - `detectConflicts()` - algorytm detekcji
   - Testy z różnymi scenariuszami

---

### Krok 4: Podstawowe komponenty (3-4 dni)

1. **GridHeaderComponent** (prosty)
2. **TimeColumnComponent** (prosty)
3. **MemberLegendComponent** (prosty)
4. **MemberFilterComponent** (średni - debouncing)

Dla każdego:

- Stwórz component z CLI
- Implementuj template
- Dodaj SCSS
- Napisz testy komponentowe

---

### Krok 5: Grid components (4-5 dni)

1. **WeekGridComponent**:

   - Implementuj CSS Grid layout
   - Sticky positioning (headers, time column)
   - Integracja z GridTransformService
   - Track functions dla @for
   - Testy

2. **GridCellComponent**:

   - Renderowanie pojedynczej komórki
   - Stackowanie aktywności
   - Empty state
   - Today highlight

3. **ActivityCellComponent**:
   - Member color background
   - Shared activity pattern (CSS gradient)
   - Proportional height calculation
   - Emoji + title + initial
   - Conflict indicators
   - Dim effect
   - Hover state
   - Testy snapshot dla różnych stanów

---

### Krok 6: Interakcje (3-4 dni)

1. **ActivityTooltipComponent**:

   - Template z detalami
   - Positioning logic (avoid overflow)
   - Fade animations
   - Delay 10ms

2. **ActivityDetailModalComponent**:
   - Full modal layout
   - Backdrop + content
   - Animations (fade + slide)
   - Keyboard support (Escape)
   - Testy E2E

---

### Krok 7: Container i state management (3-4 dni)

1. **WeekViewContainerComponent**:

   - Signals setup
   - Computed logic
   - API integration
   - Debounced filtering
   - Loading/error states
   - Week navigation
   - Testy integracyjne

2. Podłącz wszystkie komponenty dzieci
3. Testuj full flow od API do UI

---

### Krok 8: Styling i animacje (2-3 dni)

1. Stwórz SCSS variables:

   ```scss
   // _variables.scss
   $cell-height: 80px;
   $time-column-width: 80px;
   $grid-gap: 1px;
   $grid-line-color: #e5e7eb;
   // ...colors, z-indexes
   ```

2. Implementuj CSS Grid layout
3. Sticky positioning z z-index hierarchy
4. Animations (fade, scale, slide)
5. Responsive tweaks (desktop only, ale sprawdź różne rozdzielczości)
6. Hover effects

---

### Krok 9: Performance optimization (2-3 dni)

1. Dodaj OnPush change detection do wszystkich komponentów
2. Implementuj track functions dla wszystkich @for
3. Lazy rendering z @defer (on viewport) dla grid cells
4. Profile z Chrome DevTools:
   - Zmierz initial render time (cel: <100ms)
   - Zmierz filter response (cel: <50ms)
   - Sprawdź memory usage (cel: <50MB)
5. Optymalizuj bottlenecks

---

### Krok 10: Accessibility (2-3 dni)

1. Dodaj ARIA labels:
   - `aria-label` dla grid cells
   - `aria-label` dla activity cells
   - `role="grid"`, `role="row"`, `role="gridcell"`
2. Keyboard navigation:
   - Tab through filters
   - Enter/Space na aktywności (open modal)
   - Escape close modal
   - Arrow keys navigation (opcjonalnie)
3. Focus indicators (outline, focus-visible)
4. Screen reader testing (NVDA/JAWS)
5. Color contrast verification (>4.5:1)

---

### Krok 11: Testing (3-4 dni)

1. **Unit tests** (Jest):

   - Services (GridTransformService, ConflictDetectionService)
   - Utilities (date, time functions)
   - Component logic (bez DOM)
   - Coverage target: >80%

2. **Component tests** (Jest + Testing Library):

   - Każdy komponent osobno
   - User interactions
   - Conditional rendering
   - Coverage target: >70%

3. **E2E tests** (Playwright):
   ```typescript
   test('should display week grid and filter by member', async ({ page }) => {
     await page.goto('/schedule/week');

     // Check grid is visible
     await expect(page.locator('.week-grid-container')).toBeVisible();

     // Check 7 day headers
     const headers = page.locator('.day-header');
     await expect(headers).toHaveCount(7);

     // Click filter
     await page.click('button:has-text("Tata")');

     // Check dimmed effect
     await expect(page.locator('.activity-cell.dimmed')).toHaveCount(expect.any(Number));

     // Click activity
     await page.click('.activity-cell').first();

     // Check modal opens
     await expect(page.locator('.modal-content')).toBeVisible();
   });
   ```

---

### Krok 12: Integration i polish (2-3 dni)

1. Integracja z apps/frontend:
   - Dodaj routing
   - Sprawdź navigation flow
   - Auth guards
2. Test z real API (backend integration)
3. Visual QA:
   - Różne rozdzielczości desktop
   - Różne ilości aktywności
   - Edge cases (brak danych, konflikty, etc.)
4. Performance profiling w production mode
5. Dokumentacja:
   - README dla library
   - Storybook stories (opcjonalnie)

---

### Krok 13: Code review i refinement (1-2 dni)

1. Self code review
2. Peer review
3. Addressowanie feedback
4. Final testing
5. Merge do main

---

## Podsumowanie timeline

| Krok      | Opis                  | Czas                         |
| --------- | --------------------- | ---------------------------- |
| 1         | Setup struktury       | 1-2 dni                      |
| 2         | Typy i utilities      | 1 dzień                      |
| 3         | Core services         | 2-3 dni                      |
| 4         | Podstawowe komponenty | 3-4 dni                      |
| 5         | Grid components       | 4-5 dni                      |
| 6         | Interakcje            | 3-4 dni                      |
| 7         | Container i state     | 3-4 dni                      |
| 8         | Styling i animacje    | 2-3 dni                      |
| 9         | Performance           | 2-3 dni                      |
| 10        | Accessibility         | 2-3 dni                      |
| 11        | Testing               | 3-4 dni                      |
| 12        | Integration           | 2-3 dni                      |
| 13        | Review                | 1-2 dni                      |
| **TOTAL** |                       | **29-41 dni** (~6-8 tygodni) |

---

## Dodatkowe uwagi

### Dependencies

Wszystkie potrzebne zależności są już w projekcie (Angular 20+, RxJS, date-fns). Brak potrzeby dodawania nowych bibliotek.

### Angular 20+ Best Practices

- Używamy **signal-based inputs/outputs**: `input()`, `output()` zamiast `@Input()`, `@Output()`
- Używamy **deferrable views** (`@defer`) zamiast IntersectionObserver dla lazy loading
- Używamy **effect()** dla side effects zamiast logiki w constructor
- Wszystkie komponenty są **standalone** (brak NgModules)
- Preferujemy **OnPush change detection** dla wydajności

### Testowanie z mock data

Podczas developmentu użyj lokalnego mock service:

```typescript
const MOCK_TIME_BLOCKS: TimeBlock[] = [
  {
    id: 'tb-001',
    title: 'Praca',
    startTime: '09:00',
    endTime: '17:00',
    type: 'WORK',
    isGoal: false,
    emoji: '💼',
    memberId: 'tata',
  },
  // ... więcej mock data
];
```

### Browser support

Target: Modern browsers (Chrome, Firefox, Edge, Safari) - ostatnie 2 wersje. Brak support dla IE11.

### Future enhancements (poza MVP)

- Drag & drop rescheduling
- Week navigation z calendar picker
- Export do PDF/iCal
- Mobile responsive version
- Customizable member colors
- Multiple weeks view (Month)
