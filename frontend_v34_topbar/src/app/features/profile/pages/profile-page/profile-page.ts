import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AlertService } from '../../../../core/services/alert.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { ProfileForm } from '../../components/profile-form/profile-form';
import { Profile, ProfilePayload } from '../../../../core/models/profile.model';
import { ProfileService } from '../../../../core/services/profile.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [ProfileForm, ErrorState],
  template: `
    <section class="profile-content">
      <div class="page-heading">
        <div>
          <p class="eyebrow">MI CUENTA</p>
          <h1>Mi perfil</h1>
          <p class="heading-copy">Datos de contacto y presentación vinculados a tu cuenta.</p>
        </div>
        <div class="account-card">
          <strong>{{ userName() }}</strong>
          <small>{{ userEmail() }}</small>
          <span class="role-pill">{{ roleLabel() }}</span>
        </div>
      </div>

      @if (error()) { <app-error-state [message]="error() ?? ''" (retry)="load()" /> }

      @if (loading()) {
        <div class="panel loading">Cargando tu perfil…</div>
      } @else {
        <div class="profile-grid">
          <div class="panel">
            <h2>Editar perfil</h2>
            <app-profile-form [value]="profile()" [saving]="saving()" (formSubmit)="save($event)" (cancelClick)="load()" />
          </div>

          <aside class="panel preview">
            <h2>Vista previa</h2>
            <dl>
              <dt>Nombre completo</dt>
              <dd>{{ fullName() || 'Sin completar' }}</dd>
              <dt>Teléfono</dt>
              <dd>{{ profile()?.phone || '—' }}</dd>
              <dt>Foto</dt>
              <dd class="break">{{ profile()?.avatarUrl || '—' }}</dd>
              <dt>Biografía</dt>
              <dd class="pre">{{ profile()?.bio || 'Todavía no has escrito nada.' }}</dd>
            </dl>
          </aside>
        </div>
      }
    </section>
  `,
  styles: [`.profile-content{max-width:1100px;margin:auto;padding:31px 36px 48px}.page-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:24px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.account-card{display:grid;gap:4px;min-width:200px;padding:14px 16px;border:1px solid #e6eaf0;border-radius:12px;background:#fff}.account-card strong{color:#263143;font-size:13px}.account-card small{color:#8a94a3;font-size:11px}.role-pill{justify-self:start;margin-top:5px;border-radius:99px;background:#eaf3ff;padding:4px 9px;color:#1769bd;font-size:9px;font-weight:700}.panel{padding:24px 27px;border:1px solid #e6eaf0;border-radius:14px;background:#fff;box-shadow:0 3px 12px #18223206}.panel h2{margin:0 0 18px;color:#263143;font:700 14px 'Space Grotesk',sans-serif}.loading{color:#758093;font-size:12px}.profile-grid{display:grid;grid-template-columns:1.4fr 1fr;gap:20px;align-items:start}.preview dl{display:grid;gap:14px;margin:0}.preview dt{color:#9aa3b1;font-size:9px;font-weight:700;letter-spacing:.6px;text-transform:uppercase}.preview dd{margin:4px 0 0;color:#273144;font-size:12px}.preview .break{word-break:break-all}.preview .pre{white-space:pre-line;color:#5b6678}@media(max-width:850px){.profile-content{padding:25px 18px 40px}.profile-grid{grid-template-columns:1fr}.page-heading{flex-direction:column}}`]
})
export class ProfilePage implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly alerts = inject(AlertService);

  readonly profile = signal<Profile | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly userName = computed(() => this.authStore.user()?.name ?? '');
  readonly userEmail = computed(() => this.authStore.user()?.email ?? '');
  readonly roleLabel = this.authStore.roleLabel;
  readonly fullName = computed(() => [this.profile()?.firstName, this.profile()?.lastName]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(' '));

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await this.profileService.getMe();
      this.profile.set(response.data);
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'No se ha podido cargar tu perfil.'));
    } finally {
      this.loading.set(false);
    }
  }

  async save(payload: ProfilePayload): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      const response = await this.profileService.updateMe(payload);
      this.profile.set(response.data);
      // Actualiza nombre y avatar de la barra superior
      await this.authService.refresh();
      await this.alerts.success('Perfil actualizado', 'Tus datos se han guardado correctamente.');
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'No se han podido guardar los cambios.'));
    } finally {
      this.saving.set(false);
    }
  }
}
