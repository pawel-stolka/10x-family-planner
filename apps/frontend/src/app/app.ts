import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NxWelcome } from './nx-welcome';
import { featureAuthRoutes, LoginViewComponent } from '@family-planner/frontend/feature-auth';

@Component({
  imports: [NxWelcome,  RouterModule, LoginViewComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'frontend';
}
