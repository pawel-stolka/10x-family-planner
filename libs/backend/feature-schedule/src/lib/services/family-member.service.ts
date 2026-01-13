import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { FamilyMemberEntity } from '../entities/family-member.entity';
import { CreateFamilyMemberDto } from '../dto/create-family-member.dto';
import { UpdateFamilyMemberDto } from '../dto/update-family-member.dto';
import { FamilyMemberRole } from '@family-planner/shared-models-schedule';

/**
 * Family Member Service
 *
 * Business logic for managing family members.
 *
 * Features:
 * - CRUD operations
 * - Authorization (users can only access their own family members)
 * - Validation (max 10 members, age required for children, etc.)
 * - Soft delete (deletedAt timestamp)
 *
 * Security:
 * - All operations require userId (from JWT)
 * - Database RLS provides additional security layer
 */
@Injectable()
export class FamilyMemberService {
  constructor(
    @InjectRepository(FamilyMemberEntity)
    private readonly familyMemberRepo: Repository<FamilyMemberEntity>
  ) {}

  /**
   * Create a new family member
   *
   * Validates:
   * - User has not reached limit (10 members max)
   * - Age is provided if role is CHILD
   */
  async create(
    userId: string,
    dto: CreateFamilyMemberDto
  ): Promise<FamilyMemberEntity> {
    // Check limit (max 10 family members per user)
    const count = await this.familyMemberRepo.count({
      where: { userId, deletedAt: IsNull() },
    });
    if (count >= 10) {
      throw new BadRequestException('Maximum 10 family members allowed');
    }

    // Validate age for children
    if (dto.role === FamilyMemberRole.CHILD && !dto.age) {
      throw new BadRequestException('Age is required for children');
    }

    const member = this.familyMemberRepo.create({
      userId,
      name: dto.name,
      role: dto.role,
      age: dto.age,
      preferences: dto.preferences || {},
    });

    return await this.familyMemberRepo.save(member);
  }

  /**
   * Get all family members for a user
   *
   * Returns active members only (not soft-deleted).
   * Sorted by role (USER, SPOUSE, CHILD) then by name.
   */
  async findAll(userId: string): Promise<FamilyMemberEntity[]> {
    return await this.familyMemberRepo.find({
      where: { userId, deletedAt: IsNull() },
      order: { role: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Get a single family member by ID
   *
   * Validates:
   * - Member exists
   * - Member belongs to the requesting user
   * - Member is not soft-deleted
   */
  async findOne(
    userId: string,
    familyMemberId: string
  ): Promise<FamilyMemberEntity> {
    const member = await this.familyMemberRepo.findOne({
      where: { familyMemberId, userId, deletedAt: IsNull() },
    });

    if (!member) {
      throw new NotFoundException('Family member not found');
    }

    return member;
  }

  /**
   * Update an existing family member
   *
   * Note: Role cannot be changed after creation.
   */
  async update(
    userId: string,
    familyMemberId: string,
    dto: UpdateFamilyMemberDto
  ): Promise<FamilyMemberEntity> {
    const member = await this.findOne(userId, familyMemberId);

    // Apply updates
    if (dto.name !== undefined) {
      member.name = dto.name;
    }
    if (dto.age !== undefined) {
      member.age = dto.age;
    }
    if (dto.preferences !== undefined) {
      member.preferences = dto.preferences;
    }

    member.updatedAt = new Date();

    return await this.familyMemberRepo.save(member);
  }

  /**
   * Soft delete a family member
   *
   * Validates:
   * - Not the last family member (must have at least 1)
   */
  async remove(userId: string, familyMemberId: string): Promise<void> {
    // Check if this is the last member
    const count = await this.familyMemberRepo.count({
      where: { userId, deletedAt: IsNull() },
    });
    if (count <= 1) {
      throw new BadRequestException('Cannot delete last family member');
    }

    const member = await this.findOne(userId, familyMemberId);
    member.deletedAt = new Date();
    await this.familyMemberRepo.save(member);
  }
}
