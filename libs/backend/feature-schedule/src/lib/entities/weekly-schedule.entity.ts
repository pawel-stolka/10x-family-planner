import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TimeBlockEntity } from './time-block.entity';

/**
 * Weekly Schedule Entity
 * 
 * TypeORM entity representing a weekly schedule in the database.
 * Maps to table: weekly_schedules
 * 
 * Relations:
 * - OneToMany with TimeBlockEntity (child time blocks)
 * 
 * Security: Protected by RLS (Row Level Security) - filtered by user_id
 * 
 * Constraints:
 * - Unique constraint on (user_id, week_start_date) WHERE deleted_at IS NULL
 * - This ensures one schedule per week per user
 */
@Entity('weekly_schedules')
export class WeeklyScheduleEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'schedule_id' })
  scheduleId: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  /**
   * Start date of the week (Monday in YYYY-MM-DD format)
   * Stored as DATE type in PostgreSQL
   */
  @Column('date', { name: 'week_start_date' })
  weekStartDate: Date;

  @Column('boolean', { default: false, name: 'is_ai_generated' })
  isAiGenerated: boolean;

  /**
   * Additional metadata stored as JSONB
   * Examples: { generationStrategy: 'balanced', aiModel: 'gpt-4o' }
   */
  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  /**
   * One-to-Many relation with TimeBlocks
   * Lazy loaded by default - use relations: ['timeBlocks'] in find options for eager loading
   */
  @OneToMany(() => TimeBlockEntity, (block) => block.scheduleId)
  timeBlocks: TimeBlockEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @Column('timestamptz', { nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
