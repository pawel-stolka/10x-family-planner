import { Route } from '@angular/router';
import { GoalsListComponent } from './goals-list/goals-list.component';
import { GoalFormComponent } from './goal-form/goal-form.component';

/**
 * Feature Goals Routes
 *
 * Routes for recurring goals management.
 *
 * Base path: /goals
 */
export const goalsRoutes: Route[] = [
  {
    path: '',
    component: GoalsListComponent,
  },
  {
    path: 'new',
    component: GoalFormComponent,
  },
  {
    path: 'edit/:id',
    component: GoalFormComponent,
  },
];
