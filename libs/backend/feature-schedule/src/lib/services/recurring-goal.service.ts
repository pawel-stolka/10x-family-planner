import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { RecurringGoalEntity } from '../entities/recurring-goal.entity';
import { FamilyMemberEntity } from '../entities/family-member.entity';
import { CreateRecurringGoalDto } from '../dto/create-recurring-goal.dto';
import { UpdateRecurringGoalDto } from '../dto/update-recurring-goal.dto';
import { QueryRecurringGoalsDto } from '../dto/query-recurring-goals.dto';

/**
 * Recurring Goal Service
 *
 * Business logic for managing recurring goals.
 *
 * Features:
 * - CRUD operations
 * - Authorization (users can only access goals for their family members)
 * - Validation (max 50 goals, family member access)
 * - Filtering and sorting
 * - Soft delete
 */
@Injectable()
export class RecurringGoalService {
  constructor(
    @InjectRepository(RecurringGoalEntity)
    private readonly goalRepo: Repository<RecurringGoalEntity>,
    @InjectRepository(FamilyMemberEntity)
    private readonly familyMemberRepo: Repository<FamilyMemberEntity>
  ) {}

  /**
   * Create a new recurring goal
   *
   * Validates:
   * - Family member belongs to user
   * - User has not reached limit (50 goals max)
   */
  async create(
    userId: string,
    dto: CreateRecurringGoalDto
  ): Promise<RecurringGoalEntity> {
    // Validate family member access
    await this.validateFamilyMemberAccess(userId, dto.familyMemberId);

    // Check limit (max 50 goals per user)
    const count = await this.goalRepo
      .createQueryBuilder('goal')
      .leftJoin('goal.familyMember', 'member')
      .where('member.user_id = :userId', { userId })
      .andWhere('goal.deleted_at IS NULL')
      .getCount();

    if (count >= 50) {
      throw new BadRequestException('Maximum 50 recurring goals allowed');
    }

    const goal = this.goalRepo.create({
      familyMemberId: dto.familyMemberId,
      name: dto.name,
      description: dto.description,
      frequencyPerWeek: dto.frequencyPerWeek,
      preferredDurationMinutes: dto.preferredDurationMinutes,
      preferredTimeOfDay: dto.preferredTimeOfDay || [],
      priority: dto.priority,
      rules: dto.rules || {},
    });

    return await this.goalRepo.save(goal);
  }

  /**
   * Get all goals for a user (with optional filtering)
   */
  async findAll(
    userId: string,
    query: QueryRecurringGoalsDto
  ): Promise<RecurringGoalEntity[]> {
    const queryBuilder = this.goalRepo
      .createQueryBuilder('goal')
      .leftJoinAndSelect('goal.familyMember', 'member')
      .where('member.user_id = :userId', { userId })
      .andWhere('goal.deleted_at IS NULL')
      .andWhere('member.deleted_at IS NULL');

    // Apply filters
    if (query.familyMemberId) {
      queryBuilder.andWhere('goal.family_member_id = :familyMemberId', {
        familyMemberId: query.familyMemberId,
      });
    }

    if (query.priority !== undefined) {
      queryBuilder.andWhere('goal.priority = :priority', {
        priority: query.priority,
      });
    }

    // Apply sorting
    const sortBy = query.sortBy || 'priority';
    const sortOrder = query.sortOrder || 'DESC';

    if (sortBy === 'name') {
      queryBuilder.orderBy('goal.name', sortOrder);
    } else if (sortBy === 'priority') {
      queryBuilder.orderBy('goal.priority', sortOrder);
    } else {
      queryBuilder.orderBy('goal.created_at', sortOrder);
    }

    return await queryBuilder.getMany();
  }

  /**
   * Get a single goal by ID
   *
   * Validates:
   * - Goal exists
   * - Goal belongs to user's family member
   * - Goal is not soft-deleted
   */
  async findOne(userId: string, goalId: string): Promise<RecurringGoalEntity> {
    const goal = await this.goalRepo
      .createQueryBuilder('goal')
      .leftJoinAndSelect('goal.familyMember', 'member')
      .where('goal.goal_id = :goalId', { goalId })
      .andWhere('goal.deleted_at IS NULL')
      .andWhere('member.user_id = :userId', { userId })
      .andWhere('member.deleted_at IS NULL')
      .getOne();

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  /**
   * Update an existing goal
   */
  async update(
    userId: string,
    goalId: string,
    dto: UpdateRecurringGoalDto
  ): Promise<RecurringGoalEntity> {
    const goal = await this.findOne(userId, goalId);

    // Apply updates
    if (dto.name !== undefined) {
      goal.name = dto.name;
    }
    if (dto.description !== undefined) {
      goal.description = dto.description;
    }
    if (dto.frequencyPerWeek !== undefined) {
      goal.frequencyPerWeek = dto.frequencyPerWeek;
    }
    if (dto.preferredDurationMinutes !== undefined) {
      goal.preferredDurationMinutes = dto.preferredDurationMinutes;
    }
    if (dto.preferredTimeOfDay !== undefined) {
      goal.preferredTimeOfDay = dto.preferredTimeOfDay;
    }
    if (dto.priority !== undefined) {
      goal.priority = dto.priority;
    }
    if (dto.rules !== undefined) {
      goal.rules = dto.rules;
    }

    goal.updatedAt = new Date();

    return await this.goalRepo.save(goal);
  }

  /**
   * Soft delete a goal
   */
  async remove(userId: string, goalId: string): Promise<void> {
    const goal = await this.findOne(userId, goalId);
    goal.deletedAt = new Date();
    await this.goalRepo.save(goal);
  }

  /**
   * Validate that a family member belongs to the user
   */
  private async validateFamilyMemberAccess(
    userId: string,
    familyMemberId: string
  ): Promise<void> {
    const member = await this.familyMemberRepo.findOne({
      where: {
        familyMemberId,
        userId,
        deletedAt: IsNull(),
      },
    });

    if (!member) {
      throw new NotFoundException('Family member not found or access denied');
    }
  }
}
