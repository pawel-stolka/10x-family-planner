import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  CommitmentsStore,
  RecurringCommitment,
} from '@family-planner/frontend/data-access-commitments';
import { FamilyStore } from '@family-planner/frontend/data-access-family';

interface GroupedCommitment {
  ids: string[];
  title: string;
  blockType: string;
  startTime: string;
  endTime: string;
  isShared: boolean;
  familyMemberId?: string | null;
  days: number[];
}

@Component({
  selector: 'fp-commitments-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './commitments-list.component.html',
  styleUrls: ['./commitments-list.component.scss'],
})
export class CommitmentsListComponent implements OnInit {
  private readonly commitmentsStore = inject(CommitmentsStore);
  private readonly familyStore = inject(FamilyStore);
  private readonly router = inject(Router);

  commitments = this.commitmentsStore.commitments;
  isLoading = this.commitmentsStore.isLoading;
  error = this.commitmentsStore.error;
  members = this.familyStore.members;

  filterMemberId = signal<string | 'shared' | 'all'>('all');

  filtered = computed(() => {
    const filter = this.filterMemberId();
    const items = this.commitments();

    // First apply the filter
    let filteredItems = items;
    if (filter !== 'all') {
      if (filter === 'shared') {
        filteredItems = items.filter((c) => c.isShared);
      } else {
        filteredItems = items.filter(
          (c) => !c.isShared && c.familyMemberId === filter
        );
      }
    }

    // Group commitments with same title, type, times, and owner
    return this.groupCommitments(filteredItems);
  });

  async ngOnInit(): Promise<void> {
    await this.familyStore.loadMembers();
    await this.commitmentsStore.load();
  }

  onAdd(): void {
    this.router.navigate(['/commitments/new']);
  }

  onEdit(group: GroupedCommitment): void {
    // Pass the first ID and store all IDs for editing
    this.router.navigate(['/commitments/edit', group.ids[0]], {
      queryParams: { groupIds: group.ids.join(',') },
    });
  }

  async onDelete(group: GroupedCommitment): Promise<void> {
    const dayNames = group.days.map((d) => this.getDayName(d)).join(', ');
    if (confirm(`Delete "${group.title}" for ${dayNames}?`)) {
      // Delete all commitments in the group
      for (const id of group.ids) {
        await this.commitmentsStore.remove(id);
      }
    }
  }

  /**
   * Group commitments with same title, type, times, and owner
   */
  private groupCommitments(
    commitments: RecurringCommitment[]
  ): GroupedCommitment[] {
    const groups = new Map<string, GroupedCommitment>();

    for (const commitment of commitments) {
      // Create a unique key for grouping
      const key = `${commitment.title}|${commitment.blockType}|${
        commitment.startTime
      }|${commitment.endTime}|${commitment.isShared}|${
        commitment.familyMemberId || 'none'
      }`;

      if (groups.has(key)) {
        const group = groups.get(key)!;
        group.ids.push(commitment.commitmentId);
        group.days.push(commitment.dayOfWeek);
      } else {
        groups.set(key, {
          ids: [commitment.commitmentId],
          title: commitment.title,
          blockType: commitment.blockType,
          startTime: commitment.startTime,
          endTime: commitment.endTime,
          isShared: commitment.isShared,
          familyMemberId: commitment.familyMemberId,
          days: [commitment.dayOfWeek],
        });
      }
    }

    // Sort days within each group
    for (const group of groups.values()) {
      group.days.sort((a, b) => a - b);
    }

    return Array.from(groups.values());
  }

  getMemberLabel(commitment: {
    isShared: boolean;
    familyMemberId?: string | null;
  }): string {
    if (commitment.isShared) return 'Shared (Family)';
    const member = this.members().find(
      (m) => m.familyMemberId === commitment.familyMemberId
    );
    return member?.name || 'Unknown';
  }

  /**
   * Convert day of week number (1-7) to short day name
   */
  getDayName(dayOfWeek: number): string {
    const days = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[dayOfWeek] || `D${dayOfWeek}`;
  }

  /**
   * Format multiple days as comma-separated names
   */
  formatDays(days: number[]): string {
    return days.map((d) => this.getDayName(d)).join(', ');
  }

  /**
   * Format time from HH:MM:SS to HH:MM
   */
  formatTime(time: string): string {
    if (!time) return '';
    // Remove seconds if present
    return time.substring(0, 5);
  }
}
