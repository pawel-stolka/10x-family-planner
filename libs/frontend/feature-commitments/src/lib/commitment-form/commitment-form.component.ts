import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommitmentsStore } from '@family-planner/frontend/data-access-commitments';
import { FamilyStore } from '@family-planner/frontend/data-access-family';

interface DaySlot {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'fp-commitment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
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
  });

  daySlots: DaySlot[] = [
    {
      id: Date.now(),
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '09:00',
    },
  ];

  private nextSlotId = Date.now() + 1;

  async ngOnInit(): Promise<void> {
    await this.familyStore.loadMembers();
    await this.store.load();

    this.commitmentId = this.route.snapshot.paramMap.get('id');
    const groupIds = this.route.snapshot.queryParamMap.get('groupIds');

    if (this.commitmentId) {
      this.isEditMode = true;

      if (groupIds) {
        // Editing a group of commitments
        const ids = groupIds.split(',');
        const commitments = this.store
          .commitments()
          .filter((c) => ids.includes(c.commitmentId));

        if (commitments.length > 0) {
          const first = commitments[0];
          this.form.patchValue({
            isShared: first.isShared,
            familyMemberId: first.familyMemberId || '',
            title: first.title,
            blockType: first.blockType,
          });

          // Load all days from the group
          this.daySlots = commitments.map((c, index) => ({
            id: Date.now() + index,
            dayOfWeek: c.dayOfWeek,
            startTime: c.startTime.substring(0, 5),
            endTime: c.endTime.substring(0, 5),
          }));

          // Sort by day of week
          this.daySlots.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
        }
      } else {
        // Editing a single commitment
        const existing = this.store
          .commitments()
          .find((c) => c.commitmentId === this.commitmentId);
        if (existing) {
          this.form.patchValue({
            isShared: existing.isShared,
            familyMemberId: existing.familyMemberId || '',
            title: existing.title,
            blockType: existing.blockType,
          });

          this.daySlots = [
            {
              id: Date.now(),
              dayOfWeek: existing.dayOfWeek,
              startTime: existing.startTime.substring(0, 5),
              endTime: existing.endTime.substring(0, 5),
            },
          ];
        }
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

  addDaySlot(): void {
    this.daySlots.push({
      id: this.nextSlotId++,
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '09:00',
    });
  }

  removeDaySlot(index: number): void {
    if (this.daySlots.length > 1) {
      this.daySlots.splice(index, 1);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Validate day slots
    if (this.daySlots.length === 0) {
      alert('Please add at least one day/time slot');
      return;
    }

    const v = this.form.getRawValue();
    const isShared = !!v.isShared;
    const groupIds = this.route.snapshot.queryParamMap.get('groupIds');

    if (this.isEditMode && this.commitmentId) {
      if (groupIds) {
        // Edit mode: updating a group - delete old ones and create new ones
        const ids = groupIds.split(',');

        // Delete all old commitments in the group
        for (const id of ids) {
          await this.store.remove(id);
        }

        // Create new commitments for each day slot
        let allSuccess = true;
        for (const slot of this.daySlots) {
          const payload = {
            isShared,
            familyMemberId: isShared
              ? undefined
              : v.familyMemberId || undefined,
            title: v.title!,
            blockType: v.blockType! as any,
            dayOfWeek: Number(slot.dayOfWeek),
            startTime: slot.startTime + ':00',
            endTime: slot.endTime + ':00',
          };

          const result = await this.store.create(payload as any);
          if (!result) {
            allSuccess = false;
            break;
          }
        }

        if (allSuccess) {
          this.router.navigate(['/commitments']);
        }
      } else {
        // Edit mode: update single commitment
        const slot = this.daySlots[0];
        const payload = {
          isShared,
          familyMemberId: isShared ? undefined : v.familyMemberId || undefined,
          title: v.title!,
          blockType: v.blockType! as any,
          dayOfWeek: Number(slot.dayOfWeek),
          startTime: slot.startTime + ':00',
          endTime: slot.endTime + ':00',
        };

        const ok = await this.store.update(this.commitmentId, payload as any);
        if (ok) {
          this.router.navigate(['/commitments']);
        }
      }
    } else {
      // Create mode: create multiple commitments (one per day slot)
      let allSuccess = true;

      for (const slot of this.daySlots) {
        const payload = {
          isShared,
          familyMemberId: isShared ? undefined : v.familyMemberId || undefined,
          title: v.title!,
          blockType: v.blockType! as any,
          dayOfWeek: Number(slot.dayOfWeek),
          startTime: slot.startTime + ':00', // Add seconds
          endTime: slot.endTime + ':00',
        };

        const result = await this.store.create(payload as any);
        if (!result) {
          allSuccess = false;
          break;
        }
      }

      if (allSuccess) {
        this.router.navigate(['/commitments']);
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/commitments']);
  }
}
