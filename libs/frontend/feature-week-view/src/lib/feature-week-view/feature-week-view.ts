import { Component } from '@angular/core';
import { WeekViewContainerComponent } from '../components/week-view-container/week-view-container.component';

/**
 * Feature Week View Component
 * Entry point for week calendar feature
 */
@Component({
  selector: 'lib-feature-week-view',
  standalone: true,
  imports: [WeekViewContainerComponent],
  template: `<app-week-view-container />`,
})
export class FeatureWeekView {}
