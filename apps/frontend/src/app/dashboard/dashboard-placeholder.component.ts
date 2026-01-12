import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthStore } from '@family-planner/frontend/data-access-auth';

/**
 * DashboardPlaceholderComponent - Temporary dashboard for testing navigation
 * 
 * This is a placeholder component to test:
 * - Successful login/register flow
 * - AuthGuard protection
 * - Logout functionality
 * - User data display
 */
@Component({
  selector: 'fp-dashboard-placeholder',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-placeholder">
      <div class="dashboard-header">
        <div class="header-content">
          <h1 class="app-title">🏠 Family Life Planner</h1>
          <button class="logout-button" (click)="onLogout()">
            Logout
          </button>
        </div>
      </div>

      <div class="dashboard-container">
        <div class="welcome-card">
          <h2 class="welcome-title">
            Welcome back, {{ authStore.user()?.displayName || authStore.user()?.email }}! 🎉
          </h2>
          <p class="welcome-text">
            You've successfully logged in to your Family Life Planner account.
          </p>
        </div>

        <div class="info-card">
          <h3 class="info-title">Dashboard Coming Soon</h3>
          <p class="info-text">
            This is a placeholder dashboard. The full dashboard with weekly schedule preview,
            quick actions, and usage statistics will be implemented in the next phase.
          </p>
        </div>

        <div class="user-info-card">
          <h3 class="section-title">Your Account Information</h3>
          <div class="user-details">
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">{{ authStore.user()?.email }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Display Name:</span>
              <span class="detail-value">
                {{ authStore.user()?.displayName || '(Not set)' }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Member Since:</span>
              <span class="detail-value">
                {{ authStore.user()?.createdAt | date:'medium' }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Authentication Status:</span>
              <span class="detail-value status-badge">
                ✅ Authenticated
              </span>
            </div>
          </div>
        </div>

        <div class="next-steps-card">
          <h3 class="section-title">What's Next?</h3>
          <ul class="steps-list">
            <li>📝 Complete your onboarding (family members & goals setup)</li>
            <li>🪄 Generate your first weekly schedule with AI</li>
            <li>📅 View and edit your calendar</li>
            <li>👥 Manage family members and recurring goals</li>
            <li>📊 Track your planning statistics</li>
          </ul>
          <p class="info-note">
            <strong>Note:</strong> These features will be implemented in upcoming phases.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-placeholder {
      min-height: 100vh;
      background: #f7fafc;
    }

    .dashboard-header {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      padding: 1rem 2rem;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .app-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #667eea;
      margin: 0;
    }

    .logout-button {
      padding: 0.5rem 1.25rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: #e53e3e;
      background: white;
      border: 2px solid #e53e3e;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #e53e3e;
        color: white;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(229, 62, 62, 0.3);
      }

      &:active {
        transform: translateY(0);
      }

      &:focus {
        outline: 2px solid #e53e3e;
        outline-offset: 2px;
      }
    }

    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .welcome-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      padding: 2.5rem;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .welcome-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
    }

    .welcome-text {
      font-size: 1.1rem;
      margin: 0;
      opacity: 0.95;
    }

    .info-card,
    .user-info-card,
    .next-steps-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }

    .info-title,
    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a202c;
      margin: 0 0 1rem 0;
    }

    .info-text {
      font-size: 1rem;
      color: #4a5568;
      line-height: 1.6;
      margin: 0;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f7fafc;
      border-radius: 8px;
    }

    .detail-label {
      font-weight: 600;
      color: #4a5568;
      font-size: 0.95rem;
    }

    .detail-value {
      color: #1a202c;
      font-size: 0.95rem;
    }

    .status-badge {
      background: #c6f6d5;
      color: #22543d;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .steps-list {
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      li {
        padding: 0.75rem;
        background: #f7fafc;
        border-radius: 8px;
        color: #2d3748;
        font-size: 0.95rem;
        border-left: 3px solid #667eea;
      }
    }

    .info-note {
      margin: 0;
      padding: 1rem;
      background: #fef5e7;
      border-left: 3px solid #f6ad55;
      border-radius: 8px;
      color: #744210;
      font-size: 0.9rem;

      strong {
        font-weight: 600;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .dashboard-header {
        padding: 1rem;
      }

      .app-title {
        font-size: 1.25rem;
      }

      .logout-button {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
      }

      .dashboard-container {
        padding: 1rem;
      }

      .welcome-card {
        padding: 1.5rem;
      }

      .welcome-title {
        font-size: 1.5rem;
      }

      .welcome-text {
        font-size: 1rem;
      }

      .info-card,
      .user-info-card,
      .next-steps-card {
        padding: 1.5rem;
      }

      .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `]
})
export class DashboardPlaceholderComponent {
  protected readonly authStore = inject(AuthStore);

  /**
   * Handle logout
   */
  protected onLogout(): void {
    this.authStore.logout().subscribe({
      next: () => {
        console.log('Logout successful');
      },
      error: (error) => {
        console.error('Logout failed:', error);
      }
    });
  }
}
