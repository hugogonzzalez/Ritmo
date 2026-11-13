import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AlertService } from '../services/alert.service';
import { AuthService } from '../services/auth.service';
import { AuthStore } from '../stores/auth.store';

// Solo deja pasar a administradores (role ADMIN).
// Sin sesión va al login; con sesión pero sin permiso, al login con aviso de acceso denegado.
// No redirige a /profile: así el guard puede aplicarse también a /profile sin bucle de redirecciones.
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
  return router.createUrlTree(['/login']);
};
