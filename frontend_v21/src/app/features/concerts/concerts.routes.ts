import { Routes } from '@angular/router';

export const CONCERTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/concert-list/concert-list').then(m => m.ConcertList)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/concert-create/concert-create').then(m => m.ConcertCreate)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/concert-edit/concert-edit').then(m => m.ConcertEdit)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/concert-detail/concert-detail').then(m => m.ConcertDetail)
  }
];
