import {
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeBlock } from '@family-planner/frontend/data-access-schedule';
import { FamilyStore } from '@family-planner/frontend/data-access-family';

/**
 * WeeklyCalendarComponent - Family-wide calendar view
 *
 * Displays generated time blocks grouped by day and family member, with badges for goal/fixed blocks
 */
@Component({
  selector: 'fp-weekly-calendar',
  imports: [CommonModule],
  template: `
    @if (timeBlocks && timeBlocks.length > 0) {
    <div class="calendar-container">
      <div class="calendar-header">
        <h3 class="calendar-title">📅 Family Weekly Schedule</h3>

        <div class="filter-controls">
          <button
            class="filter-btn"
            [class.active]="selectedFilter() === 'all'"
            (click)="setFilter('all')"
          >
            All
          </button>
          <button
            class="filter-btn"
            [class.active]="selectedFilter() === 'shared'"
            (click)="setFilter('shared')"
          >
            Shared
          </button>
          @for (member of familyStore.members(); track member.familyMemberId) {
          <button
            class="filter-btn"
            [class.active]="selectedFilter() === member.familyMemberId"
            (click)="setFilter(member.familyMemberId)"
          >
            {{ member.name }}
          </button>
          }
        </div>
      </div>

      @for (day of groupedByDay(); track day.date) {
      <div class="day-section">
        <h4 class="day-title">{{ formatDayHeader(day.date) }}</h4>

        @for (group of day.memberGroups; track group.memberId || 'shared') {
        <div class="member-group">
          <h5 class="member-name">{{ group.memberName }}</h5>

          <div class="blocks-list">
            @for (block of group.blocks; track block.blockId) {
            <div class="time-block" [attr.data-type]="block.blockType">
              <div class="block-time">
                {{ formatTime(block.timeRange.start) }} -
                {{ formatTime(block.timeRange.end) }}
              </div>
              <div class="block-content">
                <div class="block-title">{{ block.title }}</div>
                <div class="block-meta">
                  <span class="block-type">{{ block.blockType }}</span>
                  @if (block.isShared) {
                  <span class="badge badge-shared">Shared</span>
                  } @if (block.recurringGoalId) {
                  <span class="badge badge-goal">Goal</span>
                  } @if (block.metadata?.['source'] === 'fixed') {
                  <span class="badge badge-fixed">Fixed</span>
                  }
                </div>
              </div>
            </div>
            }
          </div>
        </div>
        }
      </div>
      }
    </div>
    } @else {
    <div class="empty-state">
      <p>
        No schedule generated yet. Click "Generate Week Schedule" to create one.
      </p>
    </div>
    }
  `,
  styles: [
    `
      .calendar-container {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        border: 1px solid #e2e8f0;
      }

      .calendar-header {
        margin-bottom: 2rem;
      }

      .calendar-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1a202c;
        margin: 0 0 1rem 0;
      }

      .filter-controls {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .filter-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #e2e8f0;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        color: #4a5568;
        transition: all 0.2s;

        &:hover {
          background: #f7fafc;
          border-color: #cbd5e0;
        }

        &.active {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }
      }

      .day-section {
        margin-bottom: 2rem;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .day-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #667eea;
        margin: 0 0 1rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #e2e8f0;
      }

      .member-group {
        margin-bottom: 1.5rem;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .member-name {
        font-size: 0.95rem;
        font-weight: 600;
        color: #718096;
        margin: 0 0 0.75rem 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .blocks-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding-left: 1rem;
      }

      .time-block {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: #f7fafc;
        border-radius: 8px;
        border-left: 4px solid #cbd5e0;
        transition: all 0.2s;

        &:hover {
          background: #edf2f7;
          transform: translateX(4px);
        }

        &[data-type='WORK'] {
          border-left-color: #667eea;
        }

        &[data-type='ACTIVITY'] {
          border-left-color: #48bb78;
        }

        &[data-type='MEAL'] {
          border-left-color: #f6ad55;
        }

        &[data-type='OTHER'] {
          border-left-color: #cbd5e0;
        }
      }

      .block-time {
        font-size: 0.9rem;
        font-weight: 600;
        color: #4a5568;
        min-width: 120px;
      }

      .block-content {
        flex: 1;
      }

      .block-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1a202c;
        margin-bottom: 0.25rem;
      }

      .block-meta {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
      }

      .block-type {
        font-size: 0.85rem;
        color: #718096;
        text-transform: uppercase;
        font-weight: 500;
      }

      .badge {
        font-size: 0.75rem;
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .badge-shared {
        background: #bee3f8;
        color: #2c5282;
      }

      .badge-goal {
        background: #c6f6d5;
        color: #22543d;
      }

      .badge-fixed {
        background: #fed7d7;
        color: #742a2a;
      }

      .empty-state {
        background: white;
        border-radius: 12px;
        padding: 3rem 2rem;
        text-align: center;
        border: 2px dashed #e2e8f0;

        p {
          color: #718096;
          font-size: 1rem;
          margin: 0;
        }
      }

      @media (max-width: 768px) {
        .calendar-container {
          padding: 1.5rem;
        }

        .time-block {
          flex-direction: column;
          gap: 0.5rem;
        }

        .block-time {
          min-width: auto;
        }

        .blocks-list {
          padding-left: 0;
        }
      }
    `,
  ],
})
export class WeeklyCalendarComponent implements OnInit {
  @Input() timeBlocks: TimeBlock[] = [];

  readonly familyStore = inject(FamilyStore);
  readonly selectedFilter = signal<string>('all');

  ngOnInit() {
    // Load family members for grouping
    this.familyStore.loadMembers();
  }

  setFilter(filter: string) {
    this.selectedFilter.set(filter);
  }

  /**
   * Get filtered blocks based on selected filter
   */
  private getFilteredBlocks(): TimeBlock[] {
    const filter = this.selectedFilter();

    if (filter === 'all') {
      return this.timeBlocks;
    }

    if (filter === 'shared') {
      return this.timeBlocks.filter((b) => b.isShared);
    }

    // Filter by specific family member
    return this.timeBlocks.filter((b) => b.familyMemberId === filter);
  }

  /**
   * Group time blocks by day and then by family member
   */
  groupedByDay(): {
    date: string;
    memberGroups: {
      memberId: string | null;
      memberName: string;
      blocks: TimeBlock[];
    }[];
  }[] {
    const filteredBlocks = this.getFilteredBlocks();
    const grouped = new Map<string, TimeBlock[]>();

    // First group by date
    for (const block of filteredBlocks) {
      const date = block.timeRange.start.split('T')[0];
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(block);
    }

    // Then group each day by member
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, blocks]) => ({
        date,
        memberGroups: this.groupBlocksByMember(blocks),
      }));
  }

  /**
   * Group blocks by family member (with shared blocks first)
   */
  private groupBlocksByMember(blocks: TimeBlock[]): {
    memberId: string | null;
    memberName: string;
    blocks: TimeBlock[];
  }[] {
    const memberMap = new Map<string, TimeBlock[]>();

    // Sort blocks into member groups
    for (const block of blocks) {
      const key = block.isShared
        ? 'shared'
        : block.familyMemberId || 'unassigned';
      if (!memberMap.has(key)) {
        memberMap.set(key, []);
      }
      memberMap.get(key)!.push(block);
    }

    // Convert to array with member names
    const groups: {
      memberId: string | null;
      memberName: string;
      blocks: TimeBlock[];
    }[] = [];

    // Shared blocks first
    if (memberMap.has('shared')) {
      groups.push({
        memberId: null,
        memberName: '👨‍👩‍👧‍👦 Shared / Family',
        blocks: memberMap
          .get('shared')!
          .sort((a, b) => a.timeRange.start.localeCompare(b.timeRange.start)),
      });
    }

    // Then member-specific blocks
    const members = this.familyStore.members();
    for (const member of members) {
      if (memberMap.has(member.familyMemberId)) {
        groups.push({
          memberId: member.familyMemberId,
          memberName: member.name,
          blocks: memberMap
            .get(member.familyMemberId)!
            .sort((a, b) => a.timeRange.start.localeCompare(b.timeRange.start)),
        });
      }
    }

    // Unassigned blocks last
    if (memberMap.has('unassigned')) {
      groups.push({
        memberId: null,
        memberName: '❓ Unassigned',
        blocks: memberMap
          .get('unassigned')!
          .sort((a, b) => a.timeRange.start.localeCompare(b.timeRange.start)),
      });
    }

    return groups;
  }

  /**
   * Format day header (e.g., "Monday, Jan 13")
   */
  formatDayHeader(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format time (e.g., "09:00")
   */
  formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}
