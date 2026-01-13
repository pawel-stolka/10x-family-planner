import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { WeeklyScheduleEntity } from '../entities/weekly-schedule.entity';
import { TimeBlockEntity } from '../entities/time-block.entity';
import { FamilyMemberEntity } from '../entities/family-member.entity';
import { RecurringGoalEntity } from '../entities/recurring-goal.entity';
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

    // 4. Generate schedule using OpenAI
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
      strategy: dto.strategy || 'balanced',
    });

    this.logger.log(`✅ AI generated ${aiBlocks.length} time blocks`);

    // 5. Check if schedule already exists for this week
    const existingSchedule = await this.scheduleRepository.findOne({
      where: {
        userId,
        weekStartDate: weekStart,
        deletedAt: IsNull(),
      },
    });

    if (existingSchedule) {
      this.logger.log(
        `📝 Schedule already exists for week ${dto.weekStartDate}, deleting old one...`
      );

      // Delete existing time blocks first (cascade should handle this, but being explicit)
      await this.timeBlockRepository.delete({
        scheduleId: existingSchedule.scheduleId,
      });

      // Delete old schedule
      await this.scheduleRepository.delete(existingSchedule.scheduleId);
      this.logger.log(
        `🗑️  Deleted old schedule ${existingSchedule.scheduleId}`
      );
    }

    // 6. Create new weekly schedule entity
    const schedule = this.scheduleRepository.create({
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

    const savedSchedule = await this.scheduleRepository.save(schedule);
    this.logger.log(`✅ Created schedule ${savedSchedule.scheduleId}`);

    // 6. Create a mapping from AI familyMemberId to actual UUID
    const familyMemberMap = new Map(
      familyMembers.map((fm) => [fm.familyMemberId, fm.familyMemberId])
    );
    // Also map by role in case AI returns role instead of ID
    familyMembers.forEach((fm) => {
      familyMemberMap.set(fm.role, fm.familyMemberId);
      familyMemberMap.set(fm.name, fm.familyMemberId);
    });

    // 7. Create time blocks
    const timeBlockEntities = aiBlocks.map((block) => {
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

      // Map familyMemberId from AI response to actual UUID
      const actualFamilyMemberId = block.familyMemberId
        ? familyMemberMap.get(block.familyMemberId) || undefined
        : undefined;

      const entity = new TimeBlockEntity();
      entity.scheduleId = savedSchedule.scheduleId;
      entity.title = block.title;
      entity.blockType = block.blockType as any;
      entity.familyMemberId = actualFamilyMemberId;
      entity.timeRange = {
        start: startDateTime,
        end: endDateTime,
      };
      entity.isShared = false;
      entity.metadata = {
        notes: block.notes,
        generatedBy: 'ai',
      };

      return entity;
    });

    const savedBlocks = await this.timeBlockRepository.save(timeBlockEntities);
    this.logger.log(`✅ Saved ${savedBlocks.length} time blocks`);

    // 8. Calculate summary
    const summary = this.calculateSummary(savedBlocks, recurringGoals.length);

    // 9. Return response
    return {
      scheduleId: savedSchedule.scheduleId,
      weekStartDate: dto.weekStartDate,
      summary,
      timeBlocks: savedBlocks.map((block) => ({
        blockId: block.blockId,
        scheduleId: block.scheduleId,
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
   * Calculate summary statistics
   */
  private calculateSummary(blocks: TimeBlockEntity[], totalGoals: number) {
    const distribution: Record<string, number> = {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    };

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
    });

    return {
      totalBlocks: blocks.length,
      goalsScheduled: totalGoals, // Simplified for MVP
      totalGoals,
      conflicts: 0, // Would need conflict detection logic
      distribution,
    };
  }
}
