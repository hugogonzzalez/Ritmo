import { Routes } from '@angular/router';

export const ARTISTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/artists-admin/artists-admin').then(m => m.ArtistsAdmin)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/artist-create/artist-create').then(m => m.ArtistCreate)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/artist-edit/artist-edit').then(m => m.ArtistEdit)
  }
];
