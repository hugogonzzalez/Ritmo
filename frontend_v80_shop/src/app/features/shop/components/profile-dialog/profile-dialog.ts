import { Component, HostListener, effect, inject, input, output, signal, untracked } from '@angular/core';
import { Profile, ProfilePayload } from '../../../../core/models/profile.model';
import { AlertService } from '../../../../core/services/alert.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { AuthService } from '../../../../core/services/auth.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { ProfileForm } from '../../../profile/components/profile-form/profile-form';

// Ventana para editar el perfil desde la tienda. Usa el mismo formulario que el dashboard.
@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [ProfileForm],
  template: `
    @if (open()) {
      <div class="overlay" (click)="cerrar()">
        <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="perfil-titulo" (click)="$event.stopPropagation()">
          <header class="dialog-head">
            <h2 id="perfil-titulo">Editar perfil</h2>
            <button type="button" class="close" (click)="cerrar()" aria-label="Cerrar">×</button>
          </header>

          @if (error()) {
            <p class="error">{{ error() }}</p>
          }

          @if (loading()) {
            <p class="loading">Cargando tu perfil…</p>
          } @else {
            <app-profile-form [value]="profile()" [saving]="saving()" (formSubmit)="guardar($event)" (cancelClick)="cargar()" />
          }
        </section>
      </div>
    }
  `,
  styles: `
    .overlay { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 20px; background: rgba(11, 17, 27, 0.55); }
    .dialog { width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; border-radius: 16px; background: #fff; padding: 22px 26px; box-shadow: 0 20px 50px #0b111b55; color: #151515; }
    .dialog-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
    .dialog-head h2 { margin: 0; font: 700 16px 'Space Grotesk', sans-serif; color: #263143; }
    .close { border: 0; background: transparent; padding: 0 4px; font-size: 24px; line-height: 1; color: #6b7587; cursor: pointer; }
    .close:hover { color: #151515; }
    .error { margin: 0 0 12px; color: #c43f43; font-size: 12px; }
    .loading { color: #758093; font-size: 12px; }
  `
})
export class ProfileDialog {
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly alerts = inject(AlertService);

  readonly open = input(false);
  readonly closed = output<void>();

  readonly profile = signal<Profile | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    // Cada vez que se abre, se carga el perfil actual
    effect(() => {
      if (this.open()) {
        untracked(() => void this.cargar());
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.cerrar();
  }

  cerrar(): void {
    this.closed.emit();
  }

  async cargar(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const respuesta = await this.profileService.getMe();
      this.profile.set(respuesta.data);
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'No se ha podido cargar tu perfil.'));
    } finally {
      this.loading.set(false);
    }
  }

  async guardar(payload: ProfilePayload): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      const respuesta = await this.profileService.updateMe(payload);
      this.profile.set(respuesta.data);
      // Actualiza nombre y foto de la cabecera
      await this.authService.refresh();
      await this.alerts.success('Perfil actualizado', 'Tus datos se han guardado correctamente.');
      this.cerrar();
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'No se han podido guardar los cambios.'));
    } finally {
      this.saving.set(false);
    }
  }
}
