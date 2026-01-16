import { 
  Component, 
  input, 
  output,
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  GridCell,
  ActivityInCell,
  FamilyMemberViewModel,
} from '../../models/week-grid.models';
import { ActivityCellComponent } from '../activity-cell/activity-cell.component';

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
      <div class="activities-stack">
        @for (member of members(); track member.id) {
          @if (getActivityForMember(member.id); as activity) {
            <div class="activity-slot">
              <app-activity-cell
                [activity]="activity"
                [style.width.%]="getActivityWidth(activity)"
                (activityClick)="onActivityClick($event)"
                (activityHover)="onActivityHover($event)"
              />
            </div>
          } @else {
            <div class="activity-slot empty"></div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .grid-cell {
      position: relative;
      height: 100%;
      min-height: 100%;
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
      flex-direction: column;
      gap: var(--slot-gap, 2px);
      height: 100%;
      align-items: stretch;
      overflow: hidden;
    }

    .activity-slot {
      min-height: var(--slot-height, 12px);
      display: flex;
      align-items: center;
    }

    .activity-slot.empty {
      background: transparent;
    }

  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridCellComponent {
  cell = input.required<GridCell>();
  isToday = input<boolean>(false);
  members = input<FamilyMemberViewModel[]>([]);
  useProportionalWidth = input<boolean>(false);

  activityClick = output<ActivityInCell>();
  activityHover = output<{ activity: ActivityInCell; show: boolean }>();

  onActivityClick(activity: ActivityInCell): void {
    this.activityClick.emit(activity);
  }

  onActivityHover(event: { activity: ActivityInCell; show: boolean }): void {
    this.activityHover.emit(event);
  }

  getActivityForMember(memberId: string): ActivityInCell | null {
    return (
      this.cell().activities.find((activity) => activity.member.id === memberId) ??
      null
    );
  }

  getActivityWidth(activity: ActivityInCell): number {
    if (!this.useProportionalWidth()) {
      return 100;
    }
    return Math.max(5, Math.round(activity.proportionalHeight * 100));
  }
}
