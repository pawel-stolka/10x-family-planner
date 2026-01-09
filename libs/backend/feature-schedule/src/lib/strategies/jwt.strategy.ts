import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * JWT Strategy
 * 
 * Passport strategy for validating JWT tokens from Supabase Auth.
 * Automatically extracts and validates Bearer tokens from Authorization header.
 * 
 * Configuration:
 * - Validates token signature using JWT_SECRET
 * - Checks issuer and audience for Supabase compatibility
 * - Automatically handles token expiration
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Reject expired tokens
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      issuer: process.env.JWT_ISSUER || 'https://supabase.io/auth',
      audience: process.env.JWT_AUDIENCE || process.env.SUPABASE_PROJECT_ID,
    });
  }

  /**
   * Validate JWT payload and transform to JwtPayload format
   * Called automatically by Passport after token verification
   * 
   * @param payload - Decoded JWT payload from Supabase
   * @returns JwtPayload object attached to request.user
   */
  async validate(payload: any): Promise<JwtPayload> {
    return {
      userId: payload.sub, // Supabase uses 'sub' claim for user ID
      email: payload.email,
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
