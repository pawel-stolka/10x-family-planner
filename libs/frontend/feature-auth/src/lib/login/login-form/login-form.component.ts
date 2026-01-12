import { Component, input, output, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormBuilder, 
  FormGroup, 
  ReactiveFormsModule, 
  Validators 
} from '@angular/forms';
import { LoginCredentials } from '@family-planner/frontend/data-access-auth';

/**
 * LoginFormComponent - Reactive form for user login
 * 
 * Features:
 * - Email and password fields with validation
 * - Remember me checkbox
 * - Password visibility toggle
 * - Loading state (disabled inputs + spinner)
 * - Error display
 * - Keyboard navigation (Enter to submit)
 * - Auto-focus on email input
 * - ARIA labels for accessibility
 */
@Component({
  selector: 'fp-login-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
      <!-- Error message -->
      @if (error()) {
        <div class="error-banner" role="alert" aria-live="polite">
          <span class="error-icon">⚠️</span>
          <span class="error-message">{{ error() }}</span>
          <button 
            type="button" 
            class="error-close" 
            (click)="onClearError()"
            aria-label="Close error message"
          >
            ×
          </button>
        </div>
      }

      <!-- Email field -->
      <div class="form-group">
        <label for="email" class="form-label">Email</label>
        <input
          id="email"
          type="email"
          formControlName="email"
          class="form-input"
          [class.input-error]="isFieldInvalid('email')"
          placeholder="your@email.com"
          autocomplete="email"
          [disabled]="loading()"
          #emailInput
        />
        @if (isFieldInvalid('email')) {
          <span class="field-error" role="alert">
            @if (form.get('email')?.hasError('required')) {
              Email is required
            }
            @if (form.get('email')?.hasError('email')) {
              Please enter a valid email address
            }
          </span>
        }
      </div>

      <!-- Password field -->
      <div class="form-group">
        <label for="password" class="form-label">Password</label>
        <div class="password-input-wrapper">
          <input
            id="password"
            [type]="showPassword() ? 'text' : 'password'"
            formControlName="password"
            class="form-input"
            [class.input-error]="isFieldInvalid('password')"
            placeholder="Enter your password"
            autocomplete="current-password"
            [disabled]="loading()"
          />
          <button
            type="button"
            class="password-toggle"
            (click)="togglePasswordVisibility()"
            [disabled]="loading()"
            [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
          >
            {{ showPassword() ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
        @if (isFieldInvalid('password')) {
          <span class="field-error" role="alert">
            Password is required
          </span>
        }
      </div>

      <!-- Remember me checkbox -->
      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            formControlName="rememberMe"
            class="checkbox-input"
            [disabled]="loading()"
          />
          <span>Remember me</span>
        </label>
      </div>

      <!-- Submit button -->
      <button
        type="submit"
        class="submit-button"
        [disabled]="form.invalid || loading()"
      >
        @if (loading()) {
          <span class="spinner" aria-hidden="true"></span>
          <span>Signing in...</span>
        } @else {
          <span>Sign In</span>
        }
      </button>
    </form>
  `,
  styles: [`
    .login-form {
      width: 100%;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #fed7d7;
      border: 1px solid #fc8181;
      border-radius: 8px;
      padding: 0.875rem 1rem;
      margin-bottom: 1.5rem;
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .error-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .error-message {
      flex: 1;
      color: #742a2a;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .error-close {
      background: none;
      border: none;
      color: #742a2a;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;

      &:hover {
        background: rgba(0, 0, 0, 0.1);
      }

      &:focus {
        outline: 2px solid #fc8181;
        outline-offset: 2px;
      }
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 0.5rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      transition: all 0.2s;
      
      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      &:disabled {
        background: #f7fafc;
        cursor: not-allowed;
        opacity: 0.6;
      }

      &.input-error {
        border-color: #fc8181;
        
        &:focus {
          box-shadow: 0 0 0 3px rgba(252, 129, 129, 0.1);
        }
      }
    }

    .password-input-wrapper {
      position: relative;
    }

    .password-toggle {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;

      &:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.05);
      }

      &:focus {
        outline: 2px solid #667eea;
        outline-offset: 2px;
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }

    .field-error {
      display: block;
      margin-top: 0.375rem;
      font-size: 0.85rem;
      color: #e53e3e;
    }

    .checkbox-group {
      margin-bottom: 1.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #4a5568;
      cursor: pointer;
      user-select: none;
    }

    .checkbox-input {
      width: 18px;
      height: 18px;
      cursor: pointer;
      
      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      &:focus {
        outline: 2px solid #667eea;
        outline-offset: 2px;
      }
    }

    .submit-button {
      width: 100%;
      padding: 0.875rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      &:focus {
        outline: 2px solid #667eea;
        outline-offset: 3px;
      }
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
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoginFormComponent implements OnInit {
  // Inputs
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);

  // Outputs
  readonly submitLogin = output<LoginCredentials>();
  readonly clearError = output<void>();

  // Form
  private readonly fb = inject(FormBuilder);
  protected form!: FormGroup;

  // State
  protected readonly showPassword = signal(false);

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Initialize reactive form with validators
   */
  private initializeForm(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  /**
   * Check if field is invalid and touched
   */
  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Toggle password visibility
   */
  protected togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  /**
   * Handle form submission
   */
  protected onSubmit(): void {
    if (this.form.valid && !this.loading()) {
      const credentials: LoginCredentials = {
        email: this.form.value.email,
        password: this.form.value.password,
        rememberMe: this.form.value.rememberMe
      };
      this.submitLogin.emit(credentials);
    }
  }

  /**
   * Clear error message
   */
  protected onClearError(): void {
    this.clearError.emit();
  }
}
