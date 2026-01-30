import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RegistrationFormComponent } from './registration-form/registration-form.component';
import { AuthStore, RegistrationData } from '@family-planner/frontend/data-access-auth';

/**
 * RegisterViewComponent - Main registration view
 * 
 * Route: /register
 * Public route (PublicOnlyGuard redirects authenticated users to dashboard)
 * 
 * Features:
 * - Email/password registration form
 * - Display name (optional)
 * - Password confirmation
 * - Password strength indicator
 * - GDPR compliance checkbox
 * - Link to login
 * - Error handling with user-friendly messages
 */
@Component({
  selector: 'fp-register-view',
  imports: [CommonModule, RouterModule, RegistrationFormComponent],
  template: `
    <div class="register-view">
      <div class="register-container">
        <div class="register-header">
          <h1 class="app-title">🏠 Family Life Planner</h1>
          <h2 class="register-title">Create Your Account</h2>
          <p class="register-subtitle">Start planning your family's week in minutes</p>
        </div>

        <fp-registration-form
          [loading]="authStore.loading()"
          [error]="authStore.error()"
          (submitRegistration)="onRegister($event)"
          (clearError)="onClearError()"
        />

        <div class="register-footer">
          <p>
            Already have an account?
            <a routerLink="/login" class="login-link">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-view {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
      overflow: hidden;
    }

    .register-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      padding: 2rem 2.5rem;
      width: 100%;
      max-width: 480px;
      max-height: calc(100vh - 2rem);
      overflow-y: auto;
    }

    .register-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .app-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #667eea;
      margin: 0 0 0.75rem 0;
    }

    .register-title {
      font-size: 1.35rem;
      font-weight: 600;
      color: #1a202c;
      margin: 0 0 0.5rem 0;
    }

    .register-subtitle {
      font-size: 0.9rem;
      color: #718096;
      margin: 0;
    }

    .register-footer {
      margin-top: 1.25rem;
      text-align: center;
      font-size: 0.9rem;
      color: #4a5568;
    }

    .login-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      margin-left: 0.25rem;
      
      &:hover {
        text-decoration: underline;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .register-view {
        padding: 0.5rem;
      }

      .register-container {
        padding: 1.5rem;
        max-height: calc(100vh - 1rem);
      }

      .register-header {
        margin-bottom: 1.25rem;
      }

      .app-title {
        font-size: 1.35rem;
      }

      .register-title {
        font-size: 1.2rem;
      }
    }

    @media (max-height: 700px) {
      .register-container {
        padding: 1.5rem 2rem;
      }

      .register-header {
        margin-bottom: 1rem;
      }

      .app-title {
        font-size: 1.35rem;
        margin-bottom: 0.5rem;
      }

      .register-title {
        font-size: 1.2rem;
      }

      .register-subtitle {
        font-size: 0.85rem;
      }

      .register-footer {
        margin-top: 1rem;
      }
    }
  `]
})
export class RegisterViewComponent {
  protected readonly authStore = inject(AuthStore);

  /**
   * Handle registration form submission
   */
  protected onRegister(data: RegistrationData): void {
    this.authStore.register(data).subscribe({
      next: () => {
        // Navigation handled by AuthStore (redirect to onboarding)
        console.log('Registration successful');
      },
      error: (error) => {
        // Error already set in AuthStore signal
        console.error('Registration failed:', error);
      }
    });
  }

  /**
   * Clear error message
   */
  protected onClearError(): void {
    this.authStore.clearError();
  }
}
