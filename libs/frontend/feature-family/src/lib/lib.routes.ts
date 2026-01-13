import { Route } from '@angular/router';
import { FamilyListComponent } from './family-list/family-list.component';
import { FamilyMemberFormComponent } from './family-member-form/family-member-form.component';

/**
 * Feature Family Routes
 *
 * Routes for family member management.
 *
 * Base path: /family
 */
export const familyRoutes: Route[] = [
  {
    path: '',
    component: FamilyListComponent,
  },
  {
    path: 'new',
    component: FamilyMemberFormComponent,
  },
  {
    path: 'edit/:id',
    component: FamilyMemberFormComponent,
  },
];
