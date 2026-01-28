import { runInInjectionContext, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError, firstValueFrom } from 'rxjs';
import { AuthStore } from './auth.store';
import { AuthService } from '../services/auth.service';
import { User, LoginCredentials, RegistrationData } from '../models/user.model';

describe('AuthStore', () => {
  let mockAuthService: {
    login: jest.Mock;
    register: jest.Mock;
    logout: jest.Mock;
    refreshToken: jest.Mock;
  };
  let mockRouter: jest.Mocked<Partial<Router>>;
  let mockInjector: Injector;

  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    createdAt: new Date('2024-01-01'),
  };

  const mockToken = 'test-jwt-token';

  const createAuthStore = (): AuthStore => {
    return runInInjectionContext(mockInjector, () => new AuthStore());
  };

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

    // Create a mock injector
    mockInjector = {
      get: jest.fn((token) => {
        if (token === AuthService) {
          return mockAuthService;
        }
        if (token === Router) {
          return mockRouter;
        }
        return null;
      }),
    } as unknown as Injector;
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with no user and token', () => {
      const authStore = createAuthStore();
      expect(authStore.user()).toBeNull();
      expect(authStore.token()).toBeNull();
      expect(authStore.isAuthenticated()).toBe(false);
    });

    it('should restore auth state from localStorage on initialization', () => {
      // Arrange
      const storedUser = {
        ...mockUser,
        createdAt: mockUser.createdAt.toISOString(),
      };
      localStorage.setItem('fp_user', JSON.stringify(storedUser));
      localStorage.setItem('fp_token', mockToken);

      // Act - create new instance
      const newStore = createAuthStore();

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
      const newStore = createAuthStore();

      // Assert
      expect(newStore.user()).toBeNull();
      expect(newStore.token()).toBeNull();
      expect(localStorage.getItem('fp_user')).toBeNull();
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const authStore = createAuthStore();
      const registrationData: RegistrationData = {
        email: mockUser.email,
        password: 'password123',
        displayName: mockUser.displayName ?? 'Test User',
      };
      const response = { user: mockUser, token: mockToken };
      mockAuthService.register?.mockReturnValue(of(response));

      // Act
      await firstValueFrom(authStore.register(registrationData));

      // Assert
      expect(authStore.user()).toEqual(mockUser);
      expect(authStore.token()).toBe(mockToken);
      expect(authStore.isAuthenticated()).toBe(true);
      expect(authStore.loading()).toBe(false);
      expect(authStore.error()).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/onboarding']);
      expect(localStorage.getItem('fp_token')).toBe(mockToken);
    });

    it('should handle registration errors', async () => {
      // Arrange
      const authStore = createAuthStore();
      const registrationData: RegistrationData = {
        email: mockUser.email,
        password: 'password123',
        displayName: mockUser.displayName ?? 'Test User',
      };
      const error = { status: 409, error: { message: 'Email already exists' } };
      mockAuthService.register?.mockReturnValue(throwError(() => error));

      // Act & Assert
      await expect(
        firstValueFrom(authStore.register(registrationData))
      ).rejects.toBeDefined();

      expect(authStore.user()).toBeNull();
      expect(authStore.token()).toBeNull();
      expect(authStore.loading()).toBe(false);
      expect(authStore.error()).toBe('Email already exists');
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      // Arrange
      const authStore = createAuthStore();
      const credentials: LoginCredentials = {
        email: mockUser.email,
        password: 'password123',
      };
      const response = { user: mockUser, token: mockToken };
      mockAuthService.login?.mockReturnValue(of(response));

      // Act
      await firstValueFrom(authStore.login(credentials));

      // Assert
      expect(authStore.user()).toEqual(mockUser);
      expect(authStore.token()).toBe(mockToken);
      expect(authStore.isAuthenticated()).toBe(true);
      expect(authStore.loading()).toBe(false);
      expect(authStore.error()).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(localStorage.getItem('fp_token')).toBe(mockToken);
    });

    it('should handle login errors', async () => {
      // Arrange
      const authStore = createAuthStore();
      const credentials: LoginCredentials = {
        email: mockUser.email,
        password: 'wrong-password',
      };
      const error = { status: 401 };
      mockAuthService.login?.mockReturnValue(throwError(() => error));

      // Act & Assert
      await expect(
        firstValueFrom(authStore.login(credentials))
      ).rejects.toBeDefined();

      expect(authStore.user()).toBeNull();
      expect(authStore.token()).toBeNull();
      expect(authStore.loading()).toBe(false);
      expect(authStore.error()).toBe('Invalid email or password');
    });
  });

  describe('logout', () => {
    it('should successfully logout a user', async () => {
      // Arrange
      const authStore = createAuthStore();
      localStorage.setItem('fp_token', mockToken);
      mockAuthService.logout?.mockReturnValue(of(void 0));

      // Act
      await firstValueFrom(authStore.logout());

      // Assert
      expect(authStore.user()).toBeNull();
      expect(authStore.token()).toBeNull();
      expect(authStore.isAuthenticated()).toBe(false);
      expect(authStore.loading()).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      expect(localStorage.getItem('fp_token')).toBeNull();
    });

    it('should clear local state even if logout API fails', async () => {
      // Arrange
      const authStore = createAuthStore();
      localStorage.setItem('fp_token', mockToken);
      const error = new Error('Network error');
      mockAuthService.logout?.mockReturnValue(throwError(() => error));

      // Act & Assert
      await expect(firstValueFrom(authStore.logout())).rejects.toBeDefined();

      expect(authStore.user()).toBeNull();
      expect(authStore.token()).toBeNull();
      expect(authStore.isAuthenticated()).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      expect(localStorage.getItem('fp_token')).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      // Arrange
      const authStore = createAuthStore();
      const newToken = 'new-jwt-token';
      const response = { token: newToken };
      mockAuthService.refreshToken?.mockReturnValue(of(response));

      // Act
      await firstValueFrom(authStore.refreshToken());

      // Assert
      expect(authStore.token()).toBe(newToken);
    });

    it('should logout user if token refresh fails', async () => {
      // Arrange
      const authStore = createAuthStore();
      localStorage.setItem('fp_token', mockToken);
      const error = new Error('Refresh failed');
      mockAuthService.refreshToken?.mockReturnValue(throwError(() => error));

      // Act & Assert
      await expect(
        firstValueFrom(authStore.refreshToken())
      ).rejects.toBeDefined();

      expect(authStore.user()).toBeNull();
      expect(authStore.token()).toBeNull();
      expect(authStore.isAuthenticated()).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      expect(localStorage.getItem('fp_token')).toBeNull();
    });
  });

  describe('clearAuthData', () => {
    it('should clear all auth data and localStorage', () => {
      // Arrange
      const authStore = createAuthStore();
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
      const authStore = createAuthStore();
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
    it('should clear error message', async () => {
      // Arrange
      const authStore = createAuthStore();
      const credentials: LoginCredentials = {
        email: mockUser.email,
        password: 'wrong-password',
      };
      const error = { status: 401 };
      mockAuthService.login?.mockReturnValue(throwError(() => error));

      // Trigger an error
      await expect(
        firstValueFrom(authStore.login(credentials))
      ).rejects.toBeDefined();

      // Verify error is set
      expect(authStore.error()).toBe('Invalid email or password');

      // Act
      authStore.clearError();

      // Assert
      expect(authStore.error()).toBeNull();
    });
  });

  describe('error message extraction', () => {
    it('should extract custom error message', async () => {
      // Arrange
      const authStore = createAuthStore();
      const credentials: LoginCredentials = {
        email: mockUser.email,
        password: 'password',
      };
      const error = { error: { message: 'Custom error message' } };
      mockAuthService.login?.mockReturnValue(throwError(() => error));

      // Act & Assert
      await expect(
        firstValueFrom(authStore.login(credentials))
      ).rejects.toBeDefined();

      expect(authStore.error()).toBe('Custom error message');
    });

    it('should handle 400 Bad Request errors', async () => {
      // Arrange
      const authStore = createAuthStore();
      const credentials: LoginCredentials = {
        email: 'invalid-email',
        password: 'password',
      };
      const error = { status: 400 };
      mockAuthService.login?.mockReturnValue(throwError(() => error));

      // Act & Assert
      await expect(
        firstValueFrom(authStore.login(credentials))
      ).rejects.toBeDefined();

      expect(authStore.error()).toBe('Invalid data provided');
    });

    it('should handle unknown errors with generic message', async () => {
      // Arrange
      const authStore = createAuthStore();
      const credentials: LoginCredentials = {
        email: mockUser.email,
        password: 'password',
      };
      const error = { status: 500 };
      mockAuthService.login?.mockReturnValue(throwError(() => error));

      // Act & Assert
      await expect(
        firstValueFrom(authStore.login(credentials))
      ).rejects.toBeDefined();

      expect(authStore.error()).toBe(
        'An unexpected error occurred. Please try again.'
      );
    });
  });

  describe('computed signals', () => {
    it('should update isAuthenticated when user and token are set', async () => {
      // Arrange
      const authStore = createAuthStore();
      expect(authStore.isAuthenticated()).toBe(false);

      // Act - simulate successful login
      const credentials: LoginCredentials = {
        email: mockUser.email,
        password: 'password123',
      };
      const response = { user: mockUser, token: mockToken };
      mockAuthService.login?.mockReturnValue(of(response));

      await firstValueFrom(authStore.login(credentials));

      // Assert
      expect(authStore.isAuthenticated()).toBe(true);
    });

    it('should update isAuthenticated to false after logout', async () => {
      // Arrange
      const authStore = createAuthStore();
      const credentials: LoginCredentials = {
        email: mockUser.email,
        password: 'password123',
      };
      const response = { user: mockUser, token: mockToken };
      mockAuthService.login?.mockReturnValue(of(response));

      await firstValueFrom(authStore.login(credentials));
      expect(authStore.isAuthenticated()).toBe(true);

      // Act
      mockAuthService.logout?.mockReturnValue(of(void 0));
      await firstValueFrom(authStore.logout());

      // Assert
      expect(authStore.isAuthenticated()).toBe(false);
    });
  });
});
