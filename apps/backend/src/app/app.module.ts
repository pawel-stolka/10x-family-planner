import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@family-planner/backend/feature-schedule';
import { AuthModule } from '@family-planner/backend/feature-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * App Module
 *
 * Root module for the Family Planner backend application.
 *
 * Configuration:
 * - ConfigModule: Loads .env files for environment variables
 * - TypeOrmModule: Connects to Supabase PostgreSQL database
 * - AuthModule: Feature module for authentication (register, login, logout)
 * - ScheduleModule: Feature module for weekly schedule management
 */
@Module({
  imports: [
    // Load environment variables from .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Configure TypeORM with Supabase PostgreSQL
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'family_planner',
      autoLoadEntities: true, // Automatically load entities from feature modules
      synchronize: false, // Never use synchronize in production - use migrations instead
      logging: process.env.NODE_ENV === 'development',
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
      extra: {
        max: 20, // Max connections in pool
        min: 5, // Min idle connections
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
    }),

    // Feature modules
    AuthModule,
    ScheduleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
