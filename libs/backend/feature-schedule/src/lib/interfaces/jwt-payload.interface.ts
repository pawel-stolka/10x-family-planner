/**
 * JWT Payload Interface
 * 
 * Represents the decoded JWT token payload from Supabase Auth.
 * Used throughout the application to identify and authorize users.
 * 
 * Supabase JWT Claims:
 * - sub: User ID (UUID)
 * - email: User's email address
 * - iat: Issued at timestamp
 * - exp: Expiration timestamp
 */
export interface JwtPayload {
  /** User ID from Supabase Auth (sub claim) */
  userId: string;

  /** User's email address */
  email: string;

  /** Issued at timestamp (Unix time) */
  iat: number;

  /** Expiration timestamp (Unix time) */
  exp: number;
}
