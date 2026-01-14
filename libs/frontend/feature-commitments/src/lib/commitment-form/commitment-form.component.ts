import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommitmentsStore } from '@family-planner/frontend/data-access-commitments';
import { FamilyStore } from '@family-planner/frontend/data-access-family';

@Component({
  selector: 'fp-commitment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './commitment-form.component.html',
  styleUrls: ['./commitment-form.component.scss'],
})
export class CommitmentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(CommitmentsStore);
  private readonly familyStore = inject(FamilyStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  commitmentId: string | null = null;
  isEditMode = false;

  members = this.familyStore.members;

  form = this.fb.group({
    isShared: [false],
    familyMemberId: [''],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    blockType: ['OTHER', Validators.required],
    dayOfWeek: [1, [Validators.required, Validators.min(1), Validators.max(7)]],
    startTime: ['08:00:00', Validators.required],
    endTime: ['09:00:00', Validators.required],
  });

  async ngOnInit(): Promise<void> {
    await this.familyStore.loadMembers();
    await this.store.load();

    this.commitmentId = this.route.snapshot.paramMap.get('id');
    if (this.commitmentId) {
      this.isEditMode = true;
      const existing = this.store
        .commitments()
        .find((c) => c.commitmentId === this.commitmentId);
      if (existing) {
        this.form.patchValue({
          isShared: existing.isShared,
          familyMemberId: existing.familyMemberId || '',
          title: existing.title,
          blockType: existing.blockType,
          dayOfWeek: existing.dayOfWeek,
          startTime: existing.startTime,
          endTime: existing.endTime,
        });
      }
    }

    // Keep ownership fields consistent with isShared
    this.form.get('isShared')?.valueChanges.subscribe((isShared) => {
      if (isShared) {
        this.form.patchValue({ familyMemberId: '' });
        this.form.get('familyMemberId')?.disable();
      } else {
        this.form.get('familyMemberId')?.enable();
      }
    });

    // Initialize disabled state
    if (this.form.value.isShared) {
      this.form.get('familyMemberId')?.disable();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const isShared = !!v.isShared;

    const payload = {
      isShared,
      familyMemberId: isShared ? undefined : v.familyMemberId || undefined,
      title: v.title!,
      blockType: v.blockType! as any,
      dayOfWeek: Number(v.dayOfWeek),
      startTime: v.startTime!,
      endTime: v.endTime!,
    };

    let ok = false;
    if (this.isEditMode && this.commitmentId) {
      ok = !!(await this.store.update(this.commitmentId, payload as any));
    } else {
      ok = !!(await this.store.create(payload as any));
    }

    if (ok) {
      this.router.navigate(['/commitments']);
    }
  }

  onCancel(): void {
    this.router.navigate(['/commitments']);
  }
}

