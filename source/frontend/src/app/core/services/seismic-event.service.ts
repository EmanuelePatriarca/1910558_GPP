import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, BehaviorSubject } from 'rxjs';
import { retry, repeat } from 'rxjs/operators';
import { Event } from '../models/sensor.model';

export type ConnectionStatus = 'CONNECTING' | 'OPEN' | 'CLOSED';

@Injectable({
  providedIn: 'root'
})
export class SeismicEventService {
  private readonly apiUrl = '/api/v1';

  private statusSubject = new BehaviorSubject<ConnectionStatus>('CLOSED');
  /** Public stream to monitor the connection health */
  public status$ = this.statusSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** Fetches the full historical event log on startup (US-08) */
  getHistoricalEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/history`);
  }

  /**
   * Apre uno stream SSE (Server-Sent Events) per ricevere dati in real-time.
   * La riconnessione è gestita nativamente dal browser.
   */
  connectStream(): Observable<Event> {
    return new Observable<Event>(observer => {
      const sseUrl = `${window.location.origin}/api/v1/events/stream`;
      let eventSource: EventSource;

      const initSSE = () => {
        this.statusSubject.next('CONNECTING');
        eventSource = new EventSource(sseUrl);

        eventSource.onopen = () => {
          this.statusSubject.next('OPEN');
          console.log('SSE Connection established.');
        };

        eventSource.onmessage = (event: MessageEvent) => {
          try {
            const raw = JSON.parse(event.data);
            const seismicEvent: Event = {
              ...raw,
              timestamp: new Date(raw.timestamp)
            };
            observer.next(seismicEvent);
          } catch (e) {
            console.error('Failed to parse SSE payload:', e);
          }
        };

        eventSource.onerror = (error) => {
          // SSE riconnette automaticamente, ma aggiorniamo lo stato per la UI
          if (eventSource.readyState === EventSource.CONNECTING) {
            this.statusSubject.next('CONNECTING');
          } else if (eventSource.readyState === EventSource.CLOSED) {
            this.statusSubject.next('CLOSED');
          }
          console.error('SSE Connection error/reconnecting...', error);
        };
      };

      initSSE();

      // Pulizia alla disiscrizione
      return () => {
        if (eventSource) {
          eventSource.close();
          this.statusSubject.next('CLOSED');
        }
      };
    });
  }
}
