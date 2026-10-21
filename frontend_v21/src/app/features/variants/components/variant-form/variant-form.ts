import { Component, computed, effect, inject, input, output } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { LucideTicket } from '@lucide/angular';
import { Performance } from '../../../../core/models/performance.model';
import { Variant, VariantPayload } from '../../../../core/models/variant.model';

// Las entradas vendidas no pueden superar la cantidad total
const soldWithinQuantity: ValidatorFn = (group: AbstractControl) => {
  const quantity = Number(group.get('quantity')?.value ?? 0);
  const sold = Number(group.get('sold')?.value ?? 0);
  return sold > quantity ? { soldExceedsQuantity: true } : null;
};

@Component({
  selector: 'app-variant-form',
  standalone: true,
  imports: [ReactiveFormsModule, LucideTicket],
  template: `
    <form class="form-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="section-title"><span class="form-icon"><svg lucideTicket [size]="18"></svg></span><div><h2>Información de la variante</h2><p>Los campos marcados con * son obligatorios.</p></div></div>
      @if (error()) { <div class="form-error" role="alert">{{ error() }}</div> }

      <div class="form-grid">
        <div class="form-field full">
          <label for="performanceId">Sesión <b>*</b></label>
          <select id="performanceId" formControlName="performanceId">
            <option value="" disabled>Selecciona una sesión</option>
            @for (performance of performances(); track performance._id) { <option [value]="performance._id">{{ performanceLabel(performance) }}</option> }
          </select>
          @if (fieldError('performanceId')) { <small class="field-error">Selecciona la sesión a la que pertenece la variante.</small> }
        </div>
        <div class="form-field">
          <label for="name">Tipo de entrada <b>*</b></label>
          <input id="name" formControlName="name" maxlength="60" placeholder="Ej. VIP">
          @if (fieldError('name')) { <small class="field-error">Escribe un tipo de entrada de entre 1 y 60 caracteres.</small> }
        </div>
        <div class="form-field">
          <label for="sku">SKU <b>*</b></label>
          <input id="sku" formControlName="sku" maxlength="40" placeholder="Ej. CONC01-VIP">
          @if (fieldError('sku')) { <small class="field-error">Indica un código SKU de hasta 40 caracteres.</small> }
        </div>
        <div class="form-field full">
          <label for="description">Descripción</label>
          <textarea id="description" rows="3" maxlength="500" formControlName="description" placeholder="Qué incluye esta entrada (opcional)"></textarea>
          <small class="field-hint">{{ form.controls.description.value.length }}/500 caracteres</small>
        </div>
        <div class="form-field">
          <label for="price">Precio (€) <b>*</b></label>
          <input id="price" type="number" min="0" step="0.01" formControlName="price">
          @if (fieldError('price')) { <small class="field-error">El precio no puede ser negativo.</small> }
        </div>
        <div class="form-field">
          <label for="quantity">Entradas disponibles <b>*</b></label>
          <input id="quantity" type="number" min="0" step="1" formControlName="quantity">
          @if (fieldError('quantity')) { <small class="field-error">Indica una cantidad de 0 o más.</small> }
        </div>
        <div class="form-field">
          <label for="sold">Entradas vendidas</label>
          <input id="sold" type="number" min="0" step="1" formControlName="sold">
          @if (form.hasError('soldExceedsQuantity')) { <small class="field-error">Las vendidas no pueden superar la cantidad total.</small> }
        </div>
        <label class="active-control" for="isActive"><span class="switch-copy"><strong>Variante activa</strong><small>{{ form.controls.isActive.value ? 'Disponible para la venta' : 'Oculta para la venta' }}</small></span><input id="isActive" type="checkbox" formControlName="isActive"><span class="toggle-track"><i></i></span></label>
      </div>

      <div class="form-actions">
        <button type="button" class="secondary-action" (click)="cancelClick.emit()">Cancelar</button>
        <button type="submit" class="primary-action" [disabled]="saving()">{{ saving() ? 'Guardando…' : (isEditMode() ? 'Guardar cambios' : 'Crear variante') }}</button>
      </div>
    </form>
  `,
  styles: [`.form-card{padding:24px 27px;border:1px solid #e6eaf0;border-radius:14px;background:#fff;box-shadow:0 3px 12px #18223206}.section-title{display:flex;align-items:center;gap:11px;margin-bottom:21px}.status-section{margin:25px 0 18px;padding-top:22px;border-top:1px solid #edf0f4}.form-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:#eaf3ff;color:#0878f9}.status-icon{background:#eef7f2;color:#238355}.section-title h2{margin:0;color:#263143;font:700 14px 'Space Grotesk',sans-serif}.section-title p{margin:4px 0 0;color:#919aa8;font-size:10px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px 18px}.form-field{min-width:0;display:flex;flex-direction:column;gap:7px}.form-field.full{grid-column:1/-1}.form-field label{color:#465166;font-size:10px;font-weight:700}.form-field label b{color:#e25559}.form-field input,.form-field select,.form-field textarea{width:100%;min-height:41px;border:1px solid #dfe4eb;border-radius:8px;background:#fff;padding:10px 11px;color:#273144;font:inherit;font-size:11px;outline:0;box-sizing:border-box}.form-field textarea{resize:vertical;min-height:89px;line-height:1.5}.form-field input:focus,.form-field select:focus,.form-field textarea:focus{border-color:#0878f9;box-shadow:0 0 0 3px #0878f918}.field-error{color:#c43f43;font-size:9px}.field-hint{align-self:flex-end;color:#9aa3b1;font-size:9px}.active-control{min-height:41px;display:flex;align-items:center;justify-content:space-between;gap:15px;border:1px solid #dfe4eb;border-radius:8px;padding:8px 11px;cursor:pointer;position:relative}.switch-copy{display:grid;gap:3px}.switch-copy strong{color:#465166;font-size:10px}.switch-copy small{color:#9099a6;font-size:9px}.active-control input{position:absolute;opacity:0;width:1px;height:1px}.toggle-track{width:35px;height:20px;display:flex;align-items:center;padding:2px;border-radius:99px;background:#bcc4cf;transition:.18s}.toggle-track i{width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0002;transition:.18s}.active-control input:checked+.toggle-track{background:#22a765}.active-control input:checked+.toggle-track i{transform:translateX(15px)}.form-actions{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:25px;padding-top:19px;border-top:1px solid #edf0f4}.primary-action,.secondary-action{min-height:39px;display:inline-flex;justify-content:center;align-items:center;gap:8px;border-radius:8px;padding:0 15px;text-decoration:none;font:700 11px 'DM Sans',sans-serif;cursor:pointer}.primary-action{border:0;background:#0878f9;color:white}.primary-action:hover{background:#0669dc}.primary-action:disabled{opacity:.6;cursor:wait}.secondary-action{border:1px solid #dfe4eb;background:#fff;color:#606b7c}.secondary-action:hover{background:#f6f8fa}.form-error{margin-bottom:16px;padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}@media(max-width:650px){.form-card{padding:19px 16px}.form-grid{grid-template-columns:1fr}.form-field.full{grid-column:auto}.form-actions{justify-content:stretch}.form-actions>*{flex:1}}`]
})
export class VariantForm {
  private readonly fb = inject(FormBuilder).nonNullable;

  // Datos a editar (null al crear), sesiones para el desplegable y estado de guardado. Los gestiona la página.
  readonly value = input<Variant | null>(null);
  readonly performances = input<Performance[]>([]);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  readonly formSubmit = output<VariantPayload>();
  readonly cancelClick = output<void>();

  readonly isEditMode = computed(() => this.value() !== null);

  readonly form = this.fb.group({
    performanceId: ['', [Validators.required]],
    name: ['', [Validators.required, Validators.maxLength(60)]],
    sku: ['', [Validators.required, Validators.maxLength(40)]],
    description: ['', [Validators.maxLength(500)]],
    price: [0, [Validators.required, Validators.min(0)]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    sold: [0, [Validators.min(0)]],
    isActive: [true]
  }, { validators: [soldWithinQuantity] });

  constructor() {
    effect(() => {
      const variant = this.value();

      if (!variant) {
        this.form.reset({
          performanceId: '', name: '', sku: '', description: '', price: 0, quantity: 0, sold: 0, isActive: true
        });
        return;
      }

      this.form.patchValue({
        performanceId: variant.performanceId,
        name: variant.name,
        sku: variant.sku,
        description: variant.description ?? '',
        price: variant.price,
        quantity: variant.quantity,
        sold: variant.sold,
        isActive: variant.isActive
      });
    });
  }

  fieldError(name: 'performanceId' | 'name' | 'sku' | 'price' | 'quantity'): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  performanceLabel(performance: Performance): string {
    const date = new Date(performance.startsAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
    return `${performance.city} · ${date}`;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.formSubmit.emit({
      ...raw,
      name: raw.name.trim(),
      sku: raw.sku.trim().toUpperCase(),
      description: raw.description.trim()
    });
  }
}
