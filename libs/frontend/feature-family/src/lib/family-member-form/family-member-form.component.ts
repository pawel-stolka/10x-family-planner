import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FamilyStore } from '@family-planner/frontend/data-access-family';

/**
 * Family Member Form Component
 *
 * Form for creating or editing a family member.
 *
 * Features:
 * - Create/Edit mode
 * - Form validation
 * - Conditional age field (required for children)
 * - Interests input (comma-separated)
 */
@Component({
  selector: 'fp-family-member-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './family-member-form.component.html',
  styleUrls: ['./family-member-form.component.scss'],
})
export class FamilyMemberFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly familyStore = inject(FamilyStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  memberId: string | null = null;
  isEditMode = false;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    role: ['USER', Validators.required],
    age: [null as number | null],
    interests: [''],
  });

  roles = [
    { value: 'USER', label: 'Parent (You)' },
    { value: 'SPOUSE', label: 'Spouse/Partner' },
    { value: 'CHILD', label: 'Child' },
  ];

  ngOnInit(): void {
    this.memberId = this.route.snapshot.paramMap.get('id');
    if (this.memberId) {
      this.isEditMode = true;
      this.loadMember(this.memberId);
    }

    // Conditional age validation
    this.form.get('role')?.valueChanges.subscribe((role) => {
      const ageControl = this.form.get('age');
      if (role === 'CHILD') {
        ageControl?.setValidators([
          Validators.required,
          Validators.min(0),
          Validators.max(120),
        ]);
      } else {
        ageControl?.clearValidators();
      }
      ageControl?.updateValueAndValidity();
    });
  }

  async loadMember(id: string): Promise<void> {
    const members = this.familyStore.members();
    const member = members.find((m) => m.familyMemberId === id);
    if (member) {
      this.form.patchValue({
        name: member.name,
        role: member.role,
        age: member.age !== undefined ? member.age : null,
        interests: member.preferences?.interests?.join(', ') || '',
      });
      
      // Disable role field in edit mode (cannot be changed)
      this.form.get('role')?.disable();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    
    let result;
    if (this.isEditMode && this.memberId) {
      // Update request - exclude role (cannot be changed)
      const updateRequest = {
        name: formValue.name!,
        age: formValue.age !== null ? formValue.age : undefined,
        preferences: {
          interests: formValue.interests
            ? formValue.interests
                .split(',')
                .map((i) => i.trim())
                .filter(Boolean)
            : [],
        },
      };
      result = await this.familyStore.updateMember(this.memberId, updateRequest);
    } else {
      // Create request - include role
      const createRequest = {
        name: formValue.name!,
        role: formValue.role as 'USER' | 'SPOUSE' | 'CHILD',
        age: formValue.age !== null ? formValue.age : undefined,
        preferences: {
          interests: formValue.interests
            ? formValue.interests
                .split(',')
                .map((i) => i.trim())
                .filter(Boolean)
            : [],
        },
      };
      result = await this.familyStore.createMember(createRequest);
    }

    if (result) {
      this.router.navigate(['/family']);
    }
  }

  onCancel(): void {
    this.router.navigate(['/family']);
  }
}
