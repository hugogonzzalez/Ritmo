import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideArrowLeft, LucideMusic } from '@lucide/angular';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideArrowLeft, LucideMusic],
  template: `
    <aside class="admin-sidebar">
      <a class="admin-brand" routerLink="/concerts" aria-label="Ritmo Conciertos"><img class="brand-logo" src="/ritmo-logo.svg" alt="Ritmo Conciertos"></a>
      <p class="sidebar-label">GESTIÓN</p>
      <nav class="sidebar-nav" aria-label="Navegación de administración">
        <a routerLink="/concerts" routerLinkActive="selected"><svg lucideMusic [size]="18"></svg><span>Conciertos</span></a>
      </nav>
      <div class="sidebar-bottom"><p>Gestión de conciertos</p><a routerLink="/concerts" class="back-to-site"><svg lucideArrowLeft [size]="16"></svg> Ir al listado</a></div>
    </aside>
  `,
  styleUrl: './navbar.component.scss'
})
export class Navbar {}
