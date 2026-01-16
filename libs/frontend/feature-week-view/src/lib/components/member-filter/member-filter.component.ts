import { 
  Component, 
  input, 
  output, 
  ChangeDetectionStrategy,
  signal,
  effect 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FamilyMemberViewModel, FilterValue } from '../../models/week-grid.models';
import { FILTER_DEBOUNCE_DELAY } from '../../constants/week-grid.constants';

/**
 * Member Filter Component
 * Displays filter buttons for family members
 */
@Component({
  selector: 'app-member-filter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="member-filter">
      <div class="legend-title">Legenda:</div>

      <button
        class="legend-btn all-btn"
        [class.active]="selectedFilter() === 'all'"
        (click)="onFilterClick('all')"
      >
        Wszyscy
      </button>

      @for (member of members(); track member.id) {
        <button
          class="legend-btn"
          [class.active]="selectedFilter() === member.id"
          [style.border-color]="member.color"
          [style.--member-color]="member.color"
          (click)="onFilterClick(member.id)"
        >
          <span class="color-square" [style.background]="member.color"></span>
          <span class="label">{{ member.name }}</span>
        </button>
      }

      <button
        class="legend-btn shared-btn"
        [class.active]="selectedFilter() === 'shared'"
        (click)="onFilterClick('shared')"
      >
        <span class="color-square shared"></span>
        <span class="label">Wspólne</span>
      </button>
    </div>
  `,
  styles: [`
    .member-filter {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 0;
      flex-wrap: wrap;
    }

    .legend-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-right: 4px;
    }

    .legend-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      background: #fff;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
    }

    .legend-btn:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .legend-btn:focus-visible {
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .legend-btn.active {
      border-color: var(--member-color, #3b82f6);
      background: rgba(59, 130, 246, 0.05);
      color: var(--member-color, #3b82f6);
      font-weight: 700;
    }

    .legend-btn:not(.active):active {
      transform: scale(0.98);
    }

    .color-square {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .color-square.shared {
      background: repeating-linear-gradient(
        45deg,
        #3b82f6,
        #3b82f6 4px,
        rgba(255, 255, 255, 0.5) 4px,
        rgba(255, 255, 255, 0.5) 8px
      );
    }

    .shared-btn.active {
      border-color: #8b5cf6;
      background: rgba(139, 92, 246, 0.05);
      color: #8b5cf6;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberFilterComponent {
  members = input<FamilyMemberViewModel[]>([]);
  selectedFilter = input<FilterValue>('all');
  filterChange = output<FilterValue>();

  private filterTimeout?: ReturnType<typeof setTimeout>;
  private pendingFilter = signal<FilterValue | null>(null);

  constructor() {
    // Effect to emit debounced filter changes
    effect(() => {
      const filter = this.pendingFilter();
      if (filter !== null) {
        this.filterChange.emit(filter);
        this.pendingFilter.set(null);
      }
    });
  }

  onFilterClick(filter: FilterValue): void {
    // Clear existing timeout
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }

    // Debounce filter change
    this.filterTimeout = setTimeout(() => {
      this.pendingFilter.set(filter);
    }, FILTER_DEBOUNCE_DELAY);
  }
}
