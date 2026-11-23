import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

// Renueva el access_token llamando a auth/refresh (el refresh_token va en su cookie)
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly api = inject(ApiService);
  private enCurso: Promise<boolean> | null = null;

  // Si varias peticiones caducan a la vez, solo se llama una vez a /auth/refresh
  renovar(): Promise<boolean> {
    this.enCurso ??= this.llamarRefresh().finally(() => {
      this.enCurso = null;
    });
    return this.enCurso;
  }

  private async llamarRefresh(): Promise<boolean> {
    try {
      await this.api.post('auth/refresh', {});
      return true;
    } catch {
      return false;
    }
  }
}
