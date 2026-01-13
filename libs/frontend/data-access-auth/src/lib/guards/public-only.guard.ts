import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStore } from '../store/auth.store';

/**
 * PublicOnlyGuard - Prevents authenticated users from accessing public routes
 * 
 * Usage: Apply to public routes (login, register)
 * Redirects to /dashboard if user is already authenticated
 */
export const publicOnlyGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    return true;
  }

  console.log('PublicOnlyGuard: User already authenticated, redirecting to dashboard');
  
  // Redirect to dashboard if already logged in
  return router.createUrlTree(['/dashboard']);
};
