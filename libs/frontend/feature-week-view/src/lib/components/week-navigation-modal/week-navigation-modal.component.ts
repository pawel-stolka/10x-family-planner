import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  ActivityInCell,
  FamilyMemberViewModel,
} from '../../models/week-grid.models';
import { BlockType } from '@family-planner/shared/models-schedule';
import { parseISODate } from '../../utils/date.utils';
import { trigger, transition, style, animate } from '@angular/animations';
import {
  calculateDuration,
  parseTime,
  formatTime,
} from '../../utils/time.utils';

/**
 * Week Navigation Modal Component
 * (Now used as Quick Add Activity modal for a specific cell: day + time)
 */
@Component({
  selector: 'app-week-navigation-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick()" @fadeIn>
      <div class="modal-content" (click)="onContentClick($event)" @slideIn>
        <!-- Header -->
        <div class="modal-header">
          <h2>➕ Nowa aktywność</h2>
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
          <!-- Activity Details Section (if activities exist) -->
          @if (activities().length > 0) {
          <section class="activity-details-section">
            <h3>⏰ Aktywności w {{ cellInfoText() }}</h3>
            <div class="activities-list">
              @for (activity of activities(); track activity.id) {
              <div
                class="activity-item"
                [class.expanded]="expandedActivityId() === activity.id"
                (click)="toggleActivityDetails(activity.id)"
              >
                <div class="activity-header">
                  <div class="activity-title">
                    @if (activity.block.emoji) {
                    <span class="emoji">{{ activity.block.emoji }}</span>
                    }
                    <span>{{ activity.block.title }}</span>
                  </div>
                  <div class="activity-meta">
                    <span class="time"
                      >{{ activity.block.startTime }} -
                      {{ activity.block.endTime }}</span
                    >
                    <span class="member" [style.color]="activity.member.color">
                      {{ activity.member.name }}
                    </span>
                  </div>
                </div>
                @if (expandedActivityId() === activity.id) {
                <div class="activity-details">
                  <div class="detail-row">
                    <span class="label">Czas trwania:</span>
                    <span>{{ calculateActivityDuration(activity) }}</span>
                  </div>
                  @if (activity.block.description) {
                  <div class="detail-row">
                    <span class="label">Opis:</span>
                    <span>{{ activity.block.description }}</span>
                  </div>
                  }
                  <div class="detail-row">
                    <span class="label">Typ:</span>
                    <span>{{ activity.block.type }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Kategoria:</span>
                    <span>{{ activity.block.isGoal ? 'Cel' : 'Stałe' }}</span>
                  </div>
                  @if (activity.isShared) {
                  <div class="detail-row">
                    <span class="label">Wspólna aktywność rodzinna</span>
                  </div>
                  } @if (activity.hasConflict) {
                  <div class="conflict-warning">⚠️ Konflikt harmonogramu</div>
                  }
                </div>
                }
              </div>
              }
            </div>
          </section>
          }

          <!-- Quick Add Activity Section -->
          <div class="divider"></div>
          <section class="quick-add-section">
            <h3>➕ Dodaj aktywność</h3>
            <form [formGroup]="activityForm" (ngSubmit)="onAddActivity()">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Tytuł</mat-label>
                  <input
                    matInput
                    formControlName="title"
                    placeholder="np. Trening"
                  />
                  @if (activityForm.get('title')?.hasError('required') &&
                  activityForm.get('title')?.touched) {
                  <mat-error>Tytuł jest wymagany</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Typ</mat-label>
                  <mat-select formControlName="blockType">
                    <mat-option value="WORK">Praca</mat-option>
                    <mat-option value="ACTIVITY">Aktywność</mat-option>
                    <mat-option value="MEAL">Posiłek</mat-option>
                    <mat-option value="OTHER">Inne</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Członek rodziny</mat-label>
                  <mat-select formControlName="familyMemberId">
                    <mat-option value="">Wspólna aktywność</mat-option>
                    @for (member of availableMembers(); track member.id) {
                    <mat-option [value]="member.id">{{
                      member.name
                    }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Godzina rozpoczęcia</mat-label>
                  <input matInput type="time" formControlName="startTime" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Godzina zakończenia</mat-label>
                  <input matInput type="time" formControlName="endTime" />
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-checkbox formControlName="isShared">
                  Wspólna aktywność rodzinna
                </mat-checkbox>
              </div>

              @if (errorMessage()) {
              <div class="error-message">
                {{ errorMessage() }}
              </div>
              }

              <div class="form-actions">
                <button
                  mat-raised-button
                  color="primary"
                  class="submit-btn"
                  type="submit"
                  [disabled]="activityForm.invalid || isAddingActivity()"
                >
                  @if (isAddingActivity()) {
                  <span>Dodawanie...</span>
                  } @else {
                  <span>Dodaj aktywność</span>
                  }
                </button>
                <button mat-button type="button" (click)="resetActivityForm()">
                  Anuluj
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
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
        max-width: 700px;
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

      .modal-body {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
      }

      .divider {
        height: 1px;
        background: #e5e7eb;
        margin: 24px 0;
      }

      section {
        margin-bottom: 24px;
      }

      section:last-child {
        margin-bottom: 0;
      }

      section h3 {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
        margin: 0 0 16px 0;
      }

      .activity-details-section {
        .activities-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .activity-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .activity-item:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .activity-item.expanded {
          background: #f0f9ff;
          border-color: #3b82f6;
        }

        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .activity-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #111827;
          max-width: 260px;
        }

        .activity-title span:last-child {
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .emoji {
          font-size: 18px;
        }

        .activity-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          font-size: 11px;
          color: #6b7280;
        }

        .activity-details {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        .detail-row {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .detail-row .label {
          font-weight: 600;
          color: #374151;
          min-width: 120px;
        }

        .conflict-warning {
          margin-top: 8px;
          padding: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          color: #991b1b;
          font-size: 13px;
        }
      }

      .quick-add-section {
        form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-row:first-child {
          grid-template-columns: 1fr;
        }

        mat-form-field {
          width: 100%;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .error-message {
          padding: 12px 16px;
          background: #fee2e2;
          border: 1px solid #fca5a5;
          border-radius: 8px;
          color: #991b1b;
          font-size: 14px;
          margin-bottom: 16px;
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

      /* Inputs & selects - inner padding for text */
      :host ::ng-deep .quick-add-section input.mat-mdc-input-element {
        padding-left: 6px;
      }

      :host ::ng-deep .quick-add-section .mat-mdc-select-trigger {
        padding-left: 6px;
      }

      /* Primary submit button - stronger blue CTA */
      .quick-add-section .form-actions .submit-btn {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: #ffffff;
        font-weight: 600;
      }

      .quick-add-section .form-actions .submit-btn:hover:not([disabled]) {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
      }

      /* Material select overrides scoped to this modal */
      :host ::ng-deep .cdk-overlay-pane .mat-mdc-select-panel {
        background: #ffffff !important;
        box-shadow: 0 4px 16px rgba(15, 23, 42, 0.25);
        border-radius: 8px;
      }

      :host ::ng-deep .mat-mdc-option .mdc-list-item__primary-text {
        padding-left: 8px;
      }

      :host ::ng-deep .mat-mdc-select-trigger {
        padding-left: 4px;
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
export class WeekNavigationModalComponent {
  private readonly fb = inject(FormBuilder);

  // Inputs
  activities = input<ActivityInCell[]>([]);
  cellInfo = input<{ day: string; timeSlot: string }>();
  availableMembers = input<FamilyMemberViewModel[]>([]);

  // Outputs
  activityAdd = output<{
    title: string;
    blockType: BlockType;
    familyMemberId?: string;
    startTime: string;
    endTime: string;
    isShared: boolean;
    day: string;
  }>();
  close = output<void>();

  // State
  readonly expandedActivityId = signal<string | null>(null);
  readonly isAddingActivity = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  // Form
  readonly activityForm = this.fb.group({
    title: ['', [Validators.required]],
    blockType: [BlockType.ACTIVITY, [Validators.required]],
    familyMemberId: [''],
    startTime: ['09:00', [Validators.required]],
    endTime: ['10:00', [Validators.required]],
    isShared: [false],
  });

  /**
   * Effect: Update form times when cellInfo changes
   */
  private readonly cellInfoEffect = effect(() => {
    const info = this.cellInfo();
    if (info?.timeSlot) {
      const startTime = info.timeSlot;
      const endTime = this.calculateEndTime(startTime);

      this.activityForm.patchValue(
        {
          startTime,
          endTime,
        },
        { emitEvent: false }
      );
    }
  });

  readonly cellInfoText = computed(() => {
    const info = this.cellInfo();
    if (!info) return '';
    const dayNames = [
      'Poniedziałek',
      'Wtorek',
      'Środa',
      'Czwartek',
      'Piątek',
      'Sobota',
      'Niedziela',
    ];
    const date = parseISODate(info.day);
    const dayOfWeek = date.getDay();
    const dayName = dayOfWeek === 0 ? dayNames[6] : dayNames[dayOfWeek - 1];
    return `${dayName}, ${info.timeSlot}`;
  });

  constructor() {}

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

  /**
   * Toggle activity details
   */
  toggleActivityDetails(activityId: string): void {
    if (this.expandedActivityId() === activityId) {
      this.expandedActivityId.set(null);
    } else {
      this.expandedActivityId.set(activityId);
    }
  }

  /**
   * Calculate activity duration
   */
  calculateActivityDuration(activity: ActivityInCell): string {
    return calculateDuration(activity.block.startTime, activity.block.endTime);
  }

  /**
   * Handle add activity form submit
   */
  onAddActivity(): void {
    if (this.activityForm.invalid || !this.cellInfo()) {
      return;
    }

    const formValue = this.activityForm.value;

    this.activityAdd.emit({
      title: formValue.title!,
      blockType: formValue.blockType as BlockType,
      familyMemberId: formValue.familyMemberId || undefined,
      startTime: formValue.startTime!,
      endTime: formValue.endTime!,
      isShared: formValue.isShared || false,
      day: this.cellInfo()!.day,
    });

    // Note: Loading state is controlled by parent component
    // Form will be reset by parent after successful API call
  }

  /**
   * Calculate end time from start time (+1 hour default)
   */
  private calculateEndTime(startTime: string): string {
    const startMinutes = parseTime(startTime);
    const endMinutes = startMinutes + 60; // Add 1 hour
    return formatTime(endMinutes);
  }

  /**
   * Reset activity form
   */
  resetActivityForm(): void {
    const info = this.cellInfo();
    const startTime = info?.timeSlot || '09:00';
    const endTime = this.calculateEndTime(startTime);

    this.activityForm.reset({
      title: '',
      blockType: BlockType.ACTIVITY,
      familyMemberId: '',
      startTime,
      endTime,
      isShared: false,
    });
  }
}
