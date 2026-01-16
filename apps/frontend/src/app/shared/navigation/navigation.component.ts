import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthStore } from '@family-planner/frontend/data-access-auth';

/**
 * Navigation Component
 *
 * Main navigation bar with links to different sections
 * and authentication actions.
 */
@Component({
  selector: 'fp-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly isAuthenticated = this.authStore.isAuthenticated;
  protected readonly user = this.authStore.user;

  logout(): void {
    this.authStore.logout().subscribe({
      next: () => {
        // Navigation is handled by authStore
      },
      error: (error) => {
        console.error('Logout failed:', error);
        // Navigation is handled by authStore even on error
      },
    });
  }
}
