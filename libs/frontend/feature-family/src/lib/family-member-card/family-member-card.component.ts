import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FamilyMember } from '@family-planner/frontend/data-access-family';

/**
 * Family Member Card Component
 *
 * Displays a single family member in card format.
 *
 * Features:
 * - Role icon
 * - Edit/Delete actions
 * - Member details (name, role, age, interests)
 */
@Component({
  selector: 'fp-family-member-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './family-member-card.component.html',
  styleUrls: ['./family-member-card.component.scss'],
})
export class FamilyMemberCardComponent {
  @Input({ required: true }) member!: FamilyMember;
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  onEdit(): void {
    this.edit.emit(this.member.familyMemberId);
  }

  onDelete(): void {
    this.delete.emit(this.member.familyMemberId);
  }

  getRoleIcon(): string {
    const icons = {
      USER: '👤',
      SPOUSE: '💑',
      CHILD: '👶',
    };
    return icons[this.member.role] || '👤';
  }

  getRoleLabel(): string {
    return this.member.role.charAt(0) + this.member.role.slice(1).toLowerCase();
  }

  hasInterests(): boolean {
    return !!(
      this.member.preferences?.interests &&
      this.member.preferences.interests.length > 0
    );
  }

  getInterests(): string[] {
    return this.member.preferences?.interests || [];
  }
}
