import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Auth Guard
 *
 * NestJS guard that validates JWT tokens using Passport JWT strategy.
 * Automatically checks:
 * - Token presence in Authorization header
 * - Token signature validity
 * - Token expiration
 * - Issuer and audience (if configured)
 *
 * Usage: @UseGuards(JwtAuthGuard) on controllers or routes
 *
 * On success: Attaches decoded user (JwtPayload) to request.user
 * On failure: Throws UnauthorizedException (401)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  /**
   * Check if user can activate/access the route
   * Delegates to Passport JWT strategy
   */
  override canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  /**
   * Handle authentication result
   * Called after Passport strategy validation
   *
   * @param err - Error from strategy (if any)
   * @param user - Decoded user payload from JWT
   * @param info - Additional info about auth failure
   * @param context - Execution context
   * @returns User object to attach to request
   * @throws UnauthorizedException on auth failure (production only)
   */
  override handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext
  ) {
    const request = context.switchToHttp().getRequest();
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const hasAuthHeader = !!request.headers?.authorization;

    if (err || !user) {
      const message =
        info?.message || err?.message || 'Invalid or expired token';

      // In development mode, allow requests without valid JWT for testing
      if (isDevelopment) {
        this.logger.warn(
          `⚠️  Authentication bypassed in development mode for ${request.ip}: ${message} ` +
            `(Authorization header ${hasAuthHeader ? 'present' : 'missing'})`
        );

        // Return mock user for development mode
        const mockUser = {
          userId: '00000000-0000-0000-0000-000000000000',
          email: 'dev-user@localhost',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        };

        this.logger.warn(`🔧 Using mock user: ${mockUser.userId}`);
        return mockUser;
      }

      // In production, enforce strict authentication
      this.logger.warn(`Authentication failed for ${request.ip}: ${message}`);

      throw new UnauthorizedException('Invalid or expired token');
    }

    this.logger.log(`✅ User authenticated: ${user.userId} (${user.email})`);
    return user;
  }
}
