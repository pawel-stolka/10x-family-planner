import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * CurrentUser Decorator
 * 
 * Custom parameter decorator to extract authenticated user from request.
 * Extracts JwtPayload object attached by JwtAuthGuard after successful authentication.
 * 
 * Usage:
 * ```typescript
 * @Get()
 * @UseGuards(JwtAuthGuard)
 * async getSchedule(@CurrentUser() user: JwtPayload) {
 *   console.log(user.userId); // Access user ID directly
 * }
 * ```
 * 
 * @returns JwtPayload object with userId, email, iat, exp
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
