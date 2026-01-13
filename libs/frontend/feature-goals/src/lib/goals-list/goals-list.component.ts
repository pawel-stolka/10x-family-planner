import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GoalsStore } from '@family-planner/frontend/data-access-goals';
import { FamilyStore } from '@family-planner/frontend/data-access-family';
import { GoalCardComponent } from '../goal-card/goal-card.component';

/**
 * Goals List Component
 *
 * Displays all recurring goals with filtering and sorting.
 *
 * Features:
 * - Filter by family member
 * - Sort by name/priority/date
 * - Grouped by priority (High/Medium/Low)
 * - Add/Edit/Delete actions
 */
@Component({
  selector: 'fp-goals-list',
  standalone: true,
  imports: [CommonModule, GoalCardComponent],
  templateUrl: './goals-list.component.html',
  styleUrls: ['./goals-list.component.scss'],
})
export class GoalsListComponent implements OnInit {
  private readonly goalsStore = inject(GoalsStore);
  private readonly familyStore = inject(FamilyStore);
  private readonly router = inject(Router);

  // Signals from stores
  goals = this.goalsStore.goals;
  goalsByPriority = this.goalsStore.goalsByPriority;
  isLoading = this.goalsStore.isLoading;
  error = this.goalsStore.error;
  members = this.familyStore.members;

  // Local state for filtering
  filterMemberId = signal<string | null>(null);
  sortBy = signal<'name' | 'priority' | 'createdAt'>('priority');
  sortOrder = signal<'ASC' | 'DESC'>('DESC');

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    await this.familyStore.loadMembers();
    await this.loadGoals();
  }

  async loadGoals(): Promise<void> {
    await this.goalsStore.loadGoals({
      familyMemberId: this.filterMemberId() || undefined,
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder(),
    });
  }

  onFilterChange(memberId: string | null): void {
    this.filterMemberId.set(memberId);
    this.loadGoals();
  }

  onSortChange(sortBy: 'name' | 'priority' | 'createdAt'): void {
    this.sortBy.set(sortBy);
    this.loadGoals();
  }

  onAddGoal(): void {
    this.router.navigate(['/goals/new']);
  }

  onEditGoal(goalId: string): void {
    this.router.navigate(['/goals/edit', goalId]);
  }

  async onDeleteGoal(goalId: string): Promise<void> {
    if (confirm('Are you sure you want to delete this goal?')) {
      await this.goalsStore.deleteGoal(goalId);
    }
  }

  getMemberName(memberId: string): string {
    const member = this.members().find((m) => m.familyMemberId === memberId);
    return member?.name || 'Unknown';
  }
}
