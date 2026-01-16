import { 
  Component, 
  input, 
  output,
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridCell, ActivityInCell } from '../../models/week-grid.models';
import { ActivityCellComponent } from '../activity-cell/activity-cell.component';
import { CELL_HEIGHT } from '../../constants/week-grid.constants';

/**
 * Grid Cell Component
 * Represents a single cell in the week grid
 * Can contain multiple activities stacked vertically
 */
@Component({
  selector: 'app-grid-cell',
  standalone: true,
  imports: [CommonModule, ActivityCellComponent],
  template: `
    <div 
      class="grid-cell" 
      [class.today]="isToday()"
      [class.empty]="cell().isEmpty"
    >
      @if (!cell().isEmpty) {
        <div class="activities-stack">
          @for (activity of cell().activities; track activity.id) {
            <app-activity-cell
              [activity]="activity"
              [cellHeight]="cellHeight"
              (activityClick)="onActivityClick($event)"
              (activityHover)="onActivityHover($event)"
            />
          }
        </div>
      } @else {
        <div class="empty-state"></div>
      }
    </div>
  `,
  styles: [`
    .grid-cell {
      position: relative;
      min-height: 36px;
      background: #fff;
      border: 1px solid #e5e7eb;
      padding: 2px 3px;
      overflow: visible;
      transition: background-color 0.2s ease;
    }

    .grid-cell.today {
      background: #eff6ff;
      border-color: #bfdbfe;
    }

    .grid-cell.empty {
      background: #fafafa;
    }

    .activities-stack {
      display: flex;
      flex-direction: row;
      gap: 3px;
      height: 100%;
      align-items: center;
      flex-wrap: nowrap;
      overflow: hidden;
    }

    .empty-state {
      width: 100%;
      height: 100%;
      min-height: 24px;
    }

    /* Handle overflow when too many activities */
    .grid-cell:has(.activities-stack > :nth-child(3)) .activities-stack {
      overflow-x: auto;
    }

    /* Custom scrollbar */
    .activities-stack::-webkit-scrollbar {
      height: 4px;
    }

    .activities-stack::-webkit-scrollbar-track {
      background: transparent;
    }

    .activities-stack::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 2px;
    }

    .activities-stack::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridCellComponent {
  cell = input.required<GridCell>();
  isToday = input<boolean>(false);
  cellHeight = CELL_HEIGHT;

  activityClick = output<ActivityInCell>();
  activityHover = output<{ activity: ActivityInCell; show: boolean }>();

  onActivityClick(activity: ActivityInCell): void {
    this.activityClick.emit(activity);
  }

  onActivityHover(event: { activity: ActivityInCell; show: boolean }): void {
    this.activityHover.emit(event);
  }
}
