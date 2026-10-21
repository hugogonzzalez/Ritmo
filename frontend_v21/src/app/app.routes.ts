import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', redirectTo: 'concerts', pathMatch: 'full' },
      {
        path: 'concerts',
        loadChildren: () => import('./features/concerts/concerts.routes').then(m => m.CONCERTS_ROUTES)
      },
      {
        path: 'performances',
        loadChildren: () => import('./features/performances/performances.routes').then(m => m.PERFORMANCES_ROUTES)
      },
      {
        path: 'artists',
        loadChildren: () => import('./features/artists/artists.routes').then(m => m.ARTISTS_ROUTES)
      },
      {
        path: 'categories',
        loadChildren: () => import('./features/categories/categories.routes').then(m => m.CATEGORIES_ROUTES)
      },
      {
        path: 'venues',
        loadChildren: () => import('./features/venues/venues.routes').then(m => m.VENUES_ROUTES)
      },
      {
        path: 'variants',
        loadChildren: () => import('./features/variants/variants.routes').then(m => m.VARIANTS_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: 'concerts' }
];
