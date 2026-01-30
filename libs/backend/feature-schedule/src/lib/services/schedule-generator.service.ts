import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { WeeklyScheduleEntity } from '../entities/weekly-schedule.entity';
import { TimeBlockEntity } from '../entities/time-block.entity';
import { FamilyMemberEntity } from '../entities/family-member.entity';
import { RecurringGoalEntity } from '../entities/recurring-goal.entity';
import { RecurringCommitmentEntity } from '../entities/recurring-commitment.entity';
import { OpenAIService } from './openai.service';
import { GenerateScheduleDto } from '../dto/generate-schedule.dto';
import { ScheduleGenerationResponseDto } from '../dto/schedule-generation-response.dto';

/**
 * Schedule Generator Service
 *
 * Generates weekly schedules using AI (OpenAI GPT-4).
 * For Ultra-MVP: Creates mock family data if none exists.
 *
 * Flow:
 * 1. Load or create mock family members
 * 2. Load or create mock recurring goals
 * 3. Call OpenAI to generate schedule
 * 4. Save schedule + time blocks to database
 * 5. Return response with summary
 */
@Injectable()
export class ScheduleGeneratorService {
  private readonly logger = new Logger(ScheduleGeneratorService.name);

  constructor(
    @InjectRepository(WeeklyScheduleEntity)
    private readonly scheduleRepository: Repository<WeeklyScheduleEntity>,
    @InjectRepository(TimeBlockEntity)
    private readonly timeBlockRepository: Repository<TimeBlockEntity>,
    @InjectRepository(FamilyMemberEntity)
    private readonly familyMemberRepository: Repository<FamilyMemberEntity>,
    @InjectRepository(RecurringGoalEntity)
    private readonly recurringGoalRepository: Repository<RecurringGoalEntity>,
    @InjectRepository(RecurringCommitmentEntity)
    private readonly recurringCommitmentRepository: Repository<RecurringCommitmentEntity>,
    private readonly openAIService: OpenAIService
  ) {}

  /**
   * Generate weekly schedule using AI
   */
  async generateSchedule(
    userId: string,
    dto: GenerateScheduleDto
  ): Promise<ScheduleGenerationResponseDto> {
    this.logger.log(
      `📅 Generating schedule for user ${userId}, week ${dto.weekStartDate}`
    );

    // 1. Validate week start date is Monday
    const weekStart = new Date(dto.weekStartDate);
    if (weekStart.getDay() !== 1) {
      // 1 = Monday
      throw new BadRequestException('Week start date must be a Monday');
    }

    // 2. Load or create mock family members
    const familyMembers = await this.loadOrCreateMockFamilyMembers(userId);
    this.logger.log(`👥 Found ${familyMembers.length} family members`);

    // 3. Load or create mock recurring goals
    const recurringGoals = await this.loadOrCreateMockRecurringGoals(
      userId,
      familyMembers
    );
    this.logger.log(`🎯 Found ${recurringGoals.length} recurring goals`);

    // 4. Load recurring commitments (fixed blocks)
    const recurringCommitments = await this.recurringCommitmentRepository.find({
      where: { userId, deletedAt: IsNull() },
    });
    this.logger.log(
      `📌 Found ${recurringCommitments.length} recurring commitments`
    );

    // 5. Check if schedule already exists for this week and load manually added blocks
    const existingSchedule = await this.scheduleRepository.findOne({
      where: {
        userId,
        weekStartDate: weekStart,
        deletedAt: IsNull(),
      },
      relations: ['timeBlocks'],
    });

    // Filter to keep only manually added blocks (not AI-generated)
    const manuallyAddedBlocks =
      existingSchedule?.timeBlocks?.filter(
        (block) =>
          !block.deletedAt &&
          block.metadata?.generatedBy !== 'ai' &&
          block.metadata?.source !== 'fixed'
      ) || [];

    this.logger.log(
      `📝 Found ${manuallyAddedBlocks.length} manually added activities to preserve`
    );

    // Convert manually added blocks to format for AI prompt
    const existingBlocksForAI = manuallyAddedBlocks.map((block) => {
      const dayIndex = block.timeRange.start.getDay();
      const dayNames = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      const dayName = dayNames[dayIndex];
      const startTime = block.timeRange.start
        .toISOString()
        .split('T')[1]
        .substring(0, 5);
      const endTime = block.timeRange.end
        .toISOString()
        .split('T')[1]
        .substring(0, 5);

      return {
        title: block.title,
        blockType: block.blockType,
        day: dayName,
        startTime,
        endTime,
        familyMemberId: block.familyMemberId || null,
        isShared: block.isShared,
      };
    });

    // 6. Generate schedule using OpenAI
    this.logger.log('🤖 Calling OpenAI to generate schedule...');
    const aiBlocks = await this.openAIService.generateSchedule({
      weekStartDate: weekStart,
      familyMembers: familyMembers.map((m) => ({
        id: m.familyMemberId,
        name: m.name,
        role: m.role,
        age: m.age,
      })),
      recurringGoals: recurringGoals.map((g) => ({
        id: g.goalId,
        name: g.name,
        description: g.description || undefined,
        frequencyPerWeek: g.frequencyPerWeek,
        preferredDurationMinutes: g.preferredDurationMinutes ?? 30,
        preferredTimeOfDay:
          g.preferredTimeOfDay && g.preferredTimeOfDay.length > 0
            ? g.preferredTimeOfDay[0]
            : undefined,
        priority: 'MEDIUM',
        familyMemberId: g.familyMemberId,
      })),
      recurringCommitments: recurringCommitments.map((c) => ({
        id: c.commitmentId,
        title: c.title,
        blockType: c.blockType as string,
        dayOfWeek: this.getDayName(c.dayOfWeek),
        startTime: c.startTime,
        endTime: c.endTime,
        familyMemberId: c.familyMemberId || null,
        isShared: c.isShared,
      })),
      existingTimeBlocks: existingBlocksForAI,
      strategy: dto.strategy || 'balanced',
    });

    this.logger.log(`✅ AI generated ${aiBlocks.length} time blocks`);

    // 7. Handle existing schedule: delete only AI-generated blocks, keep manual ones
    if (existingSchedule) {
      this.logger.log(
        `📝 Schedule already exists for week ${dto.weekStartDate}, preserving manually added blocks...`
      );

      // Delete only AI-generated blocks (keep manually added ones)
      const aiGeneratedBlocks = existingSchedule.timeBlocks.filter(
        (block) =>
          !block.deletedAt &&
          (block.metadata?.generatedBy === 'ai' ||
            block.metadata?.source === 'goal')
      );

      if (aiGeneratedBlocks.length > 0) {
        await this.timeBlockRepository.delete(
          aiGeneratedBlocks.map((b) => b.blockId)
        );
        this.logger.log(
          `🗑️  Deleted ${aiGeneratedBlocks.length} AI-generated blocks`
        );
      }

      // Reuse existing schedule entity
      existingSchedule.isAiGenerated = true;
      existingSchedule.metadata = {
        ...existingSchedule.metadata,
        strategy: dto.strategy || 'balanced',
        preferences: dto.preferences || {},
        generatedAt: new Date().toISOString(),
        model: 'gpt-4-turbo-preview',
      };

      const savedSchedule = await this.scheduleRepository.save(
        existingSchedule
      );
      this.logger.log(`✅ Updated schedule ${savedSchedule.scheduleId}`);
    } else {
      // 8. Create new weekly schedule entity
      const newSchedule = this.scheduleRepository.create({
        userId,
        weekStartDate: weekStart,
        isAiGenerated: true,
        metadata: {
          strategy: dto.strategy || 'balanced',
          preferences: dto.preferences || {},
          generatedAt: new Date().toISOString(),
          model: 'gpt-4-turbo-preview',
        },
      });

      const savedSchedule = await this.scheduleRepository.save(newSchedule);
      this.logger.log(`✅ Created schedule ${savedSchedule.scheduleId}`);
    }

    // Get the schedule (either existing or newly created)
    const savedSchedule = await this.scheduleRepository.findOne({
      where: {
        userId,
        weekStartDate: weekStart,
        deletedAt: IsNull(),
      },
    });

    if (!savedSchedule) {
      throw new Error('Failed to retrieve schedule after save');
    }

    // 9. Create a mapping from AI familyMemberId to actual UUID
    const familyMemberMap = new Map(
      familyMembers.map((fm) => [fm.familyMemberId, fm.familyMemberId])
    );
    // Also map by role in case AI returns role instead of ID
    familyMembers.forEach((fm) => {
      familyMemberMap.set(fm.role, fm.familyMemberId);
      familyMemberMap.set(fm.name, fm.familyMemberId);
    });

    // Create a mapping for recurringGoalId validation
    const recurringGoalMap = new Map(
      recurringGoals.map((goal) => [goal.goalId, goal.goalId])
    );
    this.logger.debug(
      `📋 Created goal ID map with ${recurringGoalMap.size} valid goal IDs`
    );

    // 10. Create time blocks from AI-generated schedule (manually added blocks are already in DB)
    const aiTimeBlockEntities = aiBlocks.map((block) => {
      // Convert day name + time to full datetime
      const dayIndex = this.getDayIndex(block.day);
      const blockDate = new Date(weekStart);
      blockDate.setDate(blockDate.getDate() + dayIndex);

      const [startHour, startMin] = block.startTime.split(':').map(Number);
      const [endHour, endMin] = block.endTime.split(':').map(Number);

      const startDateTime = new Date(blockDate);
      startDateTime.setHours(startHour, startMin, 0, 0);

      const endDateTime = new Date(blockDate);
      endDateTime.setHours(endHour, endMin, 0, 0);

      const isShared = !!block.isShared;

      // Map familyMemberId from AI response to actual UUID (shared blocks must not have a member)
      const actualFamilyMemberId =
        !isShared && block.familyMemberId
          ? familyMemberMap.get(block.familyMemberId) || undefined
          : undefined;

      // Validate and map recurringGoalId - only use if it exists in the database
      const recurringGoalId = block.recurringGoalId
        ? recurringGoalMap.get(block.recurringGoalId) || undefined
        : undefined;

      // Log warning if AI provided an invalid goal ID
      if (block.recurringGoalId && !recurringGoalId) {
        this.logger.warn(
          `⚠️  AI provided invalid recurringGoalId "${block.recurringGoalId}" for block "${block.title}" - ignoring`
        );
      }

      const entity = new TimeBlockEntity();
      entity.scheduleId = savedSchedule.scheduleId;
      entity.title = block.title;
      entity.blockType = block.blockType as any;
      entity.familyMemberId = actualFamilyMemberId;
      entity.recurringGoalId = recurringGoalId;
      entity.timeRange = {
        start: startDateTime,
        end: endDateTime,
      };
      entity.isShared = isShared;
      entity.metadata = {
        notes: block.notes,
        generatedBy: 'ai',
        source: recurringGoalId ? 'goal' : isShared ? 'shared' : 'other',
      };

      return entity;
    });

    // 11. Create fixed time blocks from recurring commitments
    // Note: Fixed blocks should not conflict with manually added blocks since
    // they're recurring commitments that should already exist. But we'll filter
    // them just in case there's an edge case.
    const fixedTimeBlockEntities = recurringCommitments
      .flatMap((commitment) => {
        // Expand each commitment to the specific week dates
        // dayOfWeek is 1=Monday ... 7=Sunday, we need 0-based for array offset
        const dayIndex = commitment.dayOfWeek - 1;
        const blockDate = new Date(weekStart);
        blockDate.setDate(blockDate.getDate() + dayIndex);

        const [startHour, startMin] = commitment.startTime
          .split(':')
          .map(Number);
        const [endHour, endMin] = commitment.endTime.split(':').map(Number);

        const startDateTime = new Date(blockDate);
        startDateTime.setHours(startHour, startMin, 0, 0);

        const endDateTime = new Date(blockDate);
        endDateTime.setHours(endHour, endMin, 0, 0);

        const entity = new TimeBlockEntity();
        entity.scheduleId = savedSchedule.scheduleId;
        entity.title = commitment.title;
        entity.blockType = commitment.blockType as any;
        entity.familyMemberId = commitment.familyMemberId || undefined;
        entity.recurringGoalId = undefined; // Commitments are not goals
        entity.timeRange = {
          start: startDateTime,
          end: endDateTime,
        };
        entity.isShared = commitment.isShared;
        entity.metadata = {
          ...commitment.metadata,
          source: 'fixed',
          generatedBy: 'commitment',
          commitmentId: commitment.commitmentId,
        };

        return entity;
      })
      .filter((fixedBlock) => {
        // Filter out fixed blocks that conflict with manually added blocks
        // (shouldn't happen, but safety check)
        if (fixedBlock.isShared || !fixedBlock.familyMemberId) {
          return true;
        }

        for (const manualBlock of manuallyAddedBlocks) {
          if (manualBlock.isShared || !manualBlock.familyMemberId) {
            continue;
          }

          if (manualBlock.familyMemberId !== fixedBlock.familyMemberId) {
            continue;
          }

          const manualStart = new Date(manualBlock.timeRange.start);
          const manualEnd = new Date(manualBlock.timeRange.end);
          const fixedStart = new Date(fixedBlock.timeRange.start);
          const fixedEnd = new Date(fixedBlock.timeRange.end);

          if (fixedStart < manualEnd && fixedEnd > manualStart) {
            this.logger.warn(
              `⚠️  Fixed commitment "${fixedBlock.title}" conflicts with manually added block "${manualBlock.title}" - skipping fixed block (manual block takes precedence)`
            );
            return false;
          }
        }

        return true;
      });

    // 12. Filter out AI blocks that conflict with manually added blocks or fixed commitments
    const allExistingBlocks = [
      ...manuallyAddedBlocks,
      ...fixedTimeBlockEntities,
    ];

    const nonConflictingAiBlocks = aiTimeBlockEntities.filter((newBlock) => {
      // Skip conflict check for shared blocks (they can overlap by design)
      if (newBlock.isShared || !newBlock.familyMemberId) {
        return true;
      }

      // Check against all existing blocks (manually added + fixed commitments)
      for (const existingBlock of allExistingBlocks) {
        // Skip if existing block is shared or has no member (can overlap)
        if (existingBlock.isShared || !existingBlock.familyMemberId) {
          continue;
        }

        // Only check conflicts for same family member
        if (existingBlock.familyMemberId !== newBlock.familyMemberId) {
          continue;
        }

        // Check for time overlap
        const existingStart = new Date(existingBlock.timeRange.start);
        const existingEnd = new Date(existingBlock.timeRange.end);
        const newStart = new Date(newBlock.timeRange.start);
        const newEnd = new Date(newBlock.timeRange.end);

        if (newStart < existingEnd && newEnd > existingStart) {
          const blockType =
            existingBlock.metadata?.source === 'fixed'
              ? 'fixed commitment'
              : 'manually added block';
          this.logger.warn(
            `⚠️  Filtered out AI block "${
              newBlock.title
            }" (${newBlock.timeRange.start.toISOString()} - ${newBlock.timeRange.end.toISOString()}) due to conflict with ${blockType} "${
              existingBlock.title
            }"`
          );
          return false;
        }
      }

      return true;
    });

    // 13. Combine AI and fixed blocks (manually added blocks are already in DB)
    const timeBlockEntities = [
      ...fixedTimeBlockEntities,
      ...nonConflictingAiBlocks,
    ];

    const savedBlocks = await this.timeBlockRepository.save(timeBlockEntities);
    const filteredCount =
      aiTimeBlockEntities.length - nonConflictingAiBlocks.length;
    if (filteredCount > 0) {
      this.logger.warn(
        `⚠️  Filtered out ${filteredCount} AI-generated blocks due to conflicts with manually added activities`
      );
    }
    this.logger.log(
      `✅ Saved ${savedBlocks.length} time blocks (${fixedTimeBlockEntities.length} fixed + ${nonConflictingAiBlocks.length} AI-generated + ${manuallyAddedBlocks.length} manually added preserved)`
    );

    // 14. Load all blocks (AI + fixed + manual) for response
    const allBlocks = await this.timeBlockRepository.find({
      where: { scheduleId: savedSchedule.scheduleId, deletedAt: IsNull() },
    });

    // 15. Calculate summary
    const summary = this.calculateSummary(
      allBlocks,
      recurringGoals.length,
      recurringCommitments.length
    );

    // 16. Return response
    return {
      scheduleId: savedSchedule.scheduleId,
      weekStartDate: dto.weekStartDate,
      summary,
      timeBlocks: allBlocks.map((block) => ({
        blockId: block.blockId,
        scheduleId: block.scheduleId,
        recurringGoalId: block.recurringGoalId,
        title: block.title,
        blockType: block.blockType,
        familyMemberId: block.familyMemberId,
        timeRange: {
          start: block.timeRange.start.toISOString(),
          end: block.timeRange.end.toISOString(),
        },
        isShared: block.isShared,
        metadata: block.metadata,
        createdAt: block.createdAt.toISOString(),
        updatedAt: block.updatedAt.toISOString(),
      })),
    };
  }

  /**
   * Load or create mock family members for Ultra-MVP
   */
  private async loadOrCreateMockFamilyMembers(
    userId: string
  ): Promise<FamilyMemberEntity[]> {
    // Try to load existing members
    let members = await this.familyMemberRepository.find({
      where: { userId, deletedAt: IsNull() },
    });

    // If no members exist, create mock data
    if (members.length === 0) {
      this.logger.log(
        '📝 No family members found, creating mock data for demo...'
      );

      const mockMember = this.familyMemberRepository.create({
        userId,
        name: 'You',
        role: 'USER' as any,
        preferences: { interests: ['fitness', 'coding', 'guitar'] },
      });

      const saved = await this.familyMemberRepository.save(mockMember);
      members = [saved];
      this.logger.log(`✅ Created ${members.length} mock family members`);
    }

    return members;
  }

  /**
   * Load or create mock recurring goals for Ultra-MVP
   */
  private async loadOrCreateMockRecurringGoals(
    userId: string,
    familyMembers: FamilyMemberEntity[]
  ): Promise<RecurringGoalEntity[]> {
    // Try to load existing goals
    let goals = await this.recurringGoalRepository.find({
      where: {
        userId,
        deletedAt: IsNull(),
      },
    });

    // If no goals exist, create mock data
    if (goals.length === 0 && familyMembers.length > 0) {
      this.logger.log(
        '📝 No recurring goals found, creating mock data for demo...'
      );

      const owner = familyMembers[0];
      const mockGoals = [
        this.recurringGoalRepository.create({
          userId,
          familyMemberId: owner.familyMemberId,
          name: 'Morning Run',
          description: 'Daily cardio routine',
          frequencyPerWeek: 3,
          preferredDurationMinutes: 30,
          preferredTimeOfDay: ['morning'],
          priority: 2,
          rules: {},
        }),
        this.recurringGoalRepository.create({
          userId,
          familyMemberId: owner.familyMemberId,
          name: 'Workout',
          description: 'Strength training',
          frequencyPerWeek: 2,
          preferredDurationMinutes: 45,
          preferredTimeOfDay: ['afternoon'],
          priority: 2,
          rules: {},
        }),
        this.recurringGoalRepository.create({
          userId,
          familyMemberId: owner.familyMemberId,
          name: 'Guitar Practice',
          description: 'Music practice session',
          frequencyPerWeek: 2,
          preferredDurationMinutes: 30,
          preferredTimeOfDay: ['evening'],
          priority: 1,
          rules: {},
        }),
      ];

      goals = await this.recurringGoalRepository.save(mockGoals);
      this.logger.log(`✅ Created ${goals.length} mock recurring goals`);
    }

    return goals;
  }

  /**
   * Convert day name to index (0 = Monday, 6 = Sunday)
   */
  private getDayIndex(day: string): number {
    const days = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];
    return days.indexOf(day.toLowerCase());
  }

  /**
   * Convert day number to name (1 = Monday, 7 = Sunday)
   */
  private getDayName(dayNum: number): string {
    const days = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];
    return days[dayNum - 1] || 'monday';
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(
    blocks: TimeBlockEntity[],
    totalGoals: number,
    totalCommitments: number
  ) {
    const distribution: Record<string, number> = {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    };

    let fixedBlocksCount = 0;
    let goalBlocksCount = 0;

    blocks.forEach((block) => {
      const dayOfWeek = block.timeRange.start.getDay();
      const dayNames = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      const dayName = dayNames[dayOfWeek];
      distribution[dayName]++;

      // Count fixed vs goal blocks
      if (block.metadata?.source === 'fixed') {
        fixedBlocksCount++;
      } else if (block.recurringGoalId) {
        goalBlocksCount++;
      }
    });

    return {
      totalBlocks: blocks.length,
      fixedBlocksCount,
      goalBlocksCount,
      goalsScheduled: totalGoals, // Simplified for MVP
      totalGoals,
      totalCommitments,
      conflicts: 0, // Would need conflict detection logic
      distribution,
    };
  }
}
