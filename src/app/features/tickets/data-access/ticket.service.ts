import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import {
  Comment,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../../../shared/models';

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
const PRIORITIES: TicketPriority[] = [
  'HIGH',
  'MEDIUM',
  'LOW',
  'HIGH',
  'MEDIUM',
];
const CATEGORIES: TicketCategory[] = [
  'TECH',
  'BILLING',
  'OTHER',
  'TECH',
  'BILLING',
];
const ASSIGNEES = [
  'María López',
  'Carlos Ruiz',
  'Ana Torres',
  'Diego Méndez',
  'Lucía Fernández',
];

const TITLES = [
  'Fallo de inicio de sesión en dispositivos móviles',
  'El total de la factura no coincide con el resumen del pedido',
  'No se recibe el correo de restablecimiento de contraseña',
  'La app se cierra al subir archivos adjuntos',
  'Pago rechazado con tarjeta válida',
  'No se pueden exportar reportes a PDF',
  'Los widgets del panel no cargan datos',
  'El código de autenticación de dos factores no funciona',
  'El plan de suscripción no se actualiza tras el pago',
  'Los resultados de búsqueda devuelven tickets incorrectos',
  'Las notificaciones por correo no llegan',
  'La foto de perfil no se actualiza al subirla',
  'La cuenta se bloquea tras un solo intento fallido',
  'No se puede actualizar la dirección de facturación',
  'El límite de peticiones de la API genera timeouts en los clientes',
  'Los eventos de webhook no se disparan al actualizar tickets',
  'La importación CSV rechaza un formato de archivo válido',
  'El filtro de etiquetas no se mantiene entre sesiones',
  'Los permisos del rol no se aplican tras la reasignación',
  'El desplegable de prioridad no muestra la opción ALTA',
];

const DESCRIPTIONS = [
  'El usuario intenta iniciar sesión desde iOS 17 o Android 14 y recibe un mensaje de error genérico sin más detalles.',
  'El PDF de la factura muestra un subtotal que no refleja el código de descuento aplicado, generando confusión en el equipo de contabilidad.',
  'Tras solicitar el restablecimiento de contraseña, el correo nunca llega. Se confirmó que la carpeta de spam está vacía. El problema se reproduce en varias cuentas.',
  'Al seleccionar un archivo mayor de 5 MB, la aplicación se congela y debe cerrarse forzosamente. No se muestra ningún mensaje de error.',
  'El cargo se intenta procesar y el sistema lo rechaza de inmediato, aunque la tarjeta es válida y tiene fondos suficientes.',
  'Al hacer clic en el botón Exportar aparece un indicador de carga que nunca termina. El problema ocurre tanto en Chrome como en Firefox.',
  'El panel carga correctamente pero los widgets quedan vacíos. La pestaña de red muestra respuestas 200 con JSON válido.',
  'El código TOTP de seis dígitos es rechazado en el segundo paso del inicio de sesión. El reloj del dispositivo está sincronizado correctamente.',
  'Tras actualizar al plan Pro, las funcionalidades son idénticas a las del nivel gratuito. Se limpió la caché y el problema persiste.',
  'Al introducir una palabra clave que coincide con tickets existentes, se devuelven cero resultados. La búsqueda de texto completo parece estar rota.',
  'Las notificaciones por correo de nuevas asignaciones de tickets no llegan a ningún miembro del equipo, independientemente de la configuración.',
  'El cargador de foto de perfil acepta el archivo y muestra una barra de progreso al 100%, pero el avatar no cambia.',
  'Tras un solo intento fallido de contraseña la cuenta queda bloqueada de inmediato, lo que obliga a un administrador a desbloquearla cada vez.',
  'Al intentar actualizar la dirección de facturación en la configuración se produce un error de validación 422 para todos los campos.',
  'Los clientes reportan respuestas HTTP 429 durante patrones de uso normales, muy por debajo de los límites documentados.',
  'El webhook configurado para eventos ticket.updated nunca envía el payload al endpoint registrado.',
  'El asistente de importación CSV muestra "Formato no válido" para un archivo que cumple exactamente con el esquema documentado.',
  'Los filtros de etiquetas seleccionados en la barra lateral se resetean a los valores predeterminados cada vez que se recarga la pestaña.',
  'Cambiar el rol de un usuario de Visualizador a Editor no otorga los permisos de edición hasta que el usuario cierra sesión y vuelve a entrar.',
  'El selector de prioridad en el formulario de creación de tickets solo muestra BAJA y MEDIA; la opción ALTA no aparece en la lista.',
];

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

let mockTickets: Ticket[] = Array.from(
  { length: 50 },
  (_, i): Ticket => ({
    id: i + 1,
    title: TITLES[i % TITLES.length],
    description: DESCRIPTIONS[i % DESCRIPTIONS.length],
    status: STATUSES[i % STATUSES.length],
    priority: PRIORITIES[i % PRIORITIES.length],
    category: CATEGORIES[i % CATEGORIES.length],
    assignee: ASSIGNEES[i % ASSIGNEES.length],
    createdAt: isoDate(50 - i),
    updatedAt: isoDate(Math.max(0, 25 - Math.floor(i / 2))),
  }),
);

let mockComments: Comment[] = [
  {
    id: 1,
    ticketId: 1,
    author: 'Carlos Ruiz',
    message:
      'Reproduced on iPhone 15 with iOS 17.2. The error occurs after the splash screen.',
    createdAt: isoDate(10),
  },
  {
    id: 2,
    ticketId: 1,
    author: 'María López',
    message:
      'Confirmed. Looks like the OAuth redirect is failing on mobile WebViews. Escalating to backend.',
    createdAt: isoDate(8),
  },
  {
    id: 3,
    ticketId: 1,
    author: 'Ana Torres',
    message:
      'Backend team confirmed a session cookie issue on Safari. Fix in progress.',
    createdAt: isoDate(5),
  },
  {
    id: 4,
    ticketId: 2,
    author: 'Diego Méndez',
    message:
      'The discount is applied after tax. Accounting confirmed this is incorrect.',
    createdAt: isoDate(12),
  },
  {
    id: 5,
    ticketId: 2,
    author: 'Lucía Fernández',
    message:
      'Fix deployed to staging. Awaiting QA sign-off before production release.',
    createdAt: isoDate(3),
  },
  {
    id: 6,
    ticketId: 3,
    author: 'Carlos Ruiz',
    message:
      'Checked mail server logs. Emails are queued but the SMTP relay is rejecting them silently.',
    createdAt: isoDate(7),
  },
  {
    id: 7,
    ticketId: 4,
    author: 'Ana Torres',
    message:
      'Memory leak in the file upload handler. The blob reader is not released after processing.',
    createdAt: isoDate(4),
  },
  {
    id: 8,
    ticketId: 5,
    author: 'María López',
    message:
      'Payment gateway team confirmed a fraud-detection false positive. Whitelist request submitted.',
    createdAt: isoDate(6),
  },
];

let nextCommentId = mockComments.length + 1;

@Injectable({ providedIn: 'root' })
export class TicketService {
  getTickets(params: GetTicketsParams): Observable<GetTicketsResult> {
    const filtered = this.applyFilters(mockTickets, params);
    const sorted = this.applySort(filtered, params.sort);
    const total = sorted.length;
    const items = this.applyPagination(
      sorted,
      params.page ?? 1,
      params.pageSize ?? 10,
    );
    return of({ items, total }).pipe(delay(500));
  }

  getTicketById(id: number): Observable<Ticket> {
    const ticket = mockTickets.find((t) => t.id === id);
    if (!ticket) return throwError(() => new Error(`Ticket ${id} not found`));
    return of({ ...ticket }).pipe(delay(400));
  }

  createTicket(
    data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>,
  ): Observable<Ticket> {
    const newId =
      mockTickets.length > 0
        ? Math.max(...mockTickets.map((t) => t.id)) + 1
        : 1;
    const newTicket: Ticket = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTickets = [...mockTickets, newTicket];
    return of({ ...newTicket }).pipe(delay(500));
  }

  updateTicket(
    id: number,
    changes: Partial<Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Observable<Ticket> {
    const idx = mockTickets.findIndex((t) => t.id === id);
    if (idx === -1)
      return throwError(() => new Error(`Ticket ${id} not found`));
    const updated: Ticket = {
      ...mockTickets[idx],
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    mockTickets = [
      ...mockTickets.slice(0, idx),
      updated,
      ...mockTickets.slice(idx + 1),
    ];
    return of({ ...updated }).pipe(delay(600));
  }

  getCommentsByTicketId(ticketId: number): Observable<Comment[]> {
    const result = mockComments
      .filter((c) => c.ticketId === ticketId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    return of(result).pipe(delay(400));
  }

  addComment(ticketId: number, message: string): Observable<Comment> {
    const comment: Comment = {
      id: nextCommentId++,
      ticketId,
      author: 'Tú',
      message,
      createdAt: new Date().toISOString(),
    };
    mockComments = [...mockComments, comment];
    return of({ ...comment }).pipe(delay(500));
  }

  private applyFilters(tickets: Ticket[], params: GetTicketsParams): Ticket[] {
    return tickets.filter((ticket) => {
      if (params.search) {
        const q = params.search.toLowerCase();
        if (
          !ticket.title.toLowerCase().includes(q) &&
          !ticket.description.toLowerCase().includes(q)
        )
          return false;
      }
      if (params.status && ticket.status !== params.status) return false;
      if (params.priority && ticket.priority !== params.priority) return false;
      if (params.category && ticket.category !== params.category) return false;
      if (params.assignee && ticket.assignee !== params.assignee) return false;
      return true;
    });
  }

  private applySort(
    tickets: Ticket[],
    sort?: 'updatedAt' | 'priority',
  ): Ticket[] {
    const copy = [...tickets];
    if (sort === 'priority') {
      return copy.sort(
        (a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority],
      );
    }
    return copy.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  private applyPagination(
    tickets: Ticket[],
    page: number,
    pageSize: number,
  ): Ticket[] {
    const start = (page - 1) * pageSize;
    return tickets.slice(start, start + pageSize);
  }
}
