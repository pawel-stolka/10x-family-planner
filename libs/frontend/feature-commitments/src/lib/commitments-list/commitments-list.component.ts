import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommitmentsStore } from '@family-planner/frontend/data-access-commitments';
import { FamilyStore } from '@family-planner/frontend/data-access-family';

@Component({
  selector: 'fp-commitments-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './commitments-list.component.html',
  styleUrls: ['./commitments-list.component.scss'],
})
export class CommitmentsListComponent implements OnInit {
  private readonly commitmentsStore = inject(CommitmentsStore);
  private readonly familyStore = inject(FamilyStore);
  private readonly router = inject(Router);

  commitments = this.commitmentsStore.commitments;
  isLoading = this.commitmentsStore.isLoading;
  error = this.commitmentsStore.error;
  members = this.familyStore.members;

  filterMemberId = signal<string | 'shared' | 'all'>('all');

  filtered = computed(() => {
    const filter = this.filterMemberId();
    const items = this.commitments();
    if (filter === 'all') return items;
    if (filter === 'shared') return items.filter((c) => c.isShared);
    return items.filter((c) => !c.isShared && c.familyMemberId === filter);
  });

  async ngOnInit(): Promise<void> {
    await this.familyStore.loadMembers();
    await this.commitmentsStore.load();
  }

  onAdd(): void {
    this.router.navigate(['/commitments/new']);
  }

  onEdit(id: string): void {
    this.router.navigate(['/commitments/edit', id]);
  }

  async onDelete(id: string): Promise<void> {
    if (confirm('Delete this recurring commitment?')) {
      await this.commitmentsStore.remove(id);
    }
  }

  getMemberLabel(commitment: { isShared: boolean; familyMemberId?: string | null }): string {
    if (commitment.isShared) return 'Shared (Family)';
    const member = this.members().find((m) => m.familyMemberId === commitment.familyMemberId);
    return member?.name || 'Unknown';
  }
}

