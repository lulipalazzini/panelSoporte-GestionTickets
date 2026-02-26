import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { combineLatest, Observable, Subject } from 'rxjs';
import { catchError, debounceTime, map, of, startWith, switchMap, tap } from 'rxjs';

import { TicketService, GetTicketsResult } from '../data-access/ticket.service';
import { TicketCategory, TicketPriority, TicketStatus } from '../../../shared/models';

type ViewState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; data: GetTicketsResult };

const ASSIGNEES = ['María López', 'Carlos Ruiz', 'Ana Torres', 'Diego Méndez', 'Lucía Fernández'];

@Component({
  selector: 'app-ticket-list-page',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe, DatePipe, NgClass],
  templateUrl: './ticket-list.page.html',
  styleUrl: './ticket-list.page.scss',
})
export class TicketListPageComponent {
  private ticketService = inject(TicketService);
  private destroyRef = inject(DestroyRef);

  readonly pageSize = 10;
  readonly assignees = ASSIGNEES;

  page = signal(1);

  filterForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    status: new FormControl<TicketStatus | ''>('', { nonNullable: true }),
    priority: new FormControl<TicketPriority | ''>('', { nonNullable: true }),
    category: new FormControl<TicketCategory | ''>('', { nonNullable: true }),
    assignee: new FormControl('', { nonNullable: true }),
    sort: new FormControl<'updatedAt' | 'priority'>('updatedAt', { nonNullable: true }),
  });

  private retrySubject = new Subject<void>();

  readonly state$: Observable<ViewState>;

  constructor() {
    this.filterForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.page.set(1));

    this.state$ = combineLatest([
      this.filterForm.valueChanges.pipe(startWith(this.filterForm.getRawValue())),
      toObservable(this.page),
      this.retrySubject.pipe(startWith(null)),
    ]).pipe(
      debounceTime(300),
      switchMap(([filters, page]) =>
        this.ticketService.getTickets({
          search: filters.search || undefined,
          status: (filters.status || undefined) as TicketStatus | undefined,
          priority: (filters.priority || undefined) as TicketPriority | undefined,
          category: (filters.category || undefined) as TicketCategory | undefined,
          assignee: filters.assignee || undefined,
          sort: filters.sort,
          page,
          pageSize: this.pageSize,
        }).pipe(
          map((data): ViewState => ({ status: 'success', data })),
          catchError((): Observable<ViewState> => of({ status: 'error' })),
          startWith<ViewState>({ status: 'loading' }),
        ),
      ),
    );
  }

  retry(): void {
    this.retrySubject.next();
  }

  pages(total: number): number[] {
    return Array.from({ length: Math.ceil(total / this.pageSize) }, (_, i) => i + 1);
  }

  statusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      OPEN: 'Abierto',
      IN_PROGRESS: 'En progreso',
      DONE: 'Resuelto',
    };
    return labels[status];
  }

  priorityLabel(priority: TicketPriority): string {
    const labels: Record<TicketPriority, string> = {
      LOW: 'Baja',
      MEDIUM: 'Media',
      HIGH: 'Alta',
    };
    return labels[priority];
  }

  categoryLabel(category: TicketCategory): string {
    const labels: Record<TicketCategory, string> = {
      BILLING: 'Facturación',
      TECH: 'Técnico',
      OTHER: 'Otro',
    };
    return labels[category];
  }
}
