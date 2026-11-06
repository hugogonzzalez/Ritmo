import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({selector:'app-root',standalone:true,imports:[RouterOutlet],templateUrl:'./app.html',styleUrl:'./app.css'})
export class App {
  private readonly authService = inject(AuthService);

  constructor() {
    // Restaura la sesión guardada al recargar la página
    void this.authService.restoreSession();
  }
}
