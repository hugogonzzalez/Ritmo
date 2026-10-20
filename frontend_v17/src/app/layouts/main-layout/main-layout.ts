import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Loader } from '../../shared/components/loader/loader';
import { Navbar } from '../../shared/components/navbar/navbar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar, Loader],
  template: `
    <div class="admin-shell min-h-screen bg-gray-50">
      <app-navbar />
      <app-loader />
      <main>
        <router-outlet />
      </main>
    </div>
  `
})
export class MainLayout {}
