import { AlertService } from '../../../../core/services/alert.service';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { RoleForm } from '../../components/role-form/role-form';
import { RolePayload } from '../../../../core/models/role.model';
import { RoleService } from '../../../../core/services/role.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { RolesStore } from '../../../../core/stores/roles.store';

@Component({
  selector: 'app-role-create',
  standalone: true,
  imports: [RoleForm, RouterLink, LucideArrowLeft],
  template: `
    <section class="admin-content">
      <a class="form-back" routerLink="/roles"><svg lucideArrowLeft [size]="16"></svg> Volver a roles</a>
      <div class="admin-page-heading">
        <div><p class="eyebrow">ADMINISTRACIÓN</p><h1>Nuevo rol</h1><p class="heading-copy">Elige el rol y los permisos que tendrá.</p></div>
      </div>

      <app-role-form [saving]="store.saving()" [error]="store.error()" (formSubmit)="save($event)" (cancelClick)="cancel()" />
    </section>
  `,
  styles: [`.admin-content{max-width:820px;margin:auto;padding:28px 36px 52px}.form-back{display:inline-flex;align-items:center;gap:7px;margin-bottom:20px;color:#718096;text-decoration:none;font-size:11px;font-weight:600}.form-back:hover{color:#0878f9}.admin-page-heading{margin-bottom:22px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}@media(max-width:650px){.admin-content{padding:22px 16px 38px}.admin-page-heading h1{font-size:25px}}`]
})
export class RoleCreate implements OnInit {
  readonly store = inject(RolesStore);
  private readonly roleService = inject(RoleService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  ngOnInit(): void {
    this.store.clearError();
    this.store.clearSelected();
  }

  async save(payload: RolePayload): Promise<void> {
    this.store.setSaving(true);
    this.store.setError(null);
    try {
      const response = await this.roleService.create(payload);
      this.store.upsert(response.data);
      await this.alerts.success('Rol creado', response.data.name);
      await this.router.navigateByUrl('/roles');
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se ha podido guardar el rol.'));
    } finally {
      this.store.setSaving(false);
    }
  }

  cancel(): void {
    void this.router.navigateByUrl('/roles');
  }
}
