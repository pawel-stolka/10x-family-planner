import { Route } from '@angular/router';
import {
  authGuard,
  publicOnlyGuard,
} from '@family-planner/frontend/data-access-auth';

export const appRoutes: Route[] = [
  // Public routes (with PublicOnlyGuard to redirect already authenticated users)
  {
    path: 'login',
    loadComponent: () =>
      import('@family-planner/frontend/feature-auth').then(
        (m) => m.LoginViewComponent
      ),
    canActivate: [publicOnlyGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('@family-planner/frontend/feature-auth').then(
        (m) => m.RegisterViewComponent
      ),
    canActivate: [publicOnlyGuard],
  },

  // Protected routes (with AuthGuard)
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard-placeholder.component').then(
        (m) => m.DashboardPlaceholderComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'family',
    loadChildren: () =>
      import('@family-planner/frontend/feature-family').then(
        (m) => m.familyRoutes
      ),
    canActivate: [authGuard],
  },
  {
    path: 'goals',
    loadChildren: () =>
      import('@family-planner/frontend/feature-goals').then(
        (m) => m.goalsRoutes
      ),
    canActivate: [authGuard],
  },
  {
    path: 'commitments',
    loadChildren: () =>
      import('@family-planner/frontend/feature-commitments').then(
        (m) => m.commitmentsRoutes
      ),
    canActivate: [authGuard],
  },

  // Default redirect
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
];
