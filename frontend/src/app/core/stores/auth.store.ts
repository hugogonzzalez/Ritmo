import { Injectable, computed, signal } from '@angular/core';
import { ROLE_LABELS } from '../models/role.model';
import { AuthRole, AuthUser } from '../models/auth.models';
import { Profile } from '../models/profile.model';

// Estado de autenticación global: usuario, perfil y token.
// El token llega en la respuesta de login y lo usa authInterceptor para la cabecera Authorization.
// Al recargar la página el token se pierde; la sesión se recupera con GET auth/me (cookie).
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _user = signal<AuthUser | null>(null);
  private readonly _profile = signal<Profile | null>(null);
  private readonly _token = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly profile = this._profile.asReadonly();
  readonly token = this._token.asReadonly();
  readonly avatarUrl = computed(() => this._profile()?.avatarUrl ?? null);
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly roles = computed<AuthRole[]>(() => this.extractRoles(this._user()));
  readonly isAdmin = computed(() => this.hasRole('ADMIN'));
  readonly roleLabel = computed(() => {
    const name = this._user()?.role?.name;
    return name ? (ROLE_LABELS[name] ?? name) : '';
  });

  login(user: AuthUser, profile: Profile | null, token: string | null): void {
    this._user.set(user);
    this._profile.set(profile);
    this._token.set(token);
  }

  logout(): void {
    this._user.set(null);
    this._profile.set(null);
    this._token.set(null);
  }

  setProfile(profile: Profile | null): void {
    this._profile.set(profile);
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role.trim().toUpperCase() as AuthRole);
  }

  private extractRoles(user: AuthUser | null): AuthRole[] {
    if (!user) return [];
    return user.role?.name === 'admin' ? ['ADMIN'] : ['USER'];
  }
}
