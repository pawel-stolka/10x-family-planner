// Public API for feature-week-view library

// Routes
export * from './lib/week-view.routes';

// Main components
export * from './lib/feature-week-view/feature-week-view';
export * from './lib/components/week-view-container/week-view-container.component';

// Child components
export * from './lib/components/week-grid/week-grid.component';
export * from './lib/components/grid-cell/grid-cell.component';
export * from './lib/components/activity-cell/activity-cell.component';
export * from './lib/components/grid-header/grid-header.component';
export * from './lib/components/time-column/time-column.component';
export * from './lib/components/member-filter/member-filter.component';
export * from './lib/components/member-legend/member-legend.component';
export * from './lib/components/activity-tooltip/activity-tooltip.component';
export * from './lib/components/activity-detail-modal/activity-detail-modal.component';
export * from './lib/components/schedule-generator-panel/schedule-generator-panel.component';

// Models
export * from './lib/models/week-grid.models';
export * from './lib/models/schedule-generator.models';

// Constants
export * from './lib/constants/week-grid.constants';

// Services
export * from './lib/services/grid-transform.service';
export * from './lib/services/conflict-detection.service';
export * from './lib/services/week-schedule.service';
export * from './lib/services/schedule-generator.service';

// Utils
export * from './lib/utils/date.utils';
export * from './lib/utils/time.utils';
