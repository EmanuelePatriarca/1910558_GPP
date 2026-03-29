import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DashboardStore } from '../../core/store/dashboard.store';
import { SensorEventRequestEnum } from '../../core/models/sensor.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe], // Used for history table formatting natively
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  host: { class: 'flex flex-col flex-1 min-h-0 w-full' }
})
export class DashboardComponent implements OnInit {

  // Iniezione dello State Manager reattivo globale
  public store = inject(DashboardStore);

  ngOnInit() {
    this.store.loadInitialData(); // Trigger SSE / REST startup
  }

  // --- Helpers Puramente Visivi per Map Enum -> CSS --- //

  getSensorColorTheme(event?: SensorEventRequestEnum): string {
    switch(event) {
      case SensorEventRequestEnum.EARTHQUAKE: 
        return 'bg-yellow-400 border-yellow-500 text-yellow-900';
      case SensorEventRequestEnum.CONVENTIONAL_EXPLOSION: 
        return 'bg-amber-500 border-amber-600 text-amber-950';
      case SensorEventRequestEnum.NUCLEAR_LIKE: 
        return 'bg-red-600/90 border-red-700 text-white';
      default: 
        return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
    }
  }

  getEventColorClass(event?: SensorEventRequestEnum): string {
    switch(event) {
      case SensorEventRequestEnum.EARTHQUAKE: return 'text-yellow-500 font-medium';
      case SensorEventRequestEnum.CONVENTIONAL_EXPLOSION: return 'text-amber-500 font-medium';
      case SensorEventRequestEnum.NUCLEAR_LIKE: return 'text-red-500 font-bold';
      default: return 'text-emerald-500';
    }
  }

  getEventLabel(event?: SensorEventRequestEnum): string {
    switch(event) {
      case SensorEventRequestEnum.EARTHQUAKE: return 'Earthquake';
      case SensorEventRequestEnum.CONVENTIONAL_EXPLOSION: return 'Conventional Explosion';
      case SensorEventRequestEnum.NUCLEAR_LIKE: return 'Nuclear-like event';
      default: return 'OK';
    }
  }

  onFilterChange(filterObj: { [key: string]: string }) {
     this.store.updateFilters(filterObj);
  }
}
