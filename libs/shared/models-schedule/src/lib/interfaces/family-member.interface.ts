import { FamilyMemberRole } from '../enums/family-member-role.enum';

/**
 * Family Member Interface
 *
 * Represents a member of the family (user, spouse, or child).
 * Maps to database table: family_members
 */
export interface FamilyMember {
  /** Unique identifier for the family member */
  familyMemberId: string;

  /** Reference to the user who owns this family profile */
  userId: string;

  /** Display name of the family member */
  name: string;

  /** Role within the family */
  role: FamilyMemberRole;

  /** Age of the family member (primarily for children) */
  age?: number;

  /** Preferences stored as JSON (interests, energy levels, etc.) */
  preferences: Record<string, any>;

  /** Timestamp when the record was created */
  createdAt: Date;

  /** Timestamp when the record was last updated */
  updatedAt: Date;

  /** Soft delete timestamp (null if not deleted) */
  deletedAt?: Date;
}
