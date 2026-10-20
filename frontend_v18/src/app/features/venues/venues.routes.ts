import { Routes } from '@angular/router';

export const VENUES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/venues-admin/venues-admin').then(m => m.VenuesAdmin)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/venue-create/venue-create').then(m => m.VenueCreate)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/venue-edit/venue-edit').then(m => m.VenueEdit)
  }
];
