import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_FILTER } from '@nestjs/core';

// Entities
import { WeeklyScheduleEntity } from './entities/weekly-schedule.entity';
import { TimeBlockEntity } from './entities/time-block.entity';
import { FamilyMemberEntity } from './entities/family-member.entity';
import { RecurringGoalEntity } from './entities/recurring-goal.entity';

// Controllers
import { ScheduleController } from './controllers/schedule.controller';

// Services
import { ScheduleService } from './services/schedule.service';
import { ScheduleMapper } from './mappers/schedule.mapper';

// Guards & Strategies
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

// Filters
import { GlobalExceptionFilter } from './filters/global-exception.filter';

/**
 * Schedule Module
 *
 * Feature module for weekly schedule management.
 * Provides:
 * - REST API endpoints for schedule operations
 * - TypeORM entities for database access
 * - JWT authentication and authorization
 * - Global exception handling
 *
 * Dependencies:
 * - TypeORM (PostgreSQL database access)
 * - JWT/Passport (Supabase Auth integration)
 *
 * Exports:
 * - ScheduleService (for use in other modules)
 * - ScheduleMapper (for consistent DTO transformation)
 */
@Module({
  imports: [
    // Register TypeORM entities for dependency injection
    TypeOrmModule.forFeature([
      WeeklyScheduleEntity,
      TimeBlockEntity,
      FamilyMemberEntity,
      RecurringGoalEntity,
    ]),

    // Passport authentication
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT token handling
    JwtModule.register({
      secret: process.env['JWT_SECRET'] || 'your-secret-key-change-in-production',
      signOptions: {
        expiresIn: process.env['JWT_EXPIRES_IN'] || '1h',
      } as any,
    }),
  ],

  controllers: [ScheduleController],

  providers: [
    // Services
    ScheduleService,
    ScheduleMapper,

    // Auth
    JwtAuthGuard,
    JwtStrategy,

    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],

  exports: [ScheduleService, ScheduleMapper],
})
export class ScheduleModule {}
