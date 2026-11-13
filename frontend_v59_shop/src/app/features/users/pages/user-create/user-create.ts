import { AlertService } from '../../../../core/services/alert.service';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { UserForm } from '../../components/user-form/user-form';
import { UserPayload } from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user.service';
import { RoleService } from '../../../../core/services/role.service';
import { RolesStore } from '../../../../core/stores/roles.store';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { UsersStore } from '../../../../core/stores/users.store';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [UserForm, RouterLink, LucideArrowLeft],
  template: `
    <section class="admin-content">
      <a class="form-back" routerLink="/users"><svg lucideArrowLeft [size]="16"></svg> Volver a usuarios</a>
      <div class="admin-page-heading">
        <div><p class="eyebrow">ADMINISTRACIÓN</p><h1>Nuevo usuario</h1><p class="heading-copy">Crea una cuenta con su email y una contraseña inicial.</p></div>
      </div>

      <app-user-form [roles]="rolesStore.roles()" [saving]="store.saving()" [error]="store.error()" (formSubmit)="save($event)" (cancelClick)="cancel()" />
    </section>
  `,
  styles: [`.admin-content{max-width:820px;margin:auto;padding:28px 36px 52px}.form-back{display:inline-flex;align-items:center;gap:7px;margin-bottom:20px;color:#718096;text-decoration:none;font-size:11px;font-weight:600}.form-back:hover{color:#0878f9}.admin-page-heading{margin-bottom:22px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}@media(max-width:650px){.admin-content{padding:22px 16px 38px}.admin-page-heading h1{font-size:25px}}`]
})
export class UserCreate implements OnInit {
  readonly store = inject(UsersStore);
  readonly rolesStore = inject(RolesStore);
  private readonly roleService = inject(RoleService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  ngOnInit(): void {
    this.store.clearError();
    this.store.clearSelected();
    void this.loadRoles();
  }

  async save(payload: UserPayload): Promise<void> {
    this.store.setSaving(true);
    this.store.setError(null);
    try {
      const response = await this.userService.create(payload);
      this.store.upsert(response.data);
      await this.alerts.success('Usuario creado', response.data.name);
      await this.router.navigateByUrl('/users');
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se ha podido guardar el usuario.'));
    } finally {
      this.store.setSaving(false);
    }
  }

  async loadRoles(): Promise<void> {
    try {
      const response = await this.roleService.getAll();
      this.rolesStore.setItems(response.data);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se han podido cargar los roles.'));
    }
  }

  cancel(): void {
    void this.router.navigateByUrl('/users');
  }
}
