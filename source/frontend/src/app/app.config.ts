import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideEcharts } from 'ngx-echarts';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Ottimizzazione del rilevamento dei cambiamenti (Zone.js)
    provideZoneChangeDetection({ eventCoalescing: true }), 
    
    // Routing principale dell'applicazione
    provideRouter(routes),
    
    // Supporto per le chiamate API REST
    provideHttpClient(),
    
    // Integrazione per la visualizzazione dei grafici
    provideEcharts()
  ]
};
