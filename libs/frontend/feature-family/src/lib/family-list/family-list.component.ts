import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FamilyStore } from '@family-planner/frontend/data-access-family';
import { FamilyMemberCardComponent } from '../family-member-card/family-member-card.component';

/**
 * Family List Component
 *
 * Displays all family members for the current user.
 *
 * Features:
 * - Grid view of family member cards
 * - Add/Edit/Delete actions
 * - Family structure summary
 * - Loading and error states
 */
@Component({
  selector: 'fp-family-list',
  standalone: true,
  imports: [CommonModule, FamilyMemberCardComponent],
  templateUrl: './family-list.component.html',
  styleUrls: ['./family-list.component.scss'],
})
export class FamilyListComponent implements OnInit {
  private readonly familyStore = inject(FamilyStore);
  private readonly router = inject(Router);

  // Signals from store
  members = this.familyStore.members;
  membersByRole = this.familyStore.membersByRole;
  isLoading = this.familyStore.isLoading;
  error = this.familyStore.error;

  ngOnInit(): void {
    this.loadMembers();
  }

  async loadMembers(): Promise<void> {
    await this.familyStore.loadMembers();
  }

  onAddMember(): void {
    this.router.navigate(['/family/new']);
  }

  onEditMember(memberId: string): void {
    this.router.navigate(['/family/edit', memberId]);
  }

  async onDeleteMember(memberId: string): Promise<void> {
    if (confirm('Are you sure you want to remove this family member?')) {
      await this.familyStore.deleteMember(memberId);
    }
  }
}
