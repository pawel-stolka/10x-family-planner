import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStore } from '../store/auth.store';

/**
 * AuthGuard - Protects routes that require authentication
 * 
 * Usage: Apply to protected routes (dashboard, schedule, etc.)
 * Redirects to /login if user is not authenticated
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  const returnUrl = state.url;
  console.log('AuthGuard: User not authenticated, redirecting to login. Return URL:', returnUrl);
  
  // Redirect to login with return URL
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl }
  });
};
