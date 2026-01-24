import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ScheduleGeneratorService } from '../../services/schedule-generator.service';
import {
  GenerateScheduleRequest,
  ScheduleGenerationResponse,
  ScheduleGenerationStrategy,
} from '../../models/schedule-generator.models';
import {
  addDays,
  getMonday,
  parseISODate,
  formatISODate,
} from '../../utils/date.utils';

@Component({
  selector: 'app-schedule-generator-panel',
  standalone: true,
  imports: [CommonModule],
  providers: [ScheduleGeneratorService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overlay">
      <div class="panel">
        <header>
          <div>
            <h2>Generator harmonogramu AI</h2>
            <p>
              Wybierz tydzień i strategię, a AI przygotuje plan uwzględniający
              Twoje cele.
            </p>
          </div>
          <button class="close" type="button" (click)="handleClose()">✕</button>
        </header>

        <section class="form-grid">
          <label>
            <span>Tydzień od</span>
            <input
              type="date"
              [value]="weekStartDate()"
              (change)="onWeekChange($any($event.target).value)"
            />
          </label>

          <label>
            <span>Strategia</span>
            <select
              [value]="strategy()"
              (change)="onStrategyChange($any($event.target).value)"
            >
              @for (option of strategyOptions; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </label>

          <div class="checkbox-grid">
            <label>
              <input
                type="checkbox"
                [checked]="respectFixedBlocks()"
                (change)="respectFixedBlocks.set($any($event.target).checked)"
              />
              Uwzględnij fixed blocks
            </label>
            <label>
              <input
                type="checkbox"
                [checked]="includeAllGoals()"
                (change)="includeAllGoals.set($any($event.target).checked)"
              />
              Uwzględnij wszystkie cele
            </label>
            <label>
              <input
                type="checkbox"
                [checked]="preferMornings()"
                (change)="preferMornings.set($any($event.target).checked)"
              />
              Preferuj poranki
            </label>
            <label>
              <input
                type="checkbox"
                [checked]="maximizeFamilyTime()"
                (change)="maximizeFamilyTime.set($any($event.target).checked)"
              />
              Maksymalizuj czas rodzinny
            </label>
          </div>
        </section>

        <section class="actions">
          <button
            class="primary"
            type="button"
            [disabled]="isGenerating()"
            (click)="generate()"
          >
            @if (isGenerating()) {
            <span>Generuję...</span>
            } @else {
            <span>Generuj harmonogram</span>
            }
          </button>
          <button class="tertiary" type="button" (click)="handleClose()">
            Anuluj
          </button>
        </section>

        @if (generationError()) {
        <section class="status error">
          <p>{{ generationError() }}</p>
        </section>
        } @if (generationResult(); as result) {
        <section class="summary">
          <h3>Podsumowanie wygenerowanego harmonogramu</h3>
          <div class="summary-grid">
            <div>Bloków: {{ result.summary.totalBlocks }}</div>
            <div>
              Celi zaplanowano: {{ result.summary.goalsScheduled }}/{{
                result.summary.totalGoals
              }}
            </div>
            <div>Konfliktów: {{ result.summary.conflicts }}</div>
          </div>
          <div class="summary-actions">
            <button class="secondary" type="button" (click)="reset()">
              Regeneruj
            </button>
            <button class="primary" type="button" (click)="handleClose()">
              Zamknij
            </button>
          </div>
        </section>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        z-index: 2000;
      }

      .panel {
        width: min(640px, 100%);
        background: #ffffff;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.25);
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }

      header h2 {
        margin: 0;
        font-size: 20px;
      }

      header p {
        margin: 4px 0 0;
        color: #4b5563;
        font-size: 14px;
      }

      .close {
        background: transparent;
        border: 1px solid #e5e7eb;
        border-radius: 999px;
        width: 32px;
        height: 32px;
        font-size: 18px;
        line-height: 1;
        cursor: pointer;
      }

      .form-grid {
        display: grid;
        gap: 12px;
      }

      label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 14px;
        font-weight: 600;
        color: #111827;
      }

      input,
      select {
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid #d1d5db;
        font-size: 14px;
      }

      .checkbox-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 8px;
      }

      .checkbox-grid label {
        flex-direction: row;
        align-items: center;
        font-weight: 500;
      }

      .checkbox-grid input {
        margin-right: 6px;
      }

      .actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      button {
        border: none;
        border-radius: 8px;
        padding: 12px 20px;
        font-weight: 600;
        cursor: pointer;
      }

      .primary {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: #fff;
      }

      .secondary {
        background: #e5e7eb;
        color: #111827;
      }

      .tertiary {
        background: transparent;
        border: 1px solid #d1d5db;
      }

      .status.error {
        background: #fee2e2;
        color: #991b1b;
        border-radius: 8px;
        padding: 12px;
      }

      .summary {
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px;
        font-weight: 600;
        margin-bottom: 12px;
      }

      .summary-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `,
  ],
})
export class ScheduleGeneratorPanelComponent {
  private readonly generatorService = inject(ScheduleGeneratorService);

  readonly generated = output<ScheduleGenerationResponse>();
  readonly close = output<void>();

  private readonly defaultWeekStart = this.getDefaultWeekStart();
  readonly weekStartDate = signal(this.defaultWeekStart);

  private readonly options = [
    { value: 'balanced', label: 'Balanced' },
    { value: 'energy-optimized', label: 'Work-focused' },
    { value: 'goal-focused', label: 'Family-focused' },
  ] as const;
  readonly strategyOptions = this.options;
  readonly strategy = signal<ScheduleGenerationStrategy>('balanced');

  readonly respectFixedBlocks = signal(true);
  readonly includeAllGoals = signal(true);
  readonly preferMornings = signal(false);
  readonly maximizeFamilyTime = signal(false);

  readonly isGenerating = signal(false);
  readonly generationResult = signal<ScheduleGenerationResponse | null>(null);
  readonly generationError = signal<string | null>(null);

  @Input()
  set initialWeek(value: Date | string | undefined) {
    if (!value) {
      this.weekStartDate.set(this.defaultWeekStart);
      return;
    }

    const formatted = typeof value === 'string' ? value : formatISODate(value);
    this.weekStartDate.set(this.normalizeWeekStart(formatted));
  }

  async generate(): Promise<void> {
    if (this.isGenerating()) {
      return;
    }

    this.isGenerating.set(true);
    this.generationError.set(null);

    try {
      const payload: GenerateScheduleRequest = {
        weekStartDate: this.weekStartDate(),
        strategy: this.strategy(),
        preferences: {
          respectFixedBlocks: this.respectFixedBlocks(),
          includeAllGoals: this.includeAllGoals(),
          preferMornings: this.preferMornings(),
          maximizeFamilyTime: this.maximizeFamilyTime(),
        },
      };

      const response = await lastValueFrom(
        this.generatorService.generateSchedule(payload)
      );
      this.generationResult.set(response);
      this.generated.emit(response);
    } catch (error) {
      const message =
        error instanceof HttpErrorResponse
          ? error.error?.message || error.statusText || 'Błąd serwera'
          : 'Nie udało się wygenerować harmonogramu.';
      this.generationError.set(message);
    } finally {
      this.isGenerating.set(false);
    }
  }

  handleClose(): void {
    this.close.emit();
  }

  reset(): void {
    this.generationResult.set(null);
    this.generationError.set(null);
  }

  onStrategyChange(value: string): void {
    this.strategy.set(value as ScheduleGenerationStrategy);
  }

  onWeekChange(value: string): void {
    this.weekStartDate.set(this.normalizeWeekStart(value));
  }

  private normalizeWeekStart(value: string): string {
    const parsed = parseISODate(value);
    if (isNaN(parsed.getTime())) {
      return this.defaultWeekStart;
    }
    return formatISODate(getMonday(parsed));
  }

  private getDefaultWeekStart(): string {
    const nextWeek = addDays(new Date(), 7);
    return formatISODate(getMonday(nextWeek));
  }
}
