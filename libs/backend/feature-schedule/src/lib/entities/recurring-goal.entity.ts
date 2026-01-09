import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Recurring Goal Entity
 * 
 * TypeORM entity representing a recurring goal in the database.
 * Maps to table: recurring_goals
 * 
 * Security: Protected by RLS (Row Level Security) - filtered by user_id
 */
@Entity('recurring_goals')
export class RecurringGoalEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'goal_id' })
  goalId: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column('text')
  name: string;

  @Column('integer', { name: 'frequency_per_week' })
  frequencyPerWeek: number;

  @Column('integer', { name: 'duration_minutes' })
  durationMinutes: number;

  @Column('uuid', { nullable: true, name: 'family_member_id' })
  familyMemberId?: string;

  @Column('jsonb', { default: {} })
  preferences: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @Column('timestamptz', { nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
