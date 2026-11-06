import { Routes } from '@angular/router';

export const VARIANTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/variants-admin/variants-admin').then(m => m.VariantsAdmin)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/variant-create/variant-create').then(m => m.VariantCreate)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/variant-edit/variant-edit').then(m => m.VariantEdit)
  }
];
