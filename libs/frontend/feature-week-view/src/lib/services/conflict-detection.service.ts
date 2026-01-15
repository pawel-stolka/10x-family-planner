import { Injectable } from '@angular/core';
import { GridCell, ActivityInCell } from '../models/week-grid.models';

/**
 * Service for detecting time conflicts in schedule
 */
@Injectable()
export class ConflictDetectionService {
  /**
   * Detect conflicts in grid and mark activities
   */
  detectConflicts(grid: GridCell[][]): GridCell[][] {
    return grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        activities: this.markConflictsInCell(cell.activities),
      }))
    );
  }

  /**
   * Mark conflicts within a single cell
   * Conflict = same member has multiple activities in the same time slot
   */
  private markConflictsInCell(activities: ActivityInCell[]): ActivityInCell[] {
    if (activities.length <= 1) {
      return activities;
    }

    // Group activities by member ID
    const byMember = this.groupByMember(activities);

    // Mark conflicts for members with multiple activities
    Object.values(byMember).forEach((memberActivities) => {
      if (memberActivities.length > 1) {
        // Conflict detected: same member, same time slot
        memberActivities.forEach((activity) => {
          activity.hasConflict = true;
        });
      }
    });

    return activities;
  }

  /**
   * Group activities by member ID
   */
  private groupByMember(
    activities: ActivityInCell[]
  ): Record<string, ActivityInCell[]> {
    return activities.reduce(
      (acc, activity) => {
        const memberId = activity.member.id;
        if (!acc[memberId]) {
          acc[memberId] = [];
        }
        acc[memberId].push(activity);
        return acc;
      },
      {} as Record<string, ActivityInCell[]>
    );
  }

  /**
   * Check if two activities overlap (for more detailed conflict detection)
   */
  checkActivitiesOverlap(
    activity1: ActivityInCell,
    activity2: ActivityInCell
  ): boolean {
    const start1 = this.parseTime(activity1.block.startTime);
    const end1 = this.parseTime(activity1.block.endTime);
    const start2 = this.parseTime(activity2.block.startTime);
    const end2 = this.parseTime(activity2.block.endTime);

    return start1 < end2 && start2 < end1;
  }

  /**
   * Parse time to minutes
   */
  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get all conflicts summary
   */
  getConflictsSummary(grid: GridCell[][]): {
    totalConflicts: number;
    conflictsByMember: Record<string, number>;
  } {
    let totalConflicts = 0;
    const conflictsByMember: Record<string, number> = {};

    grid.forEach((row) => {
      row.forEach((cell) => {
        cell.activities.forEach((activity) => {
          if (activity.hasConflict) {
            totalConflicts++;
            const memberId = activity.member.id;
            conflictsByMember[memberId] =
              (conflictsByMember[memberId] || 0) + 1;
          }
        });
      });
    });

    return {
      totalConflicts,
      conflictsByMember,
    };
  }
}
