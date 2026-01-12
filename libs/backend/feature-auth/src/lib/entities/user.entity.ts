import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * User Entity
 *
 * Represents a user account in the system.
 * Corresponds to the 'users' table in PostgreSQL.
 *
 * Security:
 * - Password is hashed using bcrypt before storage
 * - Email is unique and indexed
 * - Soft delete support via deletedAt
 */
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  userId!: string;

  @Column('varchar', { length: 255, unique: true })
  @Index('idx_users_email')
  email!: string;

  @Column('varchar', { length: 255 })
  passwordHash!: string;

  @Column('varchar', { length: 100, nullable: true })
  displayName!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column('timestamptz', { nullable: true })
  deletedAt!: Date | null;

  @Column('timestamptz', { nullable: true })
  lastLoginAt!: Date | null;
}
