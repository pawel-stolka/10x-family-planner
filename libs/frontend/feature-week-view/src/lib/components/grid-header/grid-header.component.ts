import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DayInfo } from '../../models/week-grid.models';

/**
 * Grid Header Component
 * Displays day name and date in column header
 */
@Component({
  selector: 'app-grid-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="day-header" [class.today]="isToday()">
      <div class="day-name">{{ day().shortName }}</div>
      <div class="day-date">{{ day().dayOfMonth }}</div>
    </div>
  `,
  styles: [`
    .day-header {
      position: sticky;
      top: 0;
      z-index: 20;
      padding: 6px 4px;
      background: #fff;
      border-bottom: 2px solid #e5e7eb;
      text-align: center;
      font-weight: 600;
      transition: background-color 0.2s ease;
    }

    .day-name {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .day-date {
      font-size: 14px;
      color: #111827;
      margin-top: 2px;
    }

    .day-header.today {
      background: #eff6ff;
      border-bottom-color: #3b82f6;
    }

    .day-header.today .day-name {
      color: #3b82f6;
      font-weight: 700;
    }

    .day-header.today .day-date {
      color: #3b82f6;
      font-weight: 700;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridHeaderComponent {
  day = input<DayInfo>({ 
    name: '', 
    shortName: '', 
    date: '', 
    dayOfWeek: 0, 
    dayOfMonth: 1 
  });
  isToday = input<boolean>(false);
}
