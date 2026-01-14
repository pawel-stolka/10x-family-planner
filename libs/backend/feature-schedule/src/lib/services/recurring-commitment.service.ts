import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RecurringCommitmentEntity } from '../entities/recurring-commitment.entity';
import { CreateRecurringCommitmentDto } from '../dto/create-recurring-commitment.dto';
import { UpdateRecurringCommitmentDto } from '../dto/update-recurring-commitment.dto';
import { QueryRecurringCommitmentsDto } from '../dto/query-recurring-commitments.dto';
import { BlockType } from '@family-planner/shared-models-schedule';

@Injectable()
export class RecurringCommitmentService {
  constructor(
    @InjectRepository(RecurringCommitmentEntity)
    private readonly repo: Repository<RecurringCommitmentEntity>
  ) {}

  async create(
    userId: string,
    dto: CreateRecurringCommitmentDto
  ): Promise<RecurringCommitmentEntity> {
    const isShared = !!dto.isShared;

    if (isShared && dto.familyMemberId) {
      throw new BadRequestException(
        'Shared commitments cannot have familyMemberId'
      );
    }
    if (!isShared && !dto.familyMemberId) {
      throw new BadRequestException(
        'familyMemberId is required when isShared is false'
      );
    }

    const entity = this.repo.create({
      userId,
      familyMemberId: isShared ? undefined : dto.familyMemberId,
      title: dto.title,
      blockType: dto.blockType ?? BlockType.OTHER,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      isShared,
      metadata: dto.metadata || {},
    });

    try {
      return await this.repo.save(entity);
    } catch (error: any) {
      // Handle foreign key constraint violation for user_id
      if (error?.code === '23503' && error?.constraint === 'recurring_commitments_user_id_fkey') {
        throw new BadRequestException(
          'User account not found. Please logout and login again.'
        );
      }
      throw error;
    }
  }

  async findAll(
    userId: string,
    query: QueryRecurringCommitmentsDto
  ): Promise<RecurringCommitmentEntity[]> {
    const qb = this.repo
      .createQueryBuilder('c')
      .where('c.user_id = :userId', { userId })
      .andWhere('c.deleted_at IS NULL');

    if (query.familyMemberId) {
      qb.andWhere('c.family_member_id = :familyMemberId', {
        familyMemberId: query.familyMemberId,
      });
    }
    if (query.dayOfWeek) {
      qb.andWhere('c.day_of_week = :dayOfWeek', { dayOfWeek: query.dayOfWeek });
    }

    return await qb
      .orderBy('c.day_of_week', 'ASC')
      .addOrderBy('c.start_time', 'ASC')
      .getMany();
  }

  async findOne(
    userId: string,
    commitmentId: string
  ): Promise<RecurringCommitmentEntity> {
    const entity = await this.repo.findOne({
      where: { commitmentId, userId, deletedAt: IsNull() },
    });
    if (!entity) {
      throw new NotFoundException('Recurring commitment not found');
    }
    return entity;
  }

  async update(
    userId: string,
    commitmentId: string,
    dto: UpdateRecurringCommitmentDto
  ): Promise<RecurringCommitmentEntity> {
    const entity = await this.findOne(userId, commitmentId);

    // Apply updates
    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.blockType !== undefined) entity.blockType = dto.blockType;
    if (dto.dayOfWeek !== undefined) entity.dayOfWeek = dto.dayOfWeek;
    if (dto.startTime !== undefined) entity.startTime = dto.startTime;
    if (dto.endTime !== undefined) entity.endTime = dto.endTime;
    if (dto.metadata !== undefined) entity.metadata = dto.metadata;

    const nextIsShared = dto.isShared !== undefined ? dto.isShared : entity.isShared;
    const nextFamilyMemberId =
      dto.familyMemberId !== undefined ? dto.familyMemberId : entity.familyMemberId;

    if (nextIsShared && nextFamilyMemberId) {
      throw new BadRequestException(
        'Shared commitments cannot have familyMemberId'
      );
    }
    if (!nextIsShared && !nextFamilyMemberId) {
      throw new BadRequestException(
        'familyMemberId is required when isShared is false'
      );
    }

    entity.isShared = nextIsShared;
    entity.familyMemberId = nextIsShared ? undefined : nextFamilyMemberId;
    entity.updatedAt = new Date();

    return await this.repo.save(entity);
  }

  async remove(userId: string, commitmentId: string): Promise<void> {
    const entity = await this.findOne(userId, commitmentId);
    entity.deletedAt = new Date();
    await this.repo.save(entity);
  }
}

