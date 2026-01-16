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
import { GridHeaderComponent } from '../grid-header/grid-header.component';
import { TimeColumnComponent } from '../time-column/time-column.component';
import { GridCellComponent } from '../grid-cell/grid-cell.component';
import { isToday, parseISODate } from '../../utils/date.utils';
import {
  DAY_NAMES,
  SHORT_DAY_NAMES,
  CELL_HEIGHT,
} from '../../constants/week-grid.constants';

/**
 * Week Grid Component
 * Main grid component that renders the weekly calendar
 */
@Component({
  selector: 'app-week-grid',
  standalone: true,
  imports: [
    CommonModule,
    GridHeaderComponent,
    TimeColumnComponent,
    GridCellComponent,
  ],
  template: `
    <div
      class="week-grid-container"
      [style.--member-count]="members().length"
      [style.--slot-height.px]="slotHeight"
      [style.--slot-gap.px]="slotGap"
      #gridContainer
    >
      <!-- Header row: time column + 7 day headers -->
      <div class="grid-header-row">
        <div class="time-header">Godzina</div>
        @for (day of days(); track day.date) {
          <app-grid-header 
            [day]="day" 
            [isToday]="checkIsToday(day.date)" 
          />
        }
      </div>

      <!-- Grid rows: time slots with cells -->
      <div class="grid-body">
        @for (timeSlot of timeSlots(); track timeSlot; let rowIndex = $index) {
          <div class="grid-row">
            <!-- Time column -->
            <app-time-column [time]="timeSlot" />

            <!-- Day cells -->
            @for (day of days(); track day.date; let colIndex = $index) {
              @defer (on viewport) {
                <app-grid-cell
                  [cell]="getCell(rowIndex, colIndex)"
                  [isToday]="checkIsToday(day.date)"
                  [members]="members()"
                  (activityClick)="onActivityClick($event)"
                  (activityHover)="onActivityHover($event)"
                />
              } @placeholder {
                <div class="grid-cell-placeholder"></div>
              }
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .week-grid-container {
      width: 100%;
      overflow: auto;
      background: #f9fafb;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .grid-header-row {
      display: grid;
      grid-template-columns: 64px repeat(7, 1fr);
      position: sticky;
      top: 0;
      z-index: 30;
      background: #fff;
      border-bottom: 2px solid #d1d5db;
    }

    .time-header {
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

    .grid-body {
      display: flex;
      flex-direction: column;
    }

    .grid-row {
      display: grid;
      grid-template-columns: 64px repeat(7, 1fr);
      min-height: calc(
        (var(--member-count, 1) * var(--slot-height, 12px)) +
        ((var(--member-count, 1) - 1) * var(--slot-gap, 2px)) +
        6px
      );
    }

    .grid-cell-placeholder {
      min-height: calc(
        (var(--member-count, 1) * var(--slot-height, 12px)) +
        ((var(--member-count, 1) - 1) * var(--slot-gap, 2px)) +
        6px
      );
      background: #fafafa;
      border: 1px solid #e5e7eb;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }

    /* Responsive grid columns */
    @media (max-width: 1200px) {
      .grid-header-row,
      .grid-row {
        grid-template-columns: 56px repeat(7, minmax(100px, 1fr));
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekGridComponent {
  gridCells = input.required<GridCell[][]>();
  members = input<FamilyMemberViewModel[]>([]);
  readonly slotHeight = CELL_HEIGHT;
  readonly slotGap = 2;

  activityClick = output<ActivityInCell>();
  activityHover = output<{ activity: ActivityInCell; show: boolean }>();

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
   * Get cell by row and column index
   */
  getCell(rowIndex: number, colIndex: number): GridCell {
    const grid = this.gridCells();
    return grid[rowIndex]?.[colIndex] || this.getEmptyCell();
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
