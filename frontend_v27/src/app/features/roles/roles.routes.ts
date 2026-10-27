import { Routes } from '@angular/router';

export const ROLES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/roles-admin/roles-admin').then(m => m.RolesAdmin)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/role-create/role-create').then(m => m.RoleCreate)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/role-edit/role-edit').then(m => m.RoleEdit)
  }
];
