import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FamilyMemberRole } from '@family-planner/shared-models-schedule';

/**
 * Family Member Entity
 *
 * TypeORM entity representing a family member in the database.
 * Maps to table: family_members
 *
 * Security: Protected by RLS (Row Level Security) - filtered by user_id
 */
@Entity('family_members')
export class FamilyMemberEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'family_member_id' })
  familyMemberId!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('text')
  name!: string;

  @Column({
    type: 'enum',
    enum: FamilyMemberRole,
    enumName: 'family_member_role',
  })
  role!: FamilyMemberRole;

  @Column('integer', { nullable: true })
  age?: number;

  @Column('jsonb', { default: {} })
  preferences!: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @Column('timestamptz', { nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
