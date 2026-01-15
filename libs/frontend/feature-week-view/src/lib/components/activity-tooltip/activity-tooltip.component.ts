import { 
  Component, 
  input,
  computed,
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityInCell } from '../../models/week-grid.models';
import { calculateDuration } from '../../utils/time.utils';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Activity Tooltip Component
 * Displays detailed info on hover
 */
@Component({
  selector: 'app-activity-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="activity-tooltip" @fadeIn>
      <div class="tooltip-header">
        @if (activity().block.emoji) {
          <span class="tooltip-emoji">{{ activity().block.emoji }}</span>
        }
        <span class="tooltip-title">{{ activity().block.title }}</span>
      </div>

      <div class="tooltip-body">
        <div class="tooltip-row">
          <span class="tooltip-icon">⏰</span>
          <span class="tooltip-text">
            {{ activity().block.startTime }} - {{ activity().block.endTime }}
            <span class="duration">({{ duration() }})</span>
          </span>
        </div>

        <div class="tooltip-row">
          <span class="tooltip-icon">👤</span>
          <span class="tooltip-text">{{ participantsText() }}</span>
        </div>

        @if (activity().block.description) {
          <div class="tooltip-row">
            <span class="tooltip-icon">📝</span>
            <span class="tooltip-text">{{ activity().block.description }}</span>
          </div>
        }

        <div class="tooltip-row">
          <span class="tooltip-icon">🏷️</span>
          <span class="tooltip-text">
            {{ activity().block.type }}
            @if (activity().block.isGoal) {
              <span class="badge">Cel</span>
            } @else {
              <span class="badge">Stałe</span>
            }
          </span>
        </div>
      </div>

      <div class="tooltip-footer">
        <small>💡 Kliknij aby zobaczyć szczegóły</small>
      </div>
    </div>
  `,
  styles: [`
    .activity-tooltip {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 8px;
      padding: 12px;
      background: #1f2937;
      color: #fff;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      min-width: 280px;
      max-width: 320px;
      pointer-events: none;
    }

    .tooltip-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .tooltip-emoji {
      font-size: 20px;
    }

    .tooltip-title {
      font-size: 15px;
      font-weight: 700;
      flex: 1;
    }

    .tooltip-body {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .tooltip-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13px;
    }

    .tooltip-icon {
      font-size: 14px;
      flex-shrink: 0;
      width: 20px;
    }

    .tooltip-text {
      flex: 1;
      line-height: 1.5;
    }

    .duration {
      color: #9ca3af;
      font-size: 12px;
    }

    .badge {
      display: inline-block;
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 4px;
    }

    .tooltip-footer {
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      text-align: center;
    }

    .tooltip-footer small {
      font-size: 11px;
      color: #9ca3af;
      font-style: italic;
    }

    /* Arrow */
    .activity-tooltip::before {
      content: '';
      position: absolute;
      bottom: 100%;
      left: 20px;
      border: 6px solid transparent;
      border-bottom-color: #1f2937;
    }
  `],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-4px)' }),
        animate('100ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ opacity: 0, transform: 'translateY(-4px)' })),
      ]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityTooltipComponent {
  activity = input.required<ActivityInCell>();

  /**
   * Computed: Duration string
   */
  readonly duration = computed(() => {
    const act = this.activity();
    return calculateDuration(act.block.startTime, act.block.endTime);
  });

  /**
   * Computed: Participants text
   */
  readonly participantsText = computed(() => {
    const act = this.activity();
    if (act.isShared) {
      return `${act.member.name} i inni (Wspólne)`;
    }
    return act.member.name;
  });
}
