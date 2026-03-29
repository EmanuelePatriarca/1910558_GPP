import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DashboardStore } from '../../core/store/dashboard.store';
import { Sensor, SensorDashboardState, SensorEventRequestEnum } from '../../core/models/sensor.model';
import { EventDistributionChartComponent } from './components/frequency-chart/event-distribution-chart.component';
import { DateRangePickerComponent, DateRange } from './components/date-range-picker/date-range-picker.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, EventDistributionChartComponent, DateRangePickerComponent],
  providers: [DatePipe], // Used for history table formatting natively
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  host: { class: 'flex flex-col flex-1 min-h-0 w-full' }
})
export class DashboardComponent implements OnInit {

  selectedSensorId = 'All';
  pickerResetKey = 0;

  // Iniezione dello State Manager reattivo globale
  public store = inject(DashboardStore);

  ngOnInit() {
    this.store.loadInitialData(); // Trigger SSE / REST startup
  }

  // --- Helpers Puramente Visivi per Map Enum -> CSS --- //

  getSensorColorTheme(sensor?: SensorDashboardState): string {
    let sensorColorClasses = '';
    switch(sensor?.lastEvent?.category_event) {
      case SensorEventRequestEnum.EARTHQUAKE: 
        sensorColorClasses = 'bg-yellow-300 border-yellow-500 text-yellow-900';
        break;
      case SensorEventRequestEnum.CONVENTIONAL_EXPLOSION: 
        sensorColorClasses = 'bg-orange-400 border-orange-600 text-orange-900';
        break;
      case SensorEventRequestEnum.NUCLEAR_LIKE: 
        sensorColorClasses = 'bg-red-500/100 border-red-700 text-white';
        break;
      default: 
        sensorColorClasses = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
    }
    if(this.selectedSensorId === sensor?.id) {
      sensorColorClasses += ' shadow-inner-heavy';
    }
    return sensorColorClasses;
  }

  getEventColorClass(event?: SensorEventRequestEnum): string {
    switch(event) {
      case SensorEventRequestEnum.EARTHQUAKE: return 'text-yellow-500 font-medium';
      case SensorEventRequestEnum.CONVENTIONAL_EXPLOSION: return 'text-orange-500 font-medium';
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

  onSensorClick(sensor: Sensor) {
    this.selectedSensorId = this.selectedSensorId === sensor.id ? 'All' : sensor.id;
    this.onFilterChange({ sensorId: this.selectedSensorId });
  }

  onDateRangeChange(range: DateRange) {
    this.store.updateFilters({
      dateFrom: range.from ? range.from.toISOString() : null,
      dateTo:   range.to   ? range.to.toISOString()   : null,
    });
  }
}
