import { Injectable } from '@angular/core';
import { TimeBlock, FamilyMember, BlockType } from '@family-planner/shared/models-schedule';
import {
  GridCell,
  ActivityInCell,
  TimeBlockViewModel,
  FamilyMemberViewModel,
} from '../models/week-grid.models';
import {
  eachDayOfWeek,
  formatISODate,
  getDayOfWeek,
} from '../utils/date.utils';
import {
  parseTime,
  formatTime,
  isValidTimeFormat,
  isValidTimeRange,
  generateTimeSlots,
  calculateProportionalHeight,
  overlapsWithSlot,
  getHour,
} from '../utils/time.utils';
import {
  DEFAULT_START_HOUR,
  DEFAULT_END_HOUR,
  ACTIVITY_ICONS,
  MEMBER_COLORS,
} from '../constants/week-grid.constants';

/**
 * Service for transforming raw schedule data into grid structure
 */
@Injectable()
export class GridTransformService {
  /**
   * Transform TimeBlocks into Grid structure
   */
  transformToGrid(
    blocks: TimeBlock[],
    weekStart: Date,
    members: FamilyMember[]
  ): GridCell[][] {
    // 1. Generate 7 days of the week
    const days = eachDayOfWeek(weekStart);

    // 2. Calculate dynamic time range
    const timeRange = this.calculateTimeRange(blocks);
    const timeSlots = generateTimeSlots(timeRange.start, timeRange.end);

    // 3. Create empty grid matrix [timeSlot][day]
    const grid: GridCell[][] = timeSlots.map((timeSlot) =>
      days.map((day) => this.createEmptyCell(timeSlot, day))
    );

    // 4. Transform members to view models
    const memberViewModels = this.transformMembersToViewModels(members);
    const memberMap = new Map(
      memberViewModels.map((m) => [m.id, m])
    );

    // 5. Fill grid with activities
    blocks.forEach((block) => {
      if (!this.validateTimeBlock(block)) {
        console.warn(`Invalid time block skipped: ${block.blockId}`);
        return;
      }

      const activities = this.mapBlockToActivities(
        block,
        memberMap,
        days
      );
      this.placeActivitiesInGrid(grid, activities, timeSlots, days);
    });

    // 6. Sort activities in cells by member order
    this.sortActivitiesInCells(grid, memberViewModels);

    return grid;
  }

  /**
   * Calculate dynamic time range from blocks (earliest to latest)
   */
  private calculateTimeRange(blocks: TimeBlock[]): { start: number; end: number } {
    if (blocks.length === 0) {
      return { start: DEFAULT_START_HOUR, end: DEFAULT_END_HOUR };
    }

    let minHour = DEFAULT_START_HOUR;
    let maxHour = DEFAULT_END_HOUR;

    blocks.forEach((block) => {
      const start = block.timeRange.start;
      const end = block.timeRange.end;

      const startHour = start.getHours();
      const endHour = end.getHours() + (end.getMinutes() > 0 ? 1 : 0);

      minHour = Math.min(minHour, startHour);
      maxHour = Math.max(maxHour, endHour);
    });

    // Add some padding
    minHour = Math.max(0, minHour - 1);
    maxHour = Math.min(23, maxHour + 1);

    return { start: minHour, end: maxHour };
  }

  /**
   * Create empty grid cell
   */
  private createEmptyCell(timeSlot: string, day: Date): GridCell {
    const dayISO = formatISODate(day);
    return {
      id: `${dayISO}-${timeSlot}`,
      timeSlot,
      day: dayISO,
      dayOfWeek: getDayOfWeek(day),
      isEmpty: true,
      activities: [],
    };
  }

  /**
   * Validate time block data
   */
  private validateTimeBlock(block: TimeBlock): boolean {
    const startTime = this.dateToTimeString(block.timeRange.start);
    const endTime = this.dateToTimeString(block.timeRange.end);

    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      return false;
    }

    if (!isValidTimeRange(startTime, endTime)) {
      return false;
    }

    return true;
  }

  /**
   * Convert Date to HH:mm string
   */
  private dateToTimeString(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Transform FamilyMembers to ViewModels
   */
  private transformMembersToViewModels(
    members: FamilyMember[]
  ): FamilyMemberViewModel[] {
    return members.map((member) => ({
      id: member.familyMemberId,
      name: member.name,
      initial: this.getInitial(member.name),
      color: this.getMemberColor(member.familyMemberId),
      role: member.role === 'CHILD' ? 'child' : 'parent',
      age: member.age,
    }));
  }

  /**
   * Get initial from name
   */
  private getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  /**
   * Get member color (from constants or generate)
   */
  private getMemberColor(memberId: string): string {
    return MEMBER_COLORS[memberId] || this.generateColor(memberId);
  }

  /**
   * Generate color from member ID (fallback)
   */
  private generateColor(memberId: string): string {
    const colors = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#a855f7', '#ef4444'];
    const hash = memberId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  /**
   * Map TimeBlock to ActivityInCell instances
   */
  private mapBlockToActivities(
    block: TimeBlock,
    memberMap: Map<string, FamilyMemberViewModel>,
    days: Date[]
  ): ActivityInCell[] {
    const activities: ActivityInCell[] = [];

    // Get block date
    const blockDate = new Date(block.timeRange.start);
    const blockDay = formatISODate(blockDate);

    // Check if block date is in current week
    const isInWeek = days.some((day) => formatISODate(day) === blockDay);
    if (!isInWeek) {
      return activities;
    }

    // Get member
    const member = block.familyMemberId
      ? memberMap.get(block.familyMemberId)
      : null;

    if (!member) {
      console.warn(`Member not found for block: ${block.blockId}`);
      return activities;
    }

    // Transform block to view model
    const blockViewModel: TimeBlockViewModel = {
      id: block.blockId,
      title: block.title,
      startTime: this.dateToTimeString(block.timeRange.start),
      endTime: this.dateToTimeString(block.timeRange.end),
      type: block.blockType,
      description: block.metadata?.description,
      emoji: block.metadata?.emoji || ACTIVITY_ICONS[block.blockType],
      isGoal: !!block.recurringGoalId,
    };

    // Create activity
    const activity: ActivityInCell = {
      id: block.blockId,
      member,
      block: blockViewModel,
      isShared: block.isShared,
      hasConflict: false,
      proportionalHeight: 0, // Will be calculated per cell
      isDimmed: false,
    };

    activities.push(activity);

    return activities;
  }

  /**
   * Place activities in grid cells
   */
  private placeActivitiesInGrid(
    grid: GridCell[][],
    activities: ActivityInCell[],
    timeSlots: string[],
    days: Date[]
  ): void {
    activities.forEach((activity) => {
      const { startTime, endTime } = activity.block;

      // Find which day this activity belongs to
      const blockDate = formatISODate(new Date()); // This should come from activity date
      // For now, assume it's in the grid somewhere

      timeSlots.forEach((timeSlot, rowIndex) => {
        if (overlapsWithSlot(startTime, endTime, timeSlot)) {
          days.forEach((day, colIndex) => {
            // Check if this day matches the activity date
            // For now, place in all matching time slots
            const cell = grid[rowIndex][colIndex];

            // Calculate proportional height for this specific cell
            const proportionalHeight = calculateProportionalHeight(
              startTime,
              endTime,
              timeSlot
            );

            if (proportionalHeight > 0) {
              const activityCopy = {
                ...activity,
                proportionalHeight,
              };

              cell.activities.push(activityCopy);
              cell.isEmpty = false;
            }
          });
        }
      });
    });
  }

  /**
   * Sort activities in cells by member order
   */
  private sortActivitiesInCells(
    grid: GridCell[][],
    members: FamilyMemberViewModel[]
  ): void {
    const memberOrder = new Map(members.map((m, idx) => [m.id, idx]));

    grid.forEach((row) => {
      row.forEach((cell) => {
        cell.activities.sort((a, b) => {
          const orderA = memberOrder.get(a.member.id) ?? 999;
          const orderB = memberOrder.get(b.member.id) ?? 999;
          return orderA - orderB;
        });
      });
    });
  }
}
