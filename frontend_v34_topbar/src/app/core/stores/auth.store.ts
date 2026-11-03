import { Injectable, computed, signal } from '@angular/core';
import { ROLE_LABELS } from '../models/role.model';
import { AuthRole, AuthUser } from '../models/auth.models';
import { Profile } from '../models/profile.model';

// Estado de autenticación global. El token vive en una cookie httpOnly que el navegador
// gestiona solo; aquí guardamos el usuario y su perfil. Al recargar, AuthService lo pide a GET auth/me.
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _user = signal<AuthUser | null>(null);
  private readonly _profile = signal<Profile | null>(null);

  readonly user = this._user.asReadonly();
  readonly profile = this._profile.asReadonly();
  readonly avatarUrl = computed(() => this._profile()?.avatarUrl ?? null);
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly roles = computed<AuthRole[]>(() => this.extractRoles(this._user()));
  readonly isAdmin = computed(() => this.hasRole('ADMIN'));
  readonly roleLabel = computed(() => {
    const name = this._user()?.role?.name;
    return name ? (ROLE_LABELS[name] ?? name) : '';
  });

  login(user: AuthUser, profile: Profile | null = null): void {
    this._user.set(user);
    this._profile.set(profile);
  }

  logout(): void {
    this._user.set(null);
    this._profile.set(null);
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
