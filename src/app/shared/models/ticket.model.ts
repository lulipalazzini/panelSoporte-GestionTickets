export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TicketCategory = 'BILLING' | 'TECH' | 'OTHER';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assignee: string;
  createdAt: string;
  updatedAt: string;
}
