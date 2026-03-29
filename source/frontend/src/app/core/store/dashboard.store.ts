import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { SeismicEventService } from '../services/seismic-event.service';
import { SensorDashboardState, Event, Sensor, SensorCategoryEnum } from '../models/sensor.model';
import { Subscription } from 'rxjs';
import { STATIC_SENSORS } from '../constants/sensors.data';

export interface AppAlert {
  id: string;
  event: Event;
  sensorName: string;
  isRead: boolean;
  receivedAt: Date;
}

export interface DashboardFilters {
  eventType: string;
  category: string;
  timeRange: string;
  sensorId: string;
  /** ISO string, inclusive lower bound */
  dateFrom: string | null;
  /** ISO string, inclusive upper bound */
  dateTo:   string | null;
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
  public alertsHistory = signal<AppAlert[]>([]);
  public historySortOrder = signal<'desc' | 'asc'>('desc');
  /** All raw WS events (including uncategorized) — used by the live frequency chart */
  public liveFrequencyEvents = signal<Event[]>([]);

  public filters = signal<DashboardFilters>({
    eventType: 'All',
    category: 'All',
    timeRange: 'All',
    sensorId: 'All',
    dateFrom: null,
    dateTo:   null,
  });

  public isLoading = signal<boolean>(true);
  public isLive = signal<boolean>(false);
  public loadError = signal<string | null>(null);

  // -- COMPUTED SIGNALS -- //
  public unreadAlertsCount = computed(() => this.alertsHistory().filter(a => !a.isRead).length);

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

    const fromMs = currentFilters.dateFrom ? new Date(currentFilters.dateFrom).getTime() : null;
    const toMs   = currentFilters.dateTo   ? new Date(currentFilters.dateTo).getTime()   : null;

    return allEvents.filter(ev => {
      let isMatch = true;
      if (currentFilters.eventType !== 'All' && ev.category_event !== currentFilters.eventType) {
        isMatch = false;
      }
      const sCategory = sensorMap.get(ev.sensor_id);
      if (currentFilters.category !== 'All' && sCategory !== currentFilters.category) {
        isMatch = false;
      }
      if (currentFilters.sensorId !== 'All' && ev.sensor_id !== currentFilters.sensorId) {
        isMatch = false;
      }
      const evMs = ev.timestamp.getTime();
      if (fromMs !== null && evMs < fromMs) { isMatch = false; }
      if (toMs   !== null && evMs > toMs)   { isMatch = false; }
      return isMatch;
    }).sort((a,b) => {
      const diff = b.timestamp.getTime() - a.timestamp.getTime();
      return this.historySortOrder() === 'desc' ? diff : -diff;
    });
  });

  public getSensorRef(sensorId: string): Sensor | undefined {
    return this.sensorsBase().find(s => s.id === sensorId);
  }

  // -- ACTIONS -- //
  public pushAlert(event: Event, sensorName: string) {
    const alert: AppAlert = {
      id: crypto.randomUUID(),
      event,
      sensorName,
      isRead: false,
      receivedAt: new Date()
    };
    this.alertsHistory.update(alerts => {
      const newArray = [alert, ...alerts];
      if (newArray.length > 10) { newArray.length = 10; }
      return newArray;
    });
  }

  public markAllAlertsRead() {
    this.alertsHistory.update(alerts => alerts.map(a => ({ ...a, isRead: true })));
  }

  public deleteAlert(id: string) {
    this.alertsHistory.update(alerts => alerts.filter(a => a.id !== id));
  }

  public clearAllAlerts() {
    this.alertsHistory.set([]);
  }

  public toggleHistorySortOrder() {
    this.historySortOrder.update(s => s === 'desc' ? 'asc' : 'desc');
  }

  updateFilters(newFilters: Partial<DashboardFilters>) {
    this.filters.update(state => ({ ...state, ...newFilters }));
  }

  clearFilters() {
    this.filters.set({ eventType: 'All', category: 'All', timeRange: 'All', sensorId: 'All', dateFrom: null, dateTo: null });
  }

  // -- DATA FETCHING & SYNC -- //
  loadInitialData() {
    this.isLoading.set(true);
    this.loadError.set(null);

    // 1. Load static sensor registry immediately
    this.sensorsBase.set(STATIC_SENSORS);

    // 2. Open WebSocket immediately — independent of REST call
    this.connectLiveStream();

    // 3. Fetch historical event data from backend (parallel)
    this.seismicService.getHistoricalEvents().subscribe({
      next: (events) => {
        const parsed = events.map(e => ({ ...e, timestamp: new Date(e.timestamp) }));
        this.historicalEvents.set(parsed);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load historical events:', err);
        this.loadError.set('Could not load event history from server.');
        this.isLoading.set(false);
      }
    });
  }

  private connectLiveStream() {
    this.liveSub?.unsubscribe();
    this.liveSub = this.seismicService.connectWebSocket().subscribe({
      next: (event: Event) => {
        const parsed = { ...event, timestamp: new Date(event.timestamp) };

        // Keep only last 20 readings per sensor for the live chart
        this.liveFrequencyEvents.update(evs => {
          const sameSensor = evs.filter(e => e.sensor_id === parsed.sensor_id);
          const otherSensors = evs.filter(e => e.sensor_id !== parsed.sensor_id);
          return [parsed, ...sameSensor.slice(0, 19), ...otherSensors];
        });

        // Only categorized events update history & trigger alerts
        if (parsed.category_event) {
          this.historicalEvents.update(evs => [parsed, ...evs]);
          const sensorName = this.getSensorRef(event.sensor_id)?.name ?? event.sensor_id;
          this.pushAlert(parsed, sensorName);
        }

        this.isLive.set(true);
      },
      error: (err: unknown) => {
        console.warn('WebSocket disconnected:', err);
        this.isLive.set(false);
      }
    });
  }

  ngOnDestroy() {
    this.liveSub?.unsubscribe();
  }
}
