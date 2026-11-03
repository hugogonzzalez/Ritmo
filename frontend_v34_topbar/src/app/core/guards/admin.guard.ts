import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AlertService } from '../services/alert.service';
import { AuthService } from '../services/auth.service';
import { AuthStore } from '../stores/auth.store';

// Solo deja pasar a administradores (role ADMIN).
// Sin sesión va al login; con sesión pero sin permiso, al perfil con aviso de acceso denegado.
export const adminGuard: CanActivateFn = async () => {
  // inject() debe llamarse antes de cualquier await
  const authService = inject(AuthService);
  const authStore = inject(AuthStore);
  const alerts = inject(AlertService);
  const router = inject(Router);

  await authService.restoreSession();

  if (!authStore.isAuthenticated()) return router.createUrlTree(['/login']);
  if (authStore.isAdmin()) return true;

  void alerts.error('Acceso denegado', 'Solo los administradores pueden acceder a esta sección.');
  return router.createUrlTree(['/profile']);
};
