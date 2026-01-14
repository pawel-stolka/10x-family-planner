import { HttpRequest, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { signal, runInInjectionContext, Injector } from '@angular/core';
import { of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from '../store/auth.store';

describe('authInterceptor', () => {
  let mockAuthStore: Partial<AuthStore>;
  let mockNext: HttpHandlerFn;
  let tokenSignal = signal<string | null>(null);
  let mockInjector: Injector;

  beforeEach(() => {
    tokenSignal = signal<string | null>(null);

    mockAuthStore = {
      token: tokenSignal.asReadonly(),
    };

    mockNext = jest.fn(() => of(new HttpResponse({ status: 200 })));

    // Create a simple mock injector
    mockInjector = {
      get: jest.fn((token) => {
        if (token === AuthStore) {
          return mockAuthStore;
        }
        return null;
      }),
    } as unknown as Injector;
  });

  it('should add Authorization header when token exists and not auth endpoint', () => {
    // Arrange
    tokenSignal.set('test-token-123');
    const request = new HttpRequest('GET', '/api/v1/schedule-generator');

    // Act
    runInInjectionContext(mockInjector, () => {
      authInterceptor(request, mockNext);
    });

    // Assert
    const calledRequest = (mockNext as jest.Mock).mock.calls[0][0];
    expect(calledRequest.headers.get('Authorization')).toBe(
      'Bearer test-token-123'
    );
  });

  it('should not add Authorization header when no token exists', () => {
    // Arrange
    tokenSignal.set(null);
    const request = new HttpRequest('GET', '/api/v1/schedule-generator');

    // Act
    runInInjectionContext(mockInjector, () => {
      authInterceptor(request, mockNext);
    });

    // Assert
    expect(mockNext).toHaveBeenCalledWith(request);
  });

  it('should not add Authorization header for login endpoint', () => {
    // Arrange
    tokenSignal.set('test-token-123');
    const request = new HttpRequest('POST', '/api/v1/auth/login', null);

    // Act
    runInInjectionContext(mockInjector, () => {
      authInterceptor(request, mockNext);
    });

    // Assert
    expect(mockNext).toHaveBeenCalledWith(request);
  });

  it('should not add Authorization header for register endpoint', () => {
    // Arrange
    tokenSignal.set('test-token-123');
    const request = new HttpRequest('POST', '/api/v1/auth/register', null);

    // Act
    runInInjectionContext(mockInjector, () => {
      authInterceptor(request, mockNext);
    });

    // Assert
    expect(mockNext).toHaveBeenCalledWith(request);
  });
});
