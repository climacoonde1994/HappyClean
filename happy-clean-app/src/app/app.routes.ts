import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home').then((m) => m.Home),
    title: 'Happy Clean | Dishwashing Liquid & Liquid Handsoap',
  },
  {
    path: 'order',
    loadComponent: () => import('./pages/order').then((m) => m.Order),
    title: 'Create an order | Happy Clean',
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout').then((m) => m.Checkout),
    title: 'Checkout | Happy Clean',
  },
  {
    path: 'order/:orderNumber',
    loadComponent: () => import('./pages/confirmation').then((m) => m.Confirmation),
    title: 'Order sent | Happy Clean',
  },
  { path: '**', redirectTo: '' },
];
