import { Route } from '@angular/router';
import { WeekViewContainerComponent } from './components/week-view-container/week-view-container.component';

/**
 * Week View Routes
 */
export const weekViewRoutes: Route[] = [
  {
    path: '',
    component: WeekViewContainerComponent,
  },
];
