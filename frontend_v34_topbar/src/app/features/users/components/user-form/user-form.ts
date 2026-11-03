import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideUser } from '@lucide/angular';
import { USER_STATUS_LABELS, User, UserPayload, UserStatus } from '../../../../core/models/user.model';
import { ROLE_LABELS, Role } from '../../../../core/models/role.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, LucideUser],
  template: `
    <form class="form-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="section-title"><span class="form-icon"><svg lucideUser [size]="18"></svg></span><div><h2>Información del usuario</h2><p>Los campos marcados con * son obligatorios.</p></div></div>
      @if (error()) { <div class="form-error" role="alert">{{ error() }}</div> }

      <div class="form-grid">
        <div class="form-field full">
          <label for="name">Nombre <b>*</b></label>
          <input id="name" formControlName="name" maxlength="80" placeholder="Ej. Ana García">
          @if (fieldError('name')) { <small class="field-error">Escribe un nombre de entre 1 y 80 caracteres.</small> }
        </div>
        <div class="form-field full">
          <label for="email">Email <b>*</b></label>
          <input id="email" type="email" formControlName="email" maxlength="254" placeholder="ana@ejemplo.com">
          @if (fieldError('email')) { <small class="field-error">Introduce un email válido.</small> }
        </div>
        <div class="form-field full">
          <label for="roleId">Rol <b>*</b></label>
          <select id="roleId" formControlName="roleId">
            <option value="" disabled>Selecciona un rol</option>
            @for (role of roles(); track role._id) { <option [value]="role._id">{{ labelOf(role.name) }}</option> }
          </select>
          @if (fieldError('roleId')) { <small class="field-error">Selecciona el rol del usuario.</small> }
        </div>
        <div class="form-field full">
          <label for="status">Estado <b>*</b></label>
          <select id="status" formControlName="status">
            @for (option of statusOptions; track option) { <option [value]="option">{{ statusLabel(option) }}</option> }
          </select>
        </div>
        <div class="form-field full">
          <label for="password">{{ isEditMode() ? 'Nueva contraseña' : 'Contraseña' }} {{ isEditMode() ? '' : '*' }}</label>
          <input id="password" type="password" formControlName="password" maxlength="128" autocomplete="new-password" [placeholder]="isEditMode() ? 'Déjala en blanco para no cambiarla' : 'Mínimo 8 caracteres'">
          @if (passwordMessage()) { <small class="field-error">{{ passwordMessage() }}</small> }
        </div>
        <label class="active-control" for="isActive"><span class="switch-copy"><strong>Usuario activo</strong><small>{{ form.controls.isActive.value ? 'Puede iniciar sesión' : 'Sin acceso' }}</small></span><input id="isActive" type="checkbox" formControlName="isActive"><span class="toggle-track"><i></i></span></label>
      </div>

      <div class="form-actions">
        <button type="button" class="secondary-action" (click)="cancelClick.emit()">Cancelar</button>
        <button type="submit" class="primary-action" [disabled]="saving()">{{ saving() ? 'Guardando…' : (isEditMode() ? 'Guardar cambios' : 'Crear usuario') }}</button>
      </div>
    </form>
  `,
  styles: [`.form-card{padding:24px 27px;border:1px solid #e6eaf0;border-radius:14px;background:#fff;box-shadow:0 3px 12px #18223206}.section-title{display:flex;align-items:center;gap:11px;margin-bottom:21px}.status-section{margin:25px 0 18px;padding-top:22px;border-top:1px solid #edf0f4}.form-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:#eaf3ff;color:#0878f9}.status-icon{background:#eef7f2;color:#238355}.section-title h2{margin:0;color:#263143;font:700 14px 'Space Grotesk',sans-serif}.section-title p{margin:4px 0 0;color:#919aa8;font-size:10px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px 18px}.form-field{min-width:0;display:flex;flex-direction:column;gap:7px}.form-field.full{grid-column:1/-1}.form-field label{color:#465166;font-size:10px;font-weight:700}.form-field label b{color:#e25559}.form-field input,.form-field select,.form-field textarea{width:100%;min-height:41px;border:1px solid #dfe4eb;border-radius:8px;background:#fff;padding:10px 11px;color:#273144;font:inherit;font-size:11px;outline:0;box-sizing:border-box}.form-field textarea{resize:vertical;min-height:89px;line-height:1.5}.form-field input:focus,.form-field select:focus,.form-field textarea:focus{border-color:#0878f9;box-shadow:0 0 0 3px #0878f918}.field-error{color:#c43f43;font-size:9px}.field-hint{align-self:flex-end;color:#9aa3b1;font-size:9px}.active-control{min-height:41px;display:flex;align-items:center;justify-content:space-between;gap:15px;border:1px solid #dfe4eb;border-radius:8px;padding:8px 11px;cursor:pointer;position:relative}.switch-copy{display:grid;gap:3px}.switch-copy strong{color:#465166;font-size:10px}.switch-copy small{color:#9099a6;font-size:9px}.active-control input{position:absolute;opacity:0;width:1px;height:1px}.toggle-track{width:35px;height:20px;display:flex;align-items:center;padding:2px;border-radius:99px;background:#bcc4cf;transition:.18s}.toggle-track i{width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0002;transition:.18s}.active-control input:checked+.toggle-track{background:#22a765}.active-control input:checked+.toggle-track i{transform:translateX(15px)}.form-actions{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:25px;padding-top:19px;border-top:1px solid #edf0f4}.primary-action,.secondary-action{min-height:39px;display:inline-flex;justify-content:center;align-items:center;gap:8px;border-radius:8px;padding:0 15px;text-decoration:none;font:700 11px 'DM Sans',sans-serif;cursor:pointer}.primary-action{border:0;background:#0878f9;color:white}.primary-action:hover{background:#0669dc}.primary-action:disabled{opacity:.6;cursor:wait}.secondary-action{border:1px solid #dfe4eb;background:#fff;color:#606b7c}.secondary-action:hover{background:#f6f8fa}.form-error{margin-bottom:16px;padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}@media(max-width:650px){.form-card{padding:19px 16px}.form-grid{grid-template-columns:1fr}.form-field.full{grid-column:auto}.form-actions{justify-content:stretch}.form-actions>*{flex:1}}`]
})
export class UserForm {
  private readonly fb = inject(FormBuilder).nonNullable;

  // Datos a editar (null al crear) y estado de guardado. Los gestiona la página.
  readonly value = input<User | null>(null);
  readonly roles = input<Role[]>([]);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  readonly formSubmit = output<UserPayload>();
  readonly cancelClick = output<void>();

  readonly isEditMode = computed(() => this.value() !== null);

  readonly statusOptions: UserStatus[] = ['active', 'blocked'];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    roleId: ['', [Validators.required]],
    status: ['active' as UserStatus, [Validators.required]],
    password: ['', [Validators.maxLength(128)]],
    isActive: [true]
  });

  constructor() {
    effect(() => {
      const user = this.value();

      if (!user) {
        this.form.reset({ name: '', email: '', roleId: '', status: 'active', password: '', isActive: true });
        return;
      }

      this.form.patchValue({ name: user.name, email: user.email, roleId: user.roleId, status: user.status, password: '', isActive: user.isActive });
    });
  }

  statusLabel(status: UserStatus): string {
    return USER_STATUS_LABELS[status];
  }

  labelOf(name: string): string {
    return ROLE_LABELS[name] ?? name;
  }

  fieldError(name: 'name' | 'email' | 'roleId'): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  // Al crear la contraseña es obligatoria; al editar, solo se valida si se escribe una nueva
  passwordMessage(): string | null {
    const control = this.form.controls.password;
    const value = control.value;

    if (!value) {
      if (!this.isEditMode() && control.touched) return 'Escribe una contraseña.';
      return null;
    }
    if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'La contraseña debe incluir al menos una letra y un número.';
    return null;
  }

  submit(): void {
    if (this.form.invalid || this.passwordMessage()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.formSubmit.emit({
      name: raw.name.trim(),
      email: raw.email.trim().toLowerCase(),
      password: raw.password ? raw.password : undefined,
      roleId: raw.roleId,
      status: raw.status,
      isActive: raw.isActive
    });
  }
}
