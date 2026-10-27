import { AlertService } from '../../../../core/services/alert.service';
import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucidePencil, LucidePlus, LucidePower, LucideShield, LucideTrash2 } from '@lucide/angular';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ROLE_LABELS, Role } from '../../../../core/models/role.model';
import { RoleService } from '../../../../core/services/role.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { RolesStore } from '../../../../core/stores/roles.store';

@Component({
  selector: 'app-roles-admin',
  standalone: true,
  imports: [RouterLink, ErrorState, SkeletonLoader, LucideShield, LucidePencil, LucidePlus, LucidePower, LucideTrash2],
  template: `
    <section class="admin-content">
      <div class="admin-page-heading">
        <div><p class="eyebrow">ADMINISTRACIÓN</p><h1>Roles</h1><p class="heading-copy">Qué puede hacer cada tipo de usuario en la aplicación.</p></div>
        <a class="primary-action" routerLink="/roles/create"><svg lucidePlus [size]="17"></svg> Nuevo rol</a>
      </div>
      <section class="table-panel">
        @if (store.error()) { <app-error-state [message]="store.error() ?? ''" (retry)="load()" /> }
        @if (store.loading()) {
          <div class="skeleton-rows"><app-skeleton-loader [count]="3" /></div>
        } @else if (sortedRoles().length === 0) {
          <div class="table-empty"><span class="empty-icon"><svg lucideShield [size]="23"></svg></span><strong>Aún no hay roles</strong><p>Crea los roles para poder asignarlos a los usuarios.</p><a class="primary-action" routerLink="/roles/create"><svg lucidePlus [size]="16"></svg> Crear rol</a></div>
        } @else {
          <div class="table-scroll"><table class="venue-table">
            <thead><tr><th>Rol</th><th>Descripción</th><th>Permisos</th><th>Activo</th><th>Acciones</th></tr></thead>
            <tbody>@for (role of sortedRoles(); track role._id) {
              <tr [class.inactive-row]="!role.isActive">
                <td><div class="venue-cell"><span class="venue-avatar"><svg lucideShield [size]="17"></svg></span><span><strong>{{ labelOf(role.name) }}</strong><small>{{ role.slug }}</small></span></div></td>
                <td>{{ role.description || 'Sin descripción' }}</td>
                <td>{{ role.permissions.length }} permisos</td>
                <td><span class="active-pill" [class.inactive]="!role.isActive"><i></i>{{ role.isActive ? 'Activo' : 'Inactivo' }}</span></td>
                <td><div class="row-actions">
                  <a class="icon-action" [routerLink]="['/roles', role._id, 'edit']" [attr.aria-label]="'Editar ' + labelOf(role.name)" title="Editar"><svg lucidePencil [size]="15"></svg></a>
                  <button class="icon-action power-action" [class.power-off]="role.isActive" (click)="toggle(role)" [disabled]="store.saving()" [attr.aria-label]="role.isActive ? 'Desactivar ' + labelOf(role.name) : 'Activar ' + labelOf(role.name)" [title]="role.isActive ? 'Desactivar' : 'Activar'"><svg lucidePower [size]="15"></svg></button>
                  <button class="icon-action delete-action" (click)="remove(role)" [disabled]="store.saving()" [attr.aria-label]="'Eliminar ' + labelOf(role.name)" title="Eliminar"><svg lucideTrash2 [size]="15"></svg></button>
                </div></td>
              </tr>
            }</tbody>
          </table></div>
          <div class="table-foot">{{ store.total() }} roles <span>Un rol con usuarios activos no se puede desactivar ni borrar.</span></div>
        }
      </section>
    </section>
  `,
  styles: [`.admin-content{max-width:1200px;margin:auto;padding:31px 36px 48px}.admin-page-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:21px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.primary-action{display:flex;align-items:center;justify-content:center;gap:8px;border-radius:9px;background:#0878f9;padding:11px 15px;color:white;text-decoration:none;font-size:12px;font-weight:700;box-shadow:0 6px 15px #0878f926}.primary-action:hover{background:#0669dc}.table-panel{border:1px solid #e5e9ef;border-radius:14px;background:#fff;overflow:hidden;box-shadow:0 3px 10px #18223206}.table-scroll{overflow:auto}.venue-table{width:100%;min-width:800px;border-collapse:collapse;text-align:left}.venue-table th{height:41px;background:#f8fafc;color:#748094;font-size:10px;font-weight:700;white-space:nowrap}.venue-table th,.venue-table td{padding:0 14px}.venue-table tbody tr{height:63px;border-top:1px solid #edf0f4}.venue-table tbody tr:hover{background:#fbfcfe}.venue-table tbody tr.inactive-row{background:#f1f3f6}.venue-table td{color:#4b5668;font-size:11px}.venue-cell{display:flex;align-items:center;gap:10px;min-width:200px}.venue-avatar{display:grid;place-items:center;width:35px;height:35px;flex:0 0 35px;border-radius:10px;background:#eaf3ff;color:#0878f9}.venue-cell>span:last-child{display:grid;gap:4px;min-width:0}.venue-cell strong{color:#293345;font-size:11px}.venue-cell small{max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#9aa3b1;font-size:9px}.status-pill{display:inline-flex;border-radius:99px;background:#e7f2ff;padding:5px 9px;color:#1769bd;font-size:9px;font-weight:700;white-space:nowrap}.status-pill.status-maintenance{background:#fff3df;color:#aa6c0c}.status-pill.status-closed{background:#ffeded;color:#bd3f43}.active-pill{display:inline-flex;align-items:center;gap:6px;color:#277b4c;font-size:10px;font-weight:600;white-space:nowrap}.active-pill i{width:7px;height:7px;border-radius:50%;background:#32aa68}.active-pill.inactive{color:#778195}.active-pill.inactive i{background:#aab2bf}.row-actions{display:flex;gap:5px}.icon-action{width:29px;height:29px;display:grid;place-items:center;border:1px solid #e3e8ee;border-radius:7px;background:white;color:#647084;cursor:pointer;transition:.15s}.icon-action:hover{border-color:#a5cafa;background:#f2f8ff;color:#0878f9}.icon-action.power-off{color:#b87517}.icon-action.delete-action{color:#b54e52}.icon-action.delete-action:hover{border-color:#ffc4c4;background:#fff3f3;color:#ce3339}.icon-action:disabled{opacity:.45;cursor:wait}.table-foot{display:flex;justify-content:space-between;gap:12px;padding:12px 17px;border-top:1px solid #edf0f4;color:#8892a2;font-size:10px}.table-foot span{color:#9ca5b1}.skeleton-rows{padding:16px}.table-empty{min-height:270px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.empty-icon{width:48px;height:48px;margin-bottom:12px;display:grid;place-items:center;border-radius:15px;background:#eff6ff;color:#0878f9}.table-empty strong{font:700 15px 'Space Grotesk',sans-serif;color:#30394a}.table-empty p{margin:7px 0 16px;color:#8993a2;font-size:11px}@media(max-width:850px){.admin-content{padding:25px 18px 40px}}@media(max-width:520px){.admin-page-heading{align-items:flex-start;gap:9px}.admin-page-heading h1{font-size:25px}.primary-action{padding:10px;font-size:10px}}`]
})
export class RolesAdmin implements OnInit {
  readonly store = inject(RolesStore);
  private readonly roleService = inject(RoleService);
  private readonly alerts = inject(AlertService);
  readonly sortedRoles = computed(() => [...this.store.roles()].sort((a, b) => a.name.localeCompare(b.name)));

  ngOnInit(): void { void this.load(); }

  labelOf(name: string): string {
    return ROLE_LABELS[name] ?? name;
  }

  async load(): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);
    try {
      const response = await this.roleService.getAll({ includeInactive: true });
      this.store.setItems(response.data);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se han podido cargar los roles.'));
    } finally {
      this.store.setLoading(false);
    }
  }

  async toggle(role: Role): Promise<void> {
    const active = !role.isActive;
    this.store.setSaving(true);
    this.store.setError(null);
    try {
      const response = await this.roleService.setActivation(role._id, active);
      this.store.upsert(response.data);
      await this.alerts.success(active ? 'Rol activado' : 'Rol desactivado', this.labelOf(role.name));
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se pudo cambiar el estado activo.'));
    } finally {
      this.store.setSaving(false);
    }
  }

  async remove(role: Role): Promise<void> {
    const confirmation = await this.alerts.confirm('¿Eliminar rol?', `«${this.labelOf(role.name)}» dejará de aparecer en la lista.`, 'Eliminar');
    if (!confirmation.isConfirmed) return;

    this.store.setSaving(true);
    this.store.setError(null);
    try {
      await this.roleService.softDelete(role._id);
      this.store.remove(role._id);
      await this.alerts.success('Rol eliminado', 'Se ha eliminado de la lista de administración.');
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se pudo eliminar el rol.'));
    } finally {
      this.store.setSaving(false);
    }
  }
}
