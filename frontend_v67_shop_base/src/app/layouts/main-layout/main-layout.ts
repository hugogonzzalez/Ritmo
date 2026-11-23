import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthStore } from '../../core/stores/auth.store';
import { Loader } from '../../shared/components/loader/loader';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Topbar } from '../../shared/components/topbar/topbar';

// Contenedor de la zona privada: conecta la barra lateral y la superior con la sesión.
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar, Topbar, Loader],
  template: `
    <div class="admin-shell min-h-screen bg-gray-50">
      <app-navbar [isAdmin]="isAdmin()" />
      <app-loader />
      <main>
        <app-topbar
          [userName]="userName()"
          [roleLabel]="roleLabel()"
          [avatarUrl]="avatarUrl()"
          (logout)="logout()"
        />
        <router-outlet />
      </main>
    </div>
  `
})
export class MainLayout {
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly userName = computed(() => this.authStore.user()?.name ?? '');
  readonly roleLabel = this.authStore.roleLabel;
  readonly avatarUrl = this.authStore.avatarUrl;
  readonly isAdmin = this.authStore.isAdmin;

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigateByUrl('/login');
  }
}
