import { ApiProperty } from '@nestjs/swagger';
import { FamilyMemberRole } from '@family-planner/shared-models-schedule';

/**
 * Family Member DTO
 *
 * Minimal representation of a family member for nested responses.
 * Used when time blocks include family member information.
 */
export class FamilyMemberDto {
  @ApiProperty({
    description: 'Unique identifier for the family member',
    format: 'uuid',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  familyMemberId: string;

  @ApiProperty({
    description: 'Display name of the family member',
    example: 'John',
  })
  name: string;

  @ApiProperty({
    description: 'Role within the family',
    enum: FamilyMemberRole,
    example: FamilyMemberRole.USER,
  })
  role: FamilyMemberRole;

  @ApiProperty({
    description: 'Age of the family member (primarily for children)',
    required: false,
    nullable: true,
    example: 8,
  })
  age?: number;
}
