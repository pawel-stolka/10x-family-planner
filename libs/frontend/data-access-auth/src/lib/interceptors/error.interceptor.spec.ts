import {
  HttpRequest,
  HttpHandlerFn,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { signal, runInInjectionContext, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError, firstValueFrom } from 'rxjs';
import { errorInterceptor } from './error.interceptor';
import { AuthStore } from '../store/auth.store';

describe('errorInterceptor', () => {
  let mockAuthStore: Partial<AuthStore>;
  let mockRouter: Partial<Router>;
  let mockNext: HttpHandlerFn;
  let tokenSignal = signal<string | null>(null);
  let mockInjector: Injector;
  let refreshTokenSpy: jest.Mock;

  beforeEach(() => {
    tokenSignal = signal<string | null>('old-token');
    refreshTokenSpy = jest.fn(() => {
      tokenSignal.set('new-token');
      return of({ token: 'new-token' });
    });

    mockAuthStore = {
      token: tokenSignal.asReadonly(),
      refreshToken: refreshTokenSpy,
      clearAuthData: jest.fn(),
    };

    mockRouter = {
      navigate: jest.fn(),
    };

    mockNext = jest.fn(() => of(new HttpResponse({ status: 200 })));

    // Create a mock injector
    mockInjector = {
      get: jest.fn((token) => {
        if (token === AuthStore) {
          return mockAuthStore;
        }
        if (token === Router) {
          return mockRouter;
        }
        return null;
      }),
    } as unknown as Injector;
  });

  it('should pass through successful responses without modification', async () => {
    // Arrange
    const request = new HttpRequest('GET', '/api/v1/schedule-generator');
    mockNext = jest.fn(() =>
      of(new HttpResponse({ status: 200, body: { data: 'test' } }))
    );

    // Act
    const response = await runInInjectionContext(mockInjector, async () => {
      const result$ = errorInterceptor(request, mockNext);
      return firstValueFrom(result$);
    });

    // Assert
    expect(response).toBeInstanceOf(HttpResponse);
    expect((response as HttpResponse<any>).body).toEqual({
      data: 'test',
    });
    expect(refreshTokenSpy).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should pass through non-401 errors without modification', async () => {
    // Arrange
    const request = new HttpRequest('GET', '/api/v1/schedule-generator');
    const error404 = new HttpErrorResponse({
      status: 404,
      statusText: 'Not Found',
      url: request.url,
    });
    mockNext = jest.fn(() => throwError(() => error404));

    // Act & Assert
    await expect(
      runInInjectionContext(mockInjector, async () => {
        const result$ = errorInterceptor(request, mockNext);
        return firstValueFrom(result$);
      })
    ).rejects.toBe(error404);

    expect(refreshTokenSpy).not.toHaveBeenCalled();
  });

  it('should attempt token refresh on 401 error for regular endpoints', async () => {
    // Arrange
    const request = new HttpRequest('GET', '/api/v1/schedule-generator');
    const error401 = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: request.url,
    });

    let callCount = 0;
    mockNext = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return throwError(() => error401);
      }
      // Return success on retry
      return of(new HttpResponse({ status: 200, body: { data: 'success' } }));
    });

    // Act
    const response = await runInInjectionContext(mockInjector, async () => {
      const result$ = errorInterceptor(request, mockNext);
      return firstValueFrom(result$);
    });

    // Assert
    expect(response).toBeInstanceOf(HttpResponse);
    expect((response as HttpResponse<any>).body).toEqual({
      data: 'success',
    });
    expect(refreshTokenSpy).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(2); // Original + retry

    // Check that retry request has new token
    const retryRequest = (mockNext as jest.Mock).mock.calls[1][0];
    expect(retryRequest.headers.get('Authorization')).toBe('Bearer new-token');
  });

  it('should redirect to login on 401 for auth endpoints', async () => {
    // Arrange
    const request = new HttpRequest('POST', '/api/v1/auth/login', null);
    const error401 = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: request.url,
    });
    mockNext = jest.fn(() => throwError(() => error401));

    // Act & Assert
    await expect(
      runInInjectionContext(mockInjector, async () => {
        const result$ = errorInterceptor(request, mockNext);
        return firstValueFrom(result$);
      })
    ).rejects.toBe(error401);

    expect(refreshTokenSpy).not.toHaveBeenCalled();
    expect(mockAuthStore.clearAuthData).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to login on 401 for refresh endpoint', async () => {
    // Arrange
    const request = new HttpRequest('POST', '/api/v1/auth/refresh', null);
    const error401 = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: request.url,
    });
    mockNext = jest.fn(() => throwError(() => error401));

    // Act & Assert
    await expect(
      runInInjectionContext(mockInjector, async () => {
        const result$ = errorInterceptor(request, mockNext);
        return firstValueFrom(result$);
      })
    ).rejects.toBe(error401);

    expect(refreshTokenSpy).not.toHaveBeenCalled();
    expect(mockAuthStore.clearAuthData).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to login if token refresh fails', async () => {
    // Arrange
    const request = new HttpRequest('GET', '/api/v1/schedule-generator');
    const error401 = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: request.url,
    });
    mockNext = jest.fn(() => throwError(() => error401));

    const refreshError = new Error('Refresh failed');
    refreshTokenSpy = jest.fn(() => throwError(() => refreshError));
    mockAuthStore.refreshToken = refreshTokenSpy;

    // Act & Assert
    await expect(
      runInInjectionContext(mockInjector, async () => {
        const result$ = errorInterceptor(request, mockNext);
        return firstValueFrom(result$);
      })
    ).rejects.toBe(refreshError);

    expect(refreshTokenSpy).toHaveBeenCalledTimes(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should not add Authorization header to register endpoint on 401', async () => {
    // Arrange
    const request = new HttpRequest('POST', '/api/v1/auth/register', null);
    const error401 = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: request.url,
    });
    mockNext = jest.fn(() => throwError(() => error401));

    // Act & Assert
    await expect(
      runInInjectionContext(mockInjector, async () => {
        const result$ = errorInterceptor(request, mockNext);
        return firstValueFrom(result$);
      })
    ).rejects.toMatchObject({ status: 401 });

    expect(refreshTokenSpy).not.toHaveBeenCalled();
    expect(mockAuthStore.clearAuthData).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle multiple 401 errors gracefully', async () => {
    // Arrange
    const request1 = new HttpRequest('GET', '/api/v1/endpoint1');
    const request2 = new HttpRequest('GET', '/api/v1/endpoint2');
    const error401 = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
    });

    let callCount = 0;
    mockNext = jest.fn(() => {
      callCount++;
      if (callCount <= 2) {
        return throwError(() => error401);
      }
      return of(new HttpResponse({ status: 200 }));
    });

    // Act - simulate two concurrent requests
    await runInInjectionContext(mockInjector, async () => {
      const result1$ = errorInterceptor(request1, mockNext);
      const result2$ = errorInterceptor(request2, mockNext);

      await Promise.all([firstValueFrom(result1$), firstValueFrom(result2$)]);
    });

    // Assert - Both requests should trigger refresh
    expect(refreshTokenSpy).toHaveBeenCalledTimes(2);
  });
});
