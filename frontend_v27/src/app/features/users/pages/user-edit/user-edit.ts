import { AlertService } from '../../../../core/services/alert.service';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { UserForm } from '../../components/user-form/user-form';
import { UserPayload } from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user.service';
import { RoleService } from '../../../../core/services/role.service';
import { RolesStore } from '../../../../core/stores/roles.store';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { UsersStore } from '../../../../core/stores/users.store';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [UserForm, SkeletonLoader, RouterLink, LucideArrowLeft],
  template: `
    <section class="admin-content">
      <a class="form-back" routerLink="/users"><svg lucideArrowLeft [size]="16"></svg> Volver a usuarios</a>
      <div class="admin-page-heading">
        <div><p class="eyebrow">ADMINISTRACIÓN</p><h1>Editar usuario</h1><p class="heading-copy">Actualiza los datos de la cuenta. La contraseña solo cambia si escribes una nueva.</p></div>
      </div>

      @if (store.loading()) {
        <app-skeleton-loader [count]="5" />
      } @else if (!store.selected()) {
        <div class="form-error-panel" role="alert">{{ store.error() || 'No se ha podido cargar el usuario.' }}<a routerLink="/users">Volver al listado</a></div>
      } @else {
        <app-user-form [roles]="rolesStore.roles()" [value]="store.selected()" [saving]="store.saving()" [error]="store.error()" (formSubmit)="save($event)" (cancelClick)="cancel()" />
      }
    </section>
  `,
  styles: [`.admin-content{max-width:820px;margin:auto;padding:28px 36px 52px}.form-back{display:inline-flex;align-items:center;gap:7px;margin-bottom:20px;color:#718096;text-decoration:none;font-size:11px;font-weight:600}.form-back:hover{color:#0878f9}.admin-page-heading{margin-bottom:22px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.form-error-panel{margin-bottom:16px;padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}.form-error-panel a{display:block;margin-top:9px;color:#0878f9;font-weight:700;text-decoration:none}@media(max-width:650px){.admin-content{padding:22px 16px 38px}.admin-page-heading h1{font-size:25px}}`]
})
export class UserEdit implements OnInit {
  readonly store = inject(UsersStore);
  readonly rolesStore = inject(RolesStore);
  private readonly roleService = inject(RoleService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  ngOnInit(): void {
    this.store.clearError();
    void this.loadRoles();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) void this.load(id);
  }

  async load(id: string): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);
    this.store.setSelected(null);
    try {
      const response = await this.userService.getById(id);
      this.store.setSelected(response.data);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se ha encontrado el usuario.'));
    } finally {
      this.store.setLoading(false);
    }
  }

  async save(payload: UserPayload): Promise<void> {
    const id = this.store.selected()?._id;
    if (!id) return;

    this.store.setSaving(true);
    this.store.setError(null);
    try {
      const response = await this.userService.update(id, payload);
      this.store.upsert(response.data);
      await this.alerts.success('Usuario actualizado', response.data.name);
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
