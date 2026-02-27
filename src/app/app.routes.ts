import { Routes } from '@angular/router';
import { pendingChangesGuard } from './core/guards/pending-changes.guard';

export const routes: Routes = [
  {
    path: 'tickets',
    loadComponent: () =>
      import('./features/tickets/pages/tickets-list.page').then(
        (m) => m.TicketsListPage,
      ),
  },
  {
    path: 'tickets/new',
    loadComponent: () =>
      import('./features/tickets/pages/ticket-form.page').then(
        (m) => m.TicketFormPage,
      ),
    canDeactivate: [pendingChangesGuard],
  },
  {
    path: 'tickets/:id/edit',
    loadComponent: () =>
      import('./features/tickets/pages/ticket-form.page').then(
        (m) => m.TicketFormPage,
      ),
    canDeactivate: [pendingChangesGuard],
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
