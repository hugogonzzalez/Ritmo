import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideMapPin } from '@lucide/angular';
import { Venue, VenuePayload, VenueStatus } from '../../../../core/models/venue.model';

@Component({
  selector: 'app-venue-form',
  standalone: true,
  imports: [ReactiveFormsModule, LucideMapPin],
  template: `
    <form class="form-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="section-title"><span class="form-icon"><svg lucideMapPin [size]="18"></svg></span><div><h2>Información de la sala</h2><p>Los campos marcados con * son obligatorios.</p></div></div>
      @if (error()) { <div class="form-error" role="alert">{{ error() }}</div> }

      <div class="form-grid">
        <div class="form-field full">
          <label for="name">Nombre <b>*</b></label>
          <input id="name" formControlName="name" maxlength="120" placeholder="Ej. Movistar Arena">
          @if (fieldError('name')) { <small class="field-error">Escribe un nombre de entre 1 y 120 caracteres.</small> }
        </div>
        <div class="form-field full">
          <label for="description">Descripción</label>
          <textarea id="description" rows="3" maxlength="500" formControlName="description" placeholder="Descripción de la sala (opcional)"></textarea>
          <small class="field-hint">{{ form.controls.description.value.length }}/500 caracteres</small>
        </div>
        <div class="form-field full">
          <label for="address">Dirección <b>*</b></label>
          <input id="address" formControlName="address" maxlength="200" placeholder="Ej. Av. de Felipe II, s/n">
          @if (fieldError('address')) { <small class="field-error">Indica la dirección de la sala (máximo 200 caracteres).</small> }
        </div>
        <div class="form-field">
          <label for="city">Ciudad <b>*</b></label>
          <input id="city" formControlName="city" maxlength="80" placeholder="Ej. Madrid">
          @if (fieldError('city')) { <small class="field-error">Indica una ciudad de entre 1 y 80 caracteres.</small> }
        </div>
        <div class="form-field">
          <label for="capacity">Aforo máximo <b>*</b></label>
          <input id="capacity" type="number" min="1" formControlName="capacity">
          @if (fieldError('capacity')) { <small class="field-error">El aforo debe ser de al menos 1 persona.</small> }
        </div>
        <div class="form-field full">
          <label for="website">Web oficial (opcional)</label>
          <input id="website" type="url" formControlName="website" placeholder="https://...">
          @if (fieldError('website')) { <small class="field-error">Introduce una URL que empiece por http:// o https://.</small> }
        </div>
      </div>

      <div class="section-title status-section"><span class="form-icon status-icon"><svg lucideMapPin [size]="18"></svg></span><div><h2>Estado</h2><p>Indica si la sala puede utilizarse y si está disponible.</p></div></div>
      <div class="form-grid">
        <div class="form-field">
          <label for="status">Estado de la sala</label>
          <select id="status" formControlName="status">
            @for (status of statuses; track status) { <option [value]="status">{{ statusLabel(status) }}</option> }
          </select>
        </div>
        <label class="active-control" for="isActive"><span class="switch-copy"><strong>Sala activa</strong><small>{{ form.controls.isActive.value ? 'Disponible para asignar a sesiones' : 'Oculta para nuevas sesiones' }}</small></span><input id="isActive" type="checkbox" formControlName="isActive"><span class="toggle-track"><i></i></span></label>
      </div>

      <div class="form-actions">
        <button type="button" class="secondary-action" (click)="cancelClick.emit()">Cancelar</button>
        <button type="submit" class="primary-action" [disabled]="saving()">{{ saving() ? 'Guardando…' : (isEditMode() ? 'Guardar cambios' : 'Crear sala') }}</button>
      </div>
    </form>
  `,
  styles: [`.form-card{padding:24px 27px;border:1px solid #e6eaf0;border-radius:14px;background:#fff;box-shadow:0 3px 12px #18223206}.section-title{display:flex;align-items:center;gap:11px;margin-bottom:21px}.status-section{margin:25px 0 18px;padding-top:22px;border-top:1px solid #edf0f4}.form-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:#eaf3ff;color:#0878f9}.status-icon{background:#eef7f2;color:#238355}.section-title h2{margin:0;color:#263143;font:700 14px 'Space Grotesk',sans-serif}.section-title p{margin:4px 0 0;color:#919aa8;font-size:10px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px 18px}.form-field{min-width:0;display:flex;flex-direction:column;gap:7px}.form-field.full{grid-column:1/-1}.form-field label{color:#465166;font-size:10px;font-weight:700}.form-field label b{color:#e25559}.form-field input,.form-field select,.form-field textarea{width:100%;min-height:41px;border:1px solid #dfe4eb;border-radius:8px;background:#fff;padding:10px 11px;color:#273144;font:inherit;font-size:11px;outline:0;box-sizing:border-box}.form-field textarea{resize:vertical;min-height:89px;line-height:1.5}.form-field input:focus,.form-field select:focus,.form-field textarea:focus{border-color:#0878f9;box-shadow:0 0 0 3px #0878f918}.field-error{color:#c43f43;font-size:9px}.field-hint{align-self:flex-end;color:#9aa3b1;font-size:9px}.active-control{min-height:41px;display:flex;align-items:center;justify-content:space-between;gap:15px;border:1px solid #dfe4eb;border-radius:8px;padding:8px 11px;cursor:pointer;position:relative}.switch-copy{display:grid;gap:3px}.switch-copy strong{color:#465166;font-size:10px}.switch-copy small{color:#9099a6;font-size:9px}.active-control input{position:absolute;opacity:0;width:1px;height:1px}.toggle-track{width:35px;height:20px;display:flex;align-items:center;padding:2px;border-radius:99px;background:#bcc4cf;transition:.18s}.toggle-track i{width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0002;transition:.18s}.active-control input:checked+.toggle-track{background:#22a765}.active-control input:checked+.toggle-track i{transform:translateX(15px)}.form-actions{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:25px;padding-top:19px;border-top:1px solid #edf0f4}.primary-action,.secondary-action{min-height:39px;display:inline-flex;justify-content:center;align-items:center;gap:8px;border-radius:8px;padding:0 15px;text-decoration:none;font:700 11px 'DM Sans',sans-serif;cursor:pointer}.primary-action{border:0;background:#0878f9;color:white}.primary-action:hover{background:#0669dc}.primary-action:disabled{opacity:.6;cursor:wait}.secondary-action{border:1px solid #dfe4eb;background:#fff;color:#606b7c}.secondary-action:hover{background:#f6f8fa}.form-error{margin-bottom:16px;padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}@media(max-width:650px){.form-card{padding:19px 16px}.form-grid{grid-template-columns:1fr}.form-field.full{grid-column:auto}.form-actions{justify-content:stretch}.form-actions>*{flex:1}}`]
})
export class VenueForm {
  private readonly fb = inject(FormBuilder).nonNullable;

  // Datos a editar (null al crear) y estado de guardado. Los gestiona la página.
  readonly value = input<Venue | null>(null);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  readonly formSubmit = output<VenuePayload>();
  readonly cancelClick = output<void>();

  readonly isEditMode = computed(() => this.value() !== null);
  readonly statuses: VenueStatus[] = ['active', 'maintenance', 'closed'];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(500)]],
    address: ['', [Validators.required, Validators.maxLength(200)]],
    city: ['', [Validators.required, Validators.maxLength(80)]],
    capacity: [1000, [Validators.required, Validators.min(1)]],
    website: ['', [Validators.pattern(/^$|^https?:\/\/\S+$/i), Validators.maxLength(2048)]],
    status: ['active' as VenueStatus, [Validators.required]],
    isActive: [true]
  });

  constructor() {
    effect(() => {
      const venue = this.value();

      if (!venue) {
        this.form.reset({
          name: '', description: '', address: '', city: '', capacity: 1000, website: '', status: 'active', isActive: true
        });
        return;
      }

      this.form.patchValue({
        name: venue.name,
        description: venue.description ?? '',
        address: venue.address,
        city: venue.city,
        capacity: venue.capacity,
        website: venue.website ?? '',
        status: venue.status,
        isActive: venue.isActive
      });
    });
  }

  fieldError(name: 'name' | 'address' | 'city' | 'capacity' | 'website'): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  statusLabel(status: VenueStatus): string {
    return ({ active: 'Activa', maintenance: 'En mantenimiento', closed: 'Cerrada' })[status];
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
      address: raw.address.trim(),
      city: raw.city.trim(),
      capacity: Number(raw.capacity),
      website: raw.website.trim(),
      status: raw.status,
      isActive: raw.isActive
    });
  }
}
