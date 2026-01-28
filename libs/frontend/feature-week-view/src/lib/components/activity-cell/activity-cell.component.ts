import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityInCell } from '../../models/week-grid.models';
import { TOOLTIP_DELAY } from '../../constants/week-grid.constants';

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
      [style.--member-color]="activity().member.color"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
      (click)="onClick()"
      (keyup.enter)="onClick()"
      tabindex="0"
    >
      <div class="activity-content">
        @if (shouldShowLabel()) {
        <span
          #label
          class="activity-label"
          [attr.title]="isLabelTruncated() ? labelText() : null"
        >
          {{ labelText() }}
        </span>
        }
      </div>

      @if (showTooltip()) {
      <div class="tooltip-placeholder">
        <!-- Tooltip will be rendered here by parent -->
      </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .activity-cell {
        position: relative;
        margin: 1px;
        padding: 2px 4px;
        border-radius: 4px;
        cursor: pointer;
        overflow: hidden;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
        flex: 1 1 0;
        min-width: 0;
        min-height: var(--slot-height, 12px);
        height: 100%;
      }

      .activity-cell:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .activity-content {
        position: relative;
        display: flex;
        align-items: center;
        gap: 4px;
        flex: 1;
        min-width: 0;
        min-height: 100%;
        width: 100%;
      }

      .activity-label {
        font-size: 11px;
        font-weight: 600;
        color: #fff;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        min-width: 0;
      }

      .activity-cell.has-conflict {
        border: 2px solid #ef4444;
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
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityCellComponent implements AfterViewInit, OnDestroy {
  activity = input.required<ActivityInCell>();

  activityClick = output<ActivityInCell>();
  activityHover = output<{ activity: ActivityInCell; show: boolean }>();

  showTooltip = signal<boolean>(false);
  readonly isLabelTruncated = signal<boolean>(false);
  @ViewChild('label') private readonly labelRef?: ElementRef<HTMLElement>;
  private resizeObserver?: ResizeObserver;
  private readonly activityEffect = effect(() => {
    this.activity();
    queueMicrotask(() => this.updateLabelTruncation());
  });
  private hoverTimeout?: ReturnType<typeof setTimeout>;

  getBackground(): string {
    const act = this.activity();
    if (act.isShared) {
      // CSS variable for shared pattern
      return act.member.color;
    }
    return act.member.color;
  }

  onMouseEnter(): void {
    // Delay to prevent flickering
    this.hoverTimeout = setTimeout(() => {
      this.showTooltip.set(true);
      this.activityHover.emit({
        activity: this.activity(),
        show: true,
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
      show: false,
    });
  }

  onClick(): void {
    this.activityClick.emit(this.activity());
  }

  labelText(): string {
    const member = this.activity().member;
    // return `${member.initial} ${this.activity().block.title}`;
    return `${this.activity().block.title}`;
  }

  shouldShowLabel(): boolean {
    const activity = this.activity();
    // Show label if showLabel is not explicitly false
    // mergeConsecutiveActivities sets showLabel=false for non-first segments
    // Single-hour activities have showLabel=true from placeActivitiesInGrid
    return activity.showLabel !== false;
  }

  ngAfterViewInit(): void {
    this.updateLabelTruncation();
    this.resizeObserver = new ResizeObserver(() =>
      this.updateLabelTruncation()
    );
    if (this.labelRef?.nativeElement) {
      this.resizeObserver.observe(this.labelRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver && this.labelRef?.nativeElement) {
      this.resizeObserver.unobserve(this.labelRef.nativeElement);
    }
    this.activityEffect.destroy();
  }

  private updateLabelTruncation(): void {
    const label = this.labelRef?.nativeElement;
    if (!label) return;
    this.isLabelTruncated.set(label.scrollWidth > label.clientWidth);
  }
}
