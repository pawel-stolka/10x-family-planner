import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecurringGoal } from '@family-planner/frontend/data-access-goals';

/**
 * Goal Card Component
 *
 * Displays a single recurring goal in card format.
 *
 * Features:
 * - Priority badge with color coding
 * - Goal details (frequency, duration, time of day)
 * - Edit/Delete actions
 */
@Component({
  selector: 'fp-goal-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './goal-card.component.html',
  styleUrls: ['./goal-card.component.scss'],
})
export class GoalCardComponent {
  @Input({ required: true }) goal!: RecurringGoal;
  @Input({ required: true }) memberName!: string;
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  onEdit(): void {
    this.edit.emit(this.goal.goalId);
  }

  onDelete(): void {
    this.delete.emit(this.goal.goalId);
  }

  getPriorityLabel(): string {
    const labels = { 0: 'LOW', 1: 'MEDIUM', 2: 'HIGH' };
    return labels[this.goal.priority as keyof typeof labels] || 'MEDIUM';
  }

  getPriorityColor(): string {
    const colors = { 0: '#4caf50', 1: '#ff9800', 2: '#f44336' };
    return colors[this.goal.priority as keyof typeof colors] || '#999';
  }
}
