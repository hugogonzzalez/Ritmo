import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideArrowLeft, LucideCalendarDays, LucideIdCard, LucideMapPin, LucideMusic, LucideTag, LucideShield, LucideTicket, LucideUser } from '@lucide/angular';

// Presentacional: solo muestra los enlaces según si es admin. El usuario y el cierre de sesión están en la barra superior.
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideArrowLeft, LucideCalendarDays, LucideIdCard, LucideMapPin, LucideMusic, LucideShield, LucideTag, LucideTicket, LucideUser],
  template: `
    <aside class="admin-sidebar">
      <a class="admin-brand" routerLink="/concerts" aria-label="Ritmo Conciertos"><img class="brand-logo" src="/ritmo-logo.svg" alt="Ritmo Conciertos"></a>
      <div class="nav-group">
        <p class="sidebar-label">GESTIÓN</p>
        <nav class="sidebar-nav" aria-label="Gestión">
          <a routerLink="/concerts" routerLinkActive="selected"><svg lucideMusic [size]="18"></svg><span>Conciertos</span></a>
          <a routerLink="/performances" routerLinkActive="selected"><svg lucideCalendarDays [size]="18"></svg><span>Sesiones</span></a>
          <a routerLink="/artists" routerLinkActive="selected"><svg lucideUser [size]="18"></svg><span>Artistas</span></a>
          <a routerLink="/categories" routerLinkActive="selected"><svg lucideTag [size]="18"></svg><span>Categorías</span></a>
          <a routerLink="/venues" routerLinkActive="selected"><svg lucideMapPin [size]="18"></svg><span>Salas</span></a>
          <a routerLink="/variants" routerLinkActive="selected"><svg lucideTicket [size]="18"></svg><span>Variantes</span></a>
        </nav>
      </div>
      @if (isAdmin()) {
        <div class="nav-group">
          <p class="sidebar-label">USUARIOS</p>
          <nav class="sidebar-nav" aria-label="Usuarios">
            <a routerLink="/users" routerLinkActive="selected"><svg lucideUser [size]="18"></svg><span>Usuarios</span></a>
            <a routerLink="/users/profiles" routerLinkActive="selected"><svg lucideIdCard [size]="18"></svg><span>Perfiles</span></a>
            <a routerLink="/roles" routerLinkActive="selected"><svg lucideShield [size]="18"></svg><span>Roles</span></a>
          </nav>
        </div>
      }
      <div class="nav-group">
        <p class="sidebar-label">MI PERFIL</p>
        <nav class="sidebar-nav" aria-label="Mi perfil">
          <a routerLink="/profile" routerLinkActive="selected"><svg lucideUser [size]="18"></svg><span>Mi perfil</span></a>
        </nav>
      </div>
      <div class="sidebar-bottom">
        <a routerLink="/concerts" class="back-to-site"><svg lucideArrowLeft [size]="16"></svg> Ir al listado</a>
      </div>
    </aside>
  `,
  styleUrl: './navbar.component.scss'
})
export class Navbar {
  readonly isAdmin = input(false);
}
