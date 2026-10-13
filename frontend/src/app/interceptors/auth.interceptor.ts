import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, Subject, take, finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Refresh token gate: evita múltiples refreshes simultáneos
let refreshInProgress = false;
const refreshSubject = new Subject<string>();

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const cloned = token ? addToken(req, token) : req;

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el error es 401 y no es la propia llamada de refresh, intentamos renovar el token
      if (error.status === 401 && !req.url.includes('/auth/refresh') && authService.getRefreshToken()) {
        // Si ya hay un refresh en curso, esperar a que se complete
        if (refreshInProgress) {
          return refreshSubject.pipe(
            take(1),
            switchMap((newToken) => next(addToken(req, newToken))),
            catchError((refreshError) => {
              authService.clearSession();
              return throwError(() => refreshError);
            }),
          );
        }

        // Marcar que hay refresh en curso
        refreshInProgress = true;

        return authService.refreshTokens().pipe(
          switchMap((res) => {
            // Notificar a otros requests que el refresh se completó
            refreshSubject.next(res.access_token);
            // Reintenta la request original con el nuevo access token
            return next(addToken(req, res.access_token));
          }),
          catchError((refreshError) => {
            // Si el refresh falla, cerramos la sesión
            authService.clearSession();
            return throwError(() => refreshError);
          }),
          finalize(() => {
            // Marcar que el refresh finalizó (éxito o error)
            refreshInProgress = false;
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
