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

  // Stato locale per la selezione visiva sulla mappa/lista
  selectedSensorId   = 'All';
  pickerResetKey     = 0;
  
  // Sensore attualmente visualizzato nel pannello informativo laterale (null = pannello chiuso)
  selectedInfoSensor: SensorDashboardState | null = null;

  // Iniezione dello Store reattivo per la gestione dello stato globale
  public store = inject(DashboardStore);

  ngOnInit() {
    // Avvio del caricamento dati (SSE e storico REST)
    this.store.loadInitialData(); 
  }

  /** Determina lo stile visivo (colori e bordi) di un sensore in base all'ultimo evento rilevato */
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

  /** Traduce l'enum dell'evento in una descrizione testuale leggibile */
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

  /** 
   * Esporta la cronologia filtrata degli eventi in un file Excel professionale.
   */
  exportToExcel() {
    const events = this.store.filteredHistory();
    if (!events || events.length === 0) return;

    // 1. Mappatura dei dati in un formato piatto per Excel
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

    // 2. Creazione del foglio di lavoro e impostazione larghezza colonne
    const ws = XLSX.utils.json_to_sheet(data);
    
    ws['!cols'] = [
      { wch: 20 }, // Sensore
      { wch: 15 }, // Categoria
      { wch: 25 }, // Tipo Evento
      { wch: 20 }, // Regione
      { wch: 15 }, // Frequenza
      { wch: 25 }  // Data Ora
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Event History');

    // 3. Generazione del nome file con timestamp
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const d = pad(now.getDate());
    const m = pad(now.getMonth() + 1);
    const y = now.getFullYear();
    const h = pad(now.getHours());
    const min = pad(now.getMinutes());
    const s = pad(now.getSeconds());
    const filename = `report_eventi_${d}_${m}_${y}_${h}${min}${s}.xlsx`;

    // 4. Download del file
    XLSX.writeFile(wb, filename);
  }
}
