import { Route } from '@angular/router';
import { CommitmentsListComponent } from './commitments-list/commitments-list.component';
import { CommitmentFormComponent } from './commitment-form/commitment-form.component';

/**
 * Feature Commitments Routes
 *
 * Base path: /commitments
 */
export const commitmentsRoutes: Route[] = [
  { path: '', component: CommitmentsListComponent },
  { path: 'new', component: CommitmentFormComponent },
  { path: 'edit/:id', component: CommitmentFormComponent },
];

