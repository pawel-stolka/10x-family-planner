import { Route } from '@angular/router';
import { LoginViewComponent } from './login/login-view.component';

export const featureAuthRoutes: Route[] = [
  {
    path: 'login',
    component: LoginViewComponent,
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
