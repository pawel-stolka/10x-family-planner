import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '../store/auth.store';

/**
 * Auth Interceptor - Adds JWT token to outgoing HTTP requests
 *
 * Functionality:
 * - Retrieves token from AuthStore
 * - Adds Authorization header with Bearer token
 * - Skips auth endpoints (login, register) to avoid circular requests
 *
 * Usage: Automatically applied to all HTTP requests via app.config.ts
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const token = authStore.token();

  // Skip adding token for auth endpoints (login, register)
  const isAuthEndpoint =
    req.url.includes('/api/v1/auth/login') ||
    req.url.includes('/api/v1/auth/register');

  // If token exists and it's not an auth endpoint, add Authorization header
  if (token && !isAuthEndpoint) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(clonedRequest);
  }

  // Otherwise, proceed with original request
  return next(req);
};
