import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, EMPTY, timer, throwError } from 'rxjs';
import { retry, delayWhen, tap, map } from 'rxjs/operators';
import { Event } from '../models/sensor.model';

@Injectable({
  providedIn: 'root'
})
export class SeismicEventService {
  private readonly apiUrl = '/api/v1';
  private readonly RECONNECT_INTERVAL = 3000; // BASE RECONNECT INTERVAL (3S)
  private readonly MAX_RECONNECT_ATTEMPTS = 10;

  constructor(private http: HttpClient) {}

  /** Fetches the full historical event log on startup (US-08) */
  getHistoricalEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/events/history`);
  }

  /**
   * Opens a global WebSocket for all live seismic events with automatic reconnection.
   * Uses RxJS retry logic to handle socket closures or errors.
   */
  connectWebSocket(): Observable<Event> {
    return new Observable<Event>(observer => {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/v1/events/ws`;
      let socket: WebSocket;

      const createSocket = () => {
        socket = new WebSocket(wsUrl);

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
          // Don't close observer here, let onclose handle reconnection logic via error propagation
        };

        socket.onclose = (event) => {
          if (!event.wasClean) {
            console.warn(`WebSocket closed unexpectedly (code: ${event.code}). Attempting reconnection...`);
            observer.error(new Error('Connection lost'));
          } else {
            console.log('WebSocket closed cleanly.');
            observer.complete();
          }
        };
      };

      createSocket();

      // Teardown logic
      return () => {
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
          socket.close();
        }
      };
    }).pipe(
      // Automatic Reconnection Strategy with Exponential Backoff
      retry({
        delay: (error, retryCount) => {
          const delayTime = Math.min(this.RECONNECT_INTERVAL * Math.pow(1.5, retryCount), 30000);
          console.log(`Reconnection attempt #${retryCount} in ${Math.round(delayTime / 1000)}s...`);
          return timer(delayTime);
        }
      })
    );
  }
}
