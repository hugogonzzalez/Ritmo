import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Profile, ProfilePayload } from '../../../../core/models/profile.model';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form class="profile-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="form-grid">
        <div class="form-field">
          <label for="firstName">Nombre</label>
          <input id="firstName" formControlName="firstName" maxlength="60" placeholder="Ej. Ana">
          @if (fieldInvalid('firstName')) { <small class="field-error">Máximo 60 caracteres.</small> }
        </div>
        <div class="form-field">
          <label for="lastName">Apellidos</label>
          <input id="lastName" formControlName="lastName" maxlength="60" placeholder="Ej. García">
          @if (fieldInvalid('lastName')) { <small class="field-error">Máximo 60 caracteres.</small> }
        </div>
        <div class="form-field">
          <label for="phone">Teléfono</label>
          <input id="phone" formControlName="phone" maxlength="20" placeholder="Ej. 600000000">
          @if (fieldInvalid('phone')) { <small class="field-error">Máximo 20 caracteres.</small> }
        </div>
        <div class="form-field full">
          <label for="avatarUrl">URL de la foto</label>
          <div class="avatar-row">
            <div class="avatar-preview" aria-hidden="true">
              @if (showImage()) {
                <img [src]="previewUrl()" alt="" (error)="brokenUrl.set(previewUrl())">
              } @else {
                <span>{{ previewInitials() }}</span>
              }
            </div>
            <input id="avatarUrl" type="url" formControlName="avatarUrl" maxlength="500" placeholder="https://…">
          </div>
          @if (fieldInvalid('avatarUrl')) { <small class="field-error">Introduce una URL válida.</small> }
          @if (brokenUrl() && brokenUrl() === previewUrl()) { <small class="field-error">La URL no es una imagen válida. Se muestran las iniciales.</small> }
        </div>
        <div class="form-field full">
          <label for="bio">Biografía</label>
          <textarea id="bio" formControlName="bio" rows="4" maxlength="500" placeholder="Cuéntanos algo sobre ti"></textarea>
          @if (fieldInvalid('bio')) { <small class="field-error">Máximo 500 caracteres.</small> }
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="secondary-action" (click)="cancelClick.emit()">Deshacer cambios</button>
        <button type="submit" class="primary-action" [disabled]="saving()">{{ saving() ? 'Guardando…' : 'Guardar perfil' }}</button>
      </div>
    </form>
  `,
  styles: [`.profile-form{display:grid;gap:20px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px 18px}.form-field{min-width:0;display:flex;flex-direction:column;gap:7px}.form-field.full{grid-column:1/-1}.form-field label{color:#465166;font-size:10px;font-weight:700}.form-field input,.form-field textarea{width:100%;border:1px solid #dfe4eb;border-radius:8px;padding:10px 11px;color:#273144;font:inherit;font-size:11px;outline:0;box-sizing:border-box}.form-field input{min-height:41px}.form-field textarea{resize:vertical;min-height:89px;line-height:1.5}.form-field input:focus,.form-field textarea:focus{border-color:#0878f9;box-shadow:0 0 0 3px #0878f918}.field-error{color:#c43f43;font-size:9px}.avatar-row{display:flex;align-items:center;gap:14px}.avatar-row input{flex:1}.avatar-preview{display:grid;place-items:center;width:56px;height:56px;flex:0 0 56px;overflow:hidden;border-radius:50%;background:#eaf3ff;color:#0878f9;font:700 16px 'Space Grotesk',sans-serif}.avatar-preview img{width:100%;height:100%;object-fit:cover}.form-actions{display:flex;justify-content:flex-end;gap:10px;padding-top:18px;border-top:1px solid #edf0f4}.primary-action,.secondary-action{min-height:39px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;padding:0 15px;font:700 11px 'DM Sans',sans-serif;cursor:pointer}.primary-action{border:0;background:#0878f9;color:white}.primary-action:hover{background:#0669dc}.primary-action:disabled{opacity:.6;cursor:wait}.secondary-action{border:1px solid #dfe4eb;background:#fff;color:#606b7c}.secondary-action:hover{background:#f6f8fa}@media(max-width:650px){.form-grid{grid-template-columns:1fr}.form-field.full{grid-column:auto}.form-actions>*{flex:1}}`]
})
export class ProfileForm {
  private readonly fb = inject(FormBuilder).nonNullable;

  // Perfil actual y estado de guardado: los gestiona la página
  readonly value = input<Profile | null>(null);
  readonly saving = input(false);
  readonly formSubmit = output<ProfilePayload>();
  readonly cancelClick = output<void>();

  readonly form = this.fb.group({
    firstName: ['', [Validators.maxLength(60)]],
    lastName: ['', [Validators.maxLength(60)]],
    phone: ['', [Validators.maxLength(20)]],
    avatarUrl: ['', [Validators.maxLength(500)]],
    bio: ['', [Validators.maxLength(500)]]
  });

  // Valores del formulario en vivo, para la vista previa de la foto y las iniciales
  private readonly liveValues = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  // URL escrita sin espacios; vacía significa "sin foto"
  readonly previewUrl = computed(() => {
    const url = (this.liveValues().avatarUrl ?? '').trim();
    return /^https?:\/\//i.test(url) ? url : null;
  });

  // URL que el navegador no ha podido cargar como imagen (así se cae a las iniciales)
  readonly brokenUrl = signal<string | null>(null);

  readonly showImage = computed(() => {
    const url = this.previewUrl();
    return url !== null && url !== this.brokenUrl();
  });

  readonly previewInitials = computed(() => {
    const values = this.liveValues();
    const letters = [values.firstName, values.lastName]
      .map((part) => (part ?? '').trim().charAt(0))
      .filter(Boolean)
      .join('')
      .toUpperCase();
    return letters || '?';
  });

  constructor() {
    effect(() => {
      const profile = this.value();

      this.brokenUrl.set(null);
      this.form.reset({
        firstName: profile?.firstName ?? '',
        lastName: profile?.lastName ?? '',
        phone: profile?.phone ?? '',
        avatarUrl: profile?.avatarUrl ?? '',
        bio: profile?.bio ?? ''
      });
    });
  }

  fieldInvalid(name: 'firstName' | 'lastName' | 'phone' | 'avatarUrl' | 'bio'): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.formSubmit.emit({
      firstName: this.emptyToNull(raw.firstName),
      lastName: this.emptyToNull(raw.lastName),
      phone: this.emptyToNull(raw.phone),
      avatarUrl: this.emptyToNull(raw.avatarUrl),
      bio: this.emptyToNull(raw.bio)
    });
  }

  // El backend acepta null para borrar un dato; una cadena vacía no es una URL válida
  private emptyToNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
}
