import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideCalendarDays, LucideTicket } from '@lucide/angular';
import { Concert } from '../../../../core/models/concert.model';
import {
  PERFORMANCE_STATUSES,
  Performance,
  PerformancePayload,
  PerformanceStatus
} from '../../../../core/models/performance.model';
import { Venue } from '../../../../core/models/venue.model';

@Component({
  selector: 'app-performance-form',
  standalone: true,
  imports: [ReactiveFormsModule, LucideCalendarDays, LucideTicket],
  template: `
    <form class="concert-form-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="form-section-title"><span class="form-icon"><svg lucideCalendarDays [size]="18"></svg></span><div><h2>Información de la sesión</h2><p>Los campos marcados con * son obligatorios.</p></div></div>
      @if (formError() || error()) { <div class="form-error-panel" role="alert">{{ formError() || error() }}</div> }
      <div class="form-grid">
        <div class="form-field full"><label for="concertId">Concierto <b>*</b></label><select id="concertId" formControlName="concertId"><option value="">Selecciona un concierto</option>@for (concert of concerts(); track concert._id) { <option [value]="concert._id">{{ concert.title }}</option> }</select>@if (fieldError('concertId')) { <small class="field-error">Selecciona el concierto al que pertenece la sesión.</small> }</div>
        <div class="form-field full"><label for="venueId">Sala <b>*</b></label><select id="venueId" formControlName="venueId"><option value="">Selecciona una sala</option>@for (venue of venueOptions(); track venue._id) { <option [value]="venue._id">{{ venue.name }} · {{ venue.city }} ({{ venue.capacity }} de aforo){{ venue.isActive ? '' : ' (inactiva)' }}</option> } @empty { <option value="" disabled>No hay salas. Créalas en la sección Salas.</option> }</select>@if (fieldError('venueId')) { <small class="field-error">Selecciona la sala donde se celebra la sesión.</small> }@if (selectedCapacity() !== null) { <small class="field-hint">Aforo de la sala: {{ selectedCapacity() }}</small> }</div>
        <div class="form-field"><label for="city">Ciudad <b>*</b></label><input id="city" formControlName="city" maxlength="80" placeholder="Ej. Madrid">@if (fieldError('city')) { <small class="field-error">Indica una ciudad de entre 1 y 80 caracteres.</small> }</div>
        <div class="form-field"><label for="startsAt">Inicio <b>*</b></label><input id="startsAt" type="datetime-local" formControlName="startsAt">@if (fieldError('startsAt')) { <small class="field-error">La fecha de inicio es obligatoria.</small> }</div>
        <div class="form-field"><label for="endsAt">Fin (opcional)</label><input id="endsAt" type="datetime-local" formControlName="endsAt"></div>
        <div class="form-field"><label for="price">Precio (€) <b>*</b></label><input id="price" type="number" min="0" step="0.01" formControlName="price">@if (fieldError('price')) { <small class="field-error">El precio debe ser 0 o más.</small> }</div>
        <div class="form-field"><label for="bookedParticipants">Entradas vendidas</label><input id="bookedParticipants" type="number" min="0" formControlName="bookedParticipants"></div>
      </div>
      <div class="form-section-title status-section"><span class="form-icon status-icon"><svg lucideTicket [size]="18"></svg></span><div><h2>Publicación y estado</h2><p>Controla si la sesión está visible y en qué situación se encuentra.</p></div></div>
      <div class="form-grid status-grid">
        <div class="form-field"><label for="status">Status de la sesión</label><select id="status" formControlName="status">@for (status of statuses; track status) { <option [value]="status">{{ statusLabel(status) }}</option> }</select></div>
        <label class="active-control" for="isActive"><span class="switch-copy"><strong>Sesión activa</strong><small>{{ form.controls.isActive.value ? 'Visible en la web pública' : 'Oculta en la web pública' }}</small></span><input id="isActive" type="checkbox" formControlName="isActive"><span class="toggle-track"><i></i></span></label>
      </div>
      <div class="form-actions"><button type="button" class="secondary-action" (click)="cancelClick.emit()">Cancelar</button><button type="submit" class="primary-action" [disabled]="saving()"><svg lucideCalendarDays [size]="16"></svg>{{ saving() ? 'Guardando…' : (isEditMode() ? 'Guardar cambios' : 'Crear sesión') }}</button></div>
    </form>
  `,
  styles: [`.concert-form-card{padding:24px 27px;border:1px solid #e6eaf0;border-radius:14px;background:#fff;box-shadow:0 3px 12px #18223206}.form-section-title{display:flex;align-items:center;gap:11px;margin-bottom:21px}.form-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:#eaf3ff;color:#0878f9}.form-section-title h2{margin:0;color:#263143;font:700 14px 'Space Grotesk',sans-serif}.form-section-title p{margin:4px 0 0;color:#919aa8;font-size:10px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px 18px}.form-field{min-width:0;display:flex;flex-direction:column;gap:7px}.form-field.full{grid-column:1/-1}.form-field label{color:#465166;font-size:10px;font-weight:700}.form-field label b{color:#e25559}.form-field input,.form-field select,.form-field textarea{width:100%;min-height:41px;border:1px solid #dfe4eb;border-radius:8px;background:#fff;padding:10px 11px;color:#273144;font:inherit;font-size:11px;outline:0;transition:.15s}.form-field input:focus,.form-field select:focus,.form-field textarea:focus{border-color:#0878f9;box-shadow:0 0 0 3px #0878f918}.form-field input::placeholder{color:#a3acb8}.field-error{color:#c43f43;font-size:9px}.field-hint{color:#9aa3b1;font-size:9px}.status-section{margin:25px 0 18px;padding-top:22px;border-top:1px solid #edf0f4}.status-icon{background:#eef7f2;color:#238355}.status-grid{align-items:end}.active-control{position:relative;min-height:41px;display:flex;align-items:center;justify-content:space-between;gap:15px;border:1px solid #dfe4eb;border-radius:8px;padding:8px 11px;cursor:pointer}.switch-copy{display:grid;gap:3px}.switch-copy strong{color:#465166;font-size:10px}.switch-copy small{color:#9099a6;font-size:9px}.active-control input{position:absolute;opacity:0;width:1px;height:1px}.toggle-track{width:35px;height:20px;display:flex;align-items:center;padding:2px;border-radius:99px;background:#bcc4cf;transition:.18s}.toggle-track i{width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0002;transition:.18s}.active-control input:checked+.toggle-track{background:#22a765}.active-control input:checked+.toggle-track i{transform:translateX(15px)}.form-actions{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:25px;padding-top:19px;border-top:1px solid #edf0f4}.primary-action,.secondary-action{min-height:39px;display:inline-flex;justify-content:center;align-items:center;gap:8px;border-radius:8px;padding:0 15px;text-decoration:none;font:700 11px 'DM Sans',sans-serif;cursor:pointer}.primary-action{border:0;background:#0878f9;color:white}.primary-action:hover{background:#0669dc}.primary-action:disabled{opacity:.6;cursor:wait}.secondary-action{border:1px solid #dfe4eb;background:#fff;color:#606b7c}.secondary-action:hover{background:#f6f8fa}.form-error-panel{margin-bottom:16px;padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}@media(max-width:650px){.concert-form-card{padding:19px 16px}.form-grid{grid-template-columns:1fr;gap:14px}.form-field.full{grid-column:auto}.status-section{margin-top:20px}.status-grid{gap:13px}.form-actions{justify-content:stretch}.form-actions>*{flex:1}}`]
})
export class PerformanceForm {
  private readonly fb = inject(FormBuilder).nonNullable;

  // Datos a editar (null al crear) y listas para los desplegables. Los carga la página.
  readonly value = input<Performance | null>(null);
  readonly concerts = input<Concert[]>([]);
  readonly venues = input<Venue[]>([]);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  readonly formSubmit = output<PerformancePayload>();
  readonly cancelClick = output<void>();

  readonly formError = signal<string | null>(null);
  readonly isEditMode = computed(() => this.value() !== null);
  readonly statuses = PERFORMANCE_STATUSES;

  readonly form = this.fb.group({
    concertId: ['', [Validators.required]],
    venueId: ['', [Validators.required]],
    city: ['', [Validators.required, Validators.maxLength(80)]],
    startsAt: ['', [Validators.required]],
    endsAt: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    bookedParticipants: [0, [Validators.required, Validators.min(0)]],
    status: ['scheduled' as PerformanceStatus, [Validators.required]],
    isActive: [true]
  });

  private readonly selectedVenueId = toSignal(this.form.controls.venueId.valueChanges, { initialValue: '' });

  // Salas activas, más la asignada a esta sesión aunque esté inactiva (para no perderla al editar)
  readonly venueOptions = computed(() => this.venues().filter(
    (venue) => venue.isActive || venue._id === this.value()?.venueId
  ));

  readonly selectedCapacity = computed<number | null>(() => {
    const venue = this.venues().find((item) => item._id === this.selectedVenueId());
    return venue ? venue.capacity : null;
  });

  constructor() {
    effect(() => {
      const performance = this.value();
      this.formError.set(null);

      if (!performance) {
        this.form.reset({
          concertId: '', venueId: '', city: '', startsAt: '', endsAt: '',
          price: 0, bookedParticipants: 0, status: 'scheduled', isActive: true
        });
        return;
      }

      this.form.patchValue({
        concertId: performance.concertId,
        venueId: performance.venueId,
        city: performance.city,
        startsAt: this.toDatetimeLocal(performance.startsAt),
        endsAt: performance.endsAt ? this.toDatetimeLocal(performance.endsAt) : '',
        price: performance.price,
        bookedParticipants: performance.bookedParticipants,
        status: performance.status,
        isActive: performance.isActive
      });
    });
  }

  fieldError(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.touched && control.invalid;
  }

  statusLabel(status: PerformanceStatus): string {
    return ({ scheduled: 'Programado', full: 'Completo', cancelled: 'Cancelado', completed: 'Finalizado' })[status];
  }

  submit(): void {
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const startsAt = new Date(raw.startsAt);
    const endsAt = raw.endsAt ? new Date(raw.endsAt) : null;

    if (Number.isNaN(startsAt.getTime())) {
      this.formError.set('La fecha de inicio no es válida.');
      return;
    }
    if (endsAt && (Number.isNaN(endsAt.getTime()) || startsAt >= endsAt)) {
      this.formError.set('La fecha de fin debe ser posterior a la de inicio.');
      return;
    }

    const capacity = this.selectedCapacity();
    if (capacity !== null && raw.bookedParticipants > capacity) {
      this.formError.set('Las entradas vendidas no pueden superar el aforo de la sala.');
      return;
    }

    this.formSubmit.emit({
      concertId: raw.concertId,
      venueId: raw.venueId,
      city: raw.city.trim(),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt ? endsAt.toISOString() : null,
      price: Number(raw.price),
      bookedParticipants: Number(raw.bookedParticipants),
      status: raw.status,
      isActive: raw.isActive
    });
  }

  private toDatetimeLocal(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
