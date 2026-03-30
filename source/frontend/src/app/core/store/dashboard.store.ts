import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { SeismicEventService, ConnectionStatus } from '../services/seismic-event.service';
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

  // -- STATO (Signals) -- //
  private sensorsBase = signal<Sensor[]>([]);
  public historicalEvents = signal<Event[]>([]);
  public alertsHistory = signal<AppAlert[]>([]);
  public historySortOrder = signal<'desc' | 'asc'>('desc');
  
  // Lista di tutti gli eventi grezzi (anche non categorizzati) per il grafico real-time
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
  public connectionStatus = signal<ConnectionStatus>('CLOSED');
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

  /**
   * Genera un ID esadecimale deterministico basato sui dati dell'evento.
   * Questo garantisce che lo stesso evento abbia lo stesso ID indipendentemente dalla sorgente (REST o WS).
   */
  private generateEventId(e: any): string {
    const ts = e.timestamp instanceof Date ? e.timestamp.getTime() : new Date(e.timestamp).getTime();
    
    // Stringa sorgente per l'hash: sensore + millisecondi + categoria
    const rawStr = `${e.sensor_id}_${ts}_${e.category_event || 'raw'}`;
    
    // Algoritmo DJB2 (Veloce e deterministico)
    let hash = 5381;
    for (let i = 0; i < rawStr.length; i++) {
        hash = (hash * 33) ^ rawStr.charCodeAt(i);
    }
    return (hash >>> 0).toString(16).toUpperCase();
  }

  // -- DATA FETCHING & SYNC -- //
  // -- CARICAMENTO E SINCRONIZZAZIONE -- //
  loadInitialData() {
    this.isLoading.set(true);
    this.loadError.set(null);

    // 1. Carica l'anagrafica sensori statica
    this.sensorsBase.set(STATIC_SENSORS);
    
    // 2. Monitora la connessione: ricarica lo storico REST ad ogni riconnessione WebSocket
    this.seismicService.status$.subscribe(status => {
      this.connectionStatus.set(status);
      if (status !== 'OPEN') {
        this.isLive.set(false);
      } else {
        this.refreshHistory();
      }
    });

    // 3. Avvia lo stream WebSocket
    this.connectLiveStream();

    // 4. Primo caricamento dello storico
    this.refreshHistory();
  }

  /**
   * Recupera lo snapshot più recente degli eventi dal server e sincronizza gli alert persi.
   */
  public refreshHistory() {
    if (this.historicalEvents().length === 0) {
      this.isLoading.set(true);
    }
    this.loadError.set(null);

    const currentEventIds = new Set(this.historicalEvents().map(e => e.id));

    this.seismicService.getHistoricalEvents().subscribe({
      next: (events) => {
        const parsed = events.map(e => {
          const timestamp = new Date(e.timestamp);
          return { 
            ...e, 
            timestamp,
            // ID deterministico
            id: e.id ?? this.generateEventId({ ...e, timestamp })
          };
        });

        // 1. Identificazione eventi "persi" (nuovi alert critici)
        const newAlerts: AppAlert[] = [];
        parsed.forEach(ev => {
          // Se l'evento ha una categoria (è un alert) e non è tra gli ID noti
          if (ev.category_event && !currentEventIds.has(ev.id)) {
            const sensor = this.sensorsBase().find(s => s.id === ev.sensor_id);
            newAlerts.push({
              id: ev.id,
              event: ev,
              sensorName: sensor?.name || 'Unknown Sensor',
              isRead: false,
              receivedAt: new Date()
            });
          }
        });

        // 2. Notifica silenziosa per gli alert di recupero
        if (newAlerts.length > 0) {
           // Ordiniamo gli alert dal più vecchio al più recente per l'inserimento
           // ma AppComponent vedrà sempre l'ultimo in lista (il più recente) per il toast
           newAlerts.sort((a,b) => a.event.timestamp.getTime() - b.event.timestamp.getTime());
           
           this.alertsHistory.update(current => {
              const updated = [...newAlerts.reverse(), ...current];
              return updated.slice(0, 10); // Manteniamo solo gli ultimi 10 alert storici
           });
           console.log(`Alert Recovery: Syncing ${newAlerts.length} missed events.`);
        }

        // 3. Aggiornamento storico visibile
        this.historicalEvents.set(parsed);
        this.isLoading.set(false);
      },
      error: (err) => {
        if (this.historicalEvents().length === 0) {
          this.loadError.set('Could not load event history from server.');
        }
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Forza manualmente la riconnessione dello stream SSE.
   */
  public reconnect() {
    this.connectLiveStream();
  }

  private connectLiveStream() {
    this.liveSub?.unsubscribe();
    this.liveSub = this.seismicService.connectStream().subscribe({
      next: (event: Event) => {
        const timestamp = new Date(event.timestamp);
        const parsed: Event = { 
          ...event, 
          timestamp,
          id: event.id ?? this.generateEventId({ ...event, timestamp })
        };

        // Mantieni solo le ultime 20 letture per sensore per il grafico live
        this.liveFrequencyEvents.update(evs => {
          const sameSensor = evs.filter(e => e.sensor_id === parsed.sensor_id);
          const otherSensors = evs.filter(e => e.sensor_id !== parsed.sensor_id);
          return [parsed, ...sameSensor.slice(0, 19), ...otherSensors];
        });

        // Solo gli eventi categorizzati aggiornano lo storico e attivano i pop-up
        if (parsed.category_event) {
          // Utilizziamo l'ID deterministico per evitare duplicati durante i refresh
          const isDuplicate = this.historicalEvents().some(e => e.id === parsed.id);
          
          if (!isDuplicate) {
            this.historicalEvents.update(evs => [parsed, ...evs]);
            const sensorName = this.getSensorRef(event.sensor_id)?.name ?? event.sensor_id;
            this.pushAlert(parsed, sensorName);
          }
        }

        this.isLive.set(true);
      },
      error: (err: unknown) => {
        this.isLive.set(false);
      },
      complete: () => {
         this.isLive.set(false);
      }
    });
  }

  ngOnDestroy() {
    this.liveSub?.unsubscribe();
  }
}
