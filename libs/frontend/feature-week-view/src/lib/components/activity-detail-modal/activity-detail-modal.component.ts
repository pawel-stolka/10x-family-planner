import {
  Component,
  input,
  output,
  computed,
  effect,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityInCell } from '../../models/week-grid.models';
import { calculateDuration } from '../../utils/time.utils';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Activity Detail Modal Component
 * Full-screen modal with activity details
 */
@Component({
  selector: 'app-activity-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (activity()) {
      <div class="modal-backdrop" (click)="onBackdropClick()" @fadeIn>
        <div class="modal-content" (click)="onContentClick($event)" @slideIn>
          <!-- Header -->
          <div class="modal-header">
            <h2>
              @if (activity()!.block.emoji) {
                <span class="emoji">{{ activity()!.block.emoji }}</span>
              }
              {{ activity()!.block.title }}
            </h2>
            <button 
              class="close-btn" 
              (click)="onClose()"
              aria-label="Zamknij"
            >
              ✕
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <!-- Time section -->
            <div class="detail-section">
              <h3>⏰ Czas</h3>
              <p class="time-range">
                {{ activity()!.block.startTime }} - {{ activity()!.block.endTime }}
              </p>
              <p class="duration">Czas trwania: {{ duration() }}</p>
            </div>

            <!-- Participants section -->
            <div class="detail-section">
              <h3>👥 Uczestnicy</h3>
              <div class="participants-list">
                <div 
                  class="participant-chip"
                  [style.background]="activity()!.member.color"
                >
                  {{ activity()!.member.name }}
                </div>
                @if (activity()!.isShared) {
                  <span class="shared-badge">+ wspólna aktywność rodzinna</span>
                }
              </div>
            </div>

            <!-- Description section -->
            @if (activity()!.block.description) {
              <div class="detail-section">
                <h3>📝 Opis</h3>
                <p class="description">{{ activity()!.block.description }}</p>
              </div>
            }

            <!-- Type section -->
            <div class="detail-section">
              <h3>🏷️ Typ i kategoria</h3>
              <div class="badges">
                <span class="type-badge">{{ activity()!.block.type }}</span>
                <span class="goal-badge" [class.is-goal]="activity()!.block.isGoal">
                  {{ activity()!.block.isGoal ? 'Cel' : 'Stałe' }}
                </span>
              </div>
            </div>

            <!-- Conflict warning -->
            @if (activity()!.hasConflict) {
              <div class="detail-section conflict-warning">
                <h3>⚠️ Konflikt harmonogramu</h3>
                <p>
                  Ta aktywność pokrywa się z inną w tym samym czasie dla tego członka rodziny.
                  Rozważ przesunięcie jednej z aktywności.
                </p>
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <!-- Phase 2: Edit/Delete buttons will be added here -->
            <button class="btn-secondary" (click)="onClose()">
              Zamknij
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
    }

    .modal-content {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 24px 20px;
      border-bottom: 2px solid #e5e7eb;
    }

    .modal-header h2 {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .emoji {
      font-size: 28px;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: #f3f4f6;
      border-radius: 8px;
      font-size: 20px;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background: #e5e7eb;
      color: #111827;
    }

    .close-btn:active {
      transform: scale(0.95);
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }

    .detail-section {
      margin-bottom: 24px;
    }

    .detail-section:last-child {
      margin-bottom: 0;
    }

    .detail-section h3 {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin: 0 0 12px 0;
    }

    .time-range {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 8px 0;
    }

    .duration {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }

    .participants-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .participant-chip {
      padding: 8px 16px;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .shared-badge {
      padding: 6px 12px;
      background: #f3f4f6;
      border-radius: 6px;
      font-size: 13px;
      color: #6b7280;
      font-style: italic;
    }

    .description {
      font-size: 15px;
      line-height: 1.6;
      color: #374151;
      margin: 0;
    }

    .badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .type-badge,
    .goal-badge {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
    }

    .type-badge {
      background: #dbeafe;
      color: #1e40af;
    }

    .goal-badge {
      background: #f3f4f6;
      color: #6b7280;
    }

    .goal-badge.is-goal {
      background: #dcfce7;
      color: #15803d;
    }

    .conflict-warning {
      padding: 16px;
      background: #fef2f2;
      border: 2px solid #fecaca;
      border-radius: 8px;
    }

    .conflict-warning h3 {
      color: #dc2626;
      margin-bottom: 8px;
    }

    .conflict-warning p {
      font-size: 14px;
      color: #991b1b;
      margin: 0;
      line-height: 1.5;
    }

    .modal-footer {
      padding: 20px 24px;
      border-top: 2px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-secondary {
      padding: 10px 24px;
      border: 2px solid #d1d5db;
      background: #fff;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .btn-secondary:active {
      transform: scale(0.98);
    }

    /* Custom scrollbar */
    .modal-body::-webkit-scrollbar {
      width: 8px;
    }

    .modal-body::-webkit-scrollbar-track {
      background: #f3f4f6;
    }

    .modal-body::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 4px;
    }

    .modal-body::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
  `],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' })),
      ]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityDetailModalComponent {
  activity = input<ActivityInCell | null>(null);
  close = output<void>();

  /**
   * Computed: Duration string
   */
  readonly duration = computed(() => {
    const act = this.activity();
    if (!act) return '';
    return calculateDuration(act.block.startTime, act.block.endTime);
  });

  /**
   * Handle Escape key
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.onClose();
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(): void {
    this.onClose();
  }

  /**
   * Prevent backdrop click when clicking on content
   */
  onContentClick(event: Event): void {
    event.stopPropagation();
  }

  /**
   * Close modal
   */
  onClose(): void {
    this.close.emit();
  }
}
