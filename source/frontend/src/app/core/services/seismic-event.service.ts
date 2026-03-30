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
  
  // Intervallo base per i tentativi di riconnessione
  private readonly RECONNECT_INTERVAL = 100;
  
  // Tempo massimo per l'handshake. Se superato, forziamo il failover su un'altra replica.
  private readonly HANDSHAKE_TIMEOUT = 1000;

  private statusSubject = new BehaviorSubject<ConnectionStatus>('CLOSED');
  /** Public stream to monitor the connection health */
  public status$ = this.statusSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** Fetches the full historical event log on startup (US-08) */
  getHistoricalEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/history`);
  }

  /**
   * Apre un WebSocket "immortale" ad alta velocità.
   * Gestisce automaticamente il failover e la riconnessione trasparente.
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

        // Meccanismo di sicurezza: se l'handshake impiega troppo tempo, forziamo la chiusura
        // del socket per innescare immediatamente il failover verso una replica sana.
        handshakeTimeoutRef = setTimeout(() => {
           if (socket.readyState === WebSocket.CONNECTING) {
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
      // Strategia di riconnessione aggressiva in caso di errore o chiusura sporca (failover)
      retry({
        delay: (err, count) => {
          // Zero delay per i primi due tentativi per assorbire istantaneamente i glitch di rete
          const delayTime = count <= 2 ? 0 : Math.min(this.RECONNECT_INTERVAL * Math.pow(1.1, count - 2), 3000);
          return timer(delayTime);
        }
      }),
      // Gestione delle chiusure pulite: ripetiamo lo stream indefinitamente
      repeat({
        delay: () => timer(this.RECONNECT_INTERVAL)
      })
    );
  }
}
