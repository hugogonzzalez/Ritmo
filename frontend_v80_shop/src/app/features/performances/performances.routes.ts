import { Routes } from '@angular/router';

export const PERFORMANCES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/performances-admin/performances-admin').then(m => m.PerformancesAdmin)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/performance-create/performance-create').then(m => m.PerformanceCreate)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/performance-edit/performance-edit').then(m => m.PerformanceEdit)
  }
];
