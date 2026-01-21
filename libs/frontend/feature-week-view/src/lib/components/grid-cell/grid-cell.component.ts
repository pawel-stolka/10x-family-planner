import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  GridCell,
  ActivityInCell,
  FamilyMemberViewModel,
} from '../../models/week-grid.models';
import { ActivityCellComponent } from '../activity-cell/activity-cell.component';
import { calculateProportionalHeight, parseTime } from '../../utils/time.utils';

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
      [class.has-activities]="cell().activities.length > 0"
      [class.no-activities]="cell().activities.length === 0"
      (click)="onCellClick($event)"
      [attr.aria-label]="getAriaLabel()"
      tabindex="0"
      (keydown.enter)="onCellKeydown($event)"
      (keydown.space)="onCellKeydown($event)"
    >
      <div class="activities-stack">
        @for (member of members(); track member.id) { @if
        (getActivityForMember(member.id); as activity) {
        <div class="activity-slot">
          <app-activity-cell
            [activity]="activity"
            [style.width.%]="getActivityWidth(activity)"
            [style.margin-left.%]="getActivityLeftOffset(activity)"
            (activityClick)="onActivityClick($event)"
            (activityHover)="onActivityHover($event)"
          />
        </div>
        } @else {
        <div class="activity-slot empty"></div>
        } }
      </div>
    </div>
  `,
  styles: [
    `
      .grid-cell {
        position: relative;
        height: 100%;
        min-height: 100%;
        background: #fff;
        border: 1px solid #e5e7eb;
        padding: 2px 2px;
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

      .grid-cell.no-activities {
        cursor: pointer;
      }

      .grid-cell.no-activities:hover {
        background: #f0f9ff;
        border-color: #bfdbfe;
      }

      .grid-cell.has-activities:hover {
        background: #f9fafb;
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
        align-items: stretch;
        justify-content: flex-start;
      }

      .activity-slot.empty {
        background: transparent;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridCellComponent {
  cell = input.required<GridCell>();
  isToday = input<boolean>(false);
  members = input<FamilyMemberViewModel[]>([]);
  useProportionalWidth = input<boolean>(false);

  activityClick = output<ActivityInCell>();
  activityHover = output<{ activity: ActivityInCell; show: boolean }>();
  cellClick = output<{ cell: GridCell; day: string; timeSlot: string }>();

  onActivityClick(activity: ActivityInCell): void {
    this.activityClick.emit(activity);
  }

  onActivityHover(event: { activity: ActivityInCell; show: boolean }): void {
    this.activityHover.emit(event);
  }

  /**
   * Handle cell click - only emit if click was on empty space
   */
  onCellClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Check if click was on activity or empty space
    if (!target.closest('.activity-cell')) {
      event.stopPropagation();
      this.cellClick.emit({
        cell: this.cell(),
        day: this.cell().day,
        timeSlot: this.cell().timeSlot,
      });
    }
  }

  /**
   * Handle keyboard navigation
   */
  onCellKeydown(event: any): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.cellClick.emit({
        cell: this.cell(),
        day: this.cell().day,
        timeSlot: this.cell().timeSlot,
      });
    }
  }

  /**
   * Get ARIA label for accessibility
   */
  getAriaLabel(): string {
    const cell = this.cell();
    const dayName = this.getDayName(cell.dayOfWeek);
    const activityCount = cell.activities.length;

    if (activityCount === 0) {
      return `Empty time slot, ${dayName} ${cell.timeSlot}. Press Enter to navigate to week or add activity.`;
    }
    return `${dayName} ${cell.timeSlot}, ${activityCount} ${
      activityCount === 1 ? 'activity' : 'activities'
    }. Press Enter to navigate to week or view activities.`;
  }

  private getDayName(dayOfWeek: number): string {
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return days[dayOfWeek] || 'Day';
  }

  getActivityForMember(memberId: string): ActivityInCell | null {
    return (
      this.cell().activities.find(
        (activity) => activity.member.id === memberId
      ) ?? null
    );
  }

  getActivityWidth(activity: ActivityInCell): number {
    // Calculate width based on activity duration within the time slot
    // Each time slot represents 1 hour (60 minutes)
    // Width should be proportional to the overlap duration
    const cell = this.cell();
    const timeSlot = cell.timeSlot;

    // Use proportionalHeight if available, otherwise calculate it
    const proportion =
      activity.proportionalHeight > 0
        ? activity.proportionalHeight
        : calculateProportionalHeight(
            activity.block.startTime,
            activity.block.endTime,
            timeSlot
          );

    // Convert proportion (0.0-1.0) to percentage (0-100)
    return Math.max(10, Math.min(100, proportion * 100)); // Clamp between 10% and 100%
  }

  getActivityLeftOffset(activity: ActivityInCell): number {
    // Calculate left offset for activities that don't start at the beginning of the time slot
    // If activity starts at 19:30 in 19:00-20:00 slot, it should be offset by 50% from left
    const cell = this.cell();
    const timeSlot = cell.timeSlot;

    const activityStart = parseTime(activity.block.startTime);
    const slotStart = parseTime(timeSlot);

    // If activity starts before or at the slot start, no offset needed
    if (activityStart <= slotStart) {
      return 0;
    }

    // Calculate offset as percentage: (minutes into slot / 60) * 100
    const minutesIntoSlot = activityStart - slotStart;
    const offsetPercent = (minutesIntoSlot / 60) * 100;

    // Clamp between 0% and 100%
    return Math.max(0, Math.min(100, offsetPercent));
  }
}
