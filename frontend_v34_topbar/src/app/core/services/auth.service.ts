import { Injectable, inject } from '@angular/core';
import { ApiResponse } from '../models/api.model';
import { ApiService } from './api.service';
import { AuthStore } from '../stores/auth.store';
import { LoginCredentials, LoginResult, MeResult } from '../models/auth.models';

// Orquesta la autenticación: habla con la API y sincroniza AuthStore.
// No contiene lógica de UI ni de navegación.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly authStore = inject(AuthStore);

  // Promesa única: app.ts y los guards esperan a la misma comprobación de sesión
  private restoring?: Promise<void>;

  async login(credentials: LoginCredentials): Promise<void> {
    const response = await this.api.post<ApiResponse<LoginResult>>('auth/login', credentials);

    this.authStore.login(response.data.user, response.data.profile);
  }

  // El backend revoca el token y borra la cookie; la sesión local se limpia aunque la llamada falle
  async logout(): Promise<void> {
    try {
      if (this.authStore.isAuthenticated()) {
        await this.api.post<ApiResponse<null>>('auth/logout', {});
      }
    } catch {
      // Si la cookie ya no es válida el backend responde 401; no pasa nada
    } finally {
      this.authStore.logout();
    }
  }

  // Al arrancar la app (o al entrar en una ruta protegida): pregunta al backend quién es el usuario.
  // Si hay cookie válida lo recupera; si no, la sesión queda vacía.
  restoreSession(): Promise<void> {
    this.restoring ??= this.loadSession();
    return this.restoring;
  }

  // Vuelve a leer usuario y perfil del backend (tras editar el perfil, por ejemplo)
  async refresh(): Promise<void> {
    await this.loadSession();
  }

  private async loadSession(): Promise<void> {
    try {
      const response = await this.api.get<ApiResponse<MeResult>>('auth/me');
      this.authStore.login(response.data.user, response.data.profile);
    } catch {
      this.authStore.logout();
    }
  }
}
