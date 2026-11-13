import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { LoginPage } from './features/login/login.page';
import { ShopLayout } from './layouts/shop-layout/shop-layout';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'shop',
    pathMatch: 'full'
  },
  // ── Tienda pública (sin login) ─────────────────────────────────────────────
  {
    path: 'shop',
    component: ShopLayout,
    loadChildren: () => import('./features/shop/shop.routes').then(m => m.SHOP_ROUTES)
  },
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
        canActivate: [adminGuard],
        loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES)
      },
      {
        path: 'concerts',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/concerts/concerts.routes').then(m => m.CONCERTS_ROUTES)
      },
      {
        path: 'performances',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/performances/performances.routes').then(m => m.PERFORMANCES_ROUTES)
      },
      {
        path: 'artists',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/artists/artists.routes').then(m => m.ARTISTS_ROUTES)
      },
      {
        path: 'categories',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/categories/categories.routes').then(m => m.CATEGORIES_ROUTES)
      },
      {
        path: 'venues',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/venues/venues.routes').then(m => m.VENUES_ROUTES)
      },
      {
        path: 'variants',
        canActivate: [adminGuard],
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
  { path: '**', redirectTo: 'shop' }
];
