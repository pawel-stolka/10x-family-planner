import {
  Component,
  input,
  output,
  computed,
  effect,
  signal,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivityInCell,
  FamilyMemberViewModel,
} from '../../models/week-grid.models';
import { BlockType } from '@family-planner/shared/models-schedule';
import {
  calculateDuration,
  isValidTimeRange,
  buildTimeRange,
} from '../../utils/time.utils';
import {
  parseISODate,
  formatDisplayDateWithYear,
} from '../../utils/date.utils';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Activity Detail Modal Component
 * Full-screen modal with activity details and edit capability
 */
/* eslint-disable @angular-eslint/no-output-native */
@Component({
  selector: 'app-activity-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (activity()) {
    <div
      class="modal-backdrop"
      role="button"
      tabindex="0"
      (click)="onBackdropClick()"
      (keyup.enter)="onBackdropClick()"
      @fadeIn
    >
      <div
        class="modal-content"
        tabindex="-1"
        (click)="onContentClick($event)"
        (keyup.enter)="onContentClick($event)"
        @slideIn
      >
        <!-- Header -->
        <div class="modal-header">
          <div class="header-main">
            <h2>
              @if (isEditMode()) {
              <input
                type="text"
                class="title-input"
                [value]="editTitle()"
                (input)="editTitle.set($any($event.target).value)"
                placeholder="Nazwa aktywności"
              />
              } @else { @if (activity()!.block.emoji) {
              <span class="emoji">{{ activity()!.block.emoji }}</span>
              }
              {{ activity()!.block.title }}
              }
            </h2>
            <p class="day-label">
              {{ dayLabel() }}
            </p>
          </div>
          <button
            class="close-btn"
            (click)="onClose()"
            aria-label="Zamknij"
            type="button"
          >
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          @if (isEditMode()) {
          <!-- Edit Mode -->

          <!-- Time section -->
          <div class="detail-section">
            <h3>⏰ Czas</h3>
            <div class="time-inputs">
              <div class="time-input-group">
                <label for="edit-start-time">Od:</label>
                <input
                  id="edit-start-time"
                  type="time"
                  [value]="editStartTime()"
                  (input)="editStartTime.set($any($event.target).value)"
                  class="time-input"
                />
              </div>
              <div class="time-input-group">
                <label for="edit-end-time">Do:</label>
                <input
                  id="edit-end-time"
                  type="time"
                  [value]="editEndTime()"
                  (input)="editEndTime.set($any($event.target).value)"
                  class="time-input"
                />
              </div>
            </div>
            @if (timeError()) {
            <p class="error-message">{{ timeError() }}</p>
            }
            <p class="duration">Czas trwania: {{ editDuration() }}</p>
          </div>

          <!-- Participants section -->
          <div class="detail-section">
            <h3>👥 Uczestnicy</h3>
            <div class="participants-edit">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  [checked]="editIsShared()"
                  (change)="onSharedChange($any($event.target).checked)"
                  class="checkbox-input"
                />
                <span>Wspólna aktywność rodzinna</span>
              </label>
              @if (!editIsShared()) {
              <select
                [value]="editFamilyMemberId() || ''"
                (change)="
                  editFamilyMemberId.set($any($event.target).value || null)
                "
                class="member-select"
              >
                <option value="">Wybierz członka rodziny</option>
                @for (member of availableMembers(); track member.id) {
                <option [value]="member.id">{{ member.name }}</option>
                }
              </select>
              @if (memberError()) {
              <p class="error-message">{{ memberError() }}</p>
              } }
            </div>
          </div>

          <!-- Type section -->
          <div class="detail-section">
            <h3>🏷️ Typ</h3>
            <select
              [value]="editBlockType()"
              (change)="editBlockType.set($any($event.target).value)"
              class="type-select"
            >
              @for (type of blockTypes(); track type.value) {
              <option [value]="type.value">{{ type.label }}</option>
              }
            </select>
          </div>

          <!-- Description section -->
          <div class="detail-section">
            <h3>📝 Opis</h3>
            <textarea
              [value]="editDescription()"
              (input)="editDescription.set($any($event.target).value)"
              class="description-textarea"
              placeholder="Dodatkowe informacje (opcjonalnie)"
              rows="3"
            ></textarea>
          </div>

          @if (errorMessage()) {
          <div class="detail-section error-section">
            <p class="error-message">{{ errorMessage() }}</p>
          </div>
          } } @else {
          <!-- View Mode -->

          <!-- Time section -->
          <div class="detail-section">
            <h3>⏰ Czas</h3>
            <p class="time-range">
              {{ activity()!.block.startTime }} -
              {{ activity()!.block.endTime }}
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
              <span
                class="goal-badge"
                [class.is-goal]="activity()!.block.isGoal"
              >
                {{ activity()!.block.isGoal ? 'Cel' : 'Stałe' }}
              </span>
            </div>
          </div>

          <!-- Conflict warning -->
          @if (activity()!.hasConflict) {
          <div class="detail-section conflict-warning">
            <h3>⚠️ Konflikt harmonogramu</h3>
            <p>
              Ta aktywność pokrywa się z inną w tym samym czasie dla tego
              członka rodziny. Rozważ przesunięcie jednej z aktywności.
            </p>
          </div>
          } }
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          @if (isEditMode()) {
          <button
            class="btn-secondary"
            (click)="cancelEdit()"
            [disabled]="isSaving()"
          >
            Anuluj
          </button>
          <button
            class="btn-primary"
            (click)="onSave()"
            [disabled]="!canSave() || isSaving()"
          >
            @if (isSaving()) {
            <span class="spinner"></span>
            <span>Zapisywanie...</span>
            } @else { Zapisz zmiany }
          </button>
          } @else {
          <button
            class="btn-danger"
            (click)="onDelete()"
            [disabled]="isDeleting()"
          >
            @if (isDeleting()) {
            <span class="spinner"></span>
            <span>Usuwanie...</span>
            } @else { Usuń }
          </button>
          <button class="btn-primary" (click)="startEdit()">Edytuj</button>
          <button class="btn-secondary" (click)="onClose()">Zamknij</button>
          }
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
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

      .header-main {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
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

      .day-label {
        font-size: 13px;
        color: #6b7280;
        margin: 0;
      }

      .title-input {
        flex: 1;
        padding: 8px 12px;
        border: 2px solid #d1d5db;
        border-radius: 8px;
        font-size: 24px;
        font-weight: 700;
        color: #111827;
        font-family: inherit;
      }

      .title-input:focus {
        outline: none;
        border-color: #3b82f6;
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

      .time-inputs {
        display: flex;
        gap: 16px;
        margin-bottom: 8px;
      }

      .time-input-group {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .time-input-group label {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }

      .time-input {
        padding: 10px 12px;
        border: 2px solid #d1d5db;
        border-radius: 8px;
        font-size: 16px;
        font-family: inherit;
      }

      .time-input:focus {
        outline: none;
        border-color: #3b82f6;
      }

      .participants-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .participants-edit {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 14px;
        color: #374151;
      }

      .checkbox-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .member-select,
      .type-select {
        padding: 10px 12px;
        border: 2px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        background: #fff;
        cursor: pointer;
      }

      .member-select:focus,
      .type-select:focus {
        outline: none;
        border-color: #3b82f6;
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

      .description-textarea {
        width: 100%;
        padding: 10px 12px;
        border: 2px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        resize: vertical;
        min-height: 80px;
      }

      .description-textarea:focus {
        outline: none;
        border-color: #3b82f6;
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

      .error-section {
        padding: 12px;
        background: #fef2f2;
        border: 2px solid #fecaca;
        border-radius: 8px;
      }

      .error-message {
        font-size: 14px;
        color: #dc2626;
        margin: 8px 0 0 0;
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

      .btn-secondary:hover:not(:disabled) {
        background: #f9fafb;
        border-color: #9ca3af;
      }

      .btn-secondary:active:not(:disabled) {
        transform: scale(0.98);
      }

      .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-primary {
        padding: 10px 24px;
        border: none;
        background: #3b82f6;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .btn-primary:hover:not(:disabled) {
        background: #2563eb;
      }

      .btn-primary:active:not(:disabled) {
        transform: scale(0.98);
      }

      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-danger {
        padding: 10px 24px;
        border: none;
        background: #dc2626;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .btn-danger:hover:not(:disabled) {
        background: #b91c1c;
      }

      .btn-danger:active:not(:disabled) {
        transform: scale(0.98);
      }

      .btn-danger:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
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
    `,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' }),
        animate(
          '200ms ease-out',
          style({ opacity: 1, transform: 'scale(1) translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-in',
          style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' })
        ),
      ]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityDetailModalComponent {
  activity = input<ActivityInCell | null>(null);
  scheduleId = input.required<string>();
  availableMembers = input.required<FamilyMemberViewModel[]>();
  errorMessage = input<string | null>(null);
  close = output<void>();
  save = output<{
    blockId: string;
    scheduleId: string;
    title: string;
    blockType: BlockType;
    familyMemberId?: string | null;
    timeRange: { start: string; end: string };
    isShared: boolean;
    metadata?: Record<string, any>;
  }>();
  delete = output<{ scheduleId: string; blockId: string }>();

  // Edit mode state
  readonly isEditMode = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly isDeleting = signal<boolean>(false);

  // Form state
  readonly editTitle = signal<string>('');
  readonly editStartTime = signal<string>('');
  readonly editEndTime = signal<string>('');
  readonly editBlockType = signal<BlockType>(BlockType.ACTIVITY);
  readonly editIsShared = signal<boolean>(false);
  readonly editFamilyMemberId = signal<string | null>(null);
  readonly editDescription = signal<string>('');

  // Block types for select
  readonly blockTypes = computed(() => [
    { value: BlockType.WORK, label: 'Praca' },
    { value: BlockType.ACTIVITY, label: 'Aktywność' },
    { value: BlockType.MEAL, label: 'Posiłek' },
    { value: BlockType.OTHER, label: 'Inne' },
  ]);

  // Validation
  readonly timeError = computed(() => {
    if (!this.isEditMode()) return null;
    const start = this.editStartTime();
    const end = this.editEndTime();
    if (!start || !end) return null;
    if (!isValidTimeRange(start, end)) {
      return 'Czas zakończenia musi być późniejszy niż czas rozpoczęcia';
    }
    return null;
  });

  readonly memberError = computed(() => {
    if (!this.isEditMode() || this.editIsShared()) return null;
    if (!this.editFamilyMemberId()) {
      return 'Wybierz członka rodziny lub zaznacz jako wspólną aktywność';
    }
    return null;
  });

  readonly editDuration = computed(() => {
    if (!this.isEditMode()) return '';
    const start = this.editStartTime();
    const end = this.editEndTime();
    if (!start || !end || this.timeError()) return '';
    return calculateDuration(start, end);
  });

  readonly canSave = computed(() => {
    if (!this.isEditMode()) return false;
    if (!this.editTitle().trim()) return false;
    if (this.timeError()) return false;
    if (this.memberError()) return false;
    return true;
  });

  /**
   * Computed: Duration string (view mode)
   */
  readonly duration = computed(() => {
    const act = this.activity();
    if (!act) return '';
    return calculateDuration(act.block.startTime, act.block.endTime);
  });

  /**
   * Computed: Day of week + date label
   */
  readonly dayLabel = computed(() => {
    const act = this.activity();
    if (!act) return '';

    const date = parseISODate(act.day);
    if (isNaN(date.getTime())) {
      return '';
    }

    const dayNames = [
      'Poniedziałek',
      'Wtorek',
      'Środa',
      'Czwartek',
      'Piątek',
      'Sobota',
      'Niedziela',
    ];

    const jsDay = date.getDay(); // 0=Sunday ... 6=Saturday
    const index = jsDay === 0 ? 6 : jsDay - 1;

    const dayName = dayNames[index] ?? '';
    const dateText = formatDisplayDateWithYear(date);

    return dayName ? `${dayName}, ${dateText}` : dateText;
  });

  /**
   * Initialize form when activity changes
   */
  private readonly activityEffect = effect(() => {
    const act = this.activity();
    if (act) {
      this.editTitle.set(act.block.title);
      this.editStartTime.set(act.block.startTime);
      this.editEndTime.set(act.block.endTime);
      this.editBlockType.set(act.block.type);
      this.editIsShared.set(act.isShared);
      this.editFamilyMemberId.set(act.isShared ? null : act.member.id);
      this.editDescription.set(act.block.description || '');
      this.isEditMode.set(false);
      this.isSaving.set(false);
      this.isDeleting.set(false);
    }
  });

  /**
   * Handle Escape key
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isEditMode()) {
      this.cancelEdit();
    } else {
      this.onClose();
    }
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(): void {
    if (!this.isEditMode()) {
      this.onClose();
    }
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

  /**
   * Start edit mode
   */
  startEdit(): void {
    this.isEditMode.set(true);
  }

  /**
   * Cancel edit mode
   */
  cancelEdit(): void {
    const act = this.activity();
    if (act) {
      // Reset form to original values
      this.editTitle.set(act.block.title);
      this.editStartTime.set(act.block.startTime);
      this.editEndTime.set(act.block.endTime);
      this.editBlockType.set(act.block.type);
      this.editIsShared.set(act.isShared);
      this.editFamilyMemberId.set(act.isShared ? null : act.member.id);
      this.editDescription.set(act.block.description || '');
    }
    this.isEditMode.set(false);
  }

  /**
   * Handle shared checkbox change
   */
  onSharedChange(checked: boolean): void {
    this.editIsShared.set(checked);
    if (checked) {
      this.editFamilyMemberId.set(null);
    }
  }

  /**
   * Save changes
   */
  onSave(): void {
    if (!this.canSave() || this.isSaving()) return;

    const act = this.activity();
    if (!act) return;

    const day = act.day;
    const startTime = this.editStartTime();
    const endTime = this.editEndTime();

    if (!startTime || !endTime) return;

    const timeRange = buildTimeRange(day, startTime, endTime);

    const metadata: Record<string, any> = {};
    const description = this.editDescription().trim();
    if (description) {
      metadata['description'] = description;
    }
    // Preserve emoji if it exists
    if (act.block.emoji) {
      metadata['emoji'] = act.block.emoji;
    }

    this.save.emit({
      blockId: act.block.id,
      scheduleId: this.scheduleId(),
      title: this.editTitle().trim(),
      blockType: this.editBlockType(),
      familyMemberId: this.editIsShared() ? null : this.editFamilyMemberId(),
      timeRange,
      isShared: this.editIsShared(),
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });
  }

  /**
   * Delete activity
   */
  onDelete(): void {
    if (this.isDeleting()) return;

    const act = this.activity();
    if (!act) return;

    if (!confirm('Czy na pewno chcesz usunąć tę aktywność?')) {
      return;
    }

    this.delete.emit({
      scheduleId: this.scheduleId(),
      blockId: act.block.id,
    });
  }
}
