import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import * as XLSX from 'xlsx';
import { DashboardStore } from '../../core/store/dashboard.store';
import { Sensor, SensorDashboardState, SensorEventRequestEnum } from '../../core/models/sensor.model';
import { EventDistributionChartComponent } from './components/frequency-chart/event-distribution-chart.component';
import { DateRangePickerComponent, DateRange } from './components/date-range-picker/date-range-picker.component';
import { SensorInfoPanelComponent } from './components/sensor-info-panel/sensor-info-panel.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, EventDistributionChartComponent, DateRangePickerComponent, SensorInfoPanelComponent],
  providers: [DatePipe], // Used for history table formatting natively
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  host: { class: 'flex flex-col flex-1 min-h-0 w-full' }
})
export class DashboardComponent implements OnInit {

  selectedSensorId   = 'All';
  pickerResetKey     = 0;
  /** Sensor currently shown in the info panel (null = panel closed) */
  selectedInfoSensor: SensorDashboardState | null = null;

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
      case SensorEventRequestEnum.NUCLEAR_LIKE: return 'Nuclear-like Event';
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

  /** Opens the info panel for the given sensor */
  onInfoClick(sensor: SensorDashboardState, event: MouseEvent) {
    event.stopPropagation();
    this.selectedInfoSensor = this.selectedInfoSensor?.id === sensor.id ? null : sensor;
  }

  closeInfoPanel() {
    this.selectedInfoSensor = null;
  }

  onDateRangeChange(range: DateRange) {
    this.store.updateFilters({
      dateFrom: range.from ? range.from.toISOString() : null,
      dateTo:   range.to   ? range.to.toISOString()   : null,
    });
  }

  exportToExcel() {
    const events = this.store.filteredHistory();
    if (!events || events.length === 0) return;

    // 1. Map to Flat Objects
    const data = events.map(ev => {
      const sensor = this.store.getSensorRef(ev.sensor_id);
      return {
        'Sensor': sensor?.name || 'Unknown',
        'Category': sensor?.category?.toUpperCase() || 'UNKNOWN',
        'Event': this.getEventLabel(ev.category_event),
        'Region': sensor?.region || 'Unknown',
        'Frequency (Hz)': ev.dominant_frequency.toFixed(2),
        'DateTime': new Date(ev.timestamp).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
    });

    // 2. Generate Sheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Auto-adjust column widths
    ws['!cols'] = [
      { wch: 20 }, // Sensor
      { wch: 15 }, // Category
      { wch: 25 }, // Event
      { wch: 20 }, // Region
      { wch: 15 }, // Frequency
      { wch: 25 }  // DateTime
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Event History');

    // 3. Filename Date String
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const d = pad(now.getDate());
    const m = pad(now.getMonth() + 1);
    const y = now.getFullYear();
    const h = pad(now.getHours());
    const min = pad(now.getMinutes());
    const s = pad(now.getSeconds());
    const filename = `event_report_at_${d}_${m}_${y}_${h}${min}${s}.xlsx`;

    // 4. Trigger Download
    XLSX.writeFile(wb, filename);
  }
}
