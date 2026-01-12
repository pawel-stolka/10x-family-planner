import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../entities/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto, UserDto } from '../dto/auth-response.dto';
import { JwtPayload } from '@family-planner/backend/feature-schedule';

/**
 * Auth Service
 *
 * Handles user authentication logic:
 * - User registration with password hashing
 * - User login with credential validation
 * - JWT token generation
 * - User logout (token invalidation handled client-side)
 *
 * Security features:
 * - bcrypt password hashing with salt rounds
 * - Email uniqueness validation
 * - Soft-delete support
 * - Failed login attempt logging
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Register a new user
   *
   * @param registerDto - User registration data
   * @returns JWT token and user information
   * @throws ConflictException if email already exists
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, displayName } = registerDto;

    // Check if email already exists (including soft-deleted)
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser && !existingUser.deletedAt) {
      throw new ConflictException('Email already exists');
    }

    if (existingUser && existingUser.deletedAt) {
      throw new ConflictException(
        'This email was previously registered. Please contact support.'
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user
    const user = this.userRepository.create({
      email,
      passwordHash,
      displayName: displayName || null,
      lastLoginAt: new Date(),
    });

    const savedUser = await this.userRepository.save(user);

    this.logger.log(`User registered successfully: ${savedUser.userId}`);

    // Generate JWT token
    const token = this.generateToken(savedUser);

    return {
      token,
      user: this.toUserDto(savedUser),
    };
  }

  /**
   * Login existing user
   *
   * @param loginDto - User login credentials
   * @returns JWT token and user information
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email (exclude soft-deleted)
    const user = await this.userRepository.findOne({
      where: {
        email,
        deletedAt: IsNull(),
      },
    });

    if (!user) {
      this.logger.warn(`Login attempt with non-existent email: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      this.logger.warn(`Failed login attempt for user: ${user.userId}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    this.logger.log(`User logged in successfully: ${user.userId}`);

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      token,
      user: this.toUserDto(user),
    };
  }

  /**
   * Logout user
   *
   * Note: Since we're using stateless JWT, logout is handled client-side
   * by removing the token. This method exists for future enhancements
   * like token blacklisting or refresh token revocation.
   *
   * @param userId - User ID from JWT payload
   */
  async logout(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        userId,
        deletedAt: IsNull(),
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`User logged out: ${userId}`);

    // Future: Add token blacklisting or refresh token revocation here
  }

  /**
   * Get user profile by ID
   *
   * @param userId - User UUID
   * @returns User information
   * @throws NotFoundException if user doesn't exist
   */
  async getUserById(userId: string): Promise<UserDto> {
    const user = await this.userRepository.findOne({
      where: {
        userId,
        deletedAt: IsNull(),
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toUserDto(user);
  }

  /**
   * Generate JWT token for user
   *
   * @param user - User entity
   * @returns Signed JWT token
   */
  private generateToken(user: UserEntity): string {
    const payload: JwtPayload = {
      userId: user.userId,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Convert UserEntity to UserDto
   *
   * @param user - User entity
   * @returns UserDto (without sensitive data)
   */
  private toUserDto(user: UserEntity): UserDto {
    return {
      id: user.userId,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
