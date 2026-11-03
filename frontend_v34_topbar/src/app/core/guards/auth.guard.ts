import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthStore } from '../stores/auth.store';

// Solo deja pasar a usuarios autenticados. Espera a comprobar la cookie de sesión antes de decidir.
// Si no hay sesión, manda al login recordando la URL.
export const authGuard: CanActivateFn = async (_route, state) => {
  // inject() debe llamarse antes de cualquier await
  const authService = inject(AuthService);
  const authStore = inject(AuthStore);
  const router = inject(Router);

  await authService.restoreSession();

  if (authStore.isAuthenticated()) return true;

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
