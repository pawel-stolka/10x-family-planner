import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FamilyMemberViewModel } from '../../models/week-grid.models';

/**
 * Member Legend Component
 * Displays color legend for family members
 */
@Component({
  selector: 'app-member-legend',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="member-legend">
      <div class="legend-title">Legenda:</div>
      
      @for (member of members(); track member.id) {
        <div class="legend-item">
          <div 
            class="color-square" 
            [style.background]="member.color"
          ></div>
          <span class="member-name">{{ member.name }} ({{ member.initial }})</span>
        </div>
      }
      
      <div class="legend-item">
        <div class="color-square shared"></div>
        <span class="member-name">Wspólne</span>
      </div>
    </div>
  `,
  styles: [`
    .member-legend {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      background: #f9fafb;
      border-radius: 8px;
      flex-wrap: wrap;
    }

    .legend-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-right: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .color-square {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .color-square.shared {
      background: repeating-linear-gradient(
        45deg,
        #3b82f6,
        #3b82f6 4px,
        rgba(255, 255, 255, 0.5) 4px,
        rgba(255, 255, 255, 0.5) 8px
      );
    }

    .member-name {
      font-size: 13px;
      color: #6b7280;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberLegendComponent {
  members = input<FamilyMemberViewModel[]>([]);
}
