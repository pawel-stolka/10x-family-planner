import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@family-planner/backend/feature-auth';

/**
 * Initialization Service
 * 
 * Runs on application startup to set up necessary data:
 * - Creates demo user for development/testing
 */
@Injectable()
export class InitializationService implements OnModuleInit {
  private readonly logger = new Logger(InitializationService.name);
  private readonly DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Initialize on module startup
   */
  async onModuleInit() {
    if (process.env.NODE_ENV === 'development') {
      await this.createDemoUserIfNotExists();
    }
  }

  /**
   * Create demo user for development/testing
   * This user is used as fallback when JWT authentication is not configured
   */
  private async createDemoUserIfNotExists(): Promise<void> {
    try {
      // Check if demo user already exists
      const existingUser = await this.userRepository.findOne({
        where: { userId: this.DEMO_USER_ID },
      });

      if (existingUser) {
        this.logger.log(`✅ Demo user already exists: ${this.DEMO_USER_ID}`);
        return;
      }

      // Create demo user
      const demoUser = this.userRepository.create({
        userId: this.DEMO_USER_ID,
        email: 'demo@family-planner.local',
        displayName: 'Demo User',
        passwordHash: '', // Not needed for demo user
      });

      await this.userRepository.save(demoUser);
      
      this.logger.log(
        `✅ Created demo user: ${this.DEMO_USER_ID} (${demoUser.email})`
      );
    } catch (error) {
      this.logger.warn(
        `⚠️  Failed to create demo user: ${error.message}. ` +
        'This is normal if user already exists or in production.'
      );
    }
  }
}
