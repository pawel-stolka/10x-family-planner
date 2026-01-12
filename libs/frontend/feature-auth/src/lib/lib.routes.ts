import { Route } from '@angular/router';
import { LoginViewComponent } from './login/login-view.component';
import { RegisterViewComponent } from './register/register-view.component';

export const featureAuthRoutes: Route[] = [
  {
    path: 'login',
    component: LoginViewComponent,
  },
  {
    path: 'register',
    component: RegisterViewComponent,
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
