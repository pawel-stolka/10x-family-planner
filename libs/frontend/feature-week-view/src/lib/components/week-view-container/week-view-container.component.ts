import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import {
  GridCell,
  ActivityInCell,
  FamilyMemberViewModel,
  FilterValue,
  WeekScheduleResponse,
  WeekGridLayout,
} from '../../models/week-grid.models';
import { ScheduleGenerationResponse } from '../../models/schedule-generator.models';
import { GridTransformService } from '../../services/grid-transform.service';
import { ConflictDetectionService } from '../../services/conflict-detection.service';
import { WeekScheduleService } from '../../services/week-schedule.service';
import { ScheduleGeneratorService } from '../../services/schedule-generator.service';
import { MemberFilterComponent } from '../member-filter/member-filter.component';
import { WeekGridComponent } from '../week-grid/week-grid.component';
import { WeekGridTransposedComponent } from '../week-grid-transposed/week-grid-transposed.component';
import { ActivityDetailModalComponent } from '../activity-detail-modal/activity-detail-modal.component';
import { ScheduleGeneratorPanelComponent } from '../schedule-generator-panel/schedule-generator-panel.component';
import { WeekNavigationModalComponent } from '../week-navigation-modal/week-navigation-modal.component';
import {
  getMonday,
  addDays,
  formatISODate,
  formatDisplayDate,
  formatDisplayDateWithYear,
  parseISODate,
} from '../../utils/date.utils';
import {
  TimeBlock,
  FamilyMember,
  BlockType,
  FamilyMemberRole,
} from '@family-planner/shared/models-schedule';
import { getMemberColor } from '../../constants/week-grid.constants';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { GenerateScheduleRequest } from '../../models/schedule-generator.models';
import { buildTimeRange } from '../../utils/time.utils';

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
    WeekGridComponent,
    WeekGridTransposedComponent,
    ActivityDetailModalComponent,
    ScheduleGeneratorPanelComponent,
    WeekNavigationModalComponent,
  ],
  providers: [
    GridTransformService,
    ConflictDetectionService,
    WeekScheduleService,
    ScheduleGeneratorService,
  ],
  template: `
    <div class="week-view-container">
      <!-- Header with navigation -->
      <div class="week-view-header">
        <div class="header-title">
          <h1>
            Tydzień {{ weekStartDateFormatted() }} -
            {{ weekEndDateFormatted() }}
          </h1>
        </div>
        <div class="header-actions">
          <div class="layout-toggle">
            <button
              class="layout-btn"
              [class.active]="layout() === 'days-columns'"
              (click)="setLayout('days-columns')"
              [disabled]="isLoading()"
              type="button"
            >
              Dni → kolumny
            </button>
            <button
              class="layout-btn"
              [class.active]="layout() === 'hours-columns'"
              (click)="setLayout('hours-columns')"
              [disabled]="isLoading()"
              type="button"
            >
              Godziny → kolumny
            </button>
          </div>
          <button
            class="nav-btn"
            (click)="loadPreviousWeek()"
            [disabled]="isLoading()"
            type="button"
          >
            ‹ Poprzedni
          </button>
          <button
            class="nav-btn today"
            (click)="loadCurrentWeek()"
            [disabled]="isLoading()"
            type="button"
          >
            Dzisiaj
          </button>
          <button
            class="nav-btn"
            (click)="loadNextWeek()"
            [disabled]="isLoading()"
            type="button"
          >
            Następny ›
          </button>
        </div>
      </div>

      <!-- Filters -->
      <app-member-filter
        [members]="orderedMembers()"
        [selectedFilter]="selectedFilter()"
        (filterChange)="onFilterChange($event)"
      />

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
          <h3>Brak harmonogramu dla tego tygodnia</h3>
          <p>
            Wygeneruj nowy harmonogram za pomocą AI lub dodaj aktywności
            ręcznie.
          </p>
          <button class="cta-btn" (click)="generateSchedule()">
            ✨ Generuj harmonogram
          </button>
        </div>
        } @else { @if (layout() === 'days-columns') {
        <app-week-grid
          [gridCells]="visibleCells()"
          [members]="orderedMembers()"
          (activityClick)="onActivityClick($event)"
          (activityHover)="onActivityHover($event)"
          (cellClick)="onCellClick($event)"
        />
        } @else {
        <app-week-grid-transposed
          [gridCells]="visibleCells()"
          [members]="orderedMembers()"
          (activityClick)="onActivityClick($event)"
          (activityHover)="onActivityHover($event)"
          (cellClick)="onCellClick($event)"
        />
        } }
      </div>

      <!-- Modal -->
      @if (selectedActivity() && currentScheduleId()) {
      <app-activity-detail-modal
        [activity]="selectedActivity()"
        [scheduleId]="currentScheduleId()!"
        [availableMembers]="orderedMembers()"
        [errorMessage]="activityModalError()"
        (close)="closeActivityModal()"
        (save)="onActivityUpdate($event)"
        (delete)="onActivityDelete($event)"
      />
      } @if (isScheduleGeneratorOpen()) {
      <app-schedule-generator-panel
        [initialWeek]="weekStartDate()"
        (generated)="applyGeneratedSchedule($event)"
        (close)="closeScheduleGenerator()"
      />
      } @if (isWeekNavigationModalOpen() && selectedCellInfo()) { @defer {
      <app-week-navigation-modal
        [activities]="selectedCellActivities()"
        [cellInfo]="selectedCellInfo()!"
        [availableMembers]="orderedMembers()"
        [isAddingActivity]="isAddingActivity()"
        [errorMessage]="hasError() ? errorMessage() : null"
        (activityAdd)="onActivityAdd($event)"
        (close)="closeWeekNavigationModal()"
      />
      } }

      <!-- Sticky Reschedule Button -->
      @if (!isEmpty() && !isLoading()) {
      <div class="reschedule-button-container">
        <button
          class="reschedule-button"
          type="button"
          [disabled]="isRescheduling() || isLoading()"
          (click)="rescheduleWeek()"
        >
          @if (isRescheduling()) {
          <span class="spinner"></span>
          <span>Przeplanowuję tydzień...</span>
          } @else {
          <span>🔄 Przeplanuj tydzień (AI)</span>
          }
        </button>
        @if (rescheduleError()) {
        <div class="reschedule-error">{{ rescheduleError() }}</div>
        }
      </div>
      }
    </div>
  `,
  styles: [
    `
      .week-view-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 16px 20px;
        background: #fff;
        min-height: 100vh;
        width: 100vw;
        margin-left: calc(50% - 50vw);
        margin-right: calc(50% - 50vw);
        box-sizing: border-box;
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
        align-items: center;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .layout-toggle {
        display: inline-flex;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        background: #fff;
      }

      .layout-btn {
        padding: 8px 12px;
        border: none;
        background: #fff;
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s ease;
        border-right: 1px solid #e5e7eb;
      }

      .layout-btn:last-child {
        border-right: none;
      }

      .layout-btn.active {
        background: #111827;
        color: #fff;
      }

      .layout-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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
        height: 32px;
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
        height: 44px;
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

      /* Sticky Reschedule Button */
      .reschedule-button-container {
        position: sticky;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 16px 20px;
        background: linear-gradient(
          to top,
          rgba(255, 255, 255, 0.98) 0%,
          rgba(255, 255, 255, 0.95) 100%
        );
        backdrop-filter: blur(8px);
        border-top: 1px solid #e5e7eb;
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
        z-index: 100;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .reschedule-button {
        padding: 14px 32px;
        border: none;
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        color: #fff;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 220px;
        justify-content: center;
      }

      .reschedule-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
      }

      .reschedule-button:active:not(:disabled) {
        transform: translateY(0);
      }

      .reschedule-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .reschedule-button .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      .reschedule-error {
        color: #dc2626;
        font-size: 14px;
        text-align: center;
        padding: 8px 16px;
        background: #fee2e2;
        border-radius: 8px;
        max-width: 400px;
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

        .reschedule-button-container {
          padding: 12px 16px;
        }

        .reschedule-button {
          min-width: 100%;
          font-size: 14px;
          padding: 12px 24px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekViewContainerComponent implements OnInit {
  // Services
  private readonly scheduleService = inject(WeekScheduleService);
  private readonly gridTransformService = inject(GridTransformService);
  private readonly conflictDetectionService = inject(ConflictDetectionService);
  private readonly scheduleGeneratorService = inject(ScheduleGeneratorService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Input signals (sources of truth)
  readonly rawScheduleData = signal<TimeBlock[]>([]);
  readonly familyMembers = signal<FamilyMemberViewModel[]>([]);
  readonly selectedFilter = signal<FilterValue>(new Set());
  readonly selectedActivity = signal<ActivityInCell | null>(null);
  readonly weekStartDate = signal<Date>(getMonday(new Date()));
  readonly isLoading = signal<boolean>(false);
  readonly hasError = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly isScheduleGeneratorOpen = signal<boolean>(false);
  readonly layout = signal<WeekGridLayout>('days-columns');
  readonly isRescheduling = signal<boolean>(false);
  readonly rescheduleError = signal<string | null>(null);
  readonly isWeekNavigationModalOpen = signal<boolean>(false);
  readonly selectedCellInfo = signal<{ day: string; timeSlot: string } | null>(
    null
  );
  readonly currentScheduleId = signal<string | null>(null);
  readonly isAddingActivity = signal<boolean>(false);
  readonly activityModalError = signal<string | null>(null);
  private readonly useMockData = false;
  private readonly layoutStorageKey = 'weekViewLayout';

  // Computed signals (automatically recalculated)
  readonly weekEndDate = computed(() => addDays(this.weekStartDate(), 6));

  readonly orderedMembers = computed(() =>
    this.sortMembersForDisplay(this.familyMembers())
  );

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
    const selection = this.selectedFilter();

    if (selection.size === 0) return cells;

    return cells.map((row) =>
      row.map((cell) => ({
        ...cell,
        activities: cell.activities.map((activity) => {
          const isSelected = activity.isShared
            ? selection.has('shared') || selection.has(activity.member.id)
            : selection.has(activity.member.id);
          return {
            ...activity,
            isDimmed: !isSelected,
          };
        }),
      }))
    );
  });

  readonly isEmpty = computed(() => {
    return (
      !this.isLoading() && !this.hasError() && this.gridCells().length === 0
    );
  });

  readonly selectedCellActivities = computed(() => {
    const cellInfo = this.selectedCellInfo();
    if (!cellInfo) return [];

    const cells = this.gridCells();
    for (const row of cells) {
      for (const cell of row) {
        if (cell.day === cellInfo.day && cell.timeSlot === cellInfo.timeSlot) {
          return cell.activities;
        }
      }
    }
    return [];
  });

  readonly scheduleExists = signal<boolean>(false);
  private readonly initialQueryHandled = signal<boolean>(false);

  // Skeleton rows for loading state
  readonly skeletonRows = Array.from({ length: 12 }, (_, i) => i);

  // Debounced filter
  private filterTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.restoreLayout();
    this.subscribeToUrlChanges();
    this.initializeWeekFromUrl();
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
            if (error.status === 404) {
              return of<WeekScheduleResponse>({
                weekStart: weekStartISO,
                weekEnd: formatISODate(addDays(this.weekStartDate(), 6)),
                timeBlocks: [],
                familyMembers: [],
              });
            }
            this.handleError(error);
            return of(null);
          })
        )
        .toPromise();

      if (response) {
        if (!response.timeBlocks.length && this.useMockData) {
          const mock = this.buildMockWeekData(this.weekStartDate());
          this.rawScheduleData.set(mock.timeBlocks);
          const viewModels = this.transformToViewModels(mock.familyMembers);
          this.familyMembers.set(viewModels);
          this.ensureDefaultSelection(viewModels);
          this.scheduleExists.set(true);
          this.updateUrl(this.weekStartDate(), true);
          return;
        }

        this.rawScheduleData.set(response.timeBlocks);
        this.scheduleExists.set(response.timeBlocks.length > 0);

        // Extract scheduleId from first time block if available
        if (
          response.timeBlocks.length > 0 &&
          response.timeBlocks[0].scheduleId
        ) {
          this.currentScheduleId.set(response.timeBlocks[0].scheduleId);
        } else {
          this.currentScheduleId.set(null);
        }

        const resolvedMembers = this.resolveMembersFromResponse(response);
        if (resolvedMembers.length) {
          const viewModels = this.transformToViewModels(resolvedMembers);
          this.familyMembers.set(viewModels);
          this.ensureDefaultSelection(viewModels);
        }
        this.updateUrl(this.weekStartDate(), true);
      } else {
        this.rawScheduleData.set([]);
        this.scheduleExists.set(false);
        this.currentScheduleId.set(null);
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
        this.ensureDefaultSelection(members);
      }
    } catch (error) {
      console.error('Failed to load family members:', error);
    }
  }

  /**
   * Navigate to previous week
   */
  loadPreviousWeek(): void {
    const previousWeek = addDays(this.weekStartDate(), -7);
    this.weekStartDate.set(previousWeek);
    this.updateUrl(previousWeek);
    this.loadWeekData();
  }

  /**
   * Navigate to current week
   */
  loadCurrentWeek(): void {
    const currentWeek = getMonday(new Date());
    this.weekStartDate.set(currentWeek);
    this.updateUrl(currentWeek);
    this.loadWeekData();
  }

  /**
   * Navigate to next week
   */
  loadNextWeek(): void {
    const nextWeek = addDays(this.weekStartDate(), 7);
    this.weekStartDate.set(nextWeek);
    this.updateUrl(nextWeek);
    this.loadWeekData();
  }

  setLayout(layout: WeekGridLayout): void {
    this.layout.set(layout);
    this.persistLayout(layout);
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
   * Handle cell click (empty space)
   */
  onCellClick(event: { cell: GridCell; day: string; timeSlot: string }): void {
    // Don't open modal if activity modal is already open
    if (this.selectedActivity()) {
      return;
    }

    // Clear any previous errors
    this.hasError.set(false);
    this.errorMessage.set('');
    this.isAddingActivity.set(false);

    this.selectedCellInfo.set({
      day: event.day,
      timeSlot: event.timeSlot,
    });
    this.isWeekNavigationModalOpen.set(true);
  }

  /**
   * Close week navigation modal
   */
  closeWeekNavigationModal(): void {
    this.isWeekNavigationModalOpen.set(false);
    this.selectedCellInfo.set(null);
    // Reset error state when closing modal
    this.hasError.set(false);
    this.errorMessage.set('');
    this.isAddingActivity.set(false);
  }

  /**
   * Handle week selection from modal
   */
  onWeekSelect(weekStart: Date): void {
    this.weekStartDate.set(weekStart);
    this.updateUrl(weekStart);
    this.loadWeekData();
  }

  /**
   * Handle activity add from modal
   */
  async onActivityAdd(event: {
    title: string;
    blockType: BlockType;
    familyMemberId?: string;
    startTime: string;
    endTime: string;
    isShared: boolean;
    day: string;
  }): Promise<void> {
    const scheduleId = this.currentScheduleId();

    // Check if schedule exists
    if (!scheduleId) {
      this.errorMessage.set(
        'Brak harmonogramu dla tego tygodnia. Najpierw wygeneruj harmonogram.'
      );
      this.hasError.set(true);
      // Keep modal open so user can see the error
      return;
    }

    // Build time range from day and times
    const timeRange = buildTimeRange(event.day, event.startTime, event.endTime);

    // Prepare request data
    const requestData = {
      title: event.title,
      blockType: event.blockType,
      familyMemberId: event.isShared ? null : event.familyMemberId || null,
      timeRange,
      isShared: event.isShared,
      metadata: {},
    };

    this.isAddingActivity.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');

    try {
      // Call API to create time block
      await lastValueFrom(
        this.scheduleService.createTimeBlock(scheduleId, requestData)
      );

      // Success: close modal and reload week data
      this.closeWeekNavigationModal();
      await this.loadWeekData();
    } catch (error) {
      // Error: show message and keep modal open
      const httpError = error as HttpErrorResponse;
      let errorMsg = 'Nie udało się dodać aktywności.';

      if (httpError.status === 400) {
        errorMsg =
          httpError.error?.message ||
          'Nieprawidłowe dane. Sprawdź czy czas nie koliduje z innymi aktywnościami.';
      } else if (httpError.status === 404) {
        errorMsg =
          'Harmonogram nie został znaleziony. Odśwież stronę i spróbuj ponownie.';
      } else if (httpError.status === 409) {
        errorMsg =
          'Ta aktywność koliduje z inną aktywnością. Wybierz inny czas.';
      } else if (httpError.status >= 500) {
        errorMsg = 'Błąd serwera. Spróbuj ponownie za chwilę.';
      }

      this.errorMessage.set(errorMsg);
      this.hasError.set(true);
    } finally {
      this.isAddingActivity.set(false);
    }
  }

  /**
   * Close activity modal
   */
  closeActivityModal(): void {
    this.selectedActivity.set(null);
    this.activityModalError.set(null);
  }

  /**
   * Handle activity update from modal
   */
  async onActivityUpdate(event: {
    blockId: string;
    scheduleId: string;
    title: string;
    blockType: BlockType;
    familyMemberId?: string | null;
    timeRange: { start: string; end: string };
    isShared: boolean;
    metadata?: Record<string, any>;
  }): Promise<void> {
    this.activityModalError.set(null);

    try {
      await lastValueFrom(
        this.scheduleService.updateTimeBlock(event.scheduleId, event.blockId, {
          title: event.title,
          blockType: event.blockType,
          familyMemberId: event.familyMemberId,
          timeRange: event.timeRange,
          isShared: event.isShared,
          metadata: event.metadata,
        })
      );

      // Success: close modal and reload week data
      this.closeActivityModal();
      await this.loadWeekData();
    } catch (error) {
      // Error: show message and keep modal open
      const httpError = error as HttpErrorResponse;
      let errorMsg = 'Nie udało się zaktualizować aktywności.';

      if (httpError.status === 400) {
        errorMsg =
          httpError.error?.message ||
          'Nieprawidłowe dane. Sprawdź czy czas nie koliduje z innymi aktywnościami.';
      } else if (httpError.status === 404) {
        errorMsg =
          'Aktywność nie została znaleziona. Odśwież stronę i spróbuj ponownie.';
      } else if (httpError.status === 409) {
        errorMsg =
          'Ta aktywność koliduje z inną aktywnością. Wybierz inny czas.';
      } else if (httpError.status >= 500) {
        errorMsg = 'Błąd serwera. Spróbuj ponownie za chwilę.';
      }

      this.activityModalError.set(errorMsg);
    }
  }

  /**
   * Handle activity delete from modal
   */
  async onActivityDelete(event: {
    scheduleId: string;
    blockId: string;
  }): Promise<void> {
    this.activityModalError.set(null);

    try {
      await lastValueFrom(
        this.scheduleService.deleteTimeBlock(event.scheduleId, event.blockId)
      );

      // Success: close modal and reload week data
      this.closeActivityModal();
      await this.loadWeekData();
    } catch (error) {
      // Error: show message and keep modal open
      const httpError = error as HttpErrorResponse;
      let errorMsg = 'Nie udało się usunąć aktywności.';

      if (httpError.status === 404) {
        errorMsg =
          'Aktywność nie została znaleziona. Odśwież stronę i spróbuj ponownie.';
      } else if (httpError.status >= 500) {
        errorMsg = 'Błąd serwera. Spróbuj ponownie za chwilę.';
      }

      this.activityModalError.set(errorMsg);
    }
  }

  /**
   * Retry loading data
   */
  retryLoad(): void {
    this.loadWeekData();
  }

  /**
   * Generate new schedule for current week
   * Redirects to schedule generation page/feature
   */
  generateSchedule(): void {
    this.isScheduleGeneratorOpen.set(true);
  }

  closeScheduleGenerator(): void {
    this.isScheduleGeneratorOpen.set(false);
  }

  applyGeneratedSchedule(response: ScheduleGenerationResponse): void {
    this.rawScheduleData.set(response.timeBlocks);
    this.scheduleExists.set(response.timeBlocks.length > 0);

    const resolvedMembers = this.extractMembersFromTimeBlocks(
      response.timeBlocks
    );
    if (resolvedMembers.length) {
      const viewModels = this.transformToViewModels(resolvedMembers);
      this.familyMembers.set(viewModels);
      this.ensureDefaultSelection(viewModels);
    }

    const parsed = parseISODate(response.weekStartDate);
    if (!isNaN(parsed.getTime())) {
      const monday = getMonday(parsed);
      this.weekStartDate.set(monday);
      this.updateUrl(monday);
    }

    this.closeScheduleGenerator();
  }

  private initializeWeekFromUrl(): void {
    const weekParam = this.route.snapshot.queryParamMap.get('week');
    if (weekParam) {
      const parsed = parseISODate(weekParam);
      if (!isNaN(parsed.getTime())) {
        this.weekStartDate.set(getMonday(parsed));
        return;
      }
    }

    const currentWeek = getMonday(new Date());
    this.weekStartDate.set(currentWeek);
    this.updateUrl(currentWeek, true);
  }

  private subscribeToUrlChanges(): void {
    this.route.queryParams.subscribe((params) => {
      if (!this.initialQueryHandled()) {
        this.initialQueryHandled.set(true);
        return;
      }

      const weekParam = params['week'];
      if (!weekParam) {
        return;
      }

      const parsed = parseISODate(weekParam);
      if (isNaN(parsed.getTime())) {
        return;
      }

      const monday = getMonday(parsed);
      const currentWeek = formatISODate(this.weekStartDate());
      const newWeek = formatISODate(monday);

      if (currentWeek === newWeek) {
        return;
      }

      this.weekStartDate.set(monday);
      this.loadWeekData();
    });
  }

  private updateUrl(targetWeek: Date, replace = false): void {
    const isoWeek = formatISODate(targetWeek);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { week: isoWeek },
      queryParamsHandling: 'merge',
      replaceUrl: replace,
    });
  }

  private restoreLayout(): void {
    const stored = this.getStoredLayout();
    if (stored) {
      this.layout.set(stored);
    }
  }

  private persistLayout(layout: WeekGridLayout): void {
    try {
      globalThis.localStorage?.setItem(this.layoutStorageKey, layout);
    } catch {
      // Ignore storage errors (private mode or disabled storage)
    }
  }

  private getStoredLayout(): WeekGridLayout | null {
    try {
      const value = globalThis.localStorage?.getItem(this.layoutStorageKey);
      return value === 'days-columns' || value === 'hours-columns'
        ? value
        : null;
    } catch {
      return null;
    }
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

  private resolveMembersFromResponse(
    response: WeekScheduleResponse
  ): FamilyMember[] {
    if (response.familyMembers && response.familyMembers.length) {
      return response.familyMembers;
    }

    return this.extractMembersFromTimeBlocks(response.timeBlocks);
  }

  private extractMembersFromTimeBlocks(blocks: TimeBlock[]): FamilyMember[] {
    const memberMap = new Map<string, FamilyMember>();

    blocks.forEach((block) => {
      const member = (block as TimeBlock & { familyMember?: FamilyMember })
        .familyMember;
      if (member?.familyMemberId && !memberMap.has(member.familyMemberId)) {
        memberMap.set(member.familyMemberId, member);
      }
    });

    return Array.from(memberMap.values());
  }

  private buildMockWeekData(weekStart: Date): {
    familyMembers: FamilyMember[];
    timeBlocks: TimeBlock[];
  } {
    const members: FamilyMember[] = [
      this.createMockMember('tata', 'tata', FamilyMemberRole.USER),
      this.createMockMember('mama', 'mama', FamilyMemberRole.SPOUSE),
      this.createMockMember('hania', 'Hania', FamilyMemberRole.CHILD, 8),
      this.createMockMember('małgosia', 'Małgosia', FamilyMemberRole.CHILD, 5),
      this.createMockMember('monisia', 'Monisia', FamilyMemberRole.CHILD, 2),
    ];

    const scheduleId = 'mock-schedule';
    const blocks: TimeBlock[] = [
      this.createMockBlock({
        blockId: 'mock-1',
        scheduleId,
        weekStart,
        dayOffset: 0,
        startHour: 7,
        endHour: 16,
        title: 'Praca',
        blockType: BlockType.WORK,
        familyMemberId: 'tata',
      }),
      this.createMockBlock({
        blockId: 'mock-2',
        scheduleId,
        weekStart,
        dayOffset: 0,
        startHour: 9,
        endHour: 14,
        title: 'Przedszkole',
        blockType: BlockType.WORK,
        familyMemberId: 'małgosia',
      }),
      this.createMockBlock({
        blockId: 'mock-3',
        scheduleId,
        weekStart,
        dayOffset: 0,
        startHour: 8,
        endHour: 13,
        title: 'Szkoła',
        blockType: BlockType.WORK,
        familyMemberId: 'hania',
      }),
      this.createMockBlock({
        blockId: 'mock-4',
        scheduleId,
        weekStart,
        dayOffset: 0,
        startHour: 6,
        endHour: 7,
        title: 'Bieganie',
        blockType: BlockType.ACTIVITY,
        familyMemberId: 'tata',
        metadata: { notes: 'Poranny trening' },
      }),
      this.createMockBlock({
        blockId: 'mock-5',
        scheduleId,
        weekStart,
        dayOffset: 1,
        startHour: 7,
        endHour: 16,
        title: 'Praca',
        blockType: BlockType.WORK,
        familyMemberId: 'tata',
      }),
      this.createMockBlock({
        blockId: 'mock-6',
        scheduleId,
        weekStart,
        dayOffset: 1,
        startHour: 16,
        endHour: 17,
        title: 'Basen',
        blockType: BlockType.ACTIVITY,
        familyMemberId: 'hania',
      }),
      this.createMockBlock({
        blockId: 'mock-7',
        scheduleId,
        weekStart,
        dayOffset: 2,
        startHour: 12,
        endHour: 13,
        title: 'Trening',
        blockType: BlockType.ACTIVITY,
        familyMemberId: 'mama',
      }),
      this.createMockBlock({
        blockId: 'mock-8',
        scheduleId,
        weekStart,
        dayOffset: 4,
        startHour: 18,
        endHour: 20,
        title: 'Rodzinny czas',
        blockType: BlockType.OTHER,
        isShared: true,
      }),
      this.createMockBlock({
        blockId: 'mock-9',
        scheduleId,
        weekStart,
        dayOffset: 5,
        startHour: 9,
        endHour: 11,
        title: 'Wspólne śniadanie',
        blockType: BlockType.MEAL,
        isShared: true,
      }),
    ];

    return { familyMembers: members, timeBlocks: blocks };
  }

  private createMockMember(
    id: string,
    name: string,
    role: FamilyMemberRole,
    age?: number
  ): FamilyMember {
    return {
      familyMemberId: id,
      userId: 'mock-user',
      name,
      role,
      age,
      preferences: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createMockBlock(params: {
    blockId: string;
    scheduleId: string;
    weekStart: Date;
    dayOffset: number;
    startHour: number;
    endHour: number;
    title: string;
    blockType: BlockType;
    familyMemberId?: string;
    isShared?: boolean;
    metadata?: Record<string, any>;
  }): TimeBlock {
    const start = new Date(params.weekStart);
    start.setDate(start.getDate() + params.dayOffset);
    start.setHours(params.startHour, 0, 0, 0);

    const end = new Date(params.weekStart);
    end.setDate(end.getDate() + params.dayOffset);
    end.setHours(params.endHour, 0, 0, 0);

    return {
      blockId: params.blockId,
      scheduleId: params.scheduleId,
      recurringGoalId: undefined,
      familyMemberId: params.familyMemberId,
      title: params.title,
      blockType: params.blockType,
      timeRange: { start, end },
      isShared: params.isShared ?? false,
      metadata: params.metadata ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private ensureDefaultSelection(members: FamilyMemberViewModel[]): void {
    const current = this.selectedFilter();
    if (current.size > 0 || members.length === 0) {
      return;
    }

    const selection = new Set<string>(members.map((member) => member.id));
    selection.add('shared');
    this.selectedFilter.set(selection);
  }

  private sortMembersForDisplay(
    members: FamilyMemberViewModel[]
  ): FamilyMemberViewModel[] {
    const parents = members.filter((member) => member.role === 'parent');
    const kids = members.filter((member) => member.role === 'child');

    parents.sort((a, b) => a.name.localeCompare(b.name, 'pl'));
    kids.sort((a, b) => {
      const ageDiff = (b.age ?? 0) - (a.age ?? 0);
      return ageDiff !== 0 ? ageDiff : a.name.localeCompare(b.name, 'pl');
    });

    return [...parents, ...kids];
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
    return getMemberColor(memberId);
  }

  /**
   * Reschedule current week using AI
   * Takes all current goals and commitments and regenerates the schedule
   */
  async rescheduleWeek(): Promise<void> {
    if (this.isRescheduling() || this.isLoading()) {
      return;
    }

    this.isRescheduling.set(true);
    this.rescheduleError.set(null);

    try {
      const weekStartISO = formatISODate(this.weekStartDate());

      const request: GenerateScheduleRequest = {
        weekStartDate: weekStartISO,
        strategy: 'balanced',
        preferences: {
          respectFixedBlocks: true,
          includeAllGoals: true,
          preferMornings: false,
          maximizeFamilyTime: true,
        },
      };

      const response = await lastValueFrom(
        this.scheduleGeneratorService.generateSchedule(request)
      );

      // Apply the generated schedule
      this.applyGeneratedSchedule(response);
    } catch (error) {
      const message =
        error instanceof HttpErrorResponse
          ? error.error?.message || error.statusText || 'Błąd serwera'
          : 'Nie udało się przeplanować tygodnia.';
      this.rescheduleError.set(message);
      console.error('Failed to reschedule week:', error);
    } finally {
      this.isRescheduling.set(false);
    }
  }
}
