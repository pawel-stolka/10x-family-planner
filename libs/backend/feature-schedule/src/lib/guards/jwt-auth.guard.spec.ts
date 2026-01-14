import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    // Save original NODE_ENV
    originalEnv = process.env.NODE_ENV;

    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  afterEach(() => {
    // Restore original NODE_ENV
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('handleRequest - production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should return user when authentication succeeds', () => {
      // Arrange
      const mockUser = {
        userId: 'test-user-id',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      // Act
      const result = guard.handleRequest(null, mockUser, null, mockExecutionContext);

      // Assert
      expect(result).toBe(mockUser);
    });

    it('should throw UnauthorizedException when no user is provided', () => {
      // Arrange
      const info = { message: 'No auth token' };

      // Act & Assert
      expect(() => {
        guard.handleRequest(null, null, info, mockExecutionContext);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is expired', () => {
      // Arrange
      mockRequest.headers.authorization = 'Bearer expired-token';
      const info = { message: 'jwt expired' };

      // Act & Assert
      expect(() => {
        guard.handleRequest(null, null, info, mockExecutionContext);
      }).toThrow(UnauthorizedException);
      expect(() => {
        guard.handleRequest(null, null, info, mockExecutionContext);
      }).toThrow('Invalid or expired token');
    });

    it('should throw UnauthorizedException when error occurs', () => {
      // Arrange
      const error = new Error('Token validation failed');

      // Act & Assert
      expect(() => {
        guard.handleRequest(error, null, null, mockExecutionContext);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token signature is invalid', () => {
      // Arrange
      mockRequest.headers.authorization = 'Bearer invalid-signature-token';
      const info = { message: 'invalid signature' };

      // Act & Assert
      expect(() => {
        guard.handleRequest(null, null, info, mockExecutionContext);
      }).toThrow(UnauthorizedException);
    });
  });

  describe('handleRequest - development mode (no auth header)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should return mock user when no auth header is present in development', () => {
      // Arrange
      mockRequest.headers = {}; // No authorization header

      // Act
      const result = guard.handleRequest(null, null, null, mockExecutionContext);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe('00000000-0000-0000-0000-000000000000');
      expect(result.email).toBe('dev-user@localhost');
    });

    it('should return mock user with valid timestamps in development', () => {
      // Arrange
      mockRequest.headers = {}; // No authorization header
      const beforeTime = Math.floor(Date.now() / 1000);

      // Act
      const result = guard.handleRequest(null, null, null, mockExecutionContext);

      // Assert
      const afterTime = Math.floor(Date.now() / 1000);
      expect(result.iat).toBeGreaterThanOrEqual(beforeTime);
      expect(result.iat).toBeLessThanOrEqual(afterTime);
      expect(result.exp).toBe(result.iat + 3600);
    });
  });

  describe('handleRequest - development mode (with expired token)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should throw UnauthorizedException when expired token is present in development', () => {
      // Arrange
      mockRequest.headers.authorization = 'Bearer expired-token';
      const info = { message: 'jwt expired' };

      // Act & Assert
      expect(() => {
        guard.handleRequest(null, null, info, mockExecutionContext);
      }).toThrow(UnauthorizedException);
      expect(() => {
        guard.handleRequest(null, null, info, mockExecutionContext);
      }).toThrow('Invalid or expired token');
    });

    it('should throw UnauthorizedException when invalid token is present in development', () => {
      // Arrange
      mockRequest.headers.authorization = 'Bearer invalid-token';
      const info = { message: 'invalid signature' };

      // Act & Assert
      expect(() => {
        guard.handleRequest(null, null, info, mockExecutionContext);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when malformed token is present in development', () => {
      // Arrange
      mockRequest.headers.authorization = 'Bearer malformed';
      const error = new Error('jwt malformed');

      // Act & Assert
      expect(() => {
        guard.handleRequest(error, null, null, mockExecutionContext);
      }).toThrow(UnauthorizedException);
    });
  });

  describe('handleRequest - development mode (with valid token)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should return user when valid token is provided in development', () => {
      // Arrange
      mockRequest.headers.authorization = 'Bearer valid-token';
      const mockUser = {
        userId: 'real-user-id',
        email: 'real@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      // Act
      const result = guard.handleRequest(null, mockUser, null, mockExecutionContext);

      // Assert
      expect(result).toBe(mockUser);
      expect(result.userId).toBe('real-user-id');
      expect(result.email).toBe('real@example.com');
    });
  });

  describe('error message handling', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should use info.message when available', () => {
      // Arrange
      const info = { message: 'Custom info message' };

      // Act & Assert
      expect(() => {
        guard.handleRequest(null, null, info, mockExecutionContext);
      }).toThrow('Invalid or expired token');
    });

    it('should use err.message when info.message is not available', () => {
      // Arrange
      const error = new Error('Custom error message');

      // Act & Assert
      expect(() => {
        guard.handleRequest(error, null, null, mockExecutionContext);
      }).toThrow('Invalid or expired token');
    });

    it('should use default message when neither info nor err message is available', () => {
      // Act & Assert
      expect(() => {
        guard.handleRequest(null, null, null, mockExecutionContext);
      }).toThrow('Invalid or expired token');
    });
  });

  describe('IP address logging', () => {
    it('should include IP address in error context', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      mockRequest.ip = '192.168.1.100';
      const loggerWarnSpy = jest.spyOn(guard['logger'], 'warn');

      // Act
      try {
        guard.handleRequest(null, null, null, mockExecutionContext);
      } catch (e) {
        // Expected to throw
      }

      // Assert
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('192.168.1.100')
      );
    });

    it('should log authentication success with user details', () => {
      // Arrange
      const mockUser = {
        userId: 'test-user-id',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const loggerLogSpy = jest.spyOn(guard['logger'], 'log');

      // Act
      guard.handleRequest(null, mockUser, null, mockExecutionContext);

      // Assert
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-user-id')
      );
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('test@example.com')
      );
    });
  });

  describe('canActivate', () => {
    it('should call super.canActivate', () => {
      // Arrange
      const superCanActivateSpy = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockReturnValue(true);

      // Act
      guard.canActivate(mockExecutionContext);

      // Assert
      expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);
    });
  });
});
