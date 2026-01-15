import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import {
  GridCell,
  ActivityInCell,
  FamilyMemberViewModel,
  FilterValue,
} from '../../models/week-grid.models';
import { GridTransformService } from '../../services/grid-transform.service';
import { ConflictDetectionService } from '../../services/conflict-detection.service';
import { WeekScheduleService } from '../../services/week-schedule.service';
import { MemberFilterComponent } from '../member-filter/member-filter.component';
import { MemberLegendComponent } from '../member-legend/member-legend.component';
import { WeekGridComponent } from '../week-grid/week-grid.component';
import { ActivityDetailModalComponent } from '../activity-detail-modal/activity-detail-modal.component';
import {
  getMonday,
  addDays,
  formatISODate,
  formatDisplayDate,
  formatDisplayDateWithYear,
} from '../../utils/date.utils';
import { TimeBlock, FamilyMember } from '@family-planner/shared/models-schedule';

/**
 * Week View Container Component
 * Main container for week calendar view
 * Manages state and orchestrates child components
 */
@Component({
  selector: 'app-week-view-container',
  standalone: true,
  imports: [
    CommonModule,
    MemberFilterComponent,
    MemberLegendComponent,
    WeekGridComponent,
    ActivityDetailModalComponent,
  ],
  providers: [
    GridTransformService,
    ConflictDetectionService,
    WeekScheduleService,
  ],
  template: `
    <div class="week-view-container">
      <!-- Header with navigation -->
      <div class="week-view-header">
        <div class="header-title">
          <h1>
            Tydzień {{ weekStartDateFormatted() }} - {{ weekEndDateFormatted() }}
          </h1>
        </div>
        <div class="header-actions">
          <button 
            class="nav-btn" 
            (click)="loadPreviousWeek()"
            [disabled]="isLoading()"
          >
            ‹ Poprzedni
          </button>
          <button 
            class="nav-btn today" 
            (click)="loadCurrentWeek()"
            [disabled]="isLoading()"
          >
            Dzisiaj
          </button>
          <button 
            class="nav-btn" 
            (click)="loadNextWeek()"
            [disabled]="isLoading()"
          >
            Następny ›
          </button>
        </div>
      </div>

      <!-- Filters -->
      <app-member-filter
        [members]="familyMembers()"
        [selectedFilter]="selectedFilter()"
        (filterChange)="onFilterChange($event)"
      />

      <!-- Legend -->
      <app-member-legend [members]="familyMembers()" />

      <!-- Main content -->
      <div class="week-view-content">
        @if (isLoading()) {
          <div class="skeleton-grid">
            <div class="skeleton-header"></div>
            @for (row of skeletonRows; track $index) {
              <div class="skeleton-row"></div>
            }
          </div>
        } @else if (hasError()) {
          <div class="error-message">
            <div class="error-icon">⚠️</div>
            <h3>Wystąpił błąd</h3>
            <p>{{ errorMessage() }}</p>
            <button class="retry-btn" (click)="retryLoad()">
              Spróbuj ponownie
            </button>
          </div>
        } @else if (isEmpty()) {
          <div class="empty-state">
            <div class="empty-icon">📅</div>
            <h3>Brak aktywności w tym tygodniu</h3>
            <p>Wygeneruj harmonogram za pomocą AI lub dodaj aktywności ręcznie.</p>
            <button class="cta-btn">
              ✨ Generuj harmonogram
            </button>
          </div>
        } @else {
          <app-week-grid
            [gridCells]="visibleCells()"
            [members]="familyMembers()"
            (activityClick)="onActivityClick($event)"
            (activityHover)="onActivityHover($event)"
          />
        }
      </div>

      <!-- Modal -->
      @if (selectedActivity()) {
        <app-activity-detail-modal
          [activity]="selectedActivity()"
          (close)="closeActivityModal()"
        />
      }
    </div>
  `,
  styles: [`
    .week-view-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 24px;
      background: #fff;
      min-height: 100vh;
    }

    .week-view-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e5e7eb;
    }

    .header-title h1 {
      font-size: 28px;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .nav-btn {
      padding: 10px 20px;
      border: 2px solid #e5e7eb;
      background: #fff;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .nav-btn:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .nav-btn.today {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #fff;
    }

    .nav-btn.today:hover:not(:disabled) {
      background: #2563eb;
      border-color: #2563eb;
    }

    .nav-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .nav-btn:active:not(:disabled) {
      transform: scale(0.98);
    }

    .week-view-content {
      flex: 1;
    }

    /* Loading skeleton */
    .skeleton-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .skeleton-header,
    .skeleton-row {
      height: 60px;
      background: linear-gradient(
        90deg,
        #e5e7eb 25%,
        #f3f4f6 50%,
        #e5e7eb 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    .skeleton-header {
      height: 80px;
    }

    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    /* Error state */
    .error-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .error-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }

    .error-message h3 {
      font-size: 24px;
      font-weight: 700;
      color: #dc2626;
      margin: 0 0 12px 0;
    }

    .error-message p {
      font-size: 16px;
      color: #6b7280;
      margin: 0 0 24px 0;
      max-width: 400px;
    }

    .retry-btn {
      padding: 12px 32px;
      border: none;
      background: #3b82f6;
      color: #fff;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .retry-btn:hover {
      background: #2563eb;
    }

    .retry-btn:active {
      transform: scale(0.98);
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      text-align: center;
    }

    .empty-icon {
      font-size: 72px;
      margin-bottom: 20px;
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 12px 0;
    }

    .empty-state p {
      font-size: 16px;
      color: #6b7280;
      margin: 0 0 32px 0;
      max-width: 500px;
    }

    .cta-btn {
      padding: 14px 36px;
      border: none;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: #fff;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .cta-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
    }

    .cta-btn:active {
      transform: translateY(0);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .week-view-container {
        padding: 16px;
      }

      .week-view-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-title h1 {
        font-size: 22px;
      }

      .header-actions {
        width: 100%;
      }

      .nav-btn {
        flex: 1;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekViewContainerComponent implements OnInit {
  // Services
  private readonly scheduleService = inject(WeekScheduleService);
  private readonly gridTransformService = inject(GridTransformService);
  private readonly conflictDetectionService = inject(ConflictDetectionService);

  // Input signals (sources of truth)
  readonly rawScheduleData = signal<TimeBlock[]>([]);
  readonly familyMembers = signal<FamilyMemberViewModel[]>([]);
  readonly selectedFilter = signal<FilterValue>('all');
  readonly selectedActivity = signal<ActivityInCell | null>(null);
  readonly weekStartDate = signal<Date>(getMonday(new Date()));
  readonly isLoading = signal<boolean>(false);
  readonly hasError = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  // Computed signals (automatically recalculated)
  readonly weekEndDate = computed(() => addDays(this.weekStartDate(), 6));

  readonly weekStartDateFormatted = computed(() =>
    formatDisplayDate(this.weekStartDate())
  );

  readonly weekEndDateFormatted = computed(() =>
    formatDisplayDateWithYear(this.weekEndDate())
  );

  readonly gridCells = computed(() => {
    const rawData = this.rawScheduleData();
    const members = this.familyMembers();
    const weekStart = this.weekStartDate();

    if (!rawData.length || !members.length) return [];

    // Transform: TimeBlock[] → GridCell[][]
    const cells = this.gridTransformService.transformToGrid(
      rawData,
      weekStart,
      this.transformViewModelsToFamilyMembers(members)
    );

    // Detect conflicts
    return this.conflictDetectionService.detectConflicts(cells);
  });

  readonly visibleCells = computed(() => {
    const cells = this.gridCells();
    const filter = this.selectedFilter();

    if (filter === 'all') return cells;

    // Filter: dim other members' activities
    return cells.map((row) =>
      row.map((cell) => ({
        ...cell,
        activities: cell.activities.map((activity) => ({
          ...activity,
          isDimmed:
            filter === 'shared'
              ? !activity.isShared
              : activity.member.id !== filter,
        })),
      }))
    );
  });

  readonly isEmpty = computed(() => {
    return !this.isLoading() && !this.hasError() && this.gridCells().length === 0;
  });

  // Skeleton rows for loading state
  readonly skeletonRows = Array.from({ length: 12 }, (_, i) => i);

  // Debounced filter
  private filterTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadWeekData();
    this.loadFamilyMembers();
  }

  /**
   * Load schedule data for current week
   */
  async loadWeekData(): Promise<void> {
    this.isLoading.set(true);
    this.hasError.set(false);

    try {
      const weekStartISO = formatISODate(this.weekStartDate());
      const response = await this.scheduleService
        .getWeekSchedule(weekStartISO)
        .pipe(
          catchError((error: HttpErrorResponse) => {
            this.handleError(error);
            return of(null);
          })
        )
        .toPromise();

      if (response) {
        this.rawScheduleData.set(response.timeBlocks);
      }
    } catch (error) {
      this.handleError(error as HttpErrorResponse);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Load family members
   */
  async loadFamilyMembers(): Promise<void> {
    try {
      const members = await this.scheduleService
        .getFamilyMembers()
        .pipe(
          map((members) => this.transformToViewModels(members)),
          catchError(() => of([]))
        )
        .toPromise();

      if (members) {
        this.familyMembers.set(members);
      }
    } catch (error) {
      console.error('Failed to load family members:', error);
    }
  }

  /**
   * Navigate to previous week
   */
  loadPreviousWeek(): void {
    const currentStart = this.weekStartDate();
    this.weekStartDate.set(addDays(currentStart, -7));
    this.loadWeekData();
  }

  /**
   * Navigate to current week
   */
  loadCurrentWeek(): void {
    this.weekStartDate.set(getMonday(new Date()));
    this.loadWeekData();
  }

  /**
   * Navigate to next week
   */
  loadNextWeek(): void {
    const currentStart = this.weekStartDate();
    this.weekStartDate.set(addDays(currentStart, 7));
    this.loadWeekData();
  }

  /**
   * Handle filter change with debouncing
   */
  onFilterChange(filter: FilterValue): void {
    // Debounce is handled in MemberFilterComponent
    this.selectedFilter.set(filter);
  }

  /**
   * Handle activity click (open modal)
   */
  onActivityClick(activity: ActivityInCell): void {
    this.selectedActivity.set(activity);
  }

  /**
   * Handle activity hover (for future tooltip implementation)
   */
  onActivityHover(event: { activity: ActivityInCell; show: boolean }): void {
    // Future: Show floating tooltip
    // For now, tooltip is handled in ActivityCellComponent
  }

  /**
   * Close activity modal
   */
  closeActivityModal(): void {
    this.selectedActivity.set(null);
  }

  /**
   * Retry loading data
   */
  retryLoad(): void {
    this.loadWeekData();
  }

  /**
   * Handle API errors
   */
  private handleError(error: HttpErrorResponse): void {
    this.hasError.set(true);

    if (error.status === 404) {
      this.errorMessage.set('Nie znaleziono harmonogramu dla tego tygodnia.');
    } else if (error.status >= 500) {
      this.errorMessage.set('Problem z serwerem. Spróbuj ponownie później.');
    } else if (error.status === 0) {
      this.errorMessage.set('Brak połączenia z serwerem.');
    } else {
      this.errorMessage.set('Wystąpił nieoczekiwany błąd.');
    }
  }

  /**
   * Transform FamilyMember[] to FamilyMemberViewModel[]
   */
  private transformToViewModels(
    members: FamilyMember[]
  ): FamilyMemberViewModel[] {
    return members.map((member) => ({
      id: member.familyMemberId,
      name: member.name,
      initial: this.getInitial(member.name),
      color: this.getMemberColor(member.familyMemberId),
      role: member.role === 'CHILD' ? 'child' : 'parent',
      age: member.age,
    }));
  }

  /**
   * Transform FamilyMemberViewModel[] back to FamilyMember[] for service
   */
  private transformViewModelsToFamilyMembers(
    viewModels: FamilyMemberViewModel[]
  ): FamilyMember[] {
    return viewModels.map((vm) => ({
      familyMemberId: vm.id,
      userId: '', // Not needed for grid transform
      name: vm.name,
      role: vm.role === 'child' ? 'CHILD' : 'USER',
      age: vm.age,
      preferences: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as FamilyMember[];
  }

  /**
   * Get initial from name
   */
  private getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  /**
   * Get member color (from constants or generate)
   */
  private getMemberColor(memberId: string): string {
    const colors: Record<string, string> = {
      tata: '#3b82f6',
      mama: '#ec4899',
      hania: '#f59e0b',
      małgosia: '#10b981',
      monika: '#a855f7',
    };
    return colors[memberId] || '#6b7280';
  }
}
