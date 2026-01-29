import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthStore } from '@family-planner/frontend/data-access-auth';
import { ScheduleStore } from '@family-planner/frontend/data-access-schedule';

/**
 * DashboardPlaceholderComponent - Redirects to schedule view
 *
 * This component redirects to the schedule/week route since that's the main dashboard.
 * The week view is lazy-loaded to maintain proper code splitting.
 */
@Component({
  selector: 'fp-dashboard-placeholder',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-placeholder">
      <div class="dashboard-container">
        <div class="loading-card">
          <h2 class="loading-title">Loading Dashboard...</h2>
          <p class="loading-text">Redirecting to your weekly schedule...</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-placeholder {
        min-height: 100vh;
        background: #f7fafc;
      }

      .dashboard-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .loading-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px;
        padding: 2.5rem;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        text-align: center;
      }

      .loading-title {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0 0 1rem 0;
      }

      .loading-text {
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

      .generate-button {
        margin-top: 1.5rem;
        padding: 0.875rem 2rem;
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
        width: 100%;

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
        }

        &:focus {
          outline: 2px solid #667eea;
          outline-offset: 2px;
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
        to {
          transform: rotate(360deg);
        }
      }

      .error-message,
      .success-message {
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 8px;
        font-size: 0.95rem;
      }

      .error-message {
        background: #fed7d7;
        color: #c53030;
        border-left: 3px solid #e53e3e;
      }

      .success-message {
        background: #c6f6d5;
        color: #22543d;
        border-left: 3px solid #38a169;
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
    `,
  ],
})
export class DashboardPlaceholderComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  protected readonly scheduleStore = inject(ScheduleStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    // Redirect to the main schedule view (lazy-loaded)
    this.router.navigate(['/schedule/week']);
  }
}
