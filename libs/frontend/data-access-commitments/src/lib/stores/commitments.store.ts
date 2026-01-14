import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommitmentsApiService } from '../services/commitments-api.service';
import {
  CreateRecurringCommitmentRequest,
  QueryRecurringCommitmentsParams,
  RecurringCommitment,
  UpdateRecurringCommitmentRequest,
} from '../models/recurring-commitment.model';

@Injectable({ providedIn: 'root' })
export class CommitmentsStore {
  private readonly api = inject(CommitmentsApiService);

  private readonly commitmentsSignal = signal<RecurringCommitment[]>([]);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly commitments = this.commitmentsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly hasCommitments = computed(() => this.commitmentsSignal().length > 0);

  async load(params?: QueryRecurringCommitmentsParams): Promise<void> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const items = await firstValueFrom(this.api.list(params));
      this.commitmentsSignal.set(items || []);
    } catch (error: any) {
      this.errorSignal.set(error?.message || 'Failed to load commitments');
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async create(
    request: CreateRecurringCommitmentRequest
  ): Promise<RecurringCommitment | null> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const created = await firstValueFrom(this.api.create(request));
      this.commitmentsSignal.update((items) => [...items, created]);
      return created;
    } catch (error: any) {
      this.errorSignal.set(error?.message || 'Failed to create commitment');
      return null;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async update(
    commitmentId: string,
    request: UpdateRecurringCommitmentRequest
  ): Promise<RecurringCommitment | null> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const updated = await firstValueFrom(this.api.update(commitmentId, request));
      this.commitmentsSignal.update((items) =>
        items.map((c) => (c.commitmentId === commitmentId ? updated : c))
      );
      return updated;
    } catch (error: any) {
      this.errorSignal.set(error?.message || 'Failed to update commitment');
      return null;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async remove(commitmentId: string): Promise<boolean> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      await firstValueFrom(this.api.delete(commitmentId));
      this.commitmentsSignal.update((items) =>
        items.filter((c) => c.commitmentId !== commitmentId)
      );
      return true;
    } catch (error: any) {
      this.errorSignal.set(error?.message || 'Failed to delete commitment');
      return false;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}

