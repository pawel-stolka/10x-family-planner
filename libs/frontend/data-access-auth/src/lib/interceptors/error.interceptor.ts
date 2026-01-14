import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../store/auth.store';
import { Router } from '@angular/router';

/**
 * Error Interceptor - Handles HTTP errors, especially 401 Unauthorized
 *
 * Functionality:
 * - Catches 401 errors (expired/invalid token)
 * - Attempts automatic token refresh
 * - Retries original request with new token
 * - Redirects to login if refresh fails
 *
 * Usage: Automatically applied to all HTTP requests via app.config.ts
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors (expired/invalid token)
      if (error.status === 401) {
        const isRefreshEndpoint = req.url.includes('/api/v1/auth/refresh');
        const isAuthEndpoint =
          req.url.includes('/api/v1/auth/login') ||
          req.url.includes('/api/v1/auth/register');

        // Don't attempt refresh for auth endpoints (avoid infinite loops)
        if (isAuthEndpoint || isRefreshEndpoint) {
          // Clear auth and redirect to login
          authStore.clearAuthData();
          router.navigate(['/login']);
          return throwError(() => error);
        }

        // Attempt token refresh for other endpoints
        console.log('🔄 Token expired, attempting refresh...');
        return authStore.refreshToken().pipe(
          switchMap(() => {
            // Retry original request with new token
            const newToken = authStore.token();
            console.log('✅ Token refreshed, retrying request');
            const clonedRequest = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });
            return next(clonedRequest);
          }),
          catchError((refreshError) => {
            // Refresh failed - redirect to login
            console.error('❌ Token refresh failed, redirecting to login');
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }

      // Pass through other errors unchanged
      return throwError(() => error);
    })
  );
};
