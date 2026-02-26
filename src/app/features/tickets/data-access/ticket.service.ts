import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { Ticket, TicketCategory, TicketPriority, TicketStatus } from '../../../shared/models';

export interface GetTicketsParams {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignee?: string;
  sort?: 'updatedAt' | 'priority';
  page?: number;
  pageSize?: number;
}

export interface GetTicketsResult {
  items: Ticket[];
  total: number;
}

const PRIORITY_ORDER: Record<TicketPriority, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
};

const STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'DONE'];
const PRIORITIES: TicketPriority[] = ['HIGH', 'MEDIUM', 'LOW', 'HIGH', 'MEDIUM'];
const CATEGORIES: TicketCategory[] = ['TECH', 'BILLING', 'OTHER', 'TECH', 'BILLING'];
const ASSIGNEES = ['María López', 'Carlos Ruiz', 'Ana Torres', 'Diego Méndez', 'Lucía Fernández'];

const TITLES = [
  'Login failure on mobile devices',
  'Invoice total does not match order summary',
  'Password reset email not received',
  'App crashes when uploading attachments',
  'Payment declined despite valid card',
  'Unable to export reports to PDF',
  'Dashboard widgets not loading data',
  'Two-factor authentication code not working',
  'Subscription plan not updated after payment',
  'Search results returning incorrect tickets',
  'Notifications not delivered via email',
  'Profile picture upload failing silently',
  'Account locked after single failed attempt',
  'Billing address cannot be updated',
  'API rate limiting causing client timeouts',
  'Webhook events not firing on ticket update',
  'CSV import rejecting valid file format',
  'Tag filter not persisting between sessions',
  'Role permissions not applied after reassignment',
  'Ticket priority dropdown missing HIGH option',
];

const DESCRIPTIONS = [
  'The user attempts to sign in from iOS 17 or Android 14 and receives a generic error message with no further details.',
  'The invoice PDF shows a subtotal that does not reflect the applied discount code, causing confusion for the accounting team.',
  'After requesting a password reset, the email is never delivered. Spam folder confirmed empty. Issue reproduced across multiple accounts.',
  'When a file larger than 5 MB is selected, the application freezes and must be force-closed. No error toast is shown.',
  'The charge is attempted and immediately declined by the gateway, yet the card is valid and has sufficient funds.',
  'Clicking the Export button triggers a spinner that never resolves. The issue is consistent across Chrome and Firefox.',
  'The dashboard loads but widgets remain empty. The network tab shows 200 responses with valid JSON payloads.',
  'The six-digit TOTP code is rejected on the second step of login. The device clock is synchronized correctly.',
  'After upgrading to the Pro plan, the feature set remains identical to the Free tier. Cache cleared, issue persists.',
  'Submitting a keyword that matches known tickets returns zero results. Full-text search appears to be broken.',
  'Email notifications for new ticket assignments are not received by any team member regardless of notification settings.',
  'The profile picture uploader accepts the file and shows a progress bar to 100%, but the avatar does not change.',
  'After one wrong password the account is immediately locked, forcing an admin unlock on every mistype.',
  'Attempting to update the billing address in account settings produces a 422 validation error for all inputs.',
  'Customers report HTTP 429 responses during normal usage patterns well below documented limits.',
  'Webhook configured for ticket.updated events never delivers a payload to the registered endpoint.',
  'The CSV import wizard shows "Invalid format" for a file that matches the documented schema exactly.',
  'Tag filters selected in the sidebar are reset to default every time the browser tab is refreshed.',
  'Changing a user\'s role from Viewer to Editor does not grant edit permissions until the user logs out and back in.',
  'The priority selector in the ticket creation form shows only LOW and MEDIUM, the HIGH option is missing from the list.',
];

function isoDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

const MOCK_TICKETS: Ticket[] = Array.from({ length: 50 }, (_, i): Ticket => ({
  id: i + 1,
  title: TITLES[i % TITLES.length],
  description: DESCRIPTIONS[i % DESCRIPTIONS.length],
  status: STATUSES[i % STATUSES.length],
  priority: PRIORITIES[i % PRIORITIES.length],
  category: CATEGORIES[i % CATEGORIES.length],
  assignee: ASSIGNEES[i % ASSIGNEES.length],
  createdAt: isoDate(50 - i),
  updatedAt: isoDate(Math.max(0, 25 - Math.floor(i / 2))),
}));

@Injectable({ providedIn: 'root' })
export class TicketService {
  getTickets(params: GetTicketsParams): Observable<GetTicketsResult> {
    const filtered = this.applyFilters(MOCK_TICKETS, params);
    const sorted = this.applySort(filtered, params.sort);
    const total = sorted.length;
    const items = this.applyPagination(sorted, params.page ?? 1, params.pageSize ?? 10);
    return of({ items, total }).pipe(delay(500));
  }

  private applyFilters(tickets: Ticket[], params: GetTicketsParams): Ticket[] {
    return tickets.filter((ticket) => {
      if (params.search) {
        const q = params.search.toLowerCase();
        const matchesTitle = ticket.title.toLowerCase().includes(q);
        const matchesDescription = ticket.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDescription) return false;
      }
      if (params.status && ticket.status !== params.status) return false;
      if (params.priority && ticket.priority !== params.priority) return false;
      if (params.category && ticket.category !== params.category) return false;
      if (params.assignee && ticket.assignee !== params.assignee) return false;
      return true;
    });
  }

  private applySort(tickets: Ticket[], sort?: 'updatedAt' | 'priority'): Ticket[] {
    const copy = [...tickets];
    if (sort === 'priority') {
      return copy.sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);
    }
    return copy.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  private applyPagination(tickets: Ticket[], page: number, pageSize: number): Ticket[] {
    const start = (page - 1) * pageSize;
    return tickets.slice(start, start + pageSize);
  }
}
