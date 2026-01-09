/**
 * Family Member Role Enum
 * 
 * Defines the role of a family member within the household.
 * Matches database enum: family_member_role
 */
export enum FamilyMemberRole {
  /** Primary user of the application */
  USER = 'USER',
  
  /** User's spouse or partner */
  SPOUSE = 'SPOUSE',
  
  /** Child in the family */
  CHILD = 'CHILD',
}
