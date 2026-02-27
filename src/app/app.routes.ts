import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tickets',
    loadComponent: () =>
      import('./features/tickets/pages/tickets-list.page').then(
        (m) => m.TicketsListPage,
      ),
  },
  {
    path: 'tickets/:id',
    loadComponent: () =>
      import('./features/tickets/pages/ticket-detail.page').then(
        (m) => m.TicketDetailPage,
      ),
  },
  {
    path: '',
    redirectTo: 'tickets',
    pathMatch: 'full',
  },
];
