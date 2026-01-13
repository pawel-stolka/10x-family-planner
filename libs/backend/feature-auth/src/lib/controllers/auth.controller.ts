import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

/**
 * Auth Controller
 *
 * Handles authentication endpoints:
 * - POST /v1/auth/register - Create new account
 * - POST /v1/auth/login - Authenticate user
 * - POST /v1/auth/logout - Invalidate session
 *
 * Note: All endpoints under /auth/** do NOT require JWT
 * except for logout which needs authentication.
 */
@Controller('v1/auth')
@ApiTags('Authentication')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user account
   *
   * Creates a new user with email/password and returns JWT token.
   * Automatically creates a family member record with role=USER.
   *
   * @param registerDto - Registration data
   * @returns JWT token and user information
   */
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Create a new account with email and password. Returns JWT token and user info.',
  })
  @ApiResponse({
    status: 200,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (validation error)',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log(`Registration attempt for email: ${registerDto.email}`);
    return this.authService.register(registerDto);
  }

  /**
   * Login existing user
   *
   * Authenticates user with email/password and returns JWT token.
   *
   * @param loginDto - Login credentials
   * @returns JWT token and user information
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticate with email and password. Returns JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);
    return this.authService.login(loginDto);
  }

  /**
   * Logout current user
   *
   * Invalidates the current session. With stateless JWT,
   * this is primarily handled client-side by removing the token.
   * This endpoint exists for logging and future token blacklisting.
   *
   * @param user - Current authenticated user from JWT
   * @returns 204 No Content
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout user',
    description: 'Invalidate current session. Client should remove JWT token.',
  })
  @ApiResponse({
    status: 204,
    description: 'User logged out successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT',
  })
  async logout(@CurrentUser() user: JwtPayload): Promise<void> {
    this.logger.log(`Logout for user: ${user.userId}`);
    await this.authService.logout(user.userId);
  }
}
