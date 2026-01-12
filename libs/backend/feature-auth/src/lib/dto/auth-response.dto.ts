import { ApiProperty } from '@nestjs/swagger';

/**
 * User DTO (nested in auth responses)
 * 
 * Contains public user information returned after authentication.
 */
export class UserDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User UUID',
  })
  id!: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email!: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User display name',
    nullable: true,
  })
  displayName!: string | null;

  @ApiProperty({
    example: '2026-01-09T12:00:00Z',
    description: 'Account creation timestamp',
  })
  createdAt!: string;
}

/**
 * Auth Response DTO
 * 
 * Response body for successful login/register.
 * Contains JWT token and user information.
 */
export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  token!: string;

  @ApiProperty({
    type: UserDto,
    description: 'Authenticated user information',
  })
  user!: UserDto;
}
