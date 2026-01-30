import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LoginFormComponent } from './login-form/login-form.component';
import {
  AuthStore,
  LoginCredentials,
} from '@family-planner/frontend/data-access-auth';

/**
 * LoginViewComponent - Main login view
 *
 * Route: /login
 * Public route (PublicOnlyGuard redirects authenticated users to dashboard)
 *
 * Features:
 * - Email/password login form
 * - Link to registration
 * - Remember me checkbox
 * - Error handling with user-friendly messages
 */
@Component({
  selector: 'fp-login-view',
  imports: [CommonModule, RouterModule, LoginFormComponent],
  template: `
    <div class="login-view">
      <div class="login-container">
        <div class="login-header">
          <h1 class="app-title">🏠 Family Life Planner</h1>
          <h2 class="login-title">Welcome Back</h2>
          <p class="login-subtitle">Sign in to plan your family's week</p>
        </div>

        <fp-login-form
          [loading]="authStore.loading()"
          [error]="authStore.error()"
          (submitLogin)="onLogin($event)"
          (clearError)="onClearError()"
        />

        <div class="login-footer">
          <p>
            Don't have an account?
            <a routerLink="/register" class="register-link">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .login-view {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
        overflow: hidden;
      }

      .login-container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        padding: 2rem 2.5rem;
        width: 100%;
        max-width: 420px;
        max-height: calc(100vh - 2rem);
        overflow-y: auto;
      }

      .login-header {
        text-align: center;
        margin-bottom: 1.5rem;
      }

      .app-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #667eea;
        margin: 0 0 0.75rem 0;
      }

      .login-title {
        font-size: 1.35rem;
        font-weight: 600;
        color: #1a202c;
        margin: 0 0 0.5rem 0;
      }

      .login-subtitle {
        font-size: 0.9rem;
        color: #718096;
        margin: 0;
      }

      .login-footer {
        margin-top: 1.25rem;
        text-align: center;
        font-size: 0.9rem;
        color: #4a5568;
      }

      .register-link {
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
        .login-view {
          padding: 0.5rem;
        }

        .login-container {
          padding: 1.5rem;
          max-height: calc(100vh - 1rem);
        }

        .login-header {
          margin-bottom: 1.25rem;
        }

        .app-title {
          font-size: 1.35rem;
        }

        .login-title {
          font-size: 1.2rem;
        }
      }

      @media (max-height: 700px) {
        .login-container {
          padding: 1.5rem 2rem;
        }

        .login-header {
          margin-bottom: 1rem;
        }

        .app-title {
          font-size: 1.35rem;
          margin-bottom: 0.5rem;
        }

        .login-title {
          font-size: 1.2rem;
        }

        .login-subtitle {
          font-size: 0.85rem;
        }

        .login-footer {
          margin-top: 1rem;
        }
      }
    `,
  ],
})
export class LoginViewComponent {
  protected readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  /**
   * Handle login form submission
   */
  protected onLogin(credentials: LoginCredentials): void {
    this.authStore.login(credentials).subscribe({
      next: () => {
        // Navigation handled by AuthStore
        console.log('Login successful');
      },
      error: (error) => {
        // Error already set in AuthStore signal
        console.error('Login failed:', error);
      },
    });
  }

  /**
   * Clear error message
   */
  protected onClearError(): void {
    this.authStore.clearError();
  }
}
