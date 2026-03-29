import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Sensor, Event } from '../models/sensor.model';

@Injectable({
  providedIn: 'root'
})
export class SeismicEventService {
  // Placeholder API URL
  private readonly apiUrl = '/api/v1';

  constructor(private http: HttpClient) {}

  /** Chiamata REST per scaricare lo storico alla prima apertura, come richiesto in US-08 e Phase2 */
  getHistoricalEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/events/history`);
  }

  /**
   * Connessione SSE per eventi LIVE.
   * Il backend dovrà pushare text/event-stream json.
   */
  listenToLiveEvents(): Observable<Event> {
    const sseSubject = new Subject<Event>();
    const eventSource = new EventSource(`${this.apiUrl}/events/live`);

    eventSource.onmessage = (message: MessageEvent) => {
      try {
        const eventData = JSON.parse(message.data) as Event;
        // Parsing data Date manuale per sicurezza
        eventData.timestamp = new Date(eventData.timestamp);
        sseSubject.next(eventData);
      } catch (e) {
        console.error('Error parsing SSE event data payload', e);
      }
    };

    eventSource.onerror = (error) => {
      console.warn('SSE Error or disconnection, browser will attempt auto-reconnect...', error);
    };

    return sseSubject.asObservable();
  }
}
