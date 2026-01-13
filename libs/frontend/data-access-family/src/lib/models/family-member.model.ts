/**
 * Family Member Models and Request DTOs
 *
 * TypeScript interfaces matching the backend API contracts.
 */

export interface FamilyMember {
  familyMemberId: string;
  userId: string;
  name: string;
  role: 'USER' | 'SPOUSE' | 'CHILD';
  age?: number;
  preferences?: {
    interests?: string[];
    energyLevels?: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFamilyMemberRequest {
  name: string;
  role: 'USER' | 'SPOUSE' | 'CHILD';
  age?: number;
  preferences?: Record<string, any>;
}

export interface UpdateFamilyMemberRequest {
  name?: string;
  age?: number;
  preferences?: Record<string, any>;
}
