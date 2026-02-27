import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, Observable, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  skip,
  startWith,
  switchMap,
} from 'rxjs';

import { TicketService, GetTicketsResult } from '../data-access/ticket.service';
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../../../shared/models';

type ViewState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; data: GetTicketsResult };

const ASSIGNEES = [
  'María López',
  'Carlos Ruiz',
  'Ana Torres',
  'Diego Méndez',
  'Lucía Fernández',
];

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AsyncPipe, DatePipe, NgClass, RouterLink],
  templateUrl: './tickets-list.page.html',
  styleUrl: './tickets-list.page.scss',
})
export class TicketsListPage {
  private readonly ticketService = inject(TicketService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly pageSize = 10;
  readonly assignees = ASSIGNEES;

  readonly page = signal(1);
  readonly loading = signal(false);

  readonly filterForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    status: new FormControl<TicketStatus | ''>('', { nonNullable: true }),
    priority: new FormControl<TicketPriority | ''>('', { nonNullable: true }),
    category: new FormControl<TicketCategory | ''>('', { nonNullable: true }),
    assignee: new FormControl('', { nonNullable: true }),
    sort: new FormControl<'updatedAt' | 'priority'>('updatedAt', {
      nonNullable: true,
    }),
  });

  private readonly retry$ = new Subject<void>();

  readonly state$: Observable<ViewState>;

  constructor() {
    const qp = this.route.snapshot.queryParams;
    this.filterForm.patchValue(
      {
        search: qp['search'] ?? '',
        status: qp['status'] ?? '',
        priority: qp['priority'] ?? '',
        category: qp['category'] ?? '',
        assignee: qp['assignee'] ?? '',
        sort: qp['sort'] ?? 'updatedAt',
      },
      { emitEvent: false },
    );
    if (qp['page']) this.page.set(Number(qp['page']));

    this.filterForm.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => {
      this.page.set(1);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { ...v, page: 1 },
        replaceUrl: true,
      });
    });

    toObservable(this.page)
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe((page) => {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { page },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });

    this.state$ = combineLatest([
      this.filterForm.valueChanges.pipe(
        startWith(this.filterForm.getRawValue()),
        debounceTime(400),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      ),
      toObservable(this.page),
      this.retry$.pipe(startWith(null)),
    ]).pipe(
      switchMap(([filters, page]) => {
        this.loading.set(true);
        return this.ticketService
          .getTickets({
            search: filters.search || undefined,
            status: (filters.status || undefined) as TicketStatus | undefined,
            priority: (filters.priority || undefined) as
              | TicketPriority
              | undefined,
            category: (filters.category || undefined) as
              | TicketCategory
              | undefined,
            assignee: filters.assignee || undefined,
            sort: filters.sort,
            page,
            pageSize: this.pageSize,
          })
          .pipe(
            map((data): ViewState => ({ status: 'success', data })),
            catchError((): Observable<ViewState> => of({ status: 'error' })),
            startWith<ViewState>({ status: 'loading' }),
            finalize(() => this.loading.set(false)),
          );
      }),
    );
  }

  retry(): void {
    this.retry$.next();
  }

  pages(total: number): number[] {
    return Array.from(
      { length: Math.ceil(total / this.pageSize) },
      (_, i) => i + 1,
    );
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
