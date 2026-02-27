import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { catchError, finalize, map, of, switchMap } from 'rxjs';

import { TicketService } from '../data-access/ticket.service';
import { Ticket, TicketCategory, TicketPriority, TicketStatus } from '../../../shared/models';
import { PendingChanges } from '../../../core/guards/pending-changes.guard';

interface TicketFormGroup {
  title: FormControl<string>;
  description: FormControl<string>;
  category: FormControl<TicketCategory | ''>;
  priority: FormControl<TicketPriority | ''>;
  assignee: FormControl<string>;
  status: FormControl<TicketStatus | ''>;
}

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './ticket-form.page.html',
  styleUrl: './ticket-form.page.scss',
})
export class TicketFormPage implements PendingChanges, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ticketService = inject(TicketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isEditMode = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly loadError = signal(false);
  readonly saveError = signal(false);

  private ticketId: number | null = null;

  readonly statuses: { value: TicketStatus; label: string }[] = [
    { value: 'OPEN', label: 'Abierto' },
    { value: 'IN_PROGRESS', label: 'En progreso' },
    { value: 'DONE', label: 'Resuelto' },
  ];

  readonly priorities: { value: TicketPriority; label: string }[] = [
    { value: 'LOW', label: 'Baja' },
    { value: 'MEDIUM', label: 'Media' },
    { value: 'HIGH', label: 'Alta' },
  ];

  readonly categories: { value: TicketCategory; label: string }[] = [
    { value: 'BILLING', label: 'Facturación' },
    { value: 'TECH', label: 'Técnico' },
    { value: 'OTHER', label: 'Otro' },
  ];

  readonly assignees = [
    'María López',
    'Carlos Ruiz',
    'Ana Torres',
    'Diego Méndez',
    'Lucía Fernández',
  ];

  readonly form = new FormGroup<TicketFormGroup>({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(20)],
    }),
    category: new FormControl<TicketCategory | ''>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    priority: new FormControl<TicketPriority | ''>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    assignee: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    status: new FormControl<TicketStatus | ''>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    this.form.get('status')!.disable();

    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        switchMap((idParam) => {
          if (!idParam) {
            return of(null);
          }

          const id = Number(idParam);
          this.ticketId = id;
          this.isEditMode.set(true);
          this.form.get('status')!.enable();
          this.loading.set(true);
          this.loadError.set(false);

          return this.ticketService.getTicketById(id).pipe(
            catchError(() => {
              this.loadError.set(true);
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((ticket) => {
        if (ticket) {
          this.form.patchValue({
            title: ticket.title,
            description: ticket.description,
            category: ticket.category,
            priority: ticket.priority,
            assignee: ticket.assignee,
            status: ticket.status,
          });
        }
      });
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saved();
  }

  isInvalid(controlName: keyof TicketFormGroup): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && control.touched;
  }

  hasError(controlName: keyof TicketFormGroup, error: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.touched && control.hasError(error);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const action$: Observable<Ticket> = this.isEditMode()
      ? this.ticketService.updateTicket(this.ticketId!, {
          title: raw.title,
          description: raw.description,
          category: raw.category as TicketCategory,
          priority: raw.priority as TicketPriority,
          assignee: raw.assignee,
          status: raw.status as TicketStatus,
        })
      : this.ticketService.createTicket({
          title: raw.title,
          description: raw.description,
          category: raw.category as TicketCategory,
          priority: raw.priority as TicketPriority,
          assignee: raw.assignee,
          status: 'OPEN',
        });

    this.saving.set(true);
    this.saveError.set(false);
    this.form.disable();

    action$
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.saved.set(true);
          this.form.markAsPristine();
          setTimeout(() => {
            this.router.navigate(['/tickets'], {
              queryParamsHandling: 'preserve',
            });
          }, 1200);
        },
        error: () => {
          this.saveError.set(true);
          this.form.enable();
          if (!this.isEditMode()) {
            this.form.get('status')!.disable();
          }
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/tickets'], { queryParamsHandling: 'preserve' });
  }
}
