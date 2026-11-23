import { Component, computed, effect, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideTag } from '@lucide/angular';
import { Category, CategoryPayload } from '../../../../core/models/category.model';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideTag],
  template: `
    <form class="form-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="section-title"><span class="form-icon"><svg lucideTag [size]="18"></svg></span><div><h2>Información de la categoría</h2><p>Los campos marcados con * son obligatorios.</p></div></div>
      @if (error()) { <div class="form-error" role="alert">{{ error() }}</div> }

      <div class="form-grid">
        <div class="form-field full">
          <label for="name">Nombre <b>*</b></label>
          <input id="name" formControlName="name" maxlength="80" placeholder="Ej. Rock">
          @if (fieldError('name')) { <small class="field-error">Escribe un nombre de entre 1 y 80 caracteres.</small> }
        </div>
        <div class="form-field full">
          <label for="description">Descripción</label>
          <textarea id="description" rows="3" maxlength="500" formControlName="description" placeholder="Descripción de la categoría (opcional)"></textarea>
          <small class="field-hint">{{ form.controls.description.value.length }}/500 caracteres</small>
        </div>
      </div>

      <div class="section-title status-section"><span class="form-icon status-icon"><svg lucideTag [size]="18"></svg></span><div><h2>Estado</h2><p>Controla si la categoría está disponible.</p></div></div>
      <label class="active-control" for="isActive"><span class="switch-copy"><strong>Categoría activa</strong><small>{{ form.controls.isActive.value ? 'Disponible para asignar a conciertos' : 'Oculta para nuevas asignaciones' }}</small></span><input id="isActive" type="checkbox" formControlName="isActive"><span class="toggle-track"><i></i></span></label>

      <div class="form-actions"><button type="button" class="secondary-action" (click)="cancelClick.emit()">Cancelar</button><button type="submit" class="primary-action" [disabled]="saving()">{{ saving() ? 'Guardando…' : (isEditMode() ? 'Guardar cambios' : 'Crear categoría') }}</button></div>
    </form>
  `,
  styles: [`.form-card{padding:24px 27px;border:1px solid #e6eaf0;border-radius:14px;background:#fff;box-shadow:0 3px 12px #18223206}.section-title{display:flex;align-items:center;gap:11px;margin-bottom:21px}.status-section{margin:25px 0 18px;padding-top:22px;border-top:1px solid #edf0f4}.form-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:#eaf3ff;color:#0878f9}.status-icon{background:#eef7f2;color:#238355}.section-title h2{margin:0;color:#263143;font:700 14px 'Space Grotesk',sans-serif}.section-title p{margin:4px 0 0;color:#919aa8;font-size:10px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px 18px}.form-field{min-width:0;display:flex;flex-direction:column;gap:7px}.form-field.full{grid-column:1/-1}.form-field label{color:#465166;font-size:10px;font-weight:700}.form-field label b{color:#e25559}.form-field input,.form-field textarea{width:100%;min-height:41px;border:1px solid #dfe4eb;border-radius:8px;background:#fff;padding:10px 11px;color:#273144;font:inherit;font-size:11px;outline:0;box-sizing:border-box}.form-field textarea{resize:vertical;min-height:89px;line-height:1.5}.form-field input:focus,.form-field textarea:focus{border-color:#0878f9;box-shadow:0 0 0 3px #0878f918}.field-error{color:#c43f43;font-size:9px}.field-hint{align-self:flex-end;color:#9aa3b1;font-size:9px}.active-control{min-height:41px;display:flex;align-items:center;justify-content:space-between;gap:15px;border:1px solid #dfe4eb;border-radius:8px;padding:8px 11px;cursor:pointer}.switch-copy{display:grid;gap:3px}.switch-copy strong{color:#465166;font-size:10px}.switch-copy small{color:#9099a6;font-size:9px}.active-control input{position:absolute;opacity:0;width:1px;height:1px}.toggle-track{width:35px;height:20px;display:flex;align-items:center;padding:2px;border-radius:99px;background:#bcc4cf;transition:.18s}.toggle-track i{width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0002;transition:.18s}.active-control input:checked+.toggle-track{background:#22a765}.active-control input:checked+.toggle-track i{transform:translateX(15px)}.form-actions{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:25px;padding-top:19px;border-top:1px solid #edf0f4}.primary-action,.secondary-action{min-height:39px;display:inline-flex;justify-content:center;align-items:center;gap:8px;border-radius:8px;padding:0 15px;text-decoration:none;font:700 11px 'DM Sans',sans-serif;cursor:pointer}.primary-action{border:0;background:#0878f9;color:white}.primary-action:hover{background:#0669dc}.primary-action:disabled{opacity:.6;cursor:wait}.secondary-action{border:1px solid #dfe4eb;background:#fff;color:#606b7c}.secondary-action:hover{background:#f6f8fa}.form-error{margin-bottom:16px;padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}@media(max-width:650px){.form-card{padding:19px 16px}.form-grid{grid-template-columns:1fr}.form-field.full{grid-column:auto}.form-actions{justify-content:stretch}.form-actions>*{flex:1}}`]
})
export class CategoryForm {
  private readonly fb = inject(FormBuilder).nonNullable;

  // Datos a editar (null al crear). Lo carga la página contenedora.
  readonly value = input<Category | null>(null);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  readonly formSubmit = output<CategoryPayload>();
  readonly cancelClick = output<void>();

  readonly isEditMode = computed(() => this.value() !== null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', [Validators.maxLength(500)]],
    isActive: [true]
  });

  constructor() {
    effect(() => {
      const category = this.value();
      if (!category) {
        this.form.reset({ name: '', description: '', isActive: true });
        return;
      }
      this.form.patchValue({
        name: category.name,
        description: category.description ?? '',
        isActive: category.isActive
      });
    });
  }

  fieldError(name: 'name'): boolean {
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
      name: raw.name.trim(),
      description: raw.description.trim(),
      isActive: raw.isActive
    });
  }
}
