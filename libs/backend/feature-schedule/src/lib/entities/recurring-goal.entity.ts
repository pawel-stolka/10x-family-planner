import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FamilyMemberEntity } from './family-member.entity';

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
  goalId!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('text')
  name!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('integer', { name: 'frequency_per_week' })
  frequencyPerWeek!: number;

  @Column('integer', { nullable: true, name: 'preferred_duration_minutes' })
  preferredDurationMinutes?: number;

  @Column('text', { array: true, nullable: true, name: 'preferred_time_of_day' })
  preferredTimeOfDay?: string[];

  @Column('smallint', { default: 0 })
  priority!: number;

  @Column('uuid', { name: 'family_member_id' })
  familyMemberId!: string;

  @ManyToOne(() => FamilyMemberEntity)
  @JoinColumn({ name: 'family_member_id' })
  familyMember?: FamilyMemberEntity;

  @Column('jsonb', { default: {} })
  rules!: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @Column('timestamptz', { nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
