import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * JWT Strategy
 * 
 * Passport strategy for validating JWT tokens.
 * Automatically extracts and validates Bearer tokens from Authorization header.
 * 
 * Configuration:
 * - Validates token signature using JWT_SECRET
 * - Checks issuer and audience match token generation config
 * - Automatically handles token expiration
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Reject expired tokens
      secretOrKey: process.env['JWT_SECRET'] || 'your-secret-key-change-in-production',
      issuer: process.env['JWT_ISSUER'] || 'family-planner-api',
      audience: process.env['JWT_AUDIENCE'] || 'family-planner-users',
    });
  }

  /**
   * Validate JWT payload and transform to JwtPayload format
   * Called automatically by Passport after token verification
   * 
   * @param payload - Decoded JWT payload
   * @returns JwtPayload object attached to request.user
   */
  async validate(payload: any): Promise<JwtPayload> {
    console.log('✅ JWT Token validated successfully:', {
      userId: payload.userId,
      email: payload.email,
      iat: new Date(payload.iat * 1000).toISOString(),
      exp: new Date(payload.exp * 1000).toISOString(),
    });
    
    return {
      userId: payload.userId, // Extract userId from our custom payload
      email: payload.email,
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
