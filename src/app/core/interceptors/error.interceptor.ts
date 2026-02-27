import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        error.status === 0
          ? 'Error de red. Comprueba tu conexión.'
          : `Error ${error.status}: ${error.statusText}`;

      console.error(message, error);
      return throwError(() => error);
    }),
  );
};
