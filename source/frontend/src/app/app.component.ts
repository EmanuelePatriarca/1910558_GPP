import { Component, inject, effect, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardStore, AppAlert } from './core/store/dashboard.store';
import { DatePipe, NgClass, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DatePipe, NgClass, DecimalPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  store = inject(DashboardStore);

  isNotificationMenuOpen = signal(false);
  activeToasts = signal<AppAlert[]>([]);

  private lastAlertId: string | null = null;

  constructor() {
    effect(() => {
      const alerts = this.store.alertsHistory();
      if (alerts.length > 0) {
        const latestAlert = alerts[0];
        if (this.lastAlertId !== latestAlert.id) {
          this.lastAlertId = latestAlert.id;
          
          // Spawn toast only if it's unread / very brand new
          if (!latestAlert.isRead) {
            this.spawnToast(latestAlert);
          }
        }
      }
    }, { allowSignalWrites: true });
  }

  toggleNotificationMenu() {
    this.isNotificationMenuOpen.update(v => !v);
    if (this.isNotificationMenuOpen() && this.store.unreadAlertsCount() > 0) {
      this.store.markAllAlertsRead();
    }
  }

  closeNotificationMenu() {
    this.isNotificationMenuOpen.set(false);
  }

  spawnToast(alert: AppAlert) {
    this.activeToasts.update(t => [...t, alert]);
    setTimeout(() => {
      this.activeToasts.update(t => t.filter(x => x.id !== alert.id));
    }, 5000);
  }

  dismissToast(id: string) {
    this.activeToasts.update(t => t.filter(x => x.id !== id));
  }

  getAlertColorClass(category: string): string {
    switch (category) {
      case 'earthquake': return 'bg-yellow-500 border-yellow-400 text-yellow-950 shadow-yellow-900/20';
      case 'conventional_explosion': return 'bg-orange-500 border-orange-400 text-orange-950 shadow-orange-900/20';
      case 'nuclear_like': return 'bg-red-600 border-red-500 text-white shadow-red-900/30';
      default: return 'bg-slate-700 border-slate-600 text-white';
    }
  }

  getAlertDotColor(category: string): string {
    switch (category) {
      case 'earthquake': return 'bg-yellow-500';
      case 'conventional_explosion': return 'bg-orange-500';
      case 'nuclear_like': return 'bg-red-500';
      default: return 'bg-emerald-500';
    }
  }

  getAlertTitle(category: string): string {
    switch (category) {
      case 'earthquake': return 'EARTHQUAKE DETECTED';
      case 'conventional_explosion': return 'EXPLOSION DETECTED';
      case 'nuclear_like': return 'NUCLEAR-LIKE DETECTED';
      default: return 'ALERT DETECTED';
    }
  }
}
