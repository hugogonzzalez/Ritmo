import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { LoginPage } from './features/login/login.page';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'concerts', pathMatch: 'full' },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES)
      },
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
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/users/users.routes').then(m => m.USERS_ROUTES)
      },
      {
        path: 'roles',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/roles/roles.routes').then(m => m.ROLES_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: 'concerts' }
];
