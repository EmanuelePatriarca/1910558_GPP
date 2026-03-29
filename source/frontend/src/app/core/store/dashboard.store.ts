import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { SeismicEventService } from '../services/seismic-event.service';
import { SensorDashboardState, Event, Sensor, SensorEventRequestEnum, SensorCategoryEnum } from '../models/sensor.model';
import { Subscription } from 'rxjs';
import { STATIC_SENSORS } from '../constants/sensors.data';

export interface DashboardFilters {
  eventType: string;
  category: string;
  timeRange: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardStore implements OnDestroy {
  private seismicService = inject(SeismicEventService);
  private liveSub?: Subscription;

  // -- STATE SIGNALS -- //
  private sensorsBase = signal<Sensor[]>([]);
  public historicalEvents = signal<Event[]>([]);
  
  public filters = signal<DashboardFilters>({
    eventType: 'All',
    category: 'All',
    timeRange: 'All'
  });

  public isLoading = signal<boolean>(true);
  public isLive = signal<boolean>(false);

  // -- COMPUTED SIGNALS -- //
  public sensors = computed<SensorDashboardState[]>(() => {
    const events = this.historicalEvents();
    return this.sensorsBase().map(sensor => {
      const sensorEvents = events.filter(e => e.sensor_id === sensor.id)
        .sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      return {
        ...sensor,
        lastEvent: sensorEvents.length > 0 ? sensorEvents[0] : undefined
      };
    });
  });

  public fieldSensors = computed(() => this.sensors().filter(s => s.category === SensorCategoryEnum.FIELD));
  public datacenterSensors = computed(() => this.sensors().filter(s => s.category === SensorCategoryEnum.DATACENTER));

  public filteredHistory = computed(() => {
    const allEvents = this.historicalEvents();
    const currentFilters = this.filters();
    
    const sensorMap = new Map<string, string>();
    this.sensorsBase().forEach(s => sensorMap.set(s.id, s.category));

    return allEvents.filter(ev => {
      let isMatch = true;
      if (currentFilters.eventType !== 'All' && ev.category_event !== currentFilters.eventType) {
        isMatch = false;
      }
      const sCategory = sensorMap.get(ev.sensor_id);
      if (currentFilters.category !== 'All' && sCategory !== currentFilters.category) {
        isMatch = false;
      }
      return isMatch;
    }).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
  });

  public getSensorRef(sensorId: string): Sensor | undefined {
    return this.sensorsBase().find(s => s.id === sensorId);
  }

  // -- ACTIONS -- //
  updateFilters(newFilters: Partial<DashboardFilters>) {
    this.filters.update(state => ({ ...state, ...newFilters }));
  }

  clearFilters() {
    this.filters.set({ eventType: 'All', category: 'All', timeRange: 'All' });
  }

  // -- DATA FETCHING & SYNC -- //
  loadInitialData() {
    this.isLoading.set(true);

    setTimeout(() => {
      this.sensorsBase.set(STATIC_SENSORS);

      const now = new Date();
      this.historicalEvents.set([
        { id: 'e1', sensor_id: 'sensor-01', category_event: SensorEventRequestEnum.EARTHQUAKE, dominant_frequency: 1.2, timestamp: new Date(now.getTime() - 1000 * 60 * 15) },
        { id: 'e2', sensor_id: 'sensor-05', category_event: SensorEventRequestEnum.NUCLEAR_LIKE, dominant_frequency: 9.5, timestamp: new Date(now.getTime() - 1000 * 60 * 75) },
        { id: 'e3', sensor_id: 'sensor-12', category_event: SensorEventRequestEnum.CONVENTIONAL_EXPLOSION, dominant_frequency: 4.5, timestamp: new Date(now.getTime() - 1000 * 60 * 120) }
      ]);
      
      this.isLoading.set(false);
      this.connectLiveStream();
    }, 500);
  }

  private connectLiveStream() {
    this.isLive.set(true);
    // TODO: implement websocket array connections or single SSE
  }

  ngOnDestroy() {
    this.liveSub?.unsubscribe();
  }
}
