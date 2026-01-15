import { 
  Component, 
  input, 
  output,
  signal,
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityInCell } from '../../models/week-grid.models';
import { MIN_ACTIVITY_HEIGHT, TOOLTIP_DELAY } from '../../constants/week-grid.constants';

/**
 * Activity Cell Component
 * Displays single activity in a grid cell
 */
@Component({
  selector: 'app-activity-cell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="activity-cell"
      [class.dimmed]="activity().isDimmed"
      [class.has-conflict]="activity().hasConflict"
      [class.shared]="activity().isShared"
      [style.background]="getBackground()"
      [style.height.px]="getHeight()"
      [style.min-height.px]="minHeight"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
      (click)="onClick()"
    >
      <div class="activity-content">
        @if (activity().block.emoji) {
          <span class="activity-emoji">{{ activity().block.emoji }}</span>
        }
        <span class="activity-title">{{ activity().block.title }}</span>
        <span class="member-initial">{{ activity().member.initial }}</span>
      </div>

      @if (activity().hasConflict) {
        <div class="conflict-indicator" title="Konflikt harmonogramu">⚠️</div>
      }

      @if (showTooltip()) {
        <div class="tooltip-placeholder">
          <!-- Tooltip will be rendered here by parent -->
        </div>
      }
    </div>
  `,
  styles: [`
    .activity-cell {
      position: relative;
      margin: 2px;
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
      overflow: hidden;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .activity-cell:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .activity-content {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }

    .activity-emoji {
      font-size: 16px;
      flex-shrink: 0;
    }

    .activity-title {
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .member-initial {
      font-size: 11px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.9);
      background: rgba(0, 0, 0, 0.15);
      padding: 2px 6px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .conflict-indicator {
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 14px;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
    }

    .activity-cell.has-conflict {
      border: 3px solid #ef4444;
      box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.2);
    }

    .activity-cell.dimmed {
      opacity: 0.3;
      filter: grayscale(0.5);
      pointer-events: none;
    }

    .activity-cell.shared {
      background: repeating-linear-gradient(
        45deg,
        var(--member-color, #3b82f6),
        var(--member-color, #3b82f6) 10px,
        rgba(255, 255, 255, 0.2) 10px,
        rgba(255, 255, 255, 0.2) 20px
      ) !important;
    }

    .tooltip-placeholder {
      display: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityCellComponent {
  activity = input.required<ActivityInCell>();
  cellHeight = input<number>(80);
  minHeight = MIN_ACTIVITY_HEIGHT;

  activityClick = output<ActivityInCell>();
  activityHover = output<{ activity: ActivityInCell; show: boolean }>();

  showTooltip = signal<boolean>(false);
  private hoverTimeout?: ReturnType<typeof setTimeout>;

  getBackground(): string {
    const act = this.activity();
    if (act.isShared) {
      // CSS variable for shared pattern
      return act.member.color;
    }
    return act.member.color;
  }

  getHeight(): number {
    const act = this.activity();
    const height = this.cellHeight();
    const calculatedHeight = act.proportionalHeight * height;
    return Math.max(MIN_ACTIVITY_HEIGHT, calculatedHeight);
  }

  onMouseEnter(): void {
    // Delay to prevent flickering
    this.hoverTimeout = setTimeout(() => {
      this.showTooltip.set(true);
      this.activityHover.emit({ 
        activity: this.activity(), 
        show: true 
      });
    }, TOOLTIP_DELAY);
  }

  onMouseLeave(): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    this.showTooltip.set(false);
    this.activityHover.emit({ 
      activity: this.activity(), 
      show: false 
    });
  }

  onClick(): void {
    this.activityClick.emit(this.activity());
  }
}
