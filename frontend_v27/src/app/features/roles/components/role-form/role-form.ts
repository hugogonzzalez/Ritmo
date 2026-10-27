import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideShield } from '@lucide/angular';
import { ROLE_LABELS, ROLE_NAMES, ROLE_PERMISSIONS, Role, RolePayload, RolePermission } from '../../../../core/models/role.model';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [ReactiveFormsModule, LucideShield],
  template: `
    <form class="form-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="section-title"><span class="form-icon"><svg lucideShield [size]="18"></svg></span><div><h2>Información del rol</h2><p>Los campos marcados con * son obligatorios.</p></div></div>
      @if (error()) { <div class="form-error" role="alert">{{ error() }}</div> }

      <div class="form-grid">
        <div class="form-field">
          <label for="name">Rol <b>*</b></label>
          <select id="name" formControlName="name">
            @for (name of names; track name) { <option [value]="name">{{ labelOf(name) }}</option> }
          </select>
        </div>
        <label class="active-control" for="isActive"><span class="switch-copy"><strong>Rol activo</strong><small>{{ form.controls.isActive.value ? 'Se puede asignar a usuarios' : 'No se puede asignar' }}</small></span><input id="isActive" type="checkbox" formControlName="isActive"><span class="toggle-track"><i></i></span></label>
        <div class="form-field full">
          <label for="description">Descripción</label>
          <textarea id="description" rows="3" maxlength="300" formControlName="description" placeholder="Para qué sirve este rol (opcional)"></textarea>
          <small class="field-hint">{{ form.controls.description.value.length }}/300 caracteres</small>
        </div>
      </div>

      <fieldset class="permission-list">
        <legend>Permisos</legend>
        @for (permission of permissionOptions; track permission.key) {
          <label class="permission-item">
            <input type="checkbox" [checked]="isSelected(permission.key)" (change)="togglePermission(permission.key, $any($event.target).checked)">
            <span><strong>{{ permission.label }}</strong><small>{{ permission.key }}</small></span>
          </label>
        }
      </fieldset>

      <div class="form-actions">
        <button type="button" class="secondary-action" (click)="cancelClick.emit()">Cancelar</button>
        <button type="submit" class="primary-action" [disabled]="saving()">{{ saving() ? 'Guardando…' : (isEditMode() ? 'Guardar cambios' : 'Crear rol') }}</button>
      </div>
    </form>
  `,
  styles: [`.form-card{padding:24px 27px;border:1px solid #e6eaf0;border-radius:14px;background:#fff;box-shadow:0 3px 12px #18223206}.section-title{display:flex;align-items:center;gap:11px;margin-bottom:21px}.status-section{margin:25px 0 18px;padding-top:22px;border-top:1px solid #edf0f4}.form-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:#eaf3ff;color:#0878f9}.status-icon{background:#eef7f2;color:#238355}.section-title h2{margin:0;color:#263143;font:700 14px 'Space Grotesk',sans-serif}.section-title p{margin:4px 0 0;color:#919aa8;font-size:10px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px 18px}.form-field{min-width:0;display:flex;flex-direction:column;gap:7px}.form-field.full{grid-column:1/-1}.form-field label{color:#465166;font-size:10px;font-weight:700}.form-field label b{color:#e25559}.form-field input,.form-field select,.form-field textarea{width:100%;min-height:41px;border:1px solid #dfe4eb;border-radius:8px;background:#fff;padding:10px 11px;color:#273144;font:inherit;font-size:11px;outline:0;box-sizing:border-box}.form-field textarea{resize:vertical;min-height:89px;line-height:1.5}.form-field input:focus,.form-field select:focus,.form-field textarea:focus{border-color:#0878f9;box-shadow:0 0 0 3px #0878f918}.field-error{color:#c43f43;font-size:9px}.field-hint{align-self:flex-end;color:#9aa3b1;font-size:9px}.active-control{min-height:41px;display:flex;align-items:center;justify-content:space-between;gap:15px;border:1px solid #dfe4eb;border-radius:8px;padding:8px 11px;cursor:pointer;position:relative}.switch-copy{display:grid;gap:3px}.switch-copy strong{color:#465166;font-size:10px}.switch-copy small{color:#9099a6;font-size:9px}.active-control input{position:absolute;opacity:0;width:1px;height:1px}.toggle-track{width:35px;height:20px;display:flex;align-items:center;padding:2px;border-radius:99px;background:#bcc4cf;transition:.18s}.toggle-track i{width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0002;transition:.18s}.active-control input:checked+.toggle-track{background:#22a765}.active-control input:checked+.toggle-track i{transform:translateX(15px)}.form-actions{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:25px;padding-top:19px;border-top:1px solid #edf0f4}.primary-action,.secondary-action{min-height:39px;display:inline-flex;justify-content:center;align-items:center;gap:8px;border-radius:8px;padding:0 15px;text-decoration:none;font:700 11px 'DM Sans',sans-serif;cursor:pointer}.primary-action{border:0;background:#0878f9;color:white}.primary-action:hover{background:#0669dc}.primary-action:disabled{opacity:.6;cursor:wait}.secondary-action{border:1px solid #dfe4eb;background:#fff;color:#606b7c}.secondary-action:hover{background:#f6f8fa}.form-error{margin-bottom:16px;padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}@media(max-width:650px){.form-card{padding:19px 16px}.form-grid{grid-template-columns:1fr}.form-field.full{grid-column:auto}.form-actions{justify-content:stretch}.form-actions>*{flex:1}}.permission-list{margin:18px 0 0;padding:14px 16px;border:1px solid #e6eaf0;border-radius:12px;display:grid;gap:8px}.permission-list legend{padding:0 6px;color:#30394a;font-size:12px;font-weight:700}.permission-item{display:flex;align-items:center;gap:10px;cursor:pointer}.permission-item span{display:grid;gap:2px}.permission-item strong{color:#293345;font-size:12px}.permission-item small{color:#9aa3b1;font-size:10px}`]
})
export class RoleForm {
  private readonly fb = inject(FormBuilder).nonNullable;

  // Datos a editar (null al crear) y estado de guardado. Los gestiona la página.
  readonly value = input<Role | null>(null);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  readonly formSubmit = output<RolePayload>();
  readonly cancelClick = output<void>();

  readonly names = ROLE_NAMES;
  readonly permissionOptions = ROLE_PERMISSIONS;
  readonly isEditMode = computed(() => this.value() !== null);
  readonly selectedPermissions = signal<RolePermission[]>([]);

  readonly form = this.fb.group({
    name: ['admin' as Role['name'], [Validators.required]],
    description: ['', [Validators.maxLength(300)]],
    isActive: [true]
  });

  constructor() {
    effect(() => {
      const role = this.value();

      if (!role) {
        this.form.reset({ name: 'admin', description: '', isActive: true });
        this.selectedPermissions.set([]);
        return;
      }

      this.form.patchValue({ name: role.name, description: role.description ?? '', isActive: role.isActive });
      this.selectedPermissions.set([...role.permissions]);
    });
  }

  labelOf(name: string): string {
    return ROLE_LABELS[name] ?? name;
  }

  isSelected(permission: RolePermission): boolean {
    return this.selectedPermissions().includes(permission);
  }

  togglePermission(permission: RolePermission, checked: boolean): void {
    this.selectedPermissions.update((list) => {
      const without = list.filter((item) => item !== permission);
      return checked ? [...without, permission] : without;
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.formSubmit.emit({
      name: raw.name,
      description: raw.description.trim(),
      permissions: this.selectedPermissions(),
      isActive: raw.isActive
    });
  }
}
