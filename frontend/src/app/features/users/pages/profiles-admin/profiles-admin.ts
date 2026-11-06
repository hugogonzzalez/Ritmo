import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideIdCard, LucidePencil, LucidePower, LucideTrash2 } from '@lucide/angular';
import { AdminProfile } from '../../../../core/models/profile.model';
import { AlertService } from '../../../../core/services/alert.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { ProfileService } from '../../../../core/services/profile.service';
import { UserService } from '../../../../core/services/user.service';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';

// Listado de perfiles de todos los usuarios (solo administradores).
// Activar, desactivar y eliminar se hacen sobre el usuario; el perfil sigue ese mismo estado en el backend.
@Component({
  selector: 'app-profiles-admin',
  standalone: true,
  imports: [RouterLink, ErrorState, SkeletonLoader, LucideIdCard, LucidePencil, LucidePower, LucideTrash2],
  template: `
    <section class="admin-content">
      <div class="admin-page-heading">
        <div><p class="eyebrow">ADMINISTRACIÓN</p><h1>Perfiles</h1><p class="heading-copy">Datos de contacto y presentación de cada usuario.</p></div>
      </div>

      <section class="table-panel">
        @if (error()) { <app-error-state [message]="error() ?? ''" (retry)="load()" /> }

        @if (loading()) {
          <div class="skeleton-rows"><app-skeleton-loader [count]="5" /></div>
        } @else if (sortedProfiles().length === 0) {
          <div class="table-empty"><span class="empty-icon"><svg lucideIdCard [size]="23"></svg></span><strong>Todavía no hay perfiles</strong><p>Aparecerán cuando se creen usuarios.</p></div>
        } @else {
          <div class="table-scroll"><table class="venue-table">
            <thead><tr><th>Nombre</th><th>Cuenta</th><th>Teléfono</th><th>Biografía</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>@for (profile of sortedProfiles(); track profile._id) {
              <tr [class.inactive-row]="!profile.userId.isActive">
                <td><strong>{{ fullName(profile) }}</strong></td>
                <td><div class="account-cell"><strong>{{ profile.userId.name }}</strong><small>{{ profile.userId.email }}</small></div></td>
                <td>{{ profile.phone || '—' }}</td>
                <td class="bio-cell">{{ profile.bio || '—' }}</td>
                <td><span class="active-pill" [class.inactive]="!profile.userId.isActive"><i></i>{{ profile.userId.isActive ? 'Activo' : 'Inactivo' }}</span></td>
                <td><div class="row-actions">
                  <a class="icon-action" [routerLink]="['/users/profiles', profile.userId._id, 'edit']" [attr.aria-label]="'Editar perfil de ' + profile.userId.name" title="Editar"><svg lucidePencil [size]="15"></svg></a>
                  <button class="icon-action power-action" [class.power-off]="profile.userId.isActive" (click)="toggle(profile)" [disabled]="saving()" [attr.aria-label]="(profile.userId.isActive ? 'Desactivar ' : 'Activar ') + profile.userId.name" [title]="profile.userId.isActive ? 'Desactivar' : 'Activar'"><svg lucidePower [size]="15"></svg></button>
                  <button class="icon-action delete-action" (click)="remove(profile)" [disabled]="saving()" [attr.aria-label]="'Eliminar ' + profile.userId.name" title="Eliminar"><svg lucideTrash2 [size]="15"></svg></button>
                </div></td>
              </tr>
            }</tbody>
          </table></div>
          <div class="table-foot">{{ sortedProfiles().length }} perfiles</div>
        }
      </section>
    </section>
  `,
  styles: [`.admin-content{max-width:1200px;margin:auto;padding:31px 36px 48px}.admin-page-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:21px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.table-panel{border:1px solid #e5e9ef;border-radius:14px;background:#fff;overflow:hidden;box-shadow:0 3px 10px #18223206}.table-scroll{overflow:auto}.venue-table{width:100%;min-width:900px;border-collapse:collapse;text-align:left}.venue-table th{height:41px;background:#f8fafc;color:#748094;font-size:10px;font-weight:700;white-space:nowrap}.venue-table th,.venue-table td{padding:12px 14px}.venue-table tbody tr{border-top:1px solid #edf0f4}.venue-table tbody tr:hover{background:#fbfcfe}.venue-table tbody tr.inactive-row{background:#f1f3f6}.venue-table td{color:#4b5668;font-size:11px;vertical-align:middle}.venue-table td strong{color:#293345;font-size:11px}.account-cell{display:grid;gap:3px}.account-cell small{color:#9aa3b1;font-size:9px}.bio-cell{max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.active-pill{display:inline-flex;align-items:center;gap:6px;color:#277b4c;font-size:10px;font-weight:600;white-space:nowrap}.active-pill i{width:7px;height:7px;border-radius:50%;background:#32aa68}.active-pill.inactive{color:#778195}.active-pill.inactive i{background:#aab2bf}.row-actions{display:flex;gap:5px}.icon-action{width:29px;height:29px;display:grid;place-items:center;border:1px solid #e3e8ee;border-radius:7px;background:white;color:#647084;cursor:pointer;transition:.15s;text-decoration:none}.icon-action:hover{border-color:#a5cafa;background:#f2f8ff;color:#0878f9}.icon-action.power-off{color:#b87517}.icon-action.delete-action{color:#b54e52}.icon-action.delete-action:hover{border-color:#ffc4c4;background:#fff3f3;color:#ce3339}.icon-action:disabled{opacity:.45;cursor:wait}.skeleton-rows{padding:16px}.table-foot{padding:12px 17px;border-top:1px solid #edf0f4;color:#8892a2;font-size:10px}.table-empty{min-height:270px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.empty-icon{width:48px;height:48px;margin-bottom:12px;display:grid;place-items:center;border-radius:15px;background:#eff6ff;color:#0878f9}.table-empty strong{font:700 15px 'Space Grotesk',sans-serif;color:#30394a}.table-empty p{margin:7px 0 16px;color:#8993a2;font-size:11px}@media(max-width:850px){.admin-content{padding:25px 18px 40px}}`]
})
export class ProfilesAdmin implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly userService = inject(UserService);
  private readonly alerts = inject(AlertService);

  readonly profiles = signal<AdminProfile[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly sortedProfiles = computed(() => [...this.profiles()].sort((a, b) => a.userId.name.localeCompare(b.userId.name)));

  ngOnInit(): void {
    void this.load();
  }

  fullName(profile: AdminProfile): string {
    const name = [profile.firstName, profile.lastName].filter((part) => part?.trim()).join(' ');
    return name || 'Sin completar';
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await this.profileService.getAll();
      this.profiles.set(response.data);
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'No se han podido cargar los perfiles.'));
    } finally {
      this.loading.set(false);
    }
  }

  async toggle(profile: AdminProfile): Promise<void> {
    const active = !profile.userId.isActive;
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.userService.setActivation(profile.userId._id, active);
      await this.alerts.success(active ? 'Usuario activado' : 'Usuario desactivado', profile.userId.name);
      await this.load();
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'No se pudo cambiar el estado activo.'));
    } finally {
      this.saving.set(false);
    }
  }

  async remove(profile: AdminProfile): Promise<void> {
    const confirmation = await this.alerts.confirm('¿Eliminar usuario?', `«${profile.userId.name}» y su perfil dejarán de aparecer en la lista.`, 'Eliminar');
    if (!confirmation.isConfirmed) return;

    this.saving.set(true);
    this.error.set(null);
    try {
      await this.userService.softDelete(profile.userId._id);
      await this.alerts.success('Usuario eliminado', 'Se ha eliminado de la lista de administración.');
      await this.load();
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'No se pudo eliminar el usuario.'));
    } finally {
      this.saving.set(false);
    }
  }
}
