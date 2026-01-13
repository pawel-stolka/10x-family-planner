import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { User, LoginCredentials, RegistrationData } from '../models/user.model';

/**
 * AuthStore - manages authentication state using Angular Signals
 *
 * Responsibilities:
 * - User authentication state (user, token, isAuthenticated)
 * - Login/Logout/Register actions
 * - Token storage (localStorage for persistence across page refreshes)
 * - Token refresh mechanism
 *
 * Note: Token is stored in localStorage for development convenience.
 * For production, consider using httpOnly cookies for better security.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Signals for reactive state management
  private readonly userSignal = signal<User | null>(null);
  private readonly tokenSignal = signal<string | null>(null);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly user = this.userSignal.asReadonly();
  readonly token = this.tokenSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computed signal for authentication status
  readonly isAuthenticated = computed(() => {
    return this.userSignal() !== null && this.tokenSignal() !== null;
  });

  constructor() {
    // Initialize from storage on app start
    this.initializeFromStorage();
  }

  /**
   * Initialize auth state from localStorage
   * Loads both user data and JWT token from storage
   */
  private initializeFromStorage(): void {
    try {
      const storedUser = localStorage.getItem('fp_user');
      const storedToken = localStorage.getItem('fp_token');

      if (storedUser && storedToken) {
        const user = JSON.parse(storedUser) as User;
        // Convert createdAt string back to Date
        user.createdAt = new Date(user.createdAt);
        this.userSignal.set(user);
        this.tokenSignal.set(storedToken);
        console.log('✅ Restored auth from storage:', user.email);
      }
    } catch (error) {
      console.error('Failed to initialize auth from storage:', error);
      this.clearStorage();
    }
  }

  /**
   * Register new user
   */
  register(data: RegistrationData) {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.authService.register(data).pipe(
      tap((response) => {
        this.setAuthData(response.user, response.token);
        this.loadingSignal.set(false);
        // Auto-navigate to onboarding after successful registration
        this.router.navigate(['/onboarding']);
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * Login user
   */
  login(credentials: LoginCredentials) {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.authService.login(credentials).pipe(
      tap((response) => {
        this.setAuthData(response.user, response.token);
        this.loadingSignal.set(false);
        // Navigate to dashboard after successful login
        this.router.navigate(['/dashboard']);
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout user
   */
  logout() {
    this.loadingSignal.set(true);

    return this.authService.logout().pipe(
      tap(() => {
        this.clearAuthData();
        this.loadingSignal.set(false);
        this.router.navigate(['/login']);
      }),
      catchError((error) => {
        // Clear local state even if API call fails
        this.clearAuthData();
        this.loadingSignal.set(false);
        this.router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh JWT token
   */
  refreshToken() {
    return this.authService.refreshToken().pipe(
      tap((response) => {
        this.tokenSignal.set(response.token);
      }),
      catchError((error) => {
        // If refresh fails, logout user
        this.clearAuthData();
        this.router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  /**
   * Set authentication data (user + token)
   */
  private setAuthData(user: User, token: string): void {
    this.userSignal.set(user);
    this.tokenSignal.set(token);

    // Store user data and token in localStorage
    // Note: For production, consider using httpOnly cookies instead
    try {
      localStorage.setItem('fp_user', JSON.stringify(user));
      localStorage.setItem('fp_token', token);
    } catch (error) {
      console.error('Failed to store auth data:', error);
    }
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    this.userSignal.set(null);
    this.tokenSignal.set(null);
    this.errorSignal.set(null);
    this.clearStorage();
  }

  /**
   * Clear localStorage
   */
  private clearStorage(): void {
    try {
      localStorage.removeItem('fp_user');
      localStorage.removeItem('fp_token');
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  /**
   * Extract user-friendly error message from HTTP error
   */
  private extractErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.status === 401) {
      return 'Invalid email or password';
    }
    if (error?.status === 400) {
      return 'Invalid data provided';
    }
    if (error?.status === 409) {
      return 'Email already exists';
    }
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
}
