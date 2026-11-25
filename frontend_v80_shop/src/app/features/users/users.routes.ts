import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/users-admin/users-admin').then(m => m.UsersAdmin)
  },
  {
    path: 'profiles',
    loadComponent: () => import('./pages/profiles-admin/profiles-admin').then(m => m.ProfilesAdmin)
  },
  {
    path: 'profiles/:userId/edit',
    loadComponent: () => import('./pages/profile-edit/profile-edit').then(m => m.ProfileEdit)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/user-create/user-create').then(m => m.UserCreate)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/user-edit/user-edit').then(m => m.UserEdit)
  }
];
