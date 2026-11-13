import { Routes } from '@angular/router';

export const SHOP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/shop-home/shop-home').then(m => m.ShopHome)
  },
  {
    path: 'concerts',
    loadComponent: () => import('./pages/shop-list/shop-list').then(m => m.ShopList)
  },
  {
    path: 'concerts/:slug',
    loadComponent: () => import('./pages/shop-detail/shop-detail').then(m => m.ShopDetail)
  }
];
