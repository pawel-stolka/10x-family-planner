import { BlockType } from '../enums/block-type.enum';
import { TimeRange } from './time-range.interface';

/**
 * Time Block Interface
 *
 * Represents a scheduled time block within a weekly schedule.
 * Can be linked to a family member and/or a recurring goal.
 * Maps to database table: time_blocks
 */
export interface TimeBlock {
  /** Unique identifier for the time block */
  blockId: string;

  /** Reference to the parent weekly schedule */
  scheduleId: string;

  /** Optional reference to a recurring goal this block fulfills */
  recurringGoalId?: string;

  /** Optional reference to the family member this block is assigned to */
  familyMemberId?: string;

  /** Display title for the time block */
  title: string;

  /** Category of the time block */
  blockType: BlockType;

  /** Time range when this block is scheduled */
  timeRange: TimeRange;

  /** Whether this block is visible/shared with all family members */
  isShared: boolean;

  /** Additional metadata stored as JSON (e.g., location, notes, tags) */
  metadata: Record<string, any>;

  /** Timestamp when the block was created */
  createdAt: Date;

  /** Timestamp when the block was last updated */
  updatedAt: Date;

  /** Soft delete timestamp (null if not deleted) */
  deletedAt?: Date;
}
