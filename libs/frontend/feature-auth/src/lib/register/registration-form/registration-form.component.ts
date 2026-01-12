import { Component, input, output, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormBuilder, 
  FormGroup, 
  ReactiveFormsModule, 
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { RegistrationData } from '@family-planner/frontend/data-access-auth';

/**
 * RegistrationFormComponent - Reactive form for user registration
 * 
 * Features:
 * - Email, password, confirm password, display name fields
 * - Email validation
 * - Password strength indicator
 * - Password match validator
 * - GDPR compliance checkbox (Terms & Privacy Policy)
 * - Password visibility toggles
 * - Loading state
 * - Error display
 * - ARIA labels for accessibility
 */
@Component({
  selector: 'fp-registration-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="registration-form">
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
        <label for="email" class="form-label">Email *</label>
        <input
          id="email"
          type="email"
          formControlName="email"
          class="form-input"
          [class.input-error]="isFieldInvalid('email')"
          placeholder="your@email.com"
          autocomplete="email"
          [disabled]="loading()"
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

      <!-- Display Name field (optional) -->
      <div class="form-group">
        <label for="displayName" class="form-label">Display Name <span class="optional">(optional)</span></label>
        <input
          id="displayName"
          type="text"
          formControlName="displayName"
          class="form-input"
          placeholder="John Doe"
          autocomplete="name"
          [disabled]="loading()"
        />
      </div>

      <!-- Password field -->
      <div class="form-group">
        <label for="password" class="form-label">Password *</label>
        <div class="password-input-wrapper">
          <input
            id="password"
            [type]="showPassword() ? 'text' : 'password'"
            formControlName="password"
            class="form-input"
            [class.input-error]="isFieldInvalid('password')"
            placeholder="Create a strong password"
            autocomplete="new-password"
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
        
        <!-- Password strength indicator -->
        @if (form.get('password')?.value) {
          <div class="password-strength" [attr.data-strength]="passwordStrength()">
            <div class="strength-bar"></div>
            <span class="strength-text">
              {{ passwordStrengthText() }}
            </span>
          </div>
        }
        
        @if (isFieldInvalid('password')) {
          <span class="field-error" role="alert">
            @if (form.get('password')?.hasError('required')) {
              Password is required
            }
            @if (form.get('password')?.hasError('minlength')) {
              Password must be at least 8 characters
            }
          </span>
        }
      </div>

      <!-- Confirm Password field -->
      <div class="form-group">
        <label for="confirmPassword" class="form-label">Confirm Password *</label>
        <div class="password-input-wrapper">
          <input
            id="confirmPassword"
            [type]="showConfirmPassword() ? 'text' : 'password'"
            formControlName="confirmPassword"
            class="form-input"
            [class.input-error]="isFieldInvalid('confirmPassword')"
            placeholder="Re-enter your password"
            autocomplete="new-password"
            [disabled]="loading()"
          />
          <button
            type="button"
            class="password-toggle"
            (click)="toggleConfirmPasswordVisibility()"
            [disabled]="loading()"
            [attr.aria-label]="showConfirmPassword() ? 'Hide password' : 'Show password'"
          >
            {{ showConfirmPassword() ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
        @if (isFieldInvalid('confirmPassword')) {
          <span class="field-error" role="alert">
            @if (form.get('confirmPassword')?.hasError('required')) {
              Please confirm your password
            }
            @if (form.get('confirmPassword')?.hasError('passwordMismatch')) {
              Passwords do not match
            }
          </span>
        }
      </div>

      <!-- GDPR Compliance checkbox -->
      <div class="form-group checkbox-group">
        <label class="checkbox-label" [class.label-error]="isFieldInvalid('acceptTerms')">
          <input
            type="checkbox"
            formControlName="acceptTerms"
            class="checkbox-input"
            [disabled]="loading()"
          />
          <span>
            I agree to the <a href="#" target="_blank" rel="noopener">Terms of Service</a> 
            and <a href="#" target="_blank" rel="noopener">Privacy Policy</a> *
          </span>
        </label>
        @if (isFieldInvalid('acceptTerms')) {
          <span class="field-error" role="alert">
            You must accept the terms to continue
          </span>
        }
      </div>

      <!-- Submit button -->
      <button
        type="submit"
        class="submit-button"
        [disabled]="form.invalid || loading()"
      >
        @if (loading()) {
          <span class="spinner" aria-hidden="true"></span>
          <span>Creating account...</span>
        } @else {
          <span>Create Account</span>
        }
      </button>
    </form>
  `,
  styles: [`
    .registration-form {
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

      .optional {
        font-weight: 400;
        color: #718096;
        font-size: 0.85rem;
      }
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

    .password-strength {
      margin-top: 0.5rem;
      
      .strength-bar {
        height: 4px;
        background: #e2e8f0;
        border-radius: 2px;
        overflow: hidden;
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          transition: all 0.3s ease;
          border-radius: 2px;
        }
      }
      
      &[data-strength="weak"] .strength-bar::after {
        width: 33%;
        background: #fc8181;
      }
      
      &[data-strength="medium"] .strength-bar::after {
        width: 66%;
        background: #f6ad55;
      }
      
      &[data-strength="strong"] .strength-bar::after {
        width: 100%;
        background: #48bb78;
      }
      
      .strength-text {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.8rem;
        font-weight: 500;
      }
      
      &[data-strength="weak"] .strength-text {
        color: #e53e3e;
      }
      
      &[data-strength="medium"] .strength-text {
        color: #dd6b20;
      }
      
      &[data-strength="strong"] .strength-text {
        color: #38a169;
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
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #4a5568;
      cursor: pointer;
      user-select: none;
      line-height: 1.5;

      &.label-error {
        color: #e53e3e;
      }

      a {
        color: #667eea;
        text-decoration: underline;
        
        &:hover {
          color: #764ba2;
        }
      }
    }

    .checkbox-input {
      width: 18px;
      height: 18px;
      margin-top: 2px;
      cursor: pointer;
      flex-shrink: 0;
      
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
export class RegistrationFormComponent implements OnInit {
  // Inputs
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);

  // Outputs
  readonly submitRegistration = output<RegistrationData>();
  readonly clearError = output<void>();

  // Form
  private readonly fb = inject(FormBuilder);
  protected form!: FormGroup;

  // State
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  // Computed password strength
  protected readonly passwordStrength = computed(() => {
    const password = this.form?.get('password')?.value || '';
    return this.calculatePasswordStrength(password);
  });

  protected readonly passwordStrengthText = computed(() => {
    const strength = this.passwordStrength();
    switch (strength) {
      case 'weak': return 'Weak password';
      case 'medium': return 'Medium strength';
      case 'strong': return 'Strong password';
      default: return '';
    }
  });

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Initialize reactive form with validators
   */
  private initializeForm(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      displayName: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Custom validator to check if passwords match
   */
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (confirmPassword.value === '') {
      return null;
    }

    return password.value === confirmPassword.value 
      ? null 
      : { passwordMismatch: true };
  }

  /**
   * Calculate password strength
   */
  private calculatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
    if (password.length === 0) return 'weak';
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength++;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength++;
    
    // Contains number
    if (/\d/.test(password)) strength++;
    
    // Contains special character
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  }

  /**
   * Check if field is invalid and touched
   */
  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    
    if (fieldName === 'confirmPassword') {
      return !!(field && (field.invalid || this.form.hasError('passwordMismatch')) && (field.dirty || field.touched));
    }
    
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Toggle password visibility
   */
  protected togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  /**
   * Toggle confirm password visibility
   */
  protected toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(value => !value);
  }

  /**
   * Handle form submission
   */
  protected onSubmit(): void {
    if (this.form.valid && !this.loading()) {
      const data: RegistrationData = {
        email: this.form.value.email,
        password: this.form.value.password,
        displayName: this.form.value.displayName || undefined
      };
      this.submitRegistration.emit(data);
    }
  }

  /**
   * Clear error message
   */
  protected onClearError(): void {
    this.clearError.emit();
  }
}
