import { Component, inject } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavigationComponent } from './shared/navigation/navigation.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  imports: [CommonModule, RouterModule, NavigationComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'Family Life Planner';
  private readonly router = inject(Router);
  
  protected readonly isAuthPage = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        const url = this.router.url;
        return url.includes('/login') || url.includes('/register');
      }),
      startWith(
        this.router.url.includes('/login') || this.router.url.includes('/register')
      )
    ),
    { initialValue: false }
  );
}
