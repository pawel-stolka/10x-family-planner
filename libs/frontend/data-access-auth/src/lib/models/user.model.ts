/**
 * User model representing authenticated user data
 */
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: Date;
}

/**
 * Authentication response from API
 */
export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegistrationData {
  email: string;
  password: string;
  displayName?: string;
}
