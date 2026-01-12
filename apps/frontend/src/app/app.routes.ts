import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  // Public routes
  {
    path: 'login',
    loadComponent: () => import('@family-planner/frontend/feature-auth').then(m => m.LoginViewComponent)
  },
  // Default redirect
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];
