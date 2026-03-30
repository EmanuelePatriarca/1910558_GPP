import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const routes: Routes = [
  // Dashboard principale come pagina predefinita
  { path: '', component: DashboardComponent, pathMatch: 'full' },
  
  // Redirect di sicurezza per rotte non esistenti verso la dashboard
  { path: '**', redirectTo: '' }
];
