import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BlockType, TimeRange } from '@family-planner/shared-models-schedule';
import { TimeRangeTransformer } from '../transformers/time-range.transformer';
import { FamilyMemberEntity } from './family-member.entity';
import { RecurringGoalEntity } from './recurring-goal.entity';

/**
 * Time Block Entity
 * 
 * TypeORM entity representing a scheduled time block in the database.
 * Maps to table: time_blocks
 * 
 * Relations:
 * - ManyToOne with WeeklyScheduleEntity (parent schedule)
 * - ManyToOne with FamilyMemberEntity (optional assignment)
 * - ManyToOne with RecurringGoalEntity (optional goal fulfillment)
 * 
 * Security: Protected by RLS (Row Level Security) via schedule.user_id
 */
@Entity('time_blocks')
export class TimeBlockEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'block_id' })
  blockId: string;

  @Column('uuid', { name: 'schedule_id' })
  scheduleId: string;

  @Column('uuid', { nullable: true, name: 'recurring_goal_id' })
  recurringGoalId?: string;

  @Column('uuid', { nullable: true, name: 'family_member_id' })
  familyMemberId?: string;

  @Column('text')
  title: string;

  @Column({
    type: 'enum',
    enum: BlockType,
    enumName: 'block_type',
    name: 'block_type',
  })
  blockType: BlockType;

  /**
   * Time range stored as PostgreSQL TSTZRANGE
   * Automatically transformed to/from TimeRange object via custom transformer
   */
  @Column({
    type: 'text', // TypeORM doesn't have native TSTZRANGE support
    name: 'time_range',
    transformer: new TimeRangeTransformer(),
  })
  timeRange: TimeRange;

  @Column('boolean', { default: false, name: 'is_shared' })
  isShared: boolean;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  /**
   * Relation to FamilyMember (lazy loaded unless specified)
   */
  @ManyToOne(() => FamilyMemberEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'family_member_id' })
  familyMember?: FamilyMemberEntity;

  /**
   * Relation to RecurringGoal (lazy loaded unless specified)
   */
  @ManyToOne(() => RecurringGoalEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'recurring_goal_id' })
  recurringGoal?: RecurringGoalEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @Column('timestamptz', { nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
