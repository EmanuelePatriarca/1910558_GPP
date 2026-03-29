import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Event } from '../models/sensor.model';

@Injectable({
  providedIn: 'root'
})
export class SeismicEventService {
  private readonly apiUrl = '/api/v1';

  constructor(private http: HttpClient) {}

  /** Fetches the full historical event log on startup (US-08) */
  getHistoricalEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/events/history`);
  }

  /**
   * Opens a single global WebSocket for all live seismic events.
   * Emits every raw event, including uncategorized ones.
   * The caller is responsible for filtering by category if needed.
   * Closes the socket automatically on unsubscribe.
   */
  connectWebSocket(): Observable<Event> {
    return new Observable<Event>(observer => {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/v1/events/ws`;
      const socket = new WebSocket(wsUrl);

      socket.onmessage = (message: MessageEvent) => {
        try {
          const raw = JSON.parse(message.data);
          const event: Event = {
            ...raw,
            timestamp: new Date(raw.timestamp)
          };
          observer.next(event);
        } catch (e) {
          console.error('Failed to parse WebSocket event payload:', e);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        observer.error(error);
      };

      socket.onclose = (event) => {
        if (!event.wasClean) {
          console.warn('WebSocket closed unexpectedly, code:', event.code);
          observer.error(new Error(`WebSocket closed: ${event.code}`));
        } else {
          observer.complete();
        }
      };

      // Teardown: close socket when the observable is unsubscribed
      return () => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      };
    });
  }
}
