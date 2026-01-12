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
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId!: string;

  @Column('varchar', { name: 'email', length: 255, unique: true })
  @Index('idx_users_email')
  email!: string;

  @Column('varchar', { name: 'password_hash', length: 255 })
  passwordHash!: string;

  @Column('varchar', { name: 'display_name', length: 100, nullable: true })
  displayName!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column('timestamptz', { name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;

  @Column('timestamptz', { name: 'last_login_at', nullable: true })
  lastLoginAt!: Date | null;
}
