import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Observable, Subject } from 'rxjs';
import {
  catchError,
  finalize,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';

import { TicketService } from '../data-access/ticket.service';
import {
  Comment,
  Ticket,
  TicketPriority,
  TicketStatus,
} from '../../../shared/models';

type TicketState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; ticket: Ticket };

type CommentsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; comments: Comment[] };

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AsyncPipe, DatePipe, NgClass],
  templateUrl: './ticket-detail.page.html',
  styleUrl: './ticket-detail.page.scss',
})
export class TicketDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ticketService = inject(TicketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal(false);
  readonly submitting = signal(false);
  readonly saveError = signal(false);

  readonly commentForm = new FormGroup({
    message: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)],
    }),
  });

  private readonly ticketRefresh$ = new Subject<void>();
  private readonly commentsRefresh$ = new Subject<void>();

  private readonly ticketId$: Observable<number> = this.route.paramMap.pipe(
    map((params) => Number(params.get('id'))),
  );

  readonly ticketState$: Observable<TicketState> = combineLatest([
    this.ticketId$,
    this.ticketRefresh$.pipe(startWith(null)),
  ]).pipe(
    switchMap(([id]) =>
      this.ticketService.getTicketById(id).pipe(
        map((ticket): TicketState => ({ status: 'success', ticket })),
        catchError((): Observable<TicketState> => of({ status: 'error' })),
        startWith<TicketState>({ status: 'loading' }),
      ),
    ),
  );

  readonly commentsState$: Observable<CommentsState> = combineLatest([
    this.ticketId$,
    this.commentsRefresh$.pipe(startWith(null)),
  ]).pipe(
    switchMap(([id]) =>
      this.ticketService.getCommentsByTicketId(id).pipe(
        map((comments): CommentsState => ({ status: 'success', comments })),
        catchError((): Observable<CommentsState> => of({ status: 'error' })),
        startWith<CommentsState>({ status: 'loading' }),
      ),
    ),
  );

  changeStatus(ticketId: number, status: TicketStatus): void {
    this.saving.set(true);
    this.saveError.set(false);
    this.ticketService
      .updateTicket(ticketId, { status })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.ticketRefresh$.next(),
        error: () => this.saveError.set(true),
      });
  }

  changePriority(ticketId: number, priority: TicketPriority): void {
    this.saving.set(true);
    this.saveError.set(false);
    this.ticketService
      .updateTicket(ticketId, { priority })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.ticketRefresh$.next(),
        error: () => this.saveError.set(true),
      });
  }

  submitComment(ticketId: number): void {
    if (this.commentForm.invalid) return;
    const { message } = this.commentForm.getRawValue();
    this.submitting.set(true);
    this.ticketService
      .addComment(ticketId, message)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.commentForm.reset();
          this.commentsRefresh$.next();
        },
      });
  }

  goBack(): void {
    this.router.navigate(['../'], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve',
    });
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
}