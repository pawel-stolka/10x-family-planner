import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  GridCell,
  DayInfo,
  ActivityInCell,
  FamilyMemberViewModel,
} from '../../models/week-grid.models';
import { GridCellComponent } from '../grid-cell/grid-cell.component';
import { isToday, parseISODate } from '../../utils/date.utils';
import {
  DAY_NAMES,
  SHORT_DAY_NAMES,
  CELL_HEIGHT,
} from '../../constants/week-grid.constants';

/**
 * Week Grid Transposed Component
 * Renders hours as columns and days as rows
 */
@Component({
  selector: 'app-week-grid-transposed',
  standalone: true,
  imports: [CommonModule, GridCellComponent],
  template: `
    <div
      class="week-grid-container"
      [style.--time-slots]="timeSlots().length"
      [style.--member-count]="members().length"
      [style.--slot-height.px]="slotHeight"
      [style.--slot-gap.px]="slotGap"
    >
      <!-- Header row: day column + time headers -->
      <div class="grid-header-row">
        <div class="day-header-spacer">Dzień</div>
        @for (timeSlot of timeSlots(); track timeSlot) {
        <div class="time-header">{{ timeSlot }}</div>
        }
      </div>

      <!-- Grid rows: days with time cells -->
      <div class="grid-body">
        @for (day of days(); track day.date; let rowIndex = $index) {
        <div class="grid-row">
          <div class="day-row-header" [class.today]="checkIsToday(day.date)">
            <div class="day-name">{{ day.shortName }}</div>
            <div class="day-date">{{ day.dayOfMonth }}</div>
          </div>
          @for (timeSlot of timeSlots(); track timeSlot; let colIndex = $index)
          { @defer (on viewport) {
          <app-grid-cell
            [cell]="getCell(colIndex, rowIndex)"
            [isToday]="checkIsToday(day.date)"
            [members]="members()"
            [useProportionalWidth]="true"
            (activityClick)="onActivityClick($event)"
            (activityHover)="onActivityHover($event)"
            (cellClick)="onCellClick($event)"
          />
          } @placeholder {
          <div class="grid-cell-placeholder"></div>
          } }
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .week-grid-container {
        width: 100%;
        overflow: auto;
        background: #f9fafb;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .grid-header-row {
        display: grid;
        grid-template-columns: 64px repeat(var(--time-slots), minmax(72px, 1fr));
        position: sticky;
        top: 0;
        z-index: 30;
        background: #fff;
        border-bottom: 2px solid #d1d5db;
      }

      .day-header-spacer {
        position: sticky;
        left: 0;
        z-index: 31;
        padding: 6px 8px;
        background: #f3f4f6;
        border-right: 2px solid #d1d5db;
        font-size: 11px;
        font-weight: 700;
        color: #6b7280;
        text-transform: uppercase;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .time-header {
        padding: 6px 4px;
        text-align: left;
        padding-left: 8px;
        font-size: 11px;
        font-weight: 700;
        color: #6b7280;
        text-transform: uppercase;
        border-left: 1px solid #e5e7eb;
      }

      .grid-body {
        display: flex;
        flex-direction: column;
      }

      .grid-row {
        display: grid;
        grid-template-columns: 64px repeat(var(--time-slots), minmax(72px, 1fr));
        min-height: calc(
          (var(--member-count, 1) * var(--slot-height, 12px)) +
            ((var(--member-count, 1) - 1) * var(--slot-gap, 2px)) + 6px
        );
      }

      .day-row-header {
        position: sticky;
        left: 0;
        z-index: 20;
        padding: 4px 6px;
        background: #fff;
        border-right: 2px solid #d1d5db;
        border-bottom: 1px solid #e5e7eb;
        text-align: center;
        font-weight: 600;
        transition: background-color 0.2s ease;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 2px;
      }

      .day-row-header.today {
        background: #eff6ff;
        border-right-color: #3b82f6;
      }

      .day-name {
        font-size: 11px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }

      .day-date {
        font-size: 13px;
        color: #111827;
      }

      .grid-cell-placeholder {
        min-height: calc(
          (var(--member-count, 1) * var(--slot-height, 12px)) +
            ((var(--member-count, 1) - 1) * var(--slot-gap, 2px)) + 6px
        );
        background: #fafafa;
        border: 1px solid #e5e7eb;
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }

      @media (max-width: 1200px) {
        .grid-header-row,
        .grid-row {
          grid-template-columns: 56px repeat(
              var(--time-slots),
              minmax(64px, 1fr)
            );
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekGridTransposedComponent {
  gridCells = input.required<GridCell[][]>();
  members = input<FamilyMemberViewModel[]>([]);
  readonly slotHeight = CELL_HEIGHT;
  readonly slotGap = 2;

  activityClick = output<ActivityInCell>();
  activityHover = output<{ activity: ActivityInCell; show: boolean }>();
  cellClick = output<{ cell: GridCell; day: string; timeSlot: string }>();

  /**
   * Computed: Extract time slots from grid
   */
  readonly timeSlots = computed(() => {
    const grid = this.gridCells();
    if (grid.length === 0) return [];
    return grid.map((row) => row[0]?.timeSlot || '');
  });

  /**
   * Computed: Extract days info from grid
   */
  readonly days = computed(() => {
    const grid = this.gridCells();
    if (grid.length === 0 || grid[0].length === 0) return [];

    return grid[0].map((cell): DayInfo => {
      const date = parseISODate(cell.day);
      return {
        name: DAY_NAMES[cell.dayOfWeek],
        shortName: SHORT_DAY_NAMES[cell.dayOfWeek],
        date: cell.day,
        dayOfWeek: cell.dayOfWeek,
        dayOfMonth: date.getDate(),
      };
    });
  });

  /**
   * Get cell by time column and day row index
   */
  getCell(timeIndex: number, dayIndex: number): GridCell {
    const grid = this.gridCells();
    return grid[timeIndex]?.[dayIndex] || this.getEmptyCell();
  }

  /**
   * Check if date is today
   */
  checkIsToday(dateISO: string): boolean {
    return isToday(parseISODate(dateISO));
  }

  /**
   * Handle activity click
   */
  onActivityClick(activity: ActivityInCell): void {
    this.activityClick.emit(activity);
  }

  /**
   * Handle activity hover
   */
  onActivityHover(event: { activity: ActivityInCell; show: boolean }): void {
    this.activityHover.emit(event);
  }

  /**
   * Handle cell click
   */
  onCellClick(event: { cell: GridCell; day: string; timeSlot: string }): void {
    this.cellClick.emit(event);
  }

  /**
   * Create empty cell fallback
   */
  private getEmptyCell(): GridCell {
    return {
      id: 'empty',
      timeSlot: '',
      day: '',
      dayOfWeek: 0,
      isEmpty: true,
      activities: [],
    };
  }
}
