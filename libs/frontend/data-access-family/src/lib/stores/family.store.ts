import { Injectable, signal, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FamilyApiService } from '../services/family-api.service';
import {
  FamilyMember,
  CreateFamilyMemberRequest,
  UpdateFamilyMemberRequest,
} from '../models/family-member.model';

/**
 * Family Store
 *
 * Signal-based state management for family members.
 *
 * Features:
 * - Reactive state with Angular signals
 * - Computed derived state (grouping, filtering)
 * - Async actions for CRUD operations
 * - Error handling and loading states
 */
@Injectable({ providedIn: 'root' })
export class FamilyStore {
  private readonly familyApi = inject(FamilyApiService);

  // State
  private readonly membersSignal = signal<FamilyMember[]>([]);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly members = this.membersSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computed state
  readonly membersCount = computed(() => this.membersSignal().length);
  readonly hasMembers = computed(() => this.membersSignal().length > 0);

  /**
   * Members grouped by role
   */
  readonly membersByRole = computed(() => {
    const members = this.membersSignal();
    return {
      user: members.filter((m) => m.role === 'USER'),
      spouse: members.filter((m) => m.role === 'SPOUSE'),
      children: members.filter((m) => m.role === 'CHILD'),
    };
  });

  /**
   * Load all family members from the API
   */
  async loadMembers(): Promise<void> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const members = await firstValueFrom(this.familyApi.getMembers());
      this.membersSignal.set(members || []);
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to load family members');
      console.error('Failed to load family members:', error);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Create a new family member
   */
  async createMember(
    request: CreateFamilyMemberRequest
  ): Promise<FamilyMember | null> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const newMember = await firstValueFrom(
        this.familyApi.createMember(request)
      );
      if (newMember) {
        this.membersSignal.update((members) => [...members, newMember]);
        return newMember;
      }
      return null;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to create family member');
      console.error('Failed to create family member:', error);
      return null;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Update an existing family member
   */
  async updateMember(
    id: string,
    request: UpdateFamilyMemberRequest
  ): Promise<FamilyMember | null> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const updatedMember = await firstValueFrom(
        this.familyApi.updateMember(id, request)
      );
      if (updatedMember) {
        this.membersSignal.update((members) =>
          members.map((m) =>
            m.familyMemberId === id ? updatedMember : m
          )
        );
        return updatedMember;
      }
      return null;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to update family member');
      console.error('Failed to update family member:', error);
      return null;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Delete a family member
   */
  async deleteMember(id: string): Promise<boolean> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      await firstValueFrom(this.familyApi.deleteMember(id));
      this.membersSignal.update((members) =>
        members.filter((m) => m.familyMemberId !== id)
      );
      return true;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to delete family member');
      console.error('Failed to delete family member:', error);
      return false;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
}
