import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Time Column Component
 * Displays time label in the left column of grid
 */
@Component({
  selector: 'app-time-column',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="time-column">
      {{ time() }}
    </div>
  `,
  styles: [`
    .time-column {
      position: sticky;
      left: 0;
      z-index: 10;
      padding: 4px 6px;
      background: #f9fafb;
      border-right: 2px solid #e5e7eb;
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      text-align: right;
      min-width: 64px;
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeColumnComponent {
  time = input<string>('');
}
