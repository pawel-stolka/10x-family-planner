import { Injectable } from '@angular/core';
import {
  TimeBlock,
  FamilyMember,
  BlockType,
} from '@family-planner/shared/models-schedule';
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
  getMemberColor,
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
    const memberMap = new Map(memberViewModels.map((m) => [m.id, m]));

    // 5. Fill grid with activities
    blocks.forEach((block) => {
      if (!this.validateTimeBlock(block)) {
        console.warn(`Invalid time block skipped: ${block.blockId}`);
        return;
      }

      const activities = this.mapBlockToActivities(block, memberMap, days);
      this.placeActivitiesInGrid(grid, activities, timeSlots, days);
    });

    // 6. Sort activities in cells by member order
    this.sortActivitiesInCells(grid, memberViewModels);

    // 7. Merge consecutive activities for the same member
    this.mergeConsecutiveActivities(grid, timeSlots, days);

    return grid;
  }

  /**
   * Calculate dynamic time range from blocks (earliest to latest)
   */
  private calculateTimeRange(blocks: TimeBlock[]): {
    start: number;
    end: number;
  } {
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
    return getMemberColor(memberId);
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
      description: block.metadata?.['description'],
      emoji: block.metadata?.['emoji'] || ACTIVITY_ICONS[block.blockType],
      isGoal: !!block.recurringGoalId,
    };

    // Create activity
    const activity: ActivityInCell = {
      id: block.blockId,
      day: blockDay,
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
      const dayIndex = days.findIndex(
        (day) => formatISODate(day) === activity.day
      );

      if (dayIndex === -1) {
        return;
      }

      timeSlots.forEach((timeSlot, rowIndex) => {
        if (!overlapsWithSlot(startTime, endTime, timeSlot)) {
          return;
        }

        const cell = grid[rowIndex][dayIndex];
        const proportionalHeight = calculateProportionalHeight(
          startTime,
          endTime,
          timeSlot
        );

        if (proportionalHeight > 0) {
          const activityCopy = {
            ...activity,
            proportionalHeight,
            showLabel: true, // Default to true, will be overridden by mergeConsecutiveActivities for non-first segments
          };

          cell.activities.push(activityCopy);
          cell.isEmpty = false;
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

  /**
   * Merge consecutive activities for the same member into segments
   * Works for both consecutive separate blocks AND single activities that span multiple hours
   */
  private mergeConsecutiveActivities(
    grid: GridCell[][],
    timeSlots: string[],
    days: Date[]
  ): void {
    days.forEach((day, dayIndex) => {
      const dayISO = formatISODate(day);

      // Group unique activities by member (using block ID and times as key)
      const uniqueActivitiesByMember = new Map<
        string,
        Map<string, ActivityInCell>
      >();

      // Collect unique activities for this day (one per block)
      timeSlots.forEach((timeSlot, rowIndex) => {
        const cell = grid[rowIndex][dayIndex];
        cell.activities.forEach((activity) => {
          if (activity.day !== dayISO) return;

          const memberId = activity.member.id;
          const activityKey = `${activity.block.id}-${activity.block.startTime}-${activity.block.endTime}`;

          if (!uniqueActivitiesByMember.has(memberId)) {
            uniqueActivitiesByMember.set(memberId, new Map());
          }

          const memberMap = uniqueActivitiesByMember.get(memberId)!;
          if (!memberMap.has(activityKey)) {
            memberMap.set(activityKey, activity);
          }
        });
      });

      // For each member, find consecutive activities and mark them as segments
      uniqueActivitiesByMember.forEach((memberActivities, memberId) => {
        // Convert to array and sort by start time
        const sorted = Array.from(memberActivities.values()).sort((a, b) => {
          const startA = parseTime(a.block.startTime);
          const startB = parseTime(b.block.startTime);
          return startA - startB;
        });

        // Process each activity - mark multi-hour activities and consecutive groups
        sorted.forEach((activity) => {
          const activityStart = parseTime(activity.block.startTime);
          const activityEnd = parseTime(activity.block.endTime);
          const activityDuration = activityEnd - activityStart;
          const activityKey = `${activity.block.id}-${activity.block.startTime}-${activity.block.endTime}`;

          // Check if this activity spans multiple hours
          const totalHours = Math.ceil(activityDuration / 60);

          if (totalHours > 1) {
            // Mark all cells that contain this multi-hour activity
            timeSlots.forEach((timeSlot, rowIndex) => {
              const cell = grid[rowIndex][dayIndex];
              const slotStart = parseTime(timeSlot);
              const slotEnd = slotStart + 60;

              // Check if this time slot overlaps with the activity
              if (activityStart < slotEnd && activityEnd > slotStart) {
                cell.activities.forEach((cellActivity) => {
                  const cellKey = `${cellActivity.block.id}-${cellActivity.block.startTime}-${cellActivity.block.endTime}`;
                  if (
                    cellKey === activityKey &&
                    cellActivity.member.id === memberId
                  ) {
                    const hoursFromStart = Math.floor(
                      (slotStart - activityStart) / 60
                    );

                    cellActivity.segmentIndex = hoursFromStart;
                    cellActivity.segmentCount = totalHours;
                    cellActivity.isFirstSegment = hoursFromStart === 0;
                    cellActivity.isLastSegment =
                      hoursFromStart === totalHours - 1;
                    cellActivity.showLabel = hoursFromStart === 0;
                  }
                });
              }
            });
          }
        });

        // Now find consecutive separate blocks
        const groups: ActivityInCell[][] = [];
        let currentGroup: ActivityInCell[] = [];

        sorted.forEach((activity) => {
          const activityDuration =
            parseTime(activity.block.endTime) -
            parseTime(activity.block.startTime);

          // Skip if already processed as multi-hour (duration >= 60)
          if (activityDuration >= 60) {
            if (currentGroup.length > 1) {
              groups.push([...currentGroup]);
            }
            currentGroup = [];
            return;
          }

          if (currentGroup.length === 0) {
            currentGroup.push(activity);
          } else {
            const lastActivity = currentGroup[currentGroup.length - 1];
            const lastEnd = parseTime(lastActivity.block.endTime);
            const currStart = parseTime(activity.block.startTime);

            // Check if consecutive (end time of previous = start time of current)
            if (lastEnd === currStart) {
              currentGroup.push(activity);
            } else {
              if (currentGroup.length > 1) {
                groups.push([...currentGroup]);
              }
              currentGroup = [activity];
            }
          }
        });

        if (currentGroup.length > 1) {
          groups.push(currentGroup);
        }

        // Mark segments for consecutive separate blocks
        groups.forEach((group) => {
          const firstActivity = group[0];
          const lastActivity = group[group.length - 1];
          const groupStart = parseTime(firstActivity.block.startTime);
          const groupEnd = parseTime(lastActivity.block.endTime);
          const totalHours = Math.ceil((groupEnd - groupStart) / 60);

          group.forEach((activity) => {
            const activityKey = `${activity.block.id}-${activity.block.startTime}-${activity.block.endTime}`;
            const activityStart = parseTime(activity.block.startTime);
            const activityEnd = parseTime(activity.block.endTime);

            timeSlots.forEach((timeSlot, rowIndex) => {
              const cell = grid[rowIndex][dayIndex];
              const slotStart = parseTime(timeSlot);
              const slotEnd = slotStart + 60;

              if (activityStart < slotEnd && activityEnd > slotStart) {
                cell.activities.forEach((cellActivity) => {
                  const cellKey = `${cellActivity.block.id}-${cellActivity.block.startTime}-${cellActivity.block.endTime}`;
                  if (
                    cellKey === activityKey &&
                    cellActivity.member.id === memberId
                  ) {
                    const hoursFromGroupStart = Math.floor(
                      (slotStart - groupStart) / 60
                    );

                    cellActivity.segmentIndex = hoursFromGroupStart;
                    cellActivity.segmentCount = totalHours;
                    cellActivity.isFirstSegment = hoursFromGroupStart === 0;
                    cellActivity.isLastSegment =
                      hoursFromGroupStart === totalHours - 1;
                    cellActivity.showLabel = hoursFromGroupStart === 0;
                  }
                });
              }
            });
          });
        });
      });
    });
  }
}
