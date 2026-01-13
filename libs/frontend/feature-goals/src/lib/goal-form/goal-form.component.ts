import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { GoalsStore } from '@family-planner/frontend/data-access-goals';
import { FamilyStore } from '@family-planner/frontend/data-access-family';

/**
 * Goal Form Component
 *
 * Form for creating or editing a recurring goal.
 *
 * Features:
 * - Create/Edit mode
 * - Form validation
 * - Priority selection with visual indicators
 * - Time of day checkboxes
 */
@Component({
  selector: 'fp-goal-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './goal-form.component.html',
  styleUrls: ['./goal-form.component.scss'],
})
export class GoalFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly goalsStore = inject(GoalsStore);
  private readonly familyStore = inject(FamilyStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  goalId: string | null = null;
  isEditMode = false;

  members = this.familyStore.members;
  isLoading = this.goalsStore.isLoading;

  form = this.fb.group({
    familyMemberId: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', Validators.maxLength(500)],
    frequencyPerWeek: [
      3,
      [Validators.required, Validators.min(1), Validators.max(14)],
    ],
    preferredDurationMinutes: [
      30,
      [Validators.required, Validators.min(15), Validators.max(480)],
    ],
    preferredTimeOfDay: [[] as string[]],
    priority: [1, [Validators.required, Validators.min(0), Validators.max(2)]],
  });

  timeOfDayOptions = [
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening', label: 'Evening' },
  ];

  priorityOptions = [
    { value: 0, label: 'Low', color: '#4caf50' },
    { value: 1, label: 'Medium', color: '#ff9800' },
    { value: 2, label: 'High', color: '#f44336' },
  ];

  ngOnInit(): void {
    this.familyStore.loadMembers();

    this.goalId = this.route.snapshot.paramMap.get('id');
    if (this.goalId) {
      this.isEditMode = true;
      this.loadGoal(this.goalId);
    }
  }

  async loadGoal(id: string): Promise<void> {
    const goals = this.goalsStore.goals();
    const goal = goals.find((g) => g.goalId === id);
    if (goal) {
      this.form.patchValue({
        familyMemberId: goal.familyMemberId,
        name: goal.name,
        description: goal.description || '',
        frequencyPerWeek: goal.frequencyPerWeek,
        preferredDurationMinutes: goal.preferredDurationMinutes,
        preferredTimeOfDay: goal.preferredTimeOfDay || [],
        priority: goal.priority,
      });
    }
  }

  onTimeOfDayChange(value: string, checked: boolean): void {
    const current = this.form.value.preferredTimeOfDay || [];
    if (checked) {
      this.form.patchValue({
        preferredTimeOfDay: [...current, value],
      });
    } else {
      this.form.patchValue({
        preferredTimeOfDay: current.filter((v) => v !== value),
      });
    }
  }

  isTimeOfDaySelected(value: string): boolean {
    return (this.form.value.preferredTimeOfDay || []).includes(value);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const request = {
      familyMemberId: formValue.familyMemberId!,
      name: formValue.name!,
      description: formValue.description || undefined,
      frequencyPerWeek: formValue.frequencyPerWeek!,
      preferredDurationMinutes: formValue.preferredDurationMinutes!,
      preferredTimeOfDay: formValue.preferredTimeOfDay?.length
        ? formValue.preferredTimeOfDay
        : undefined,
      priority: formValue.priority!,
    };

    let result;
    if (this.isEditMode && this.goalId) {
      result = await this.goalsStore.updateGoal(this.goalId, request);
    } else {
      result = await this.goalsStore.createGoal(request);
    }

    if (result) {
      this.router.navigate(['/goals']);
    }
  }

  onCancel(): void {
    this.router.navigate(['/goals']);
  }
}
