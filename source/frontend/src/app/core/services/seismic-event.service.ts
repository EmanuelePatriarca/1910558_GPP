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
  private readonly RECONNECT_INTERVAL = 100;  // 100ms base
  private readonly HANDSHAKE_TIMEOUT = 1000;  // 1000ms (Balanced speed/reliability)

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
      let isClosed = false;

      const createSocket = () => {
        if (isClosed) return;
        
        this.statusSubject.next('CONNECTING');
        socket = new WebSocket(wsUrl);

        // Force failover if Nginx keeps us in CONNECTING state for a dead replica
        handshakeTimeoutRef = setTimeout(() => {
           if (socket.readyState === WebSocket.CONNECTING) {
              console.warn('WS Handshake taking too long (>500ms). Forcing failover...');
              // Clear current handlers to prevent redundant triggers
              socket.onclose = null;
              socket.onerror = null;
              socket.onopen = null;
              socket.close();
              this.statusSubject.next('CLOSED');
              observer.error(new Error('Handshake timeout - forcing failover'));
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
          // onerror is usually followed by onclose, but we log it for clarity
          console.error('WS Connection error:', error);
        };

        socket.onclose = (event) => {
          clearTimeout(handshakeTimeoutRef);
          this.statusSubject.next('CLOSED');
          
          if (!event.wasClean) {
            console.warn(`WS Connection lost (code: ${event.code}). Retrying...`);
            observer.error(new Error(`Connection broken (code: ${event.code})`));
          } else {
            console.warn('WS Connection closed gracefully by server. Repeating...');
            observer.complete(); // repeat() will handle this
          }
        };
      };

      createSocket();

      return () => {
        isClosed = true;
        clearTimeout(handshakeTimeoutRef);
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
          socket.onclose = null;
          socket.onerror = null;
          socket.close();
        }
      };
    }).pipe(
      // Aggressive Reconnection Strategy for Errors/Dirty Closes
      retry({
        delay: (err, count) => {
          // Zero delay for the first two attempts to catch transient flickers instantly
          const delayTime = count <= 2 ? 0 : Math.min(this.RECONNECT_INTERVAL * Math.pow(1.1, count - 2), 3000);
          console.log(`WS Reconnecting in ${delayTime.toFixed(0)}ms... (Attempt ${count})`);
          return timer(delayTime);
        }
      }),
      // Handle Clean Closes (repeat the observable)
      repeat({
        delay: () => {
          console.log('WS Repeating stream after clean close...');
          return timer(this.RECONNECT_INTERVAL);
        }
      })
    );
  }
}
