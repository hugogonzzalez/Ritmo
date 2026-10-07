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
      }
    ]
  },
  { path: '**', redirectTo: 'concerts' }
];
