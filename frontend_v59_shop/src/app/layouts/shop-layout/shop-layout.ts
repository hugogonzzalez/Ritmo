import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideLogOut } from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import { AuthStore } from '../../core/stores/auth.store';

const AVATAR_COLORS = ['#0878f9', '#e5484d', '#30a46c', '#f76b15', '#8e4ec6', '#d6409f', '#12a594', '#c79a1a'];

// Cabecera pública de la tienda, con el mismo bloque de usuario que el dashboard
@Component({
  selector: 'app-shop-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideLogOut],
  template: `
    <div class="min-h-screen bg-[#f5f7fa] text-[#151515]" style="font-family: 'DM Sans', sans-serif">
      <header class="sticky top-0 z-50 bg-[#121a27] shadow-[0_2px_12px_#0b111b40]">
        <div class="flex h-[72px] w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          <a routerLink="/shop" aria-label="Volver al inicio" class="shrink-0 no-underline">
            <img src="/ritmo-logo.svg" alt="Ritmo Conciertos" class="h-10 w-auto sm:h-11" />
          </a>

          <div class="flex flex-1 items-center justify-between gap-4">
            <nav class="flex items-center gap-1">
              <a routerLink="/shop" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="is-current" class="nav-link">Inicio</a>
              <a routerLink="/shop/concerts" routerLinkActive="is-current" class="nav-link">Conciertos</a>
              @if (authStore.isAdmin()) {
                <a routerLink="/concerts" class="nav-link">Panel</a>
              }
            </nav>

            @if (authStore.isAuthenticated()) {
              <div class="ml-auto flex items-center gap-3">
                @if (authStore.avatarUrl(); as avatar) {
                  <img [src]="avatar" [alt]="userName()" class="h-9 w-9 shrink-0 rounded-full object-cover" />
                } @else {
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                        [style.background]="avatarColor">{{ initials() }}</span>
                }

                <div class="hidden grid-cols-1 gap-0.5 sm:grid">
                  <strong class="text-[13px] leading-tight text-[#e7edf7]">{{ userName() }}</strong>
                  <small class="w-fit rounded-full bg-[#1684ff]/20 px-2 py-px text-[9px] font-bold text-[#7ab8ff]">{{ authStore.roleLabel() }}</small>
                </div>

                <button type="button" (click)="logout()"
                        class="logout-btn inline-flex items-center gap-1.5 rounded-md border border-[#2c3a4f] bg-transparent px-2 py-1 text-[#dbe3ef] transition hover:bg-[#202c3e] hover:text-white">
                  <svg lucideLogOut [size]="12"></svg>
                  <span class="hidden sm:inline">Cerrar sesión</span>
                </button>
              </div>
            } @else {
              <a routerLink="/login"
                 class="rounded-lg bg-[#1684ff] px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-[#1769bd]">
                Iniciar sesión
              </a>
            }
          </div>
        </div>
      </header>

      <main>
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .nav-link {
      display: inline-flex;
      align-items: center;
      border-radius: 10px;
      padding: 8px 12px;
      color: #abb5c6;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: background-color 0.18s, color 0.18s;
    }
    .nav-link:hover { color: #ffffff; background: #202c3e; }
    .nav-link.is-current { color: #ffffff; background: #202c3e; }
    /* Va con clase porque la regla global "button { font: inherit }" pisa las utilidades de Tailwind */
    .logout-btn { font-size: 11px; font-weight: 600; line-height: 1.2; }
  `
})
export class ShopLayout {
  protected readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly userName = computed(() => this.authStore.user()?.name ?? '');
  protected readonly initials = computed(() =>
    this.userName().split(' ').filter(Boolean).slice(0, 2).map(word => word[0].toUpperCase()).join('') || '?'
  );
  protected readonly avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigateByUrl('/shop');
  }
}
