import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { UserEntity } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * Auth Module
 * 
 * Provides authentication functionality for the application.
 * 
 * Features:
 * - User registration with password hashing
 * - User login with JWT token generation
 * - User logout
 * - Integration with Passport.js JWT strategy
 * 
 * Dependencies:
 * - TypeORM for user entity persistence
 * - JWT for token generation and validation
 * - Passport.js for authentication strategies
 * - bcrypt for password hashing
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env['JWT_SECRET'] || 'your-secret-key-change-in-production',
      signOptions: {
        expiresIn: '1h',
        issuer: process.env['JWT_ISSUER'] || 'https://supabase.io/auth',
        audience: process.env['JWT_AUDIENCE'] || process.env['SUPABASE_PROJECT_ID'],
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtStrategy, JwtAuthGuard],
})
export class AuthModule {}
