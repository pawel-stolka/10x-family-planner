import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthStore } from './auth.store';
import { AuthService } from '../services/auth.service';
import { User, LoginCredentials, RegistrationData } from '../models/user.model';

describe('AuthStore', () => {
  let authStore: AuthStore;
  let mockAuthService: jest.Mocked<Partial<AuthService>>;
  let mockRouter: jest.Mocked<Partial<Router>>;

  const mockUser: User = {
    userId: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    hasCompletedOnboarding: false,
    createdAt: new Date('2024-01-01'),
  };

  const mockToken = 'test-jwt-token';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    mockAuthService = {
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
    };

    mockRouter = {
      navigate: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    authStore = TestBed.inject(AuthStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with no user and token', () => {
      expect(authStore.user()).toBeNull();
      expect(authStore.token()).toBeNull();
      expect(authStore.isAuthenticated()).toBe(false);
    });

    it('should restore auth state from localStorage on initialization', () => {
      // Arrange
      const storedUser = { ...mockUser, createdAt: mockUser.createdAt.toISOString() };
      localStorage.setItem('fp_user', JSON.stringify(storedUser));
      localStorage.setItem('fp_token', mockToken);

      // Act - create new instance
      const newStore = TestBed.inject(AuthStore);

      // Assert
      expect(newStore.user()).toEqual(mockUser);
      expect(newStore.token()).toBe(mockToken);
      expect(newStore.isAuthenticated()).toBe(true);
    });

    it('should handle corrupt localStorage data gracefully', () => {
      // Arrange
      localStorage.setItem('fp_user', 'invalid-json');
      localStorage.setItem('fp_token', mockToken);

      // Act - create new instance
      const newStore = TestBed.inject(AuthStore);

      // Assert
      expect(newStore.user()).toBeNull();
      expect(newStore.token()).toBeNull();
      expect(localStorage.getItem('fp_user')).toBeNull();
    });
  });

  describe('register', () => {
    it('should successfully register a new user', (done) => {
      // Arrange
      const registrationData: RegistrationData = {
        email: mockUser.email,
        password: 'password123',
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      };
      const response = { user: mockUser, token: mockToken };
      mockAuthService.register?.mockReturnValue(of(response));

      // Act
      authStore.register(registrationData).subscribe({
        next: () => {
          // Assert
          expect(authStore.user()).toEqual(mockUser);
          expect(authStore.token()).toBe(mockToken);
          expect(authStore.isAuthenticated()).toBe(true);
          expect(authStore.loading()).toBe(false);
          expect(authStore.error()).toBeNull();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/onboarding']);
          expect(localStorage.getItem('fp_token')).toBe(mockToken);
          done();
        },
        error: () => done.fail('should not error'),
      });
    });

    it('should handle registration errors', (done) => {
      // Arrange
      const registrationData: RegistrationData = {
        email: mockUser.email,
        password: 'password123',
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      };
      const error = { status: 409, error: { message: 'Email already exists' } };
      mockAuthService.register?.mockReturnValue(throwError(() => error));

      // Act
      authStore.register(registrationData).subscribe({
        next: () => done.fail('should error'),
        error: () => {
          // Assert
          expect(authStore.user()).toBeNull();
          expect(authStore.token()).toBeNull();
          expect(authStore.loading()).toBe(false);
          expect(authStore.error()).toBe('Email already exists');
          done();
        },
      });
    });
  });

  describe('login', () => {
    it('should successfully login a user', (done) => {
      // Arrange
      const credentials: LoginCredentials = {
        email: mockUser.email,
        password: 'password123',
      };
      const response = { user: mockUser, token: mockToken };
      mockAuthService.login?.mockReturnValue(of(response));

      // Act
      authStore.login(credentials).subscribe({
        next: () => {
          // Assert
          expect(authStore.user()).toEqual(mockUser);
          expect(authStore.token()).toBe(mockToken);
          expect(authStore.isAuthenticated()).toBe(true);
          expect(authStore.loading()).toBe(false);
          expect(authStore.error()).toBeNull();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
          expect(localStorage.getItem('fp_token')).toBe(mockToken);
          done();
        },
        error: () => done.fail('should not error'),
      });
    });

    it('should handle login errors', (done) => {
      // Arrange
      const credentials: LoginCredentials = {
        email: mockUser.email,
        password: 'wrong-password',
      };
      const error = { status: 401 };
      mockAuthService.login?.mockReturnValue(throwError(() => error));

      // Act
      authStore.login(credentials).subscribe({
        next: () => done.fail('should error'),
        error: () => {
          // Assert
          expect(authStore.user()).toBeNull();
          expect(authStore.token()).toBeNull();
          expect(authStore.loading()).toBe(false);
          expect(authStore.error()).toBe('Invalid email or password');
          done();
        },
      });
    });
  });

  describe('logout', () => {
    it('should successfully logout a user', (done) => {
      // Arrange
      localStorage.setItem('fp_token', mockToken);
      mockAuthService.logout?.mockReturnValue(of(void 0));

      // Act
      authStore.logout().subscribe({
        next: () => {
          // Assert
          expect(authStore.user()).toBeNull();
          expect(authStore.token()).toBeNull();
          expect(authStore.isAuthenticated()).toBe(false);
          expect(authStore.loading()).toBe(false);
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
          expect(localStorage.getItem('fp_token')).toBeNull();
          done();
        },
        error: () => done.fail('should not error'),
      });
    });

    it('should clear local state even if logout API fails', (done) => {
      // Arrange
      localStorage.setItem('fp_token', mockToken);
      const error = new Error('Network error');
      mockAuthService.logout?.mockReturnValue(throwError(() => error));

      // Act
      authStore.logout().subscribe({
        next: () => done.fail('should error'),
        error: () => {
          // Assert
          expect(authStore.user()).toBeNull();
          expect(authStore.token()).toBeNull();
          expect(authStore.isAuthenticated()).toBe(false);
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
          expect(localStorage.getItem('fp_token')).toBeNull();
          done();
        },
      });
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', (done) => {
      // Arrange
      const newToken = 'new-jwt-token';
      const response = { token: newToken };
      mockAuthService.refreshToken?.mockReturnValue(of(response));

      // Act
      authStore.refreshToken().subscribe({
        next: () => {
          // Assert
          expect(authStore.token()).toBe(newToken);
          done();
        },
        error: () => done.fail('should not error'),
      });
    });

    it('should logout user if token refresh fails', (done) => {
      // Arrange
      localStorage.setItem('fp_token', mockToken);
      const error = new Error('Refresh failed');
      mockAuthService.refreshToken?.mockReturnValue(throwError(() => error));

      // Act
      authStore.refreshToken().subscribe({
        next: () => done.fail('should error'),
        error: () => {
          // Assert
          expect(authStore.user()).toBeNull();
          expect(authStore.token()).toBeNull();
          expect(authStore.isAuthenticated()).toBe(false);
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
          expect(localStorage.getItem('fp_token')).toBeNull();
          done();
        },
      });
    });
  });

  describe('clearAuthData', () => {
    it('should clear all auth data and localStorage', () => {
      // Arrange - set up authenticated state
      localStorage.setItem('fp_user', JSON.stringify(mockUser));
      localStorage.setItem('fp_token', mockToken);

      // Act
      authStore.clearAuthData();

      // Assert
      expect(authStore.user()).toBeNull();
      expect(authStore.token()).toBeNull();
      expect(authStore.error()).toBeNull();
      expect(authStore.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('fp_user')).toBeNull();
      expect(localStorage.getItem('fp_token')).toBeNull();
    });

    it('should be safe to call multiple times', () => {
      // Arrange
      localStorage.setItem('fp_token', mockToken);

      // Act
      authStore.clearAuthData();
      authStore.clearAuthData();
      authStore.clearAuthData();

      // Assert
      expect(authStore.user()).toBeNull();
      expect(authStore.token()).toBeNull();
      expect(localStorage.getItem('fp_token')).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error message', (done) => {
      // Arrange - trigger an error
      const credentials: LoginCredentials = {
        email: mockUser.email,
        password: 'wrong-password',
      };
      const error = { status: 401 };
      mockAuthService.login?.mockReturnValue(throwError(() => error));

      authStore.login(credentials).subscribe({
        error: () => {
          // Verify error is set
          expect(authStore.error()).toBe('Invalid email or password');

          // Act
          authStore.clearError();

          // Assert
          expect(authStore.error()).toBeNull();
          done();
        },
      });
    });
  });

  describe('error message extraction', () => {
    it('should extract custom error message', (done) => {
      // Arrange
      const credentials: LoginCredentials = {
        email: mockUser.email,
        password: 'password',
      };
      const error = { error: { message: 'Custom error message' } };
      mockAuthService.login?.mockReturnValue(throwError(() => error));

      // Act
      authStore.login(credentials).subscribe({
        error: () => {
          // Assert
          expect(authStore.error()).toBe('Custom error message');
          done();
        },
      });
    });

    it('should handle 400 Bad Request errors', (done) => {
      // Arrange
      const credentials: LoginCredentials = {
        email: 'invalid-email',
        password: 'password',
      };
      const error = { status: 400 };
      mockAuthService.login?.mockReturnValue(throwError(() => error));

      // Act
      authStore.login(credentials).subscribe({
        error: () => {
          // Assert
          expect(authStore.error()).toBe('Invalid data provided');
          done();
        },
      });
    });

    it('should handle unknown errors with generic message', (done) => {
      // Arrange
      const credentials: LoginCredentials = {
        email: mockUser.email,
        password: 'password',
      };
      const error = { status: 500 };
      mockAuthService.login?.mockReturnValue(throwError(() => error));

      // Act
      authStore.login(credentials).subscribe({
        error: () => {
          // Assert
          expect(authStore.error()).toBe('An unexpected error occurred. Please try again.');
          done();
        },
      });
    });
  });

  describe('computed signals', () => {
    it('should update isAuthenticated when user and token are set', () => {
      // Arrange - initially not authenticated
      expect(authStore.isAuthenticated()).toBe(false);

      // Act - simulate successful login
      const credentials: LoginCredentials = {
        email: mockUser.email,
        password: 'password123',
      };
      const response = { user: mockUser, token: mockToken };
      mockAuthService.login?.mockReturnValue(of(response));

      authStore.login(credentials).subscribe();

      // Assert
      expect(authStore.isAuthenticated()).toBe(true);
    });

    it('should update isAuthenticated to false after logout', (done) => {
      // Arrange - set up authenticated state
      const credentials: LoginCredentials = {
        email: mockUser.email,
        password: 'password123',
      };
      const response = { user: mockUser, token: mockToken };
      mockAuthService.login?.mockReturnValue(of(response));

      authStore.login(credentials).subscribe(() => {
        expect(authStore.isAuthenticated()).toBe(true);

        // Act
        mockAuthService.logout?.mockReturnValue(of(void 0));
        authStore.logout().subscribe({
          next: () => {
            // Assert
            expect(authStore.isAuthenticated()).toBe(false);
            done();
          },
        });
      });
    });
  });
});
