import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BlockType } from '@family-planner/shared-models-schedule';

/**
 * Recurring Commitment Entity
 *
 * Represents a fixed recurring weekly block (work/school/sleep/etc.) that is used as a
 * hard constraint during AI schedule generation and displayed in the weekly calendar.
 *
 * Maps to table: recurring_commitments
 */
@Entity('recurring_commitments')
export class RecurringCommitmentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'commitment_id' })
  commitmentId!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('uuid', { nullable: true, name: 'family_member_id' })
  familyMemberId?: string;

  @Column('text')
  title!: string;

  @Column({
    type: 'enum',
    enum: BlockType,
    enumName: 'block_type',
    name: 'block_type',
    default: BlockType.OTHER,
  })
  blockType!: BlockType;

  /**
   * Day of week: 1=Monday ... 7=Sunday
   */
  @Column('smallint', { name: 'day_of_week' })
  dayOfWeek!: number;

  @Column('time', { name: 'start_time' })
  startTime!: string;

  @Column('time', { name: 'end_time' })
  endTime!: string;

  @Column('boolean', { default: false, name: 'is_shared' })
  isShared!: boolean;

  @Column('jsonb', { default: {} })
  metadata!: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @Column('timestamptz', { nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}

