/**
 * JWT Payload Interface
 * 
 * Structure of the JWT token payload used for authentication.
 * Contains user information extracted from the token.
 * 
 * This interface is shared between auth and other backend modules.
 */
export interface JwtPayload {
  /**
   * User ID from the database (UUID)
   * Corresponds to the 'sub' claim in the JWT
   */
  userId: string;

  /**
   * User's email address
   */
  email: string;

  /**
   * Issued at timestamp (seconds since epoch)
   */
  iat: number;

  /**
   * Expiration timestamp (seconds since epoch)
   */
  exp: number;
}
