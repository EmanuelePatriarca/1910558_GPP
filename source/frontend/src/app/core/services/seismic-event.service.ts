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
  private readonly RECONNECT_INTERVAL = 1000; // Base interval (1S)
  private readonly HANDSHAKE_TIMEOUT = 2000;  // 2S timeout to force new handshake if Nginx sticks to a dead IP

  private statusSubject = new BehaviorSubject<ConnectionStatus>('CLOSED');
  /** Public stream to monitor the connection health */
  public status$ = this.statusSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** Fetches the full historical event log on startup (US-08) */
  getHistoricalEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/events/history`);
  }

  /**
   * Opens an "immortal" high-speed WebSocket that handles reconnection for any closure type.
   */
  connectWebSocket(): Observable<Event> {
    return new Observable<Event>(observer => {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/v1/events/ws`;
      let socket: WebSocket;
      let handshakeTimeoutRef: any;

      const createSocket = () => {
        this.statusSubject.next('CONNECTING');
        socket = new WebSocket(wsUrl);

        // Force failover if Nginx keeps us in CONNECTING state for a dead replica
        handshakeTimeoutRef = setTimeout(() => {
           if (socket.readyState === WebSocket.CONNECTING) {
              console.warn('WS Handshake taking too long (>2s). Forcing failover...');
              socket.close(); // Triggers onclose -> error -> retry
           }
        }, this.HANDSHAKE_TIMEOUT);

        socket.onopen = () => {
          clearTimeout(handshakeTimeoutRef);
          this.statusSubject.next('OPEN');
          console.log('WS Connection established.');
        };

        socket.onmessage = (message: MessageEvent) => {
          try {
            const raw = JSON.parse(message.data);
            const event: Event = {
              ...raw,
              timestamp: new Date(raw.timestamp)
            };
            observer.next(event);
          } catch (e) {
            console.error('Failed to parse WS payload:', e);
          }
        };

        socket.onerror = (error) => {
          console.error('WS Connection error:', error);
        };

        socket.onclose = (event) => {
          clearTimeout(handshakeTimeoutRef);
          this.statusSubject.next('CLOSED');
          
          if (!event.wasClean) {
            console.warn(`WS Connection lost (code: ${event.code}). Retrying in 1s...`);
            observer.error(new Error('Connection broken'));
          } else {
            console.warn('WS Connection closed gracefully by server. Repeating...');
            observer.complete(); // repeat() will handle this
          }
        };
      };

      createSocket();

      return () => {
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
          socket.close();
        }
      };
    }).pipe(
      // Aggressive Reconnection Strategy for Errors/Dirty Closes
      retry({
        delay: (err, count) => {
          const delayTime = Math.min(this.RECONNECT_INTERVAL * Math.pow(1.2, count), 10000);
          return timer(delayTime);
        }
      }),
      // Handle Clean Closes (repeat the observable)
      repeat({
        delay: () => timer(this.RECONNECT_INTERVAL)
      })
    );
  }
}
